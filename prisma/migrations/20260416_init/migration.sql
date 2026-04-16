CREATE TABLE "app_user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "weight_kg" DECIMAL(6,2) NOT NULL,
    "height_cm" DECIMAL(6,2) NOT NULL,
    "experience_level" TEXT NOT NULL,
    "training_track" TEXT NOT NULL,
    "readiness_score" INTEGER NOT NULL,
    "primary_goal" TEXT NOT NULL,
    "available_equipment" JSONB NOT NULL DEFAULT '[]',
    "constraints" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "baseline_assessment" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "training_days_per_week" INTEGER NOT NULL,
    "recovery_score" INTEGER NOT NULL,
    "sleep_hours" DECIMAL(4,1) NOT NULL,
    "stress_level" INTEGER NOT NULL,
    "movement_limitations" JSONB NOT NULL DEFAULT '[]',
    "muscle_priorities" JSONB NOT NULL DEFAULT '[]',
    "summary" TEXT NOT NULL,

    CONSTRAINT "baseline_assessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workout_plan" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "days_per_week" INTEGER NOT NULL,
    "progression_notes" JSONB NOT NULL DEFAULT '[]',
    "deload_rule" TEXT NOT NULL,

    CONSTRAINT "workout_plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workout_session" (
    "id" TEXT NOT NULL,
    "workout_plan_id" TEXT NOT NULL,
    "day_label" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "focus" TEXT NOT NULL,

    CONSTRAINT "workout_session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "planned_exercise" (
    "id" TEXT NOT NULL,
    "workout_session_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "target_reps" TEXT NOT NULL,
    "target_rpe" DECIMAL(4,1) NOT NULL,
    "progression_rule" TEXT NOT NULL,

    CONSTRAINT "planned_exercise_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workout_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workout_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_log_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "logged_set" (
    "id" TEXT NOT NULL,
    "workout_log_id" TEXT NOT NULL,
    "weight_kg" DECIMAL(7,2) NOT NULL,
    "reps" INTEGER NOT NULL,
    "rpe" DECIMAL(4,1) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "logged_set_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "benchmark_standard" (
    "id" BIGSERIAL NOT NULL,
    "lift" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "bodyweight_class_kg" DECIMAL(6,2) NOT NULL,
    "source_label" TEXT NOT NULL,
    "novice" DECIMAL(7,2) NOT NULL,
    "intermediate" DECIMAL(7,2) NOT NULL,
    "advanced" DECIMAL(7,2) NOT NULL,
    "elite" DECIMAL(7,2) NOT NULL,
    "olympian" DECIMAL(7,2) NOT NULL,

    CONSTRAINT "benchmark_standard_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "progress_metric" (
    "user_id" TEXT NOT NULL,
    "total_volume" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "completed_sessions" INTEGER NOT NULL DEFAULT 0,
    "consistency_score" INTEGER NOT NULL DEFAULT 0,
    "personal_records" JSONB NOT NULL DEFAULT '{}',
    "streak_days" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "progress_metric_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "challenge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "challenger_id" TEXT NOT NULL,
    "opponent_id" TEXT NOT NULL,
    "starts_on" DATE NOT NULL,
    "ends_on" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "winner_id" TEXT,

    CONSTRAINT "challenge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "friendship" (
    "user_id" TEXT NOT NULL,
    "friend_id" TEXT NOT NULL,

    CONSTRAINT "friendship_pkey" PRIMARY KEY ("user_id","friend_id")
);

ALTER TABLE "baseline_assessment"
ADD CONSTRAINT "baseline_assessment_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "workout_plan"
ADD CONSTRAINT "workout_plan_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "workout_session"
ADD CONSTRAINT "workout_session_workout_plan_id_fkey"
FOREIGN KEY ("workout_plan_id") REFERENCES "workout_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "planned_exercise"
ADD CONSTRAINT "planned_exercise_workout_session_id_fkey"
FOREIGN KEY ("workout_session_id") REFERENCES "workout_session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workout_log"
ADD CONSTRAINT "workout_log_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "workout_log"
ADD CONSTRAINT "workout_log_workout_id_fkey"
FOREIGN KEY ("workout_id") REFERENCES "workout_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "workout_log"
ADD CONSTRAINT "workout_log_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "workout_session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "logged_set"
ADD CONSTRAINT "logged_set_workout_log_id_fkey"
FOREIGN KEY ("workout_log_id") REFERENCES "workout_log"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "progress_metric"
ADD CONSTRAINT "progress_metric_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "challenge"
ADD CONSTRAINT "challenge_challenger_id_fkey"
FOREIGN KEY ("challenger_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "challenge"
ADD CONSTRAINT "challenge_opponent_id_fkey"
FOREIGN KEY ("opponent_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "challenge"
ADD CONSTRAINT "challenge_winner_id_fkey"
FOREIGN KEY ("winner_id") REFERENCES "app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "friendship"
ADD CONSTRAINT "friendship_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "friendship"
ADD CONSTRAINT "friendship_friend_id_fkey"
FOREIGN KEY ("friend_id") REFERENCES "app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
