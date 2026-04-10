-- ═══════════════════════════════════════════════════════════
-- VITALIS — Schema do banco de dados
-- Cole este SQL no Supabase > SQL Editor > New Query
-- ═══════════════════════════════════════════════════════════

-- 1. PROFILES (nutricionistas e alunos)
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null check (role in ('aluno','nutri','admin')),
  name          text,
  email         text,
  nutri_id      uuid references profiles(id),   -- aluno aponta para sua nutri
  goal          text,
  allergies     text[],
  birth_date    date,
  sex           text,
  -- plano (preenchido pelo admin)
  plan          text default 'mensal',
  plan_valor    numeric default 89,
  start_date    date,
  paid_until    date,
  status        text default 'ativo' check (status in ('ativo','vencendo','bloqueado')),
  blocked       boolean default false,
  -- timestamps
  created_at    timestamptz default now(),
  last_seen     timestamptz default now()
);

-- 2. DAILY LOGS (registros diários do aluno)
create table if not exists daily_logs (
  id         uuid primary key default gen_random_uuid(),
  aluno_id   uuid references profiles(id) on delete cascade,
  date       date not null,
  humor      text,
  water      integer default 0,
  adherence  integer default 0,
  meals_data jsonb default '{}',   -- {meal_id: {food_id: 'ok'|'skip'}}
  created_at timestamptz default now(),
  unique(aluno_id, date)
);

-- 3. MEASUREMENTS (avaliações antropométricas)
create table if not exists measurements (
  id           uuid primary key default gen_random_uuid(),
  aluno_id     uuid references profiles(id) on delete cascade,
  date         date not null,
  by_role      text default 'aluno',
  protocolo    text,
  sex          text,
  age          integer,
  peso         numeric, altura numeric,
  cintura      numeric, quadril numeric,
  braco        numeric, antebraco numeric,
  coxa         numeric, panturrilha numeric,
  pescoco      numeric, torax numeric, abdomen numeric,
  dc_triceps   numeric, dc_subescapular numeric,
  dc_suprailiaca numeric, dc_abdominal numeric,
  dc_coxa      numeric, dc_peitoral numeric, dc_axilar numeric,
  dc_biceps    numeric,
  created_at   timestamptz default now()
);

-- 4. DIET (cardápio do aluno)
create table if not exists diets (
  id         uuid primary key default gen_random_uuid(),
  aluno_id   uuid references profiles(id) on delete cascade,
  meals      jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. DIARY (diário do aluno)
create table if not exists diary_entries (
  id         uuid primary key default gen_random_uuid(),
  aluno_id   uuid references profiles(id) on delete cascade,
  date       date not null,
  time       text,
  text       text not null,
  type       text default 'diario',  -- 'diario' | 'extra' | 'desvio' | 'duvida'
  created_at timestamptz default now()
);

-- 6. CHAT MESSAGES
create table if not exists chat_messages (
  id         uuid primary key default gen_random_uuid(),
  from_id    uuid references profiles(id) on delete cascade,
  to_id      uuid references profiles(id) on delete cascade,
  text       text not null,
  read       boolean default false,
  created_at timestamptz default now()
);

-- 7. NUTRI NOTES (observações da nutri para o aluno — visível ao aluno)
create table if not exists nutri_notes (
  id         uuid primary key default gen_random_uuid(),
  nutri_id   uuid references profiles(id) on delete cascade,
  aluno_id   uuid references profiles(id) on delete cascade,
  text       text not null,
  created_at timestamptz default now()
);

-- 8. PRIVATE NOTES (notas privadas da nutri — NÃO visível ao aluno)
create table if not exists private_notes (
  id         uuid primary key default gen_random_uuid(),
  nutri_id   uuid references profiles(id) on delete cascade,
  aluno_id   uuid references profiles(id) on delete cascade,
  text       text not null,
  created_at timestamptz default now()
);

-- 9. PHOTOS
create table if not exists progress_photos (
  id         uuid primary key default gen_random_uuid(),
  aluno_id   uuid references profiles(id) on delete cascade,
  label      text,
  date       date not null,
  storage_path text,
  created_at timestamptz default now()
);

-- 10. TEMPLATES DE CARDÁPIO (da nutri)
create table if not exists diet_templates (
  id         uuid primary key default gen_random_uuid(),
  nutri_id   uuid references profiles(id) on delete cascade,
  name       text not null,
  goal       text,
  meals      jsonb not null default '[]',
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) — protege os dados de cada usuário
-- ═══════════════════════════════════════════════════════════

alter table profiles         enable row level security;
alter table daily_logs       enable row level security;
alter table measurements     enable row level security;
alter table diets            enable row level security;
alter table diary_entries    enable row level security;
alter table chat_messages    enable row level security;
alter table nutri_notes      enable row level security;
alter table private_notes    enable row level security;
alter table progress_photos  enable row level security;
alter table diet_templates   enable row level security;

-- Profiles: cada um vê o próprio; nutri vê seus alunos; admin vê todos
create policy "profiles_select" on profiles for select using (
  auth.uid() = id
  or (select role from profiles where id = auth.uid()) = 'admin'
  or nutri_id = auth.uid()
);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

-- Daily logs: aluno vê os seus; nutri vê de seus alunos
create policy "logs_select" on daily_logs for select using (
  aluno_id = auth.uid()
  or aluno_id in (select id from profiles where nutri_id = auth.uid())
);
create policy "logs_insert" on daily_logs for insert with check (aluno_id = auth.uid());
create policy "logs_update" on daily_logs for update using (aluno_id = auth.uid());

-- Measurements: mesmo padrão
create policy "measure_select" on measurements for select using (
  aluno_id = auth.uid()
  or aluno_id in (select id from profiles where nutri_id = auth.uid())
);
create policy "measure_insert" on measurements for insert with check (
  aluno_id = auth.uid()
  or aluno_id in (select id from profiles where nutri_id = auth.uid())
);

-- Diets: aluno vê o seu; nutri edita de seus alunos
create policy "diets_select" on diets for select using (
  aluno_id = auth.uid()
  or aluno_id in (select id from profiles where nutri_id = auth.uid())
);
create policy "diets_upsert" on diets for all using (
  aluno_id in (select id from profiles where nutri_id = auth.uid())
);

-- Diary: aluno vê os seus; nutri vê de seus alunos
create policy "diary_select" on diary_entries for select using (
  aluno_id = auth.uid()
  or aluno_id in (select id from profiles where nutri_id = auth.uid())
);
create policy "diary_insert" on diary_entries for insert with check (aluno_id = auth.uid());

-- Chat: apenas os dois participantes veem
create policy "chat_select" on chat_messages for select using (
  from_id = auth.uid() or to_id = auth.uid()
);
create policy "chat_insert" on chat_messages for insert with check (from_id = auth.uid());

-- Nutri notes: nutri escreve; aluno lê as suas
create policy "nutri_notes_select" on nutri_notes for select using (
  aluno_id = auth.uid() or nutri_id = auth.uid()
);
create policy "nutri_notes_insert" on nutri_notes for insert with check (nutri_id = auth.uid());

-- Private notes: SOMENTE a nutri vê e escreve
create policy "private_notes_all" on private_notes for all using (nutri_id = auth.uid());

-- Photos: aluno e nutri veem
create policy "photos_select" on progress_photos for select using (
  aluno_id = auth.uid()
  or aluno_id in (select id from profiles where nutri_id = auth.uid())
);
create policy "photos_insert" on progress_photos for insert with check (aluno_id = auth.uid());

-- Templates: nutri vê e edita os seus
create policy "templates_all" on diet_templates for all using (nutri_id = auth.uid());
