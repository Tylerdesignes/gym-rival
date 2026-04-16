import type {
  BenchmarkStandard,
  ChallengeSummary,
  Exercise,
  GeneratedPlan,
  ProgressMetric,
  RankTier,
  UserProfile
} from "@/lib/types";

export const exercises: Exercise[] = [
  {
    id: "barbell-squat",
    name: "Barbell Squat",
    category: "compound",
    primaryMuscles: ["Quads", "Glutes"],
    equipment: ["barbell", "rack"],
    defaultRepRange: "5-8"
  },
  {
    id: "bench-press",
    name: "Bench Press",
    category: "compound",
    primaryMuscles: ["Chest", "Triceps"],
    equipment: ["barbell", "bench"],
    defaultRepRange: "6-10"
  },
  {
    id: "deadlift",
    name: "Deadlift",
    category: "compound",
    primaryMuscles: ["Posterior Chain"],
    equipment: ["barbell"],
    defaultRepRange: "3-6"
  },
  {
    id: "ohp",
    name: "Overhead Press",
    category: "compound",
    primaryMuscles: ["Shoulders", "Triceps"],
    equipment: ["barbell"],
    defaultRepRange: "6-10"
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    category: "accessory",
    primaryMuscles: ["Lats", "Upper Back"],
    equipment: ["cable"],
    defaultRepRange: "10-15"
  },
  {
    id: "rdl",
    name: "Romanian Deadlift",
    category: "compound",
    primaryMuscles: ["Hamstrings", "Glutes"],
    equipment: ["barbell", "dumbbell"],
    defaultRepRange: "6-10"
  },
  {
    id: "split-squat",
    name: "Bulgarian Split Squat",
    category: "accessory",
    primaryMuscles: ["Quads", "Glutes"],
    equipment: ["dumbbell"],
    defaultRepRange: "8-12"
  },
  {
    id: "cable-row",
    name: "Seated Cable Row",
    category: "accessory",
    primaryMuscles: ["Mid Back", "Biceps"],
    equipment: ["cable"],
    defaultRepRange: "10-15"
  }
];

export const rankTiers: RankTier[] = [
  { name: "Novice", minScore: 0, description: "Learning movement patterns and building a base." },
  { name: "Intermediate", minScore: 45, description: "Consistent lifting with clear progression." },
  { name: "Advanced", minScore: 65, description: "Strong relative to bodyweight and training age." },
  { name: "Elite", minScore: 82, description: "Competition-adjacent strength and consistency." },
  { name: "Olympian", minScore: 92, description: "Top aspirational tier modeled on elite ranges." }
];

export const benchmarkStandards: BenchmarkStandard[] = [
  {
    lift: "squat",
    gender: "male",
    bodyweightClassKg: 82.5,
    sourceLabel: "Composite public strength standards",
    standards: { Novice: 60, Intermediate: 110, Advanced: 150, Elite: 190, Olympian: 220 }
  },
  {
    lift: "bench",
    gender: "male",
    bodyweightClassKg: 82.5,
    sourceLabel: "Composite public strength standards",
    standards: { Novice: 45, Intermediate: 82.5, Advanced: 115, Elite: 145, Olympian: 175 }
  },
  {
    lift: "deadlift",
    gender: "male",
    bodyweightClassKg: 82.5,
    sourceLabel: "Composite public strength standards",
    standards: { Novice: 75, Intermediate: 140, Advanced: 185, Elite: 225, Olympian: 255 }
  },
  {
    lift: "overheadPress",
    gender: "male",
    bodyweightClassKg: 82.5,
    sourceLabel: "Composite public strength standards",
    standards: { Novice: 30, Intermediate: 55, Advanced: 75, Elite: 95, Olympian: 110 }
  },
  {
    lift: "squat",
    gender: "female",
    bodyweightClassKg: 63,
    sourceLabel: "Composite public strength standards",
    standards: { Novice: 35, Intermediate: 75, Advanced: 110, Elite: 145, Olympian: 170 }
  },
  {
    lift: "bench",
    gender: "female",
    bodyweightClassKg: 63,
    sourceLabel: "Composite public strength standards",
    standards: { Novice: 20, Intermediate: 45, Advanced: 67.5, Elite: 85, Olympian: 102.5 }
  },
  {
    lift: "deadlift",
    gender: "female",
    bodyweightClassKg: 63,
    sourceLabel: "Composite public strength standards",
    standards: { Novice: 45, Intermediate: 92.5, Advanced: 130, Elite: 165, Olympian: 190 }
  },
  {
    lift: "overheadPress",
    gender: "female",
    bodyweightClassKg: 63,
    sourceLabel: "Composite public strength standards",
    standards: { Novice: 15, Intermediate: 32.5, Advanced: 47.5, Elite: 60, Olympian: 72.5 }
  }
];

export const seedUsers: UserProfile[] = [
  {
    id: "user-demo",
    name: "Taylor",
    age: 28,
    gender: "male",
    weightKg: 82.5,
    heightCm: 181,
    experienceLevel: "intermediate",
    trainingTrack: "intermediate",
    readinessScore: 76,
    constraints: ["Monitor shoulder fatigue", "Deload every 5th week"],
    primaryGoal: "Gain lean muscle while improving benchmark lifts",
    availableEquipment: ["barbell", "bench", "rack", "cable", "dumbbell", "machines"]
  },
  {
    id: "user-rival-1",
    name: "Avery",
    age: 25,
    gender: "female",
    weightKg: 63,
    heightCm: 170,
    experienceLevel: "advanced",
    trainingTrack: "advanced",
    readinessScore: 82,
    constraints: ["Cap high-fatigue deadlifts at 1 top set"],
    primaryGoal: "Push toward elite total",
    availableEquipment: ["barbell", "rack", "cable", "dumbbell"]
  },
  {
    id: "user-rival-2",
    name: "Jordan",
    age: 31,
    gender: "male",
    weightKg: 90,
    heightCm: 185,
    experienceLevel: "beginner",
    trainingTrack: "beginner",
    readinessScore: 68,
    constraints: ["Favor machine substitutions for knee comfort"],
    primaryGoal: "Build muscle consistency",
    availableEquipment: ["machines", "cable", "dumbbell"]
  }
];

export const seedProgressMetrics: ProgressMetric[] = [
  {
    userId: "user-demo",
    totalVolume: 15240,
    completedSessions: 18,
    consistencyScore: 84,
    personalRecords: { squat: 110, bench: 82.5, deadlift: 145, overheadPress: 55 },
    streakDays: 13
  },
  {
    userId: "user-rival-1",
    totalVolume: 16620,
    completedSessions: 19,
    consistencyScore: 91,
    personalRecords: { squat: 122.5, bench: 72.5, deadlift: 157.5, overheadPress: 47.5 },
    streakDays: 18
  },
  {
    userId: "user-rival-2",
    totalVolume: 9140,
    completedSessions: 11,
    consistencyScore: 70,
    personalRecords: { squat: 80, bench: 65, deadlift: 115, overheadPress: 40 },
    streakDays: 5
  }
];

export const seedPlans: GeneratedPlan[] = [
  {
    id: "plan-generated",
    userId: "user-demo",
    name: "Lean Mass Ladder",
    source: "generated",
    focus: "Hypertrophy + benchmark lift progression",
    daysPerWeek: 4,
    progressionNotes: [
      "Add 2.5kg when all top sets land at target reps with RPE 8 or below.",
      "If two consecutive sessions miss targets, swap to a rep progression before load progression.",
      "Insert a low-fatigue deload on week 5."
    ],
    deloadRule: "Reduce sets by 40% and keep loads at 85% of the prior week on deload weeks.",
    sessions: [
      {
        id: "session-upper-a",
        dayLabel: "Day 1",
        name: "Upper A",
        focus: "Pressing strength and back volume",
        exercises: [
          { id: "bench-press", name: "Bench Press", sets: 4, targetReps: "6-8", targetRpe: 8, progressionRule: "Add 2.5kg after two successful weeks." },
          { id: "cable-row", name: "Seated Cable Row", sets: 4, targetReps: "10-12", targetRpe: 8, progressionRule: "Add reps before load." },
          { id: "ohp", name: "Overhead Press", sets: 3, targetReps: "8-10", targetRpe: 8, progressionRule: "Add 1-2 reps before load." }
        ]
      },
      {
        id: "session-lower-a",
        dayLabel: "Day 2",
        name: "Lower A",
        focus: "Squat emphasis and posterior chain",
        exercises: [
          { id: "barbell-squat", name: "Barbell Squat", sets: 4, targetReps: "5-7", targetRpe: 8, progressionRule: "Add 2.5-5kg when reps are complete." },
          { id: "rdl", name: "Romanian Deadlift", sets: 3, targetReps: "8-10", targetRpe: 8, progressionRule: "Progress load every other week." },
          { id: "split-squat", name: "Bulgarian Split Squat", sets: 3, targetReps: "10-12", targetRpe: 8, progressionRule: "Add reps first." }
        ]
      }
    ]
  }
];

export const seedChallenges: ChallengeSummary[] = [
  {
    id: "challenge-1",
    name: "Spring Volume Race",
    metric: "volume",
    challengerId: "user-demo",
    opponentId: "user-rival-1",
    startsOn: "2026-04-01",
    endsOn: "2026-04-21",
    status: "active"
  }
];
