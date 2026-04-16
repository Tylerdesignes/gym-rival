import { benchmarkStandards, rankTiers } from "@/lib/seed-data";
import type { BenchmarkStandard, ProgressMetric, RankLiftResult, RankResult, TierName, UserProfile } from "@/lib/types";

const tierOrder: TierName[] = ["Novice", "Intermediate", "Advanced", "Elite", "Olympian"];

function getStandard(user: UserProfile, lift: BenchmarkStandard["lift"]) {
  const byGender = benchmarkStandards.filter((standard) => standard.lift === lift && standard.gender === user.gender);
  return byGender[0] ?? benchmarkStandards.find((standard) => standard.lift === lift)!;
}

function computeTier(score: number): TierName {
  const match = [...rankTiers].reverse().find((tier) => score >= tier.minScore);
  return match?.name ?? "Novice";
}

function normalizeLift(scoreKg: number, standard: BenchmarkStandard) {
  const olympian = standard.standards.Olympian;
  return Math.min(100, Math.round((scoreKg / olympian) * 100));
}

function toLiftResult(user: UserProfile, lift: BenchmarkStandard["lift"], scoreKg: number): RankLiftResult {
  const standard = getStandard(user, lift);
  const normalized = normalizeLift(scoreKg, standard);
  const tier = [...tierOrder].reverse().find((tierName) => scoreKg >= standard.standards[tierName]) ?? "Novice";

  return {
    lift,
    score: normalized,
    ratioToBodyweight: Number((scoreKg / user.weightKg).toFixed(2)),
    tier
  };
}

export function calculateRankResult(user: UserProfile, progress: ProgressMetric): RankResult {
  const lifts = [
    toLiftResult(user, "squat", progress.personalRecords.squat ?? 0),
    toLiftResult(user, "bench", progress.personalRecords.bench ?? 0),
    toLiftResult(user, "deadlift", progress.personalRecords.deadlift ?? 0),
    toLiftResult(user, "overheadPress", progress.personalRecords.overheadPress ?? 0)
  ];

  const strengthScore = lifts.reduce((total, lift) => total + lift.score, 0) / lifts.length;
  const consistencyBoost = progress.consistencyScore * 0.18;
  const readinessBoost = user.readinessScore * 0.12;
  const overallScore = Math.round(Math.min(100, strengthScore * 0.7 + consistencyBoost + readinessBoost));
  const overallTier = computeTier(overallScore);

  return {
    userId: user.id,
    overallTier,
    overallScore,
    summary: `${user.name} sits in ${overallTier} with an overall score of ${overallScore}, combining benchmark lifts, recovery readiness, and consistency.`,
    liftBreakdown: lifts
  };
}
