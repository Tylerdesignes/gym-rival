"use client";

import { useMemo, useState, useTransition } from "react";
import type {
  AppSnapshot,
  BaselineAssessmentInput,
  ChallengeMetric,
  ChallengeSummary,
  Gender,
  GeneratedPlan,
  LeaderboardEntry,
  RankTier,
  SetLogInput,
  WorkoutSession
} from "@/lib/types";

type DashboardProps = {
  initialSnapshot: AppSnapshot;
};

type TabId = "home" | "workout" | "challenges" | "leaderboard" | "profile";
type JsonValue = Record<string, unknown>;

const tabs: Array<{ id: TabId; label: string; shortLabel: string }> = [
  { id: "home", label: "Home", shortLabel: "Base" },
  { id: "workout", label: "Workout", shortLabel: "Lift" },
  { id: "challenges", label: "Challenges", shortLabel: "Rivals" },
  { id: "leaderboard", label: "Leaderboard", shortLabel: "Ranks" },
  { id: "profile", label: "Profile", shortLabel: "Pilot" }
];

const parseNumber = (value: string) => Number.parseFloat(value || "0");

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.toLowerCase() !== "none");

async function callApi<T>(url: string, method: "GET" | "POST", body?: JsonValue): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || "Request failed");
  }

  return (await response.json()) as T;
}

function getNextTier(rankTiers: RankTier[], currentTier: string) {
  const index = rankTiers.findIndex((tier) => tier.name === currentTier);
  if (index < 0 || index === rankTiers.length - 1) return null;
  return rankTiers[index + 1];
}

function getTierProgress(rankTiers: RankTier[], overallTier: string, overallScore: number) {
  const currentTier = rankTiers.find((tier) => tier.name === overallTier);
  const nextTier = getNextTier(rankTiers, overallTier);
  if (!currentTier || !nextTier) return 100;
  const span = nextTier.minScore - currentTier.minScore;
  const offset = overallScore - currentTier.minScore;
  return Math.max(10, Math.min(100, (offset / span) * 100));
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getRankLabel(rank: number) {
  return String(rank).padStart(2, "0");
}

function getExerciseBadge(session: WorkoutSession | undefined) {
  if (!session) return "No session loaded";
  return `${session.exercises.length} drills`;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function Dashboard({ initialSnapshot }: DashboardProps) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [createdChallenge, setCreatedChallenge] = useState<ChallengeSummary | null>(null);
  const [status, setStatus] = useState("Ready to build your next lift cycle.");
  const [pending, startTransition] = useTransition();

  const currentPlan = generatedPlan ?? snapshot.workoutPlans[0] ?? null;
  const [selectedSessionId, setSelectedSessionId] = useState(currentPlan?.sessions[0]?.id ?? "");
  const rival = snapshot.friends[0] ?? null;

  const [baselineForm, setBaselineForm] = useState({
    userId: snapshot.currentUser.id,
    age: String(snapshot.currentUser.age),
    weightKg: String(snapshot.currentUser.weightKg),
    heightCm: String(snapshot.currentUser.heightCm),
    gender: snapshot.currentUser.gender,
    experienceLevel: snapshot.currentUser.experienceLevel,
    trainingDaysPerWeek: "4",
    availableEquipment: snapshot.currentUser.availableEquipment.join(","),
    recoveryScore: "8",
    sleepHours: "7.5",
    stressLevel: "4",
    primaryGoal: snapshot.currentUser.primaryGoal,
    movementLimitations: snapshot.currentUser.constraints.join(", "),
    squat1RM: "110",
    bench1RM: "82.5",
    deadlift1RM: "145",
    overheadPress1RM: "55",
    pullUpsMax: "8"
  });

  const [logForm, setLogForm] = useState({
    workoutId: currentPlan?.id ?? "plan-generated",
    sessionId: currentPlan?.sessions[0]?.id ?? "session-upper-a",
    exerciseId: currentPlan?.sessions[0]?.exercises[0]?.id ?? "bench-press",
    weightKg: "80",
    reps: "8",
    rpe: "8",
    notes: "Explosive lockout."
  });

  const [challengeForm, setChallengeForm] = useState({
    challengerId: snapshot.currentUser.id,
    opponentId: rival?.id ?? snapshot.currentUser.id,
    metric: "volume" as ChallengeMetric,
    name: "Velocity Ladder",
    startsOn: "2026-04-16",
    endsOn: "2026-04-30"
  });

  const currentSession = useMemo(() => {
    const session =
      currentPlan?.sessions.find((item) => item.id === selectedSessionId) ??
      currentPlan?.sessions[0] ??
      null;
    return session;
  }, [currentPlan, selectedSessionId]);

  const currentExercise =
    currentSession?.exercises.find((exercise) => exercise.id === logForm.exerciseId) ??
    currentSession?.exercises[0] ??
    null;

  const rankedBoard = snapshot.leaderboard.global;
  const currentUserRank = rankedBoard.findIndex((entry) => entry.userId === snapshot.currentUser.id) + 1;
  const nextTier = getNextTier(snapshot.rankTiers, snapshot.rankResult.overallTier);
  const tierProgress = getTierProgress(
    snapshot.rankTiers,
    snapshot.rankResult.overallTier,
    snapshot.rankResult.overallScore
  );

  const refreshSnapshot = async () => {
    const nextSnapshot = await callApi<AppSnapshot>("/api/leaderboards", "GET");
    setSnapshot(nextSnapshot);

    if (!generatedPlan) {
      const nextPlan = nextSnapshot.workoutPlans[0];
      if (nextPlan) {
        setSelectedSessionId((current) => current || nextPlan.sessions[0]?.id || "");
        setLogForm((current) => ({
          ...current,
          workoutId: nextPlan.id,
          sessionId: nextPlan.sessions[0]?.id ?? current.sessionId,
          exerciseId: nextPlan.sessions[0]?.exercises[0]?.id ?? current.exerciseId
        }));
      }
    }
  };

  const submitBaseline = () =>
    startTransition(async () => {
      try {
        setStatus("Recomputing baseline and updating your rank profile...");
        const payload: BaselineAssessmentInput = {
          userId: baselineForm.userId,
          age: parseNumber(baselineForm.age),
          weightKg: parseNumber(baselineForm.weightKg),
          heightCm: parseNumber(baselineForm.heightCm),
          gender: baselineForm.gender as Gender,
          experienceLevel: baselineForm.experienceLevel as "beginner" | "intermediate" | "advanced",
          trainingDaysPerWeek: parseNumber(baselineForm.trainingDaysPerWeek),
          availableEquipment: splitList(baselineForm.availableEquipment),
          recoveryScore: parseNumber(baselineForm.recoveryScore),
          sleepHours: parseNumber(baselineForm.sleepHours),
          stressLevel: parseNumber(baselineForm.stressLevel),
          primaryGoal: baselineForm.primaryGoal,
          movementLimitations: splitList(baselineForm.movementLimitations),
          performance: {
            squat: parseNumber(baselineForm.squat1RM),
            bench: parseNumber(baselineForm.bench1RM),
            deadlift: parseNumber(baselineForm.deadlift1RM),
            overheadPress: parseNumber(baselineForm.overheadPress1RM),
            pullUps: parseNumber(baselineForm.pullUpsMax)
          }
        };

        await callApi("/api/onboarding/baseline", "POST", payload as unknown as JsonValue);
        await refreshSnapshot();
        setStatus("Baseline locked in. Your performance cockpit is refreshed.");
      } catch (error) {
        setStatus((error as Error).message);
      }
    });

  const generatePlan = () =>
    startTransition(async () => {
      try {
        setStatus("Generating your next progression block...");
        const response = await callApi<GeneratedPlan>("/api/plans/generate", "POST", {
          userId: baselineForm.userId,
          daysPerWeek: parseNumber(baselineForm.trainingDaysPerWeek),
          goal: baselineForm.primaryGoal
        });
        setGeneratedPlan(response);
        setSelectedSessionId(response.sessions[0]?.id ?? "");
        setLogForm((current) => ({
          ...current,
          workoutId: response.id,
          sessionId: response.sessions[0]?.id ?? current.sessionId,
          exerciseId: response.sessions[0]?.exercises[0]?.id ?? current.exerciseId
        }));
        await refreshSnapshot();
        setStatus(`New plan ready: ${response.name}.`);
        setActiveTab("workout");
      } catch (error) {
        setStatus((error as Error).message);
      }
    });

  const logSession = () =>
    startTransition(async () => {
      try {
        setStatus("Logging session data and recalculating momentum...");
        const payload: SetLogInput = {
          workoutId: logForm.workoutId,
          sessionId: logForm.sessionId,
          exerciseId: logForm.exerciseId,
          sets: [
            {
              weightKg: parseNumber(logForm.weightKg),
              reps: parseNumber(logForm.reps),
              rpe: parseNumber(logForm.rpe),
              completed: true,
              notes: logForm.notes
            }
          ]
        };

        await callApi(
          `/api/workouts/${encodeURIComponent(logForm.workoutId)}/log-session`,
          "POST",
          { userId: baselineForm.userId, ...payload }
        );
        await refreshSnapshot();
        setStatus("Workout saved. Leaderboard and rank pressure updated.");
      } catch (error) {
        setStatus((error as Error).message);
      }
    });

  const createChallenge = () =>
    startTransition(async () => {
      try {
        setStatus("Issuing challenge to your current rival...");
        const response = await callApi<ChallengeSummary>(
          "/api/challenges",
          "POST",
          challengeForm as unknown as JsonValue
        );
        setCreatedChallenge(response);
        await refreshSnapshot();
        setStatus(`Challenge issued: ${response.name}.`);
        setActiveTab("challenges");
      } catch (error) {
        setStatus((error as Error).message);
      }
    });

  return (
    <div className="mobile-app-shell">
      <div className="mobile-app-frame">
        <header className="topbar">
          <div className="brand-lockup">
            <span className="brand-mark" />
            <div>
              <div className="brand-name">RIVAL</div>
              <div className="brand-subtitle">competitive fitness tracker</div>
            </div>
          </div>
          <div className="profile-chip">
            <span className="profile-chip__tier">{snapshot.rankResult.overallTier}</span>
            <span className="avatar-tile">{getInitials(snapshot.currentUser.name)}</span>
          </div>
        </header>

        <main className="screen-scroll">
          {activeTab === "home" ? (
            <>
              <section className="hero-panel">
                <div className="hero-panel__eyebrow">Current Division</div>
                <div className="hero-panel__title">{snapshot.rankResult.overallTier}</div>
                <div className="hero-panel__meta">
                  {nextTier
                    ? `${Math.max(0, nextTier.minScore - snapshot.rankResult.overallScore).toFixed(1)} RP to ${nextTier.name}`
                    : "Top division secured"}
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${tierProgress}%` }} />
                </div>
                <div className="progress-caption">{formatPercent(tierProgress)}</div>
              </section>

              <section className="power-card">
                <div className="section-label">Power Score</div>
                <div className="power-score">{snapshot.rankResult.overallScore.toFixed(1)}</div>
                <div className="power-caption">{snapshot.rankResult.summary}</div>
              </section>

              <section className="mini-grid">
                <article className="stat-card stat-card--accent">
                  <div className="section-label">Streak</div>
                  <strong>{snapshot.currentUser.readinessScore}</strong>
                  <span>readiness index</span>
                </article>
                <article className="stat-card">
                  <div className="section-label">Total Workouts</div>
                  <strong>{currentUserRank > 0 ? currentUserRank : "--"}</strong>
                  <span>global rank right now</span>
                </article>
              </section>

              <section className="content-heading">
                <h2>AI Recommendations</h2>
                <p>Based on your current block and rivalry pressure.</p>
              </section>

              <section className="recommendation-stack">
                {(currentPlan?.sessions.slice(0, 2) ?? []).map((session, index) => (
                  <article className="recommendation-card" key={session.id}>
                    <div className="recommendation-card__backdrop recommendation-card__backdrop--image" />
                    <div className="recommendation-card__overlay" />
                    <div className="recommendation-card__content">
                      <div className="recommendation-meta">
                        <span className={`meta-chip ${index === 0 ? "meta-chip--hot" : ""}`}>
                          {index === 0 ? "Intense" : "Recovery"}
                        </span>
                        <span>{session.focus}</span>
                      </div>
                      <h3>{session.name}</h3>
                      <p>
                        {getExerciseBadge(session)} • {session.exercises[0]?.name ?? "Next move ready"}
                      </p>
                    </div>
                  </article>
                ))}
              </section>

              {rival ? (
                <section className="rival-card">
                  <div className="rival-card__portrait">{getInitials(rival.name)}</div>
                  <div className="section-label">Current Rival</div>
                  <h3>{rival.name}</h3>
                  <div className="rival-stats">
                    <span>Status {rival.trainingTrack}</span>
                    <span>
                      Gap {Math.round(snapshot.rankResult.overallScore - (rankedBoard[0]?.score ?? 0))} RP
                    </span>
                  </div>
                  <button type="button" className="secondary-action" onClick={createChallenge}>
                    Challenge
                  </button>
                </section>
              ) : null}
            </>
          ) : null}

          {activeTab === "workout" ? (
            <>
              <section className="content-heading">
                <h2>Workout Logger</h2>
                <p>Train inside the current plan and log a session live.</p>
              </section>

              <section className="session-strip">
                {(currentPlan?.sessions ?? []).map((session) => (
                  <button
                    type="button"
                    key={session.id}
                    className={`session-pill ${currentSession?.id === session.id ? "session-pill--active" : ""}`}
                    onClick={() => {
                      setSelectedSessionId(session.id);
                      setLogForm((current) => ({
                        ...current,
                        workoutId: currentPlan?.id ?? current.workoutId,
                        sessionId: session.id,
                        exerciseId: session.exercises[0]?.id ?? current.exerciseId
                      }));
                    }}
                  >
                    <span>{session.dayLabel}</span>
                    <strong>{session.name}</strong>
                  </button>
                ))}
              </section>

              <section className="panel-card">
                <div className="panel-card__header">
                  <div>
                    <div className="section-label">Now Training</div>
                    <h3>{currentSession?.name ?? "No active session"}</h3>
                  </div>
                  <span className="meta-chip">{currentSession?.focus ?? "Load a plan"}</span>
                </div>

                <label className="field">
                  Exercise
                  <select
                    value={logForm.exerciseId}
                    onChange={(event) =>
                      setLogForm((current) => ({ ...current, exerciseId: event.target.value }))
                    }
                  >
                    {(currentSession?.exercises ?? []).map((exercise) => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="field-grid">
                  <label className="field">
                    Weight (kg)
                    <input
                      value={logForm.weightKg}
                      onChange={(event) =>
                        setLogForm((current) => ({ ...current, weightKg: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    Reps
                    <input
                      value={logForm.reps}
                      onChange={(event) =>
                        setLogForm((current) => ({ ...current, reps: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    Target RPE
                    <input
                      value={logForm.rpe}
                      onChange={(event) =>
                        setLogForm((current) => ({ ...current, rpe: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    Sets x Reps
                    <input
                      value={
                        currentExercise
                          ? `${currentExercise.sets} x ${currentExercise.targetReps}`
                          : "0 x 0"
                      }
                      readOnly
                    />
                  </label>
                </div>

                <label className="field">
                  Notes
                  <textarea
                    value={logForm.notes}
                    onChange={(event) =>
                      setLogForm((current) => ({ ...current, notes: event.target.value }))
                    }
                  />
                </label>

                <button type="button" className="primary-action" onClick={logSession}>
                  Log Workout
                </button>
              </section>

              <section className="mini-grid">
                <article className="panel-card compact-card">
                  <div className="section-label">Progression Rule</div>
                  <h3>{currentExercise?.name ?? "No exercise selected"}</h3>
                  <p>{currentExercise?.progressionRule ?? "Generate a plan to see progression cues."}</p>
                </article>
                <article className="panel-card compact-card">
                  <div className="section-label">Block Notes</div>
                  <h3>{currentPlan?.name ?? "No plan loaded"}</h3>
                  <p>{currentPlan?.progressionNotes[0] ?? "Use profile controls to generate a fresh block."}</p>
                </article>
              </section>
            </>
          ) : null}

          {activeTab === "challenges" ? (
            <>
              <section className="content-heading">
                <h2>Challenge Board</h2>
                <p>Create a rivalry match and keep pressure on the leaderboard.</p>
              </section>

              <section className="panel-card">
                <div className="panel-card__header">
                  <div>
                    <div className="section-label">Issue Challenge</div>
                    <h3>{challengeForm.name}</h3>
                  </div>
                  <span className="meta-chip meta-chip--hot">{challengeForm.metric}</span>
                </div>

                <label className="field">
                  Challenge Name
                  <input
                    value={challengeForm.name}
                    onChange={(event) =>
                      setChallengeForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </label>

                <div className="field-grid">
                  <label className="field">
                    Rival
                    <select
                      value={challengeForm.opponentId}
                      onChange={(event) =>
                        setChallengeForm((current) => ({ ...current, opponentId: event.target.value }))
                      }
                    >
                      {snapshot.friends.map((friend) => (
                        <option key={friend.id} value={friend.id}>
                          {friend.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Metric
                    <select
                      value={challengeForm.metric}
                      onChange={(event) =>
                        setChallengeForm((current) => ({
                          ...current,
                          metric: event.target.value as ChallengeMetric
                        }))
                      }
                    >
                      <option value="volume">Volume</option>
                      <option value="consistency">Consistency</option>
                      <option value="pr">PR</option>
                    </select>
                  </label>
                  <label className="field">
                    Starts
                    <input
                      type="date"
                      value={challengeForm.startsOn}
                      onChange={(event) =>
                        setChallengeForm((current) => ({ ...current, startsOn: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    Ends
                    <input
                      type="date"
                      value={challengeForm.endsOn}
                      onChange={(event) =>
                        setChallengeForm((current) => ({ ...current, endsOn: event.target.value }))
                      }
                    />
                  </label>
                </div>

                <button type="button" className="primary-action" onClick={createChallenge}>
                  Send Challenge
                </button>
              </section>

              <section className="challenge-stack">
                {[createdChallenge, ...snapshot.challenges]
                  .filter((challenge, index, list): challenge is ChallengeSummary => {
                    if (!challenge) return false;
                    return list.findIndex((item) => item?.id === challenge.id) === index;
                  })
                  .map((challenge) => {
                    const opponent =
                      snapshot.friends.find((friend) =>
                        [challenge.challengerId, challenge.opponentId].includes(friend.id)
                      ) ?? rival;

                    return (
                      <article className="challenge-card" key={challenge.id}>
                        <div className="challenge-card__header">
                          <div>
                            <div className="section-label">{challenge.status}</div>
                            <h3>{challenge.name}</h3>
                          </div>
                          <span className="challenge-avatar">{getInitials(opponent?.name ?? "RV")}</span>
                        </div>
                        <p>
                          {challenge.metric.toUpperCase()} vs {opponent?.name ?? "Rival"} • {challenge.startsOn} to{" "}
                          {challenge.endsOn}
                        </p>
                      </article>
                    );
                  })}
              </section>
            </>
          ) : null}

          {activeTab === "leaderboard" ? (
            <>
              <section className="content-heading">
                <h2>Leaderboard</h2>
                <p>Global order, podium energy, and your current territory.</p>
              </section>

              <section className="leaderboard-podium">
                {rankedBoard.slice(0, 3).map((entry, index) => (
                  <article
                    key={entry.userId}
                    className={`podium-card ${index === 0 ? "podium-card--winner" : ""}`}
                  >
                    <span className="podium-rank">#{index + 1}</span>
                    <div className="podium-avatar">{getInitials(entry.userName)}</div>
                    <h3>{entry.userName}</h3>
                    <p>{entry.overallTier}</p>
                    <strong>{entry.score.toFixed(1)}</strong>
                  </article>
                ))}
              </section>

              <section className="leaderboard-list">
                {rankedBoard.slice(3, 8).map((entry, index) => (
                  <LeaderboardRow
                    key={entry.userId}
                    entry={entry}
                    rank={index + 4}
                    highlight={entry.userId === snapshot.currentUser.id}
                  />
                ))}
              </section>

              <section className="territory-card">
                <div className="territory-rank">{getRankLabel(Math.max(1, currentUserRank))}</div>
                <div>
                  <div className="section-label">Your Territory</div>
                  <h3>{snapshot.currentUser.name}</h3>
                  <p>{snapshot.rankResult.overallTier} performance lane</p>
                </div>
                <div className="territory-score">
                  <strong>{snapshot.rankResult.overallScore.toFixed(1)}</strong>
                  <span>RP points</span>
                </div>
              </section>
            </>
          ) : null}

          {activeTab === "profile" ? (
            <>
              <section className="profile-hero">
                <div className="profile-hero__meta">
                  <span className="avatar-tile avatar-tile--large">
                    {getInitials(snapshot.currentUser.name)}
                  </span>
                  <div>
                    <div className="section-label">Athlete Profile</div>
                    <h2>{snapshot.currentUser.name}</h2>
                    <p>
                      {snapshot.currentUser.experienceLevel} track • {snapshot.currentUser.primaryGoal}
                    </p>
                  </div>
                </div>

                <div className="lift-breakdown">
                  {snapshot.rankResult.liftBreakdown.map((lift) => (
                    <div className="lift-chip" key={lift.lift}>
                      <span>{lift.lift}</span>
                      <strong>{lift.tier}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel-card">
                <div className="panel-card__header">
                  <div>
                    <div className="section-label">Baseline Assessment</div>
                    <h3>Update inputs</h3>
                  </div>
                  <span className="meta-chip">{snapshot.currentUser.readinessScore} readiness</span>
                </div>

                <div className="field-grid">
                  <label className="field">
                    Age
                    <input
                      value={baselineForm.age}
                      onChange={(event) =>
                        setBaselineForm((current) => ({ ...current, age: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    Weight (kg)
                    <input
                      value={baselineForm.weightKg}
                      onChange={(event) =>
                        setBaselineForm((current) => ({ ...current, weightKg: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    Height (cm)
                    <input
                      value={baselineForm.heightCm}
                      onChange={(event) =>
                        setBaselineForm((current) => ({ ...current, heightCm: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    Training Days
                    <input
                      value={baselineForm.trainingDaysPerWeek}
                      onChange={(event) =>
                        setBaselineForm((current) => ({
                          ...current,
                          trainingDaysPerWeek: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    Gender
                    <select
                      value={baselineForm.gender}
                      onChange={(event) =>
                        setBaselineForm((current) => ({
                          ...current,
                          gender: event.target.value as Gender
                        }))
                      }
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="nonbinary">Nonbinary</option>
                    </select>
                  </label>
                  <label className="field">
                    Experience
                    <select
                      value={baselineForm.experienceLevel}
                      onChange={(event) =>
                        setBaselineForm((current) => ({
                          ...current,
                          experienceLevel: event.target.value as
                            | "beginner"
                            | "intermediate"
                            | "advanced"
                        }))
                      }
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </label>
                  <label className="field">
                    Recovery
                    <input
                      value={baselineForm.recoveryScore}
                      onChange={(event) =>
                        setBaselineForm((current) => ({
                          ...current,
                          recoveryScore: event.target.value
                        }))
                      }
                    />
                  </label>
                  <label className="field">
                    Sleep Hours
                    <input
                      value={baselineForm.sleepHours}
                      onChange={(event) =>
                        setBaselineForm((current) => ({ ...current, sleepHours: event.target.value }))
                      }
                    />
                  </label>
                </div>

                <div className="field-grid">
                  <label className="field">
                    Squat 1RM
                    <input
                      value={baselineForm.squat1RM}
                      onChange={(event) =>
                        setBaselineForm((current) => ({ ...current, squat1RM: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    Bench 1RM
                    <input
                      value={baselineForm.bench1RM}
                      onChange={(event) =>
                        setBaselineForm((current) => ({ ...current, bench1RM: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    Deadlift 1RM
                    <input
                      value={baselineForm.deadlift1RM}
                      onChange={(event) =>
                        setBaselineForm((current) => ({ ...current, deadlift1RM: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    OHP 1RM
                    <input
                      value={baselineForm.overheadPress1RM}
                      onChange={(event) =>
                        setBaselineForm((current) => ({
                          ...current,
                          overheadPress1RM: event.target.value
                        }))
                      }
                    />
                  </label>
                </div>

                <label className="field">
                  Goal
                  <input
                    value={baselineForm.primaryGoal}
                    onChange={(event) =>
                      setBaselineForm((current) => ({ ...current, primaryGoal: event.target.value }))
                    }
                  />
                </label>

                <label className="field">
                  Equipment
                  <textarea
                    value={baselineForm.availableEquipment}
                    onChange={(event) =>
                      setBaselineForm((current) => ({
                        ...current,
                        availableEquipment: event.target.value
                      }))
                    }
                  />
                </label>

                <div className="action-row">
                  <button type="button" className="secondary-action" onClick={submitBaseline}>
                    Save Baseline
                  </button>
                  <button type="button" className="primary-action" onClick={generatePlan}>
                    Generate Plan
                  </button>
                </div>
              </section>
            </>
          ) : null}
        </main>

        <div className="status-ribbon">
          <span className={`status-dot ${pending ? "status-dot--pending" : ""}`} />
          <p>{status}</p>
        </div>

        <nav className="bottom-nav">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={`bottom-nav__item ${activeTab === tab.id ? "bottom-nav__item--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="bottom-nav__glyph" />
              <span>{tab.shortLabel}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

function LeaderboardRow({
  entry,
  rank,
  highlight
}: {
  entry: LeaderboardEntry;
  rank: number;
  highlight?: boolean;
}) {
  return (
    <article className={`leaderboard-row ${highlight ? "leaderboard-row--highlight" : ""}`}>
      <span className="leaderboard-row__rank">{getRankLabel(rank)}</span>
      <span className="leaderboard-row__avatar">{getInitials(entry.userName)}</span>
      <div className="leaderboard-row__body">
        <h3>{entry.userName}</h3>
        <p>{entry.overallTier}</p>
      </div>
      <div className="leaderboard-row__score">
        <strong>{entry.score.toFixed(1)}</strong>
        <span>{entry.consistency}% consistency</span>
      </div>
    </article>
  );
}
