
-- ════════════════════════════════════════════════════════════════════
-- PATCH — Add plan management columns to profiles
-- Run this if you already created the table without these columns
-- ════════════════════════════════════════════════════════════════════

alter table profiles add column if not exists plan        text    default 'mensal';
alter table profiles add column if not exists plan_valor  numeric default 89;
alter table profiles add column if not exists start_date  date;
alter table profiles add column if not exists paid_until  date;
alter table profiles add column if not exists status      text    default 'ativo' check (status in ('ativo','vencendo','bloqueado'));
alter table profiles add column if not exists blocked     boolean default false;

-- Admin can update plan fields on any profile
create policy if not exists "admin_update_all" on profiles for update
  using ((select role from profiles where id = auth.uid()) = 'admin');

create policy if not exists "admin_select_all" on profiles for select
  using ((select role from profiles where id = auth.uid()) = 'admin');

-- Create the admin user profile (after creating via Supabase Auth dashboard)
-- Replace the UUID below with your admin user's UID from Supabase Auth > Users
-- INSERT INTO profiles (id, role, name, email, status)
-- VALUES ('YOUR-ADMIN-UID-HERE', 'admin', 'Admin Vitalis', 'admin@vitalis.app', 'ativo');
