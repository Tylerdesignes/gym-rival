import type {
  BaselineAssessment as PrismaBaselineAssessment,
  Challenge as PrismaChallenge,
  ProgressMetric as PrismaProgressMetric,
  WorkoutLog as PrismaWorkoutLog
} from "@prisma/client";
import { Prisma } from "@prisma/client";
import { createAssessmentRecord, deriveConstraints, deriveReadinessScore, deriveTrainingTrack } from "@/lib/assessment";
import { createChallengeSummary, evaluateChallengeWinner } from "@/lib/challenges";
import { buildLeaderboard } from "@/lib/leaderboards";
import { buildCustomPlan, generateWorkoutPlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { calculateRankResult } from "@/lib/ranking";
import {
  benchmarkStandards,
  rankTiers,
  seedChallenges,
  seedPlans,
  seedProgressMetrics,
  seedUsers
} from "@/lib/seed-data";
import type {
  AppSnapshot,
  BaselineAssessment,
  BaselineAssessmentInput,
  ChallengeSummary,
  GeneratedPlan,
  ProgressMetric,
  RankResult,
  SetLogInput,
  UserProfile,
  WorkoutLog
} from "@/lib/types";

type JsonArray = string[];
type PersonalRecords = Record<string, number>;

const appUserInclude = {
  progressMetric: true
} satisfies Prisma.AppUserInclude;

const workoutPlanInclude = {
  sessions: {
    include: {
      exercises: true
    },
    orderBy: {
      dayLabel: "asc"
    }
  }
} satisfies Prisma.WorkoutPlanInclude;

let seedPromise: Promise<void> | null = null;

function toNumber(value: Prisma.Decimal | number | string | null | undefined) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value.toNumber();
}

function asStringArray(value: Prisma.JsonValue): JsonArray {
  return Array.isArray(value) ? value.map(String) : [];
}

function asPersonalRecords(value: Prisma.JsonValue): PersonalRecords {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, Prisma.JsonValue>).map(([key, recordValue]) => [
      key,
      typeof recordValue === "number" ? recordValue : Number(recordValue ?? 0)
    ])
  );
}

function toUserProfile(user: Prisma.AppUserGetPayload<{ include: typeof appUserInclude }>): UserProfile {
  return {
    id: user.id,
    name: user.name,
    age: user.age,
    gender: user.gender as UserProfile["gender"],
    weightKg: toNumber(user.weightKg),
    heightCm: toNumber(user.heightCm),
    experienceLevel: user.experienceLevel as UserProfile["experienceLevel"],
    trainingTrack: user.trainingTrack as UserProfile["trainingTrack"],
    readinessScore: user.readinessScore,
    constraints: asStringArray(user.constraints),
    primaryGoal: user.primaryGoal,
    availableEquipment: asStringArray(user.availableEquipment)
  };
}

function toProgressMetric(
  metric: Pick<
    PrismaProgressMetric,
    "userId" | "totalVolume" | "completedSessions" | "consistencyScore" | "personalRecords" | "streakDays"
  >
) {
  return {
    userId: metric.userId,
    totalVolume: toNumber(metric.totalVolume as Prisma.Decimal | number),
    completedSessions: metric.completedSessions,
    consistencyScore: metric.consistencyScore,
    personalRecords: asPersonalRecords(metric.personalRecords as Prisma.JsonValue),
    streakDays: metric.streakDays
  } satisfies ProgressMetric;
}

function toGeneratedPlan(
  plan: Prisma.WorkoutPlanGetPayload<{
    include: typeof workoutPlanInclude;
  }>
): GeneratedPlan {
  return {
    id: plan.id,
    userId: plan.userId,
    name: plan.name,
    source: plan.source as GeneratedPlan["source"],
    focus: plan.focus,
    daysPerWeek: plan.daysPerWeek,
    progressionNotes: asStringArray(plan.progressionNotes),
    deloadRule: plan.deloadRule,
    sessions: plan.sessions.map((session) => ({
      id: session.id,
      dayLabel: session.dayLabel,
      name: session.name,
      focus: session.focus,
      exercises: session.exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        targetReps: exercise.targetReps,
        targetRpe: toNumber(exercise.targetRpe),
        progressionRule: exercise.progressionRule
      }))
    }))
  };
}

function toAssessment(assessment: PrismaBaselineAssessment): BaselineAssessment {
  return {
    id: assessment.id,
    userId: assessment.userId,
    createdAt: assessment.createdAt.toISOString(),
    trainingDaysPerWeek: assessment.trainingDaysPerWeek,
    recoveryScore: assessment.recoveryScore,
    sleepHours: toNumber(assessment.sleepHours),
    stressLevel: assessment.stressLevel,
    movementLimitations: asStringArray(assessment.movementLimitations),
    musclePriorities: asStringArray(assessment.musclePriorities),
    summary: assessment.summary
  };
}

function toChallengeSummary(challenge: PrismaChallenge): ChallengeSummary {
  return {
    id: challenge.id,
    name: challenge.name,
    metric: challenge.metric as ChallengeSummary["metric"],
    challengerId: challenge.challengerId,
    opponentId: challenge.opponentId,
    startsOn: challenge.startsOn.toISOString().slice(0, 10),
    endsOn: challenge.endsOn.toISOString().slice(0, 10),
    status: challenge.status as ChallengeSummary["status"],
    winnerId: challenge.winnerId ?? undefined
  };
}

function toWorkoutLog(
  log: Prisma.WorkoutLogGetPayload<{ include: { sets: true } }> | (PrismaWorkoutLog & { sets: Array<{
    id: string;
    weightKg: Prisma.Decimal;
    reps: number;
    rpe: Prisma.Decimal;
    completed: boolean;
    notes: string | null;
  }> })
): WorkoutLog {
  return {
    id: log.id,
    userId: log.userId,
    workoutId: log.workoutId,
    sessionId: log.sessionId,
    exerciseId: log.exerciseId,
    createdAt: log.createdAt.toISOString(),
    sets: log.sets.map((set) => ({
      id: set.id,
      weightKg: toNumber(set.weightKg),
      reps: set.reps,
      rpe: toNumber(set.rpe),
      completed: set.completed,
      notes: set.notes ?? undefined
    }))
  };
}

function toPrKey(exerciseId: string) {
  const normalized = exerciseId.toLowerCase();
  if (normalized.includes("bench")) return "bench";
  if (normalized.includes("squat")) return "squat";
  if (normalized.includes("deadlift") || normalized === "rdl") return "deadlift";
  if (normalized.includes("press") || normalized === "ohp") return "overheadPress";
  return exerciseId;
}

async function getUserOrThrow(userId: string) {
  const user = await prisma.appUser.findUnique({
    where: { id: userId },
    include: appUserInclude
  });

  if (!user) throw new Error(`Unknown user ${userId}`);
  return user;
}

async function getProgressOrThrow(userId: string) {
  const progress = await prisma.progressMetric.findUnique({
    where: { userId }
  });

  if (!progress) throw new Error(`Missing progress for ${userId}`);
  return progress;
}

async function ensureDatabaseSeeded() {
  if (seedPromise) {
    await seedPromise;
    return;
  }

  seedPromise = (async () => {
    const existingUsers = await prisma.appUser.count();
    if (existingUsers > 0) return;

    await prisma.$transaction(async (tx) => {
      for (const user of seedUsers) {
        await tx.appUser.create({
          data: {
            id: user.id,
            name: user.name,
            age: user.age,
            gender: user.gender,
            weightKg: user.weightKg,
            heightCm: user.heightCm,
            experienceLevel: user.experienceLevel,
            trainingTrack: user.trainingTrack,
            readinessScore: user.readinessScore,
            primaryGoal: user.primaryGoal,
            availableEquipment: user.availableEquipment,
            constraints: user.constraints
          }
        });
      }

      for (const progress of seedProgressMetrics) {
        await tx.progressMetric.create({
          data: {
            userId: progress.userId,
            totalVolume: progress.totalVolume,
            completedSessions: progress.completedSessions,
            consistencyScore: progress.consistencyScore,
            personalRecords: progress.personalRecords,
            streakDays: progress.streakDays
          }
        });
      }

      await tx.friendship.createMany({
        data: [
          { userId: "user-demo", friendId: "user-rival-1" },
          { userId: "user-demo", friendId: "user-rival-2" }
        ]
      });

      for (const standard of benchmarkStandards) {
        await tx.benchmarkStandard.create({
          data: {
            lift: standard.lift,
            gender: standard.gender,
            bodyweightClassKg: standard.bodyweightClassKg,
            sourceLabel: standard.sourceLabel,
            novice: standard.standards.Novice,
            intermediate: standard.standards.Intermediate,
            advanced: standard.standards.Advanced,
            elite: standard.standards.Elite,
            olympian: standard.standards.Olympian
          }
        });
      }

      for (const plan of seedPlans) {
        await tx.workoutPlan.create({
          data: {
            id: plan.id,
            userId: plan.userId,
            name: plan.name,
            source: plan.source,
            focus: plan.focus,
            daysPerWeek: plan.daysPerWeek,
            progressionNotes: plan.progressionNotes,
            deloadRule: plan.deloadRule,
            sessions: {
              create: plan.sessions.map((session) => ({
                id: session.id,
                dayLabel: session.dayLabel,
                name: session.name,
                focus: session.focus,
                exercises: {
                  create: session.exercises.map((exercise) => ({
                    id: exercise.id,
                    name: exercise.name,
                    sets: exercise.sets,
                    targetReps: exercise.targetReps,
                    targetRpe: exercise.targetRpe,
                    progressionRule: exercise.progressionRule
                  }))
                }
              }))
            }
          }
        });
      }

      for (const challenge of seedChallenges) {
        await tx.challenge.create({
          data: {
            id: challenge.id,
            name: challenge.name,
            metric: challenge.metric,
            challengerId: challenge.challengerId,
            opponentId: challenge.opponentId,
            startsOn: new Date(challenge.startsOn),
            endsOn: new Date(challenge.endsOn),
            status: challenge.status,
            winnerId: challenge.winnerId
          }
        });
      }
    });
  })();

  await seedPromise;
}

export async function createBaselineAssessment(input: BaselineAssessmentInput): Promise<{
  assessment: BaselineAssessment;
  rankResult: RankResult;
}> {
  await ensureDatabaseSeeded();

  const existingUser = await getUserOrThrow(input.userId);
  const { assessment, userPatch } = createAssessmentRecord(input);

  await prisma.$transaction(async (tx) => {
    await tx.appUser.update({
      where: { id: input.userId },
      data: {
        age: userPatch.age,
        gender: userPatch.gender,
        weightKg: userPatch.weightKg,
        heightCm: userPatch.heightCm,
        experienceLevel: userPatch.experienceLevel,
        trainingTrack: userPatch.trainingTrack,
        readinessScore: userPatch.readinessScore,
        primaryGoal: userPatch.primaryGoal,
        availableEquipment: userPatch.availableEquipment,
        constraints: userPatch.constraints
      }
    });

    await tx.baselineAssessment.create({
      data: {
        id: assessment.id,
        userId: assessment.userId,
        createdAt: new Date(assessment.createdAt),
        trainingDaysPerWeek: assessment.trainingDaysPerWeek,
        recoveryScore: assessment.recoveryScore,
        sleepHours: assessment.sleepHours,
        stressLevel: assessment.stressLevel,
        movementLimitations: assessment.movementLimitations,
        musclePriorities: assessment.musclePriorities,
        summary: assessment.summary
      }
    });

    const currentProgress = await tx.progressMetric.findUnique({ where: { userId: input.userId } });
    const nextConsistency = currentProgress
      ? Math.max(currentProgress.consistencyScore, Math.round(deriveReadinessScore(input) * 0.9))
      : Math.round(deriveReadinessScore(input) * 0.9);

    await tx.progressMetric.upsert({
      where: { userId: input.userId },
      update: {
        personalRecords: {
          squat: input.performance.squat,
          bench: input.performance.bench,
          deadlift: input.performance.deadlift,
          overheadPress: input.performance.overheadPress
        },
        consistencyScore: nextConsistency
      },
      create: {
        userId: input.userId,
        totalVolume: 0,
        completedSessions: 0,
        consistencyScore: nextConsistency,
        personalRecords: {
          squat: input.performance.squat,
          bench: input.performance.bench,
          deadlift: input.performance.deadlift,
          overheadPress: input.performance.overheadPress
        },
        streakDays: 0
      }
    });
  });

  const updatedUser = {
    ...toUserProfile(existingUser),
    ...userPatch
  } satisfies UserProfile;
  const progress = toProgressMetric(await getProgressOrThrow(input.userId));

  return {
    assessment,
    rankResult: calculateRankResult(updatedUser, progress)
  };
}

export async function generatePlanForUser(userId: string, daysPerWeek?: number, goal?: string) {
  await ensureDatabaseSeeded();

  const user = toUserProfile(await getUserOrThrow(userId));
  const assessmentRecord = await prisma.baselineAssessment.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  const assessment = assessmentRecord ? toAssessment(assessmentRecord) : undefined;
  const plan = generateWorkoutPlan({
    userId,
    track: user.trainingTrack,
    trainingDaysPerWeek: daysPerWeek ?? 4,
    goal: goal ?? user.primaryGoal,
    availableEquipment: user.availableEquipment,
    assessment
  });

  await prisma.workoutPlan.create({
    data: {
      id: plan.id,
      userId: plan.userId,
      name: plan.name,
      source: plan.source,
      focus: plan.focus,
      daysPerWeek: plan.daysPerWeek,
      progressionNotes: plan.progressionNotes,
      deloadRule: plan.deloadRule,
      sessions: {
        create: plan.sessions.map((session) => ({
          id: session.id,
          dayLabel: session.dayLabel,
          name: session.name,
          focus: session.focus,
          exercises: {
            create: session.exercises.map((exercise) => ({
              id: exercise.id,
              name: exercise.name,
              sets: exercise.sets,
              targetReps: exercise.targetReps,
              targetRpe: exercise.targetRpe,
              progressionRule: exercise.progressionRule
            }))
          }
        }))
      }
    }
  });

  return plan;
}

export async function createCustomPlan(input: {
  userId: string;
  name: string;
  focus: string;
  daysPerWeek: number;
  exerciseNames: string[];
}) {
  await ensureDatabaseSeeded();

  const user = toUserProfile(await getUserOrThrow(input.userId));
  const plan = buildCustomPlan({
    ...input,
    track: user.trainingTrack
  });

  await prisma.workoutPlan.create({
    data: {
      id: plan.id,
      userId: plan.userId,
      name: plan.name,
      source: plan.source,
      focus: plan.focus,
      daysPerWeek: plan.daysPerWeek,
      progressionNotes: plan.progressionNotes,
      deloadRule: plan.deloadRule,
      sessions: {
        create: plan.sessions.map((session) => ({
          id: session.id,
          dayLabel: session.dayLabel,
          name: session.name,
          focus: session.focus,
          exercises: {
            create: session.exercises.map((exercise) => ({
              id: exercise.id,
              name: exercise.name,
              sets: exercise.sets,
              targetReps: exercise.targetReps,
              targetRpe: exercise.targetRpe,
              progressionRule: exercise.progressionRule
            }))
          }
        }))
      }
    }
  });

  return plan;
}

export async function logWorkoutSession(userId: string, input: SetLogInput) {
  await ensureDatabaseSeeded();

  const user = toUserProfile(await getUserOrThrow(userId));
  const ownedPlan = await prisma.workoutPlan.findFirst({
    where: { id: input.workoutId, userId }
  });
  if (!ownedPlan) throw new Error("Workout plan not found for this user.");

  const createdLog = await prisma.workoutLog.create({
    data: {
      id: `log-${Date.now()}`,
      userId,
      workoutId: input.workoutId,
      sessionId: input.sessionId,
      exerciseId: input.exerciseId,
      sets: {
        create: input.sets.map((set, index) => ({
          id: `set-${Date.now()}-${index + 1}`,
          weightKg: set.weightKg,
          reps: set.reps,
          rpe: set.rpe,
          completed: set.completed,
          notes: set.notes
        }))
      }
    },
    include: { sets: true }
  });

  const progress = await getProgressOrThrow(userId);
  const progressRecords = asPersonalRecords(progress.personalRecords);
  const addedVolume = input.sets.reduce((total, set) => total + set.weightKg * set.reps, 0);
  const prKey = toPrKey(input.exerciseId);
  const nextPr = Math.max(progressRecords[prKey] ?? 0, ...input.sets.map((set) => set.weightKg));

  const updatedProgress = await prisma.progressMetric.update({
    where: { userId },
    data: {
      totalVolume: toNumber(progress.totalVolume) + addedVolume,
      completedSessions: progress.completedSessions + 1,
      consistencyScore: Math.min(100, progress.consistencyScore + 1),
      streakDays: progress.streakDays + 1,
      personalRecords: {
        ...progressRecords,
        [prKey]: nextPr
      }
    }
  });

  const rankResult = calculateRankResult(user, toProgressMetric(updatedProgress));
  return {
    log: toWorkoutLog(createdLog),
    progress: toProgressMetric(updatedProgress),
    rankResult
  };
}

export async function getRankForUser(userId: string) {
  await ensureDatabaseSeeded();
  const user = toUserProfile(await getUserOrThrow(userId));
  const progress = toProgressMetric(await getProgressOrThrow(userId));
  return calculateRankResult(user, progress);
}

export async function createChallenge(input: {
  challengerId: string;
  opponentId: string;
  metric: "volume" | "consistency" | "pr";
  name: string;
  startsOn: string;
  endsOn: string;
}) {
  await ensureDatabaseSeeded();

  await getUserOrThrow(input.challengerId);
  await getUserOrThrow(input.opponentId);

  const summary = createChallengeSummary({
    id: `challenge-${Date.now()}`,
    ...input
  });

  await prisma.challenge.create({
    data: {
      id: summary.id,
      name: summary.name,
      metric: summary.metric,
      challengerId: summary.challengerId,
      opponentId: summary.opponentId,
      startsOn: new Date(summary.startsOn),
      endsOn: new Date(summary.endsOn),
      status: summary.status,
      winnerId: summary.winnerId
    }
  });

  return summary;
}

export async function joinChallenge(challengeId: string, userId: string) {
  await ensureDatabaseSeeded();

  await getUserOrThrow(userId);
  const challenge = await prisma.challenge.findUnique({ where: { id: challengeId } });
  if (!challenge) throw new Error("Challenge not found.");
  if (![challenge.challengerId, challenge.opponentId].includes(userId)) {
    throw new Error("User is not eligible for this challenge.");
  }

  const challengerProgress = toProgressMetric(await getProgressOrThrow(challenge.challengerId));
  const opponentProgress = toProgressMetric(await getProgressOrThrow(challenge.opponentId));
  const winnerId = evaluateChallengeWinner(
    challenge.metric as ChallengeSummary["metric"],
    challengerProgress,
    opponentProgress
  );

  const updated = await prisma.challenge.update({
    where: { id: challengeId },
    data: {
      status: "active",
      winnerId
    }
  });

  return toChallengeSummary(updated);
}

export async function getAppSnapshot(): Promise<AppSnapshot> {
  await ensureDatabaseSeeded();

  const currentUserRecord = await getUserOrThrow("user-demo");
  const currentUser = toUserProfile(currentUserRecord);
  const currentRank = calculateRankResult(
    currentUser,
    toProgressMetric(await getProgressOrThrow("user-demo"))
  );

  const friendLinks = await prisma.friendship.findMany({
    where: { userId: currentUser.id }
  });
  const friendRecords = await prisma.appUser.findMany({
    where: {
      id: {
        in: friendLinks.map((link) => link.friendId)
      }
    },
    include: appUserInclude
  });
  const friends = friendRecords.map(toUserProfile);

  const allUsers = await prisma.appUser.findMany({ include: appUserInclude });
  const allProgress = await prisma.progressMetric.findMany();
  const globalLeaderboard = buildLeaderboard(
    allUsers.map(toUserProfile),
    allProgress.map(toProgressMetric)
  );
  const friendLeaderboard = globalLeaderboard.filter((entry) =>
    friends.some((friend) => friend.id === entry.userId)
  );

  const workoutPlans = await prisma.workoutPlan.findMany({
    where: { userId: currentUser.id },
    include: workoutPlanInclude,
    orderBy: { id: "desc" }
  });

  const challenges = await prisma.challenge.findMany({
    where: {
      OR: [{ challengerId: currentUser.id }, { opponentId: currentUser.id }]
    },
    orderBy: { startsOn: "desc" }
  });

  return {
    currentUser,
    friends,
    rankTiers,
    rankResult: currentRank,
    workoutPlans: workoutPlans.map(toGeneratedPlan),
    challenges: challenges.map(toChallengeSummary),
    leaderboard: {
      global: globalLeaderboard,
      friends: friendLeaderboard
    }
  };
}

export async function __resetStoreForTests() {
  await prisma.loggedSet.deleteMany();
  await prisma.workoutLog.deleteMany();
  await prisma.plannedExercise.deleteMany();
  await prisma.workoutSession.deleteMany();
  await prisma.workoutPlan.deleteMany();
  await prisma.baselineAssessment.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.progressMetric.deleteMany();
  await prisma.benchmarkStandard.deleteMany();
  await prisma.appUser.deleteMany();
  seedPromise = null;
  await ensureDatabaseSeeded();
}

export function __buildAssessmentPreview(input: BaselineAssessmentInput) {
  return {
    trainingTrack: deriveTrainingTrack(input),
    readinessScore: deriveReadinessScore(input),
    constraints: deriveConstraints(input)
  };
}
