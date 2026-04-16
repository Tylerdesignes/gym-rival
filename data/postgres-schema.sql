create table app_user (
  id text primary key,
  name text not null,
  age integer not null,
  gender text not null,
  weight_kg numeric(6,2) not null,
  height_cm numeric(6,2) not null,
  experience_level text not null,
  training_track text not null,
  readiness_score integer not null,
  primary_goal text not null,
  available_equipment jsonb not null default '[]'::jsonb,
  constraints jsonb not null default '[]'::jsonb
);

create table baseline_assessment (
  id text primary key,
  user_id text not null references app_user(id),
  created_at timestamptz not null default now(),
  training_days_per_week integer not null,
  recovery_score integer not null,
  sleep_hours numeric(4,1) not null,
  stress_level integer not null,
  movement_limitations jsonb not null default '[]'::jsonb,
  muscle_priorities jsonb not null default '[]'::jsonb,
  summary text not null
);

create table workout_plan (
  id text primary key,
  user_id text not null references app_user(id),
  name text not null,
  source text not null,
  focus text not null,
  days_per_week integer not null,
  progression_notes jsonb not null default '[]'::jsonb,
  deload_rule text not null
);

create table workout_session (
  id text primary key,
  workout_plan_id text not null references workout_plan(id) on delete cascade,
  day_label text not null,
  name text not null,
  focus text not null
);

create table planned_exercise (
  id text primary key,
  workout_session_id text not null references workout_session(id) on delete cascade,
  name text not null,
  sets integer not null,
  target_reps text not null,
  target_rpe numeric(4,1) not null,
  progression_rule text not null
);

create table workout_log (
  id text primary key,
  user_id text not null references app_user(id),
  workout_id text not null references workout_plan(id),
  session_id text not null references workout_session(id),
  exercise_id text not null,
  created_at timestamptz not null default now()
);

create table logged_set (
  id text primary key,
  workout_log_id text not null references workout_log(id) on delete cascade,
  weight_kg numeric(7,2) not null,
  reps integer not null,
  rpe numeric(4,1) not null,
  completed boolean not null default true,
  notes text
);

create table benchmark_standard (
  id bigserial primary key,
  lift text not null,
  gender text not null,
  bodyweight_class_kg numeric(6,2) not null,
  source_label text not null,
  novice numeric(7,2) not null,
  intermediate numeric(7,2) not null,
  advanced numeric(7,2) not null,
  elite numeric(7,2) not null,
  olympian numeric(7,2) not null
);

create table progress_metric (
  user_id text primary key references app_user(id),
  total_volume numeric(12,2) not null default 0,
  completed_sessions integer not null default 0,
  consistency_score integer not null default 0,
  personal_records jsonb not null default '{}'::jsonb,
  streak_days integer not null default 0
);

create table challenge (
  id text primary key,
  name text not null,
  metric text not null,
  challenger_id text not null references app_user(id),
  opponent_id text not null references app_user(id),
  starts_on date not null,
  ends_on date not null,
  status text not null,
  winner_id text references app_user(id)
);

create table friendship (
  user_id text not null references app_user(id),
  friend_id text not null references app_user(id),
  primary key (user_id, friend_id)
);
