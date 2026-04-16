import { exercises } from "@/lib/seed-data";
import type { BaselineAssessment, Exercise, GeneratedPlan, PlannedExercise, TrainingTrack } from "@/lib/types";

function selectExercise(name: string) {
  return exercises.find((exercise) => exercise.name.toLowerCase() === name.toLowerCase());
}

function progressionRule(track: TrainingTrack) {
  if (track === "advanced") return "Use small load jumps and add a back-off set only after strong recovery weeks.";
  if (track === "intermediate") return "Progress load once top sets hit the rep ceiling at RPE 8 or below.";
  return "Own the rep range first, then add small load jumps.";
}

function buildExercisePlan(exercise: Exercise, track: TrainingTrack): PlannedExercise {
  const sets = track === "advanced" ? 4 : track === "intermediate" ? 3 : 2;
  const targetRpe = track === "advanced" ? 8.5 : 8;
  return {
    id: exercise.id,
    name: exercise.name,
    sets,
    targetReps: exercise.defaultRepRange,
    targetRpe,
    progressionRule: progressionRule(track)
  };
}

export function generateWorkoutPlan(args: {
  userId: string;
  track: TrainingTrack;
  trainingDaysPerWeek: number;
  goal: string;
  availableEquipment: string[];
  assessment?: BaselineAssessment;
}): GeneratedPlan {
  const compoundPool = exercises.filter(
    (exercise) =>
      exercise.category === "compound" &&
      exercise.equipment.some((item) => args.availableEquipment.includes(item))
  );
  const accessoryPool = exercises.filter(
    (exercise) =>
      exercise.category === "accessory" &&
      exercise.equipment.some((item) => args.availableEquipment.includes(item))
  );

  const days = Math.max(3, Math.min(5, args.trainingDaysPerWeek));
  const sessions = Array.from({ length: days }, (_, index) => {
    const main = compoundPool[index % compoundPool.length] ?? exercises[0];
    const secondary = compoundPool[(index + 1) % compoundPool.length] ?? exercises[1];
    const accessory = accessoryPool[index % accessoryPool.length] ?? exercises[4];
    return {
      id: `generated-session-${index + 1}`,
      dayLabel: `Day ${index + 1}`,
      name: index % 2 === 0 ? "Upper / Pull Emphasis" : "Lower / Push Emphasis",
      focus: `${args.goal} with ${main.primaryMuscles[0]} priority`,
      exercises: [
        buildExercisePlan(main, args.track),
        buildExercisePlan(secondary, args.track),
        buildExercisePlan(accessory, args.track)
      ]
    };
  });

  const notes = [
    progressionRule(args.track),
    "Missed sessions trigger a repeat week before increasing training stress.",
    "Plateaus across two exposures reduce load by 5% and add one top-end rep target."
  ];

  if (args.assessment && args.assessment.recoveryScore <= 5) {
    notes.push("Cap weekly set increases at one extra set per muscle group due to recovery profile.");
  }

  return {
    id: `plan-${args.userId}-${Date.now()}`,
    userId: args.userId,
    name: args.track === "advanced" ? "Elite Muscle Climb" : args.track === "intermediate" ? "Mass Momentum" : "Foundations for Size",
    source: "generated",
    focus: args.goal,
    daysPerWeek: days,
    progressionNotes: notes,
    deloadRule: "Every 5th week, reduce volume by 35-40% and keep technique crisp.",
    sessions
  };
}

export function buildCustomPlan(args: {
  userId: string;
  name: string;
  focus: string;
  daysPerWeek: number;
  exerciseNames: string[];
  track: TrainingTrack;
}): GeneratedPlan {
  const selected = args.exerciseNames
    .map((name) => selectExercise(name))
    .filter((exercise): exercise is Exercise => Boolean(exercise));

  const fallback = selected.length > 0 ? selected : exercises.slice(0, 4);

  return {
    id: `custom-${args.userId}-${Date.now()}`,
    userId: args.userId,
    name: args.name,
    source: "custom",
    focus: args.focus,
    daysPerWeek: args.daysPerWeek,
    progressionNotes: [
      "Custom plans still track progression against volume, PRs, and adherence.",
      progressionRule(args.track)
    ],
    deloadRule: "Trigger deload after 3 consecutive under-recovered sessions or a 10% performance dip.",
    sessions: Array.from({ length: Math.max(1, args.daysPerWeek) }, (_, index) => ({
      id: `custom-session-${index + 1}`,
      dayLabel: `Day ${index + 1}`,
      name: `${args.focus} Session ${index + 1}`,
      focus: args.focus,
      exercises: fallback.slice(index, index + 3).concat(fallback.slice(0, Math.max(0, index + 3 - fallback.length))).slice(0, 3).map((exercise) => buildExercisePlan(exercise, args.track))
    }))
  };
}
