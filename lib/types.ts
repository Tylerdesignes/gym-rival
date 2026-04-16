export type Gender = "male" | "female" | "nonbinary";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type TrainingTrack = ExperienceLevel;
export type TierName = "Novice" | "Intermediate" | "Advanced" | "Elite" | "Olympian";
export type ChallengeMetric = "volume" | "consistency" | "pr";

export type UserProfile = {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  experienceLevel: ExperienceLevel;
  trainingTrack: TrainingTrack;
  readinessScore: number;
  constraints: string[];
  primaryGoal: string;
  availableEquipment: string[];
};

export type BaselineAssessmentInput = {
  userId: string;
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  experienceLevel: ExperienceLevel;
  trainingDaysPerWeek: number;
  availableEquipment: string[];
  recoveryScore: number;
  sleepHours: number;
  stressLevel: number;
  primaryGoal: string;
  movementLimitations: string[];
  performance: {
    squat: number;
    bench: number;
    deadlift: number;
    overheadPress: number;
    pullUps: number;
  };
};

export type BaselineAssessment = {
  id: string;
  userId: string;
  createdAt: string;
  trainingDaysPerWeek: number;
  recoveryScore: number;
  sleepHours: number;
  stressLevel: number;
  movementLimitations: string[];
  musclePriorities: string[];
  summary: string;
};

export type Exercise = {
  id: string;
  name: string;
  category: "compound" | "accessory";
  primaryMuscles: string[];
  equipment: string[];
  defaultRepRange: string;
};

export type PlannedExercise = {
  id: string;
  name: string;
  sets: number;
  targetReps: string;
  targetRpe: number;
  progressionRule: string;
};

export type WorkoutSession = {
  id: string;
  dayLabel: string;
  name: string;
  focus: string;
  exercises: PlannedExercise[];
};

export type GeneratedPlan = {
  id: string;
  userId: string;
  name: string;
  source: "generated" | "custom";
  focus: string;
  daysPerWeek: number;
  progressionNotes: string[];
  deloadRule: string;
  sessions: WorkoutSession[];
};

export type LoggedSet = {
  id: string;
  weightKg: number;
  reps: number;
  rpe: number;
  completed: boolean;
  notes?: string;
};

export type SetLogInput = {
  workoutId: string;
  sessionId: string;
  exerciseId: string;
  sets: Array<{
    weightKg: number;
    reps: number;
    rpe: number;
    completed: boolean;
    notes?: string;
  }>;
};

export type WorkoutLog = {
  id: string;
  userId: string;
  workoutId: string;
  sessionId: string;
  exerciseId: string;
  createdAt: string;
  sets: LoggedSet[];
};

export type ProgressMetric = {
  userId: string;
  totalVolume: number;
  completedSessions: number;
  consistencyScore: number;
  personalRecords: Record<string, number>;
  streakDays: number;
};

export type BenchmarkStandard = {
  lift: "squat" | "bench" | "deadlift" | "overheadPress";
  gender: Gender | "open";
  bodyweightClassKg: number;
  standards: Record<TierName, number>;
  sourceLabel: string;
};

export type RankLiftResult = {
  lift: string;
  score: number;
  ratioToBodyweight: number;
  tier: TierName;
};

export type RankResult = {
  userId: string;
  overallTier: TierName;
  overallScore: number;
  summary: string;
  liftBreakdown: RankLiftResult[];
};

export type RankTier = {
  name: TierName;
  minScore: number;
  description: string;
};

export type ChallengeSummary = {
  id: string;
  name: string;
  metric: ChallengeMetric;
  challengerId: string;
  opponentId: string;
  startsOn: string;
  endsOn: string;
  status: "pending" | "active" | "completed";
  winnerId?: string;
};

export type LeaderboardEntry = {
  userId: string;
  userName: string;
  overallTier: TierName;
  score: number;
  consistency: number;
};

export type AppSnapshot = {
  currentUser: UserProfile;
  friends: UserProfile[];
  rankTiers: RankTier[];
  rankResult: RankResult;
  workoutPlans: GeneratedPlan[];
  challenges: ChallengeSummary[];
  leaderboard: {
    global: LeaderboardEntry[];
    friends: LeaderboardEntry[];
  };
};
