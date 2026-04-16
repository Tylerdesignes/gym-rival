import type { BaselineAssessment, BaselineAssessmentInput, TrainingTrack, UserProfile } from "@/lib/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function deriveTrainingTrack(input: BaselineAssessmentInput): TrainingTrack {
  const liftAverage =
    (input.performance.squat +
      input.performance.bench +
      input.performance.deadlift +
      input.performance.overheadPress) /
    4;

  if (input.experienceLevel === "advanced" || liftAverage >= 120) {
    return "advanced";
  }

  if (input.experienceLevel === "intermediate" || liftAverage >= 70) {
    return "intermediate";
  }

  return "beginner";
}

export function deriveReadinessScore(input: BaselineAssessmentInput) {
  const score =
    input.recoveryScore * 7 +
    input.sleepHours * 4 -
    input.stressLevel * 3 +
    input.trainingDaysPerWeek * 3 -
    input.movementLimitations.length * 4;

  return clamp(Math.round(score), 35, 96);
}

export function deriveConstraints(input: BaselineAssessmentInput) {
  const constraints: string[] = [];

  if (input.sleepHours < 7) constraints.push("Prioritize recovery and cap volume spikes");
  if (input.stressLevel >= 7) constraints.push("Use slower overload while stress is elevated");
  if (input.movementLimitations.length > 0) constraints.push(...input.movementLimitations);
  if (!input.availableEquipment.includes("barbell")) constraints.push("Need machine or dumbbell substitutions");
  if (input.recoveryScore <= 5) constraints.push("Insert extra recovery day before heavy lower sessions");

  return constraints.length > 0 ? constraints : ["Standard progression can proceed"];
}

export function deriveMusclePriorities(input: BaselineAssessmentInput) {
  const priorities = ["Chest", "Back", "Legs"];
  if (input.performance.pullUps < 8) priorities.unshift("Upper Back");
  if (input.performance.overheadPress < input.performance.bench * 0.65) priorities.push("Shoulders");
  return priorities.slice(0, 4);
}

export function createAssessmentRecord(input: BaselineAssessmentInput): {
  assessment: BaselineAssessment;
  userPatch: Partial<UserProfile>;
} {
  const trainingTrack = deriveTrainingTrack(input);
  const readinessScore = deriveReadinessScore(input);
  const constraints = deriveConstraints(input);
  const musclePriorities = deriveMusclePriorities(input);

  return {
    assessment: {
      id: `assessment-${input.userId}-${Date.now()}`,
      userId: input.userId,
      createdAt: new Date().toISOString(),
      trainingDaysPerWeek: input.trainingDaysPerWeek,
      recoveryScore: input.recoveryScore,
      sleepHours: input.sleepHours,
      stressLevel: input.stressLevel,
      movementLimitations: input.movementLimitations,
      musclePriorities,
      summary: `${trainingTrack} track with readiness ${readinessScore}/100. Prioritize ${musclePriorities.join(", ")}.`
    },
    userPatch: {
      age: input.age,
      gender: input.gender,
      weightKg: input.weightKg,
      heightCm: input.heightCm,
      experienceLevel: input.experienceLevel,
      trainingTrack,
      readinessScore,
      constraints,
      primaryGoal: input.primaryGoal,
      availableEquipment: input.availableEquipment
    }
  };
}
