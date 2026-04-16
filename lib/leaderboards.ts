import { calculateRankResult } from "@/lib/ranking";
import type { LeaderboardEntry, ProgressMetric, UserProfile } from "@/lib/types";

export function buildLeaderboard(users: UserProfile[], progressMetrics: ProgressMetric[]): LeaderboardEntry[] {
  const entries = users.map((user) => {
    const progress = progressMetrics.find((item) => item.userId === user.id);
    if (!progress) {
      throw new Error(`Missing progress metrics for ${user.id}`);
    }

    const rank = calculateRankResult(user, progress);
    return {
      userId: user.id,
      userName: user.name,
      overallTier: rank.overallTier,
      score: rank.overallScore,
      consistency: progress.consistencyScore
    };
  });

  return entries.sort((left, right) => right.score - left.score || right.consistency - left.consistency);
}
