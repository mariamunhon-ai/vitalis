-- ═══════════════════════════════════════════════════════════════════════════
-- VITALIS — Schema completo do banco de dados
-- Cole este SQL no Supabase > SQL Editor > New Query > Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── EXTENSIONS ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── 1. PROFILES ─────────────────────────────────────────────────────────────
-- Armazena nutricionistas, alunos e admin
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('aluno','nutricionista','admin')),  -- Item 12: always these exact values
  name        text,
  email       text,
  nutri_id    uuid references profiles(id) on delete set null,
  goal        text,
  allergies   text[],
  birth_date  date,
  sex         text,
  obs         text,
  -- itens 1.1 + 10: novos campos
  invite_code      text unique,
  onboarding_done  boolean default false,
  -- plano (preenchido pelo admin)
  plan        text    default 'mensal',
  plan_valor  numeric default 89,
  start_date  date,
  paid_until  date,
  status      text    default 'ativo' check (status in ('ativo','vencendo','bloqueado')),
  blocked     boolean default false,
  -- timestamps
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  last_seen   timestamptz default now()
);

create index if not exists profiles_nutri_id_idx on profiles(nutri_id);
create index if not exists profiles_role_idx     on profiles(role);

-- ─── 2. WEEK DIET ─────────────────────────────────────────────────────────────
-- Plano alimentar semanal do aluno (jsonb flexível)
create table if not exists week_diet (
  aluno_id   uuid primary key references profiles(id) on delete cascade,
  data       jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- ─── 3. MEDICATIONS ──────────────────────────────────────────────────────────
create table if not exists medications (
  id         uuid primary key default gen_random_uuid(),
  aluno_id   uuid not null references profiles(id) on delete cascade,
  name       text not null,
  dose       text,
  times      text[] default '{}',
  created_at timestamptz default now()
);

create index if not exists medications_aluno_idx on medications(aluno_id);

-- ─── 4. DAILY LOGS ───────────────────────────────────────────────────────────
-- Registros diários do aluno (humor, água, refeições)
create table if not exists daily_logs (
  id         uuid primary key default gen_random_uuid(),
  aluno_id   uuid not null references profiles(id) on delete cascade,
  log_date   date not null,
  data       jsonb not null default '{}',
  created_at timestamptz default now(),
  unique(aluno_id, log_date)
);

create index if not exists daily_logs_aluno_date_idx on daily_logs(aluno_id, log_date desc);

-- ─── 5. DIARY ────────────────────────────────────────────────────────────────
-- Diário e fotos de progresso
create table if not exists diary (
  id             uuid primary key default gen_random_uuid(),
  aluno_id       uuid not null references profiles(id) on delete cascade,
  entry_date     date not null,
  entries        jsonb not null default '[]',
  progress_photo text,
  created_at     timestamptz default now(),
  unique(aluno_id, entry_date)
);

create index if not exists diary_aluno_date_idx on diary(aluno_id, entry_date desc);

-- ─── 6. MEASUREMENTS ─────────────────────────────────────────────────────────
-- Avaliações antropométricas
create table if not exists measurements (
  id           uuid primary key default gen_random_uuid(),
  aluno_id     uuid not null references profiles(id) on delete cascade,
  by_role      text default 'aluno',
  protocolo    text,
  sex          text,
  age          integer,
  peso         numeric, altura     numeric,
  cintura      numeric, quadril    numeric,
  braco        numeric, antebraco  numeric,
  coxa         numeric, panturrilha numeric,
  pescoco      numeric, torax      numeric,
  abdomen      numeric,
  -- dobras cutâneas
  dc_triceps      numeric, dc_subescapular  numeric,
  dc_suprailiaca  numeric, dc_abdominal     numeric,
  dc_coxa         numeric, dc_peitoral      numeric,
  dc_axilar       numeric, dc_biceps        numeric,
  created_at   timestamptz default now()
);

create index if not exists measurements_aluno_idx on measurements(aluno_id, created_at asc);

-- ─── 7. NUTRI NOTES ──────────────────────────────────────────────────────────
-- Observações da nutricionista para o aluno (visível ao aluno)
create table if not exists nutri_notes (
  id         uuid primary key default gen_random_uuid(),
  nutri_id   uuid not null references profiles(id) on delete cascade,
  aluno_id   uuid not null references profiles(id) on delete cascade,
  text       text not null,
  note_date  date not null default current_date,
  created_at timestamptz default now()
);

create index if not exists nutri_notes_aluno_idx on nutri_notes(aluno_id, created_at desc);

-- ═══════════════════════════════════════════════════════════════════════════
-- RPC: get_my_alunos
-- Retorna os alunos da nutricionista logada com dados de adesão
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function get_my_alunos()
returns table (
  id          uuid,
  name        text,
  email       text,
  goal        text,
  allergies   text[],
  birth_date  date,
  sex         text,
  obs         text,
  last_seen   timestamptz,
  created_at  timestamptz
)
language sql security definer
as $$
  select
    p.id, p.name, p.email, p.goal,
    p.allergies, p.birth_date, p.sex, p.obs,
    p.last_seen, p.created_at
  from profiles p
  where p.nutri_id = auth.uid()
    and p.role = 'aluno'
  order by p.name asc;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

alter table profiles      enable row level security;
alter table week_diet     enable row level security;
alter table medications   enable row level security;
alter table daily_logs    enable row level security;
alter table diary         enable row level security;
alter table measurements  enable row level security;
alter table nutri_notes   enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean language sql security definer
as $$ select exists(select 1 from profiles where id=auth.uid() and role='admin'); $$;

-- Helper: is the current user a nutricionista of the given aluno?
create or replace function is_my_aluno(aluno_id uuid)
returns boolean language sql security definer
as $$ select exists(select 1 from profiles where id=aluno_id and nutri_id=auth.uid()); $$;

-- ─── profiles policies ────────────────────────────────────────────────────────
drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles for select using (
  auth.uid() = id
  or is_admin()
  or nutri_id = auth.uid()
);

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles for insert with check (
  auth.uid() = id
);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update using (
  auth.uid() = id or is_admin()
);

-- ─── week_diet policies ───────────────────────────────────────────────────────
drop policy if exists "week_diet_select" on week_diet;
create policy "week_diet_select" on week_diet for select using (
  aluno_id = auth.uid() or is_my_aluno(aluno_id) or is_admin()
);

drop policy if exists "week_diet_upsert" on week_diet;
create policy "week_diet_upsert" on week_diet for all using (
  aluno_id = auth.uid() or is_my_aluno(aluno_id)
);

-- ─── medications policies ─────────────────────────────────────────────────────
drop policy if exists "meds_select" on medications;
create policy "meds_select" on medications for select using (
  aluno_id = auth.uid() or is_my_aluno(aluno_id) or is_admin()
);

drop policy if exists "meds_all" on medications;
create policy "meds_all" on medications for all using (
  aluno_id = auth.uid() or is_my_aluno(aluno_id)
);

-- ─── daily_logs policies ──────────────────────────────────────────────────────
drop policy if exists "logs_select" on daily_logs;
create policy "logs_select" on daily_logs for select using (
  aluno_id = auth.uid() or is_my_aluno(aluno_id) or is_admin()
);

drop policy if exists "logs_insert" on daily_logs;
create policy "logs_insert" on daily_logs for insert with check (
  aluno_id = auth.uid()
);

drop policy if exists "logs_update" on daily_logs;
create policy "logs_update" on daily_logs for update using (
  aluno_id = auth.uid()
);

-- ─── diary policies ───────────────────────────────────────────────────────────
drop policy if exists "diary_select" on diary;
create policy "diary_select" on diary for select using (
  aluno_id = auth.uid() or is_my_aluno(aluno_id) or is_admin()
);

drop policy if exists "diary_all" on diary;
create policy "diary_all" on diary for all using (
  aluno_id = auth.uid()
);

-- ─── measurements policies ────────────────────────────────────────────────────
drop policy if exists "measurements_select" on measurements;
create policy "measurements_select" on measurements for select using (
  aluno_id = auth.uid() or is_my_aluno(aluno_id) or is_admin()
);

drop policy if exists "measurements_insert" on measurements;
create policy "measurements_insert" on measurements for insert with check (
  aluno_id = auth.uid() or is_my_aluno(aluno_id)
);

-- ─── nutri_notes policies ─────────────────────────────────────────────────────
drop policy if exists "notes_select" on nutri_notes;
create policy "notes_select" on nutri_notes for select using (
  aluno_id = auth.uid() or nutri_id = auth.uid() or is_admin()
);

drop policy if exists "notes_insert" on nutri_notes;
create policy "notes_insert" on nutri_notes for insert with check (
  nutri_id = auth.uid()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGER: updated_at automático
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function update_updated_at()
returns trigger language plpgsql
as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTE: Profile creation is handled entirely by the frontend (supabase.js signUp).
-- There is NO trigger that auto-creates profiles on auth.users insert.
-- This avoids race conditions and keeps the flow predictable.
-- last_seen is updated by the app via updateProfile() after login.
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- SUPABASE AUTH SETTINGS (Item 2)
-- In Supabase dashboard → Authentication → Sign In / Providers → Email:
--   ✓ Allow new users to sign up  = ON
--   ✓ Confirm email               = OFF  (disable to avoid "Email not confirmed" error)
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- ADMIN INITIAL SETUP
-- ═══════════════════════════════════════════════════════════════════════════
-- After creating the admin user via Supabase Auth > Users, run this
-- replacing the placeholder with the real UID:
--
-- INSERT INTO profiles (id, role, name, email, status)
-- VALUES ('SEU-UID-AQUI', 'admin', 'Admin Vitalis', 'admin@vitalis.app', 'ativo')
-- ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- PATCH: run this if you already created the table without invite_code / onboarding_done
-- Item 1.3 from the checklist
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.profiles add column if not exists invite_code     text unique;
alter table public.profiles add column if not exists onboarding_done boolean default false;

-- NOTE: blocked nutri is checked in supabase.js signIn(), not via RLS policy.
-- This is intentional: RLS policies run per-row, not per-session.

-- ═══════════════════════════════════════════════════════════════════════════
-- NEW TABLES — Chat, Metas, Templates, Questionários, Push tokens
-- Run this block after the original schema.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── CHAT MESSAGES ───────────────────────────────────────────────────────────
create table if not exists messages (
  id           uuid primary key default gen_random_uuid(),
  nutri_id     uuid not null references profiles(id) on delete cascade,
  aluno_id     uuid not null references profiles(id) on delete cascade,
  sender_id    uuid not null references profiles(id) on delete cascade,
  text         text not null,
  read_at      timestamptz,
  created_at   timestamptz default now()
);
create index if not exists messages_thread_idx on messages(nutri_id, aluno_id, created_at asc);
alter table messages enable row level security;
drop policy if exists "messages_select" on messages;
create policy "messages_select" on messages for select using (
  sender_id = auth.uid() or nutri_id = auth.uid() or aluno_id = auth.uid()
);
drop policy if exists "messages_insert" on messages;
create policy "messages_insert" on messages for insert with check (
  sender_id = auth.uid()
);
drop policy if exists "messages_update" on messages;
create policy "messages_update" on messages for update using (
  nutri_id = auth.uid() or aluno_id = auth.uid()
);

-- ─── METAS (shared nutri→aluno or self) ──────────────────────────────────────
create table if not exists metas (
  id           uuid primary key default gen_random_uuid(),
  aluno_id     uuid not null references profiles(id) on delete cascade,
  nutri_id     uuid references profiles(id) on delete set null,
  texto        text not null,
  prazo        date,
  done         boolean default false,
  done_at      timestamptz,
  created_at   timestamptz default now()
);
create index if not exists metas_aluno_idx on metas(aluno_id, created_at desc);
alter table metas enable row level security;
drop policy if exists "metas_select" on metas;
create policy "metas_select" on metas for select using (
  aluno_id = auth.uid() or nutri_id = auth.uid() or is_admin()
);
drop policy if exists "metas_insert" on metas;
create policy "metas_insert" on metas for insert with check (
  aluno_id = auth.uid() or nutri_id = auth.uid()
);
drop policy if exists "metas_update" on metas;
create policy "metas_update" on metas for update using (
  aluno_id = auth.uid() or nutri_id = auth.uid()
);
drop policy if exists "metas_delete" on metas;
create policy "metas_delete" on metas for delete using (
  aluno_id = auth.uid() or nutri_id = auth.uid()
);

-- ─── CARDÁPIO TEMPLATES (nutri saves reusable plans) ─────────────────────────
create table if not exists diet_templates (
  id           uuid primary key default gen_random_uuid(),
  nutri_id     uuid not null references profiles(id) on delete cascade,
  name         text not null,
  description  text,
  data         jsonb not null default '{}',
  meds         jsonb not null default '[]',
  created_at   timestamptz default now()
);
create index if not exists templates_nutri_idx on diet_templates(nutri_id, created_at desc);
alter table diet_templates enable row level security;
drop policy if exists "templates_nutri" on diet_templates;
create policy "templates_nutri" on diet_templates for all using (
  nutri_id = auth.uid() or is_admin()
);

-- ─── QUESTIONÁRIOS SEMANAIS ───────────────────────────────────────────────────
create table if not exists weekly_questionnaire (
  id           uuid primary key default gen_random_uuid(),
  aluno_id     uuid not null references profiles(id) on delete cascade,
  week_start   date not null,
  energia      integer check (energia between 1 and 5),
  sono         integer check (sono between 1 and 5),
  fome         integer check (fome between 1 and 5),
  disposicao   integer check (disposicao between 1 and 5),
  estresse     integer check (estresse between 1 and 5),
  obs          text,
  created_at   timestamptz default now(),
  unique(aluno_id, week_start)
);
alter table weekly_questionnaire enable row level security;
drop policy if exists "quest_aluno" on weekly_questionnaire;
create policy "quest_aluno" on weekly_questionnaire for all using (
  aluno_id = auth.uid() or is_my_aluno(aluno_id) or is_admin()
);

-- ─── PUSH TOKENS ──────────────────────────────────────────────────────────────
create table if not exists push_tokens (
  user_id      uuid primary key references profiles(id) on delete cascade,
  token        text not null,
  platform     text default 'web',
  updated_at   timestamptz default now()
);
alter table push_tokens enable row level security;
drop policy if exists "push_own" on push_tokens;
create policy "push_own" on push_tokens for all using (user_id = auth.uid());

-- ─── CONSULTAS ────────────────────────────────────────────────────────────────
create table if not exists consultas (
  id           uuid primary key default gen_random_uuid(),
  nutri_id     uuid not null references profiles(id) on delete cascade,
  aluno_id     uuid not null references profiles(id) on delete cascade,
  data         date not null,
  peso         numeric,
  obs          text,
  proxima      date,
  created_at   timestamptz default now()
);
create index if not exists consultas_aluno_idx on consultas(aluno_id, data desc);
alter table consultas enable row level security;
drop policy if exists "consultas_access" on consultas;
create policy "consultas_access" on consultas for all using (
  nutri_id = auth.uid() or aluno_id = auth.uid() or is_admin()
);

-- ─── SUPLEMENTOS ──────────────────────────────────────────────────────────────
create table if not exists suplementos (
  id           uuid primary key default gen_random_uuid(),
  aluno_id     uuid not null references profiles(id) on delete cascade,
  nutri_id     uuid references profiles(id) on delete set null,
  nome         text not null,
  dose         text,
  horario      text,
  prescrito    boolean default false,
  created_at   timestamptz default now()
);
create index if not exists supl_aluno_idx on suplementos(aluno_id);
alter table suplementos enable row level security;
drop policy if exists "supl_access" on suplementos;
create policy "supl_access" on suplementos for all using (
  aluno_id = auth.uid() or nutri_id = auth.uid() or is_my_aluno(aluno_id) or is_admin()
);

-- ─── ORIENTAÇÕES ──────────────────────────────────────────────────────────────
create table if not exists orientacoes (
  aluno_id     uuid primary key references profiles(id) on delete cascade,
  nutri_id     uuid references profiles(id) on delete set null,
  texto        text not null default '',
  updated_at   timestamptz default now()
);
alter table orientacoes enable row level security;
drop policy if exists "orient_access" on orientacoes;
create policy "orient_access" on orientacoes for all using (
  aluno_id = auth.uid() or nutri_id = auth.uid() or is_admin()
);

-- ─── RPC: get thread messages ─────────────────────────────────────────────────
create or replace function get_messages(p_nutri_id uuid, p_aluno_id uuid, p_limit int default 50)
returns table (id uuid, sender_id uuid, text text, read_at timestamptz, created_at timestamptz)
language sql security definer
as $$
  select id, sender_id, text, read_at, created_at
  from messages
  where nutri_id = p_nutri_id and aluno_id = p_aluno_id
  order by created_at asc
  limit p_limit;
$$;

-- ─── Add streak/perc_gordura to existing tables ───────────────────────────────
alter table measurements add column if not exists perc_gordura numeric;
alter table measurements add column if not exists massa_magra  numeric;
alter table measurements add column if not exists date         text;
alter table profiles     add column if not exists orientacoes  text;
