import {
  __buildAssessmentPreview,
  __resetStoreForTests,
  createBaselineAssessment,
  createChallenge,
  generatePlanForUser,
  getAppSnapshot,
  joinChallenge,
  logWorkoutSession
} from "@/lib/data-store";
import type { BaselineAssessmentInput } from "@/lib/types";

describe("gym rival domain", () => {
  beforeEach(async () => {
    await __resetStoreForTests();
  });

  const baselineInput: BaselineAssessmentInput = {
    userId: "user-demo",
    age: 28,
    gender: "male",
    weightKg: 82.5,
    heightCm: 181,
    experienceLevel: "intermediate",
    trainingDaysPerWeek: 4,
    availableEquipment: ["barbell", "rack", "bench", "dumbbell", "cable"],
    recoveryScore: 7,
    sleepHours: 7.5,
    stressLevel: 4,
    primaryGoal: "Gain lean muscle",
    movementLimitations: [],
    performance: {
      squat: 115,
      bench: 85,
      deadlift: 150,
      overheadPress: 57.5,
      pullUps: 8
    }
  };

  it("derives the expected training track and readiness inputs", () => {
    const preview = __buildAssessmentPreview(baselineInput);
    expect(preview.trainingTrack).toBe("intermediate");
    expect(preview.readinessScore).toBeGreaterThan(60);
    expect(preview.constraints.length).toBeGreaterThan(0);
  });

  it("creates a baseline and returns a rank result", async () => {
    const result = await createBaselineAssessment(baselineInput);
    expect(result.assessment.userId).toBe("user-demo");
    expect(result.rankResult.overallTier).toBeTruthy();
  });

  it("generates a valid training plan for the user", async () => {
    await createBaselineAssessment(baselineInput);
    const plan = await generatePlanForUser("user-demo", 4, "Gain muscle");
    expect(plan.sessions).toHaveLength(4);
    expect(plan.progressionNotes.length).toBeGreaterThan(1);
  });

  it("logs workout volume and improves progress metrics", async () => {
    const initialVolume = (await getAppSnapshot()).leaderboard.global.find(
      (entry) => entry.userId === "user-demo"
    )?.score;
    const plan = await generatePlanForUser("user-demo", 3, "Gain muscle");
    const result = await logWorkoutSession("user-demo", {
      workoutId: plan.id,
      sessionId: plan.sessions[0].id,
      exerciseId: "bench",
      sets: [{ weightKg: 80, reps: 8, rpe: 8, completed: true }]
    });

    expect(result.progress.totalVolume).toBeGreaterThan(15240);
    expect(result.rankResult.overallScore).toBeGreaterThan(0);
    expect(initialVolume).toBeGreaterThan(0);
  });

  it("creates and resolves challenges across supported metrics", async () => {
    const challenge = await createChallenge({
      challengerId: "user-demo",
      opponentId: "user-rival-1",
      metric: "volume",
      name: "Volume Clash",
      startsOn: "2026-04-15",
      endsOn: "2026-04-30"
    });

    const joined = await joinChallenge(challenge.id, "user-rival-1");
    expect(joined.status).toBe("active");
    expect(joined.winnerId).toBeTruthy();
  });
});
