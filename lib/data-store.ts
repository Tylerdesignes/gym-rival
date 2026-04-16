import type {
  AppSnapshot,
  BaselineAssessmentInput,
  ChallengeSummary,
  GeneratedPlan,
  RankResult,
  SetLogInput
} from "@/lib/types";
import * as databaseStore from "@/lib/database-store";
import * as memoryStore from "@/lib/memory-store";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

function getStore() {
  return hasDatabaseUrl ? databaseStore : memoryStore;
}

export async function createBaselineAssessment(input: BaselineAssessmentInput): Promise<{
  assessment: Awaited<ReturnType<typeof memoryStore.createBaselineAssessment>>["assessment"];
  rankResult: RankResult;
}> {
  return getStore().createBaselineAssessment(input);
}

export async function generatePlanForUser(
  userId: string,
  daysPerWeek?: number,
  goal?: string
): Promise<GeneratedPlan> {
  return getStore().generatePlanForUser(userId, daysPerWeek, goal);
}

export async function createCustomPlan(input: {
  userId: string;
  name: string;
  focus: string;
  daysPerWeek: number;
  exerciseNames: string[];
}): Promise<GeneratedPlan> {
  return getStore().createCustomPlan(input);
}

export async function logWorkoutSession(userId: string, input: SetLogInput): Promise<{
  log: Awaited<ReturnType<typeof memoryStore.logWorkoutSession>>["log"];
  progress: Awaited<ReturnType<typeof memoryStore.logWorkoutSession>>["progress"];
  rankResult: RankResult;
}> {
  return getStore().logWorkoutSession(userId, input);
}

export async function getRankForUser(userId: string): Promise<RankResult> {
  return getStore().getRankForUser(userId);
}

export async function createChallenge(input: {
  challengerId: string;
  opponentId: string;
  metric: "volume" | "consistency" | "pr";
  name: string;
  startsOn: string;
  endsOn: string;
}): Promise<ChallengeSummary> {
  return getStore().createChallenge(input);
}

export async function joinChallenge(challengeId: string, userId: string): Promise<ChallengeSummary> {
  return getStore().joinChallenge(challengeId, userId);
}

export async function getAppSnapshot(): Promise<AppSnapshot> {
  return getStore().getAppSnapshot();
}

export async function __resetStoreForTests() {
  return getStore().__resetStoreForTests();
}

export function __buildAssessmentPreview(input: BaselineAssessmentInput) {
  return getStore().__buildAssessmentPreview(input);
}

export function isDatabaseEnabled() {
  return hasDatabaseUrl;
}
