import type { ChallengeMetric, ChallengeSummary, ProgressMetric } from "@/lib/types";

export function createChallengeSummary(input: {
  id: string;
  name: string;
  metric: ChallengeMetric;
  challengerId: string;
  opponentId: string;
  startsOn: string;
  endsOn: string;
}): ChallengeSummary {
  return {
    ...input,
    status: "pending"
  };
}

export function evaluateChallengeWinner(
  metric: ChallengeMetric,
  challenger: ProgressMetric,
  opponent: ProgressMetric
) {
  if (metric === "consistency") {
    return challenger.consistencyScore >= opponent.consistencyScore ? challenger.userId : opponent.userId;
  }

  if (metric === "pr") {
    const challengerBest = Math.max(...Object.values(challenger.personalRecords));
    const opponentBest = Math.max(...Object.values(opponent.personalRecords));
    return challengerBest >= opponentBest ? challenger.userId : opponent.userId;
  }

  return challenger.totalVolume >= opponent.totalVolume ? challenger.userId : opponent.userId;
}
