import { createAssessmentRecord, deriveConstraints, deriveReadinessScore, deriveTrainingTrack } from "@/lib/assessment";
import { createChallengeSummary, evaluateChallengeWinner } from "@/lib/challenges";
import { buildLeaderboard } from "@/lib/leaderboards";
import { buildCustomPlan, generateWorkoutPlan } from "@/lib/plans";
import { calculateRankResult } from "@/lib/ranking";
import { seedChallenges, seedPlans, seedProgressMetrics, seedUsers, rankTiers } from "@/lib/seed-data";
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

type Store = {
  users: UserProfile[];
  assessments: BaselineAssessment[];
  workoutPlans: GeneratedPlan[];
  logs: WorkoutLog[];
  progressMetrics: ProgressMetric[];
  challenges: ChallengeSummary[];
  friends: Array<{ userId: string; friendId: string }>;
};

const globalStore = globalThis as typeof globalThis & { __gymRivalStore?: Store };

function createStore(): Store {
  return {
    users: structuredClone(seedUsers),
    assessments: [],
    workoutPlans: structuredClone(seedPlans),
    logs: [],
    progressMetrics: structuredClone(seedProgressMetrics),
    challenges: structuredClone(seedChallenges),
    friends: [
      { userId: "user-demo", friendId: "user-rival-1" },
      { userId: "user-demo", friendId: "user-rival-2" }
    ]
  };
}

function getStore() {
  if (!globalStore.__gymRivalStore) {
    globalStore.__gymRivalStore = createStore();
  }

  return globalStore.__gymRivalStore;
}

function getUser(userId: string) {
  const user = getStore().users.find((candidate) => candidate.id === userId);
  if (!user) throw new Error(`Unknown user ${userId}`);
  return user;
}

function getProgress(userId: string) {
  const progress = getStore().progressMetrics.find((candidate) => candidate.userId === userId);
  if (!progress) throw new Error(`Missing progress for ${userId}`);
  return progress;
}

function upsertPlan(plan: GeneratedPlan) {
  const store = getStore();
  store.workoutPlans.unshift(plan);
}

function toPrKey(exerciseId: string) {
  const normalized = exerciseId.toLowerCase();
  if (normalized.includes("bench")) return "bench";
  if (normalized.includes("squat")) return "squat";
  if (normalized.includes("deadlift") || normalized === "rdl") return "deadlift";
  if (normalized.includes("press") || normalized === "ohp") return "overheadPress";
  return exerciseId;
}

export function createBaselineAssessment(input: BaselineAssessmentInput): {
  assessment: BaselineAssessment;
  rankResult: RankResult;
} {
  const store = getStore();
  const existingUser = getUser(input.userId);
  const { assessment, userPatch } = createAssessmentRecord(input);

  Object.assign(existingUser, userPatch);
  store.assessments.unshift(assessment);

  const progress = getProgress(input.userId);
  progress.personalRecords = {
    squat: input.performance.squat,
    bench: input.performance.bench,
    deadlift: input.performance.deadlift,
    overheadPress: input.performance.overheadPress
  };
  progress.consistencyScore = Math.max(progress.consistencyScore, Math.round(deriveReadinessScore(input) * 0.9));

  return {
    assessment,
    rankResult: calculateRankResult(existingUser, progress)
  };
}

export function generatePlanForUser(userId: string, daysPerWeek?: number, goal?: string) {
  const store = getStore();
  const user = getUser(userId);
  const assessment = store.assessments.find((item) => item.userId === userId);
  const plan = generateWorkoutPlan({
    userId,
    track: user.trainingTrack,
    trainingDaysPerWeek: daysPerWeek ?? 4,
    goal: goal ?? user.primaryGoal,
    availableEquipment: user.availableEquipment,
    assessment
  });
  upsertPlan(plan);
  return plan;
}

export function createCustomPlan(input: {
  userId: string;
  name: string;
  focus: string;
  daysPerWeek: number;
  exerciseNames: string[];
}) {
  const user = getUser(input.userId);
  const plan = buildCustomPlan({
    ...input,
    track: user.trainingTrack
  });
  upsertPlan(plan);
  return plan;
}

export function logWorkoutSession(userId: string, input: SetLogInput) {
  const store = getStore();
  const user = getUser(userId);
  const ownedPlan = store.workoutPlans.find((plan) => plan.id === input.workoutId && plan.userId === userId);
  if (!ownedPlan) throw new Error("Workout plan not found for this user.");

  const log: WorkoutLog = {
    id: `log-${Date.now()}`,
    userId,
    workoutId: input.workoutId,
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    createdAt: new Date().toISOString(),
    sets: input.sets.map((set, index) => ({
      id: `set-${index + 1}`,
      weightKg: set.weightKg,
      reps: set.reps,
      rpe: set.rpe,
      completed: set.completed,
      notes: set.notes
    }))
  };

  store.logs.unshift(log);

  const progress = getProgress(userId);
  const addedVolume = log.sets.reduce((total, set) => total + set.weightKg * set.reps, 0);
  progress.totalVolume += addedVolume;
  progress.completedSessions += 1;
  progress.consistencyScore = Math.min(100, progress.consistencyScore + 1);
  progress.streakDays += 1;
  const prKey = toPrKey(input.exerciseId);
  progress.personalRecords[prKey] = Math.max(
    progress.personalRecords[prKey] ?? 0,
    ...log.sets.map((set) => set.weightKg)
  );

  const rankResult = calculateRankResult(user, progress);
  return { log, progress, rankResult };
}

export function getRankForUser(userId: string) {
  return calculateRankResult(getUser(userId), getProgress(userId));
}

export function createChallenge(input: {
  challengerId: string;
  opponentId: string;
  metric: "volume" | "consistency" | "pr";
  name: string;
  startsOn: string;
  endsOn: string;
}) {
  getUser(input.challengerId);
  getUser(input.opponentId);
  const summary = createChallengeSummary({
    id: `challenge-${Date.now()}`,
    ...input
  });
  getStore().challenges.unshift(summary);
  return summary;
}

export function joinChallenge(challengeId: string, userId: string) {
  getUser(userId);
  const challenge = getStore().challenges.find((item) => item.id === challengeId);
  if (!challenge) throw new Error("Challenge not found.");

  if (![challenge.challengerId, challenge.opponentId].includes(userId)) {
    throw new Error("User is not eligible for this challenge.");
  }

  challenge.status = "active";
  challenge.winnerId = evaluateChallengeWinner(
    challenge.metric,
    getProgress(challenge.challengerId),
    getProgress(challenge.opponentId)
  );

  return challenge;
}

export function getAppSnapshot(): AppSnapshot {
  const store = getStore();
  const currentUser = getUser("user-demo");
  const currentRank = calculateRankResult(currentUser, getProgress("user-demo"));
  const friendUsers = store.friends
    .filter((link) => link.userId === currentUser.id)
    .map((link) => getUser(link.friendId));

  const globalLeaderboard = buildLeaderboard(store.users, store.progressMetrics);
  const friendLeaderboard = globalLeaderboard.filter((entry) =>
    friendUsers.some((friend) => friend.id === entry.userId)
  );

  return {
    currentUser,
    friends: friendUsers,
    rankTiers,
    rankResult: currentRank,
    workoutPlans: store.workoutPlans.filter((plan) => plan.userId === currentUser.id),
    challenges: store.challenges.filter(
      (challenge) =>
        challenge.challengerId === currentUser.id || challenge.opponentId === currentUser.id
    ),
    leaderboard: {
      global: globalLeaderboard,
      friends: friendLeaderboard
    }
  };
}

export function __resetStoreForTests() {
  globalStore.__gymRivalStore = createStore();
}

export function __buildAssessmentPreview(input: BaselineAssessmentInput) {
  return {
    trainingTrack: deriveTrainingTrack(input),
    readinessScore: deriveReadinessScore(input),
    constraints: deriveConstraints(input)
  };
}
