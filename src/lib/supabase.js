// src/supabase.js
// All Supabase interactions centralised here.
// Replace the two constants below with your project values.

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── AUTH ────────────────────────────────────────────────────────────────────

export async function signUp({ email, password, name, role, nutriCode }) {
  let nutri_id = null;

  // Se for aluno, código é obrigatório
  if (role === "aluno") {
    if (!nutriCode || !nutriCode.trim()) {
      throw new Error("Informe o código da nutricionista.");
    }

    const { data: nutri, error: nutriError } = await sb
      .from("profiles")
      .select("id")
      .eq("invite_code", nutriCode.trim())
      .eq("role", "nutri")
      .maybeSingle();

    if (nutriError) throw nutriError;
    if (!nutri) throw new Error("Código da nutricionista inválido.");

    nutri_id = nutri.id;
  }

  // Cria no Auth
  const { data, error } = await sb.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  const userId = data?.user?.id;
  if (!userId) throw new Error("Erro ao criar usuário.");

  const profileData = {
    id: userId,
    email,
    role,
    nutri_id,
    name: name || null,
  };

  // Se for nutri, gera código de convite automático
  if (role === "nutri") {
    profileData.invite_code = userId.slice(0, 8).toUpperCase();
  }

  const { error: profileError } = await sb
    .from("profiles")
    .upsert(profileData);

  if (profileError) throw profileError;

  return data.user;
}

export async function signIn({ email, password }) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  await sb.auth.signOut();
}

export async function getSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function getProfile(userId) {
  const { data, error } = await sb.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, patch) {
  const { error } = await sb.from("profiles").update(patch).eq("id", userId);
  if (error) throw error;
}

// ─── ALUNO LIST (for nutricionista) ─────────────────────────────────────────

export async function getMyAlunos() {
  const { data, error } = await sb.rpc("get_my_alunos");
  if (error) throw error;
  return data || [];
}

// ─── WEEK DIET ───────────────────────────────────────────────────────────────

export async function getWeekDiet(alunoId) {
  const { data } = await sb.from("week_diet").select("data").eq("aluno_id", alunoId).single();
  return data?.data || {};
}

export async function saveWeekDiet(alunoId, weekDietObj) {
  const { error } = await sb.from("week_diet").upsert({ aluno_id: alunoId, data: weekDietObj, updated_at: new Date().toISOString() }, { onConflict: "aluno_id" });
  if (error) throw error;
}

// ─── MEDICATIONS ─────────────────────────────────────────────────────────────

export async function getMeds(alunoId) {
  const { data, error } = await sb.from("medications").select("*").eq("aluno_id", alunoId);
  if (error) throw error;
  return data || [];
}

export async function saveMeds(alunoId, medsArray) {
  // Delete all and re-insert (simple approach)
  await sb.from("medications").delete().eq("aluno_id", alunoId);
  if (medsArray.length === 0) return;
  const rows = medsArray.map(m => ({ id: m.id, aluno_id: alunoId, name: m.name, dose: m.dose, times: m.times || [] }));
  const { error } = await sb.from("medications").insert(rows);
  if (error) throw error;
}

// ─── DAILY LOGS ──────────────────────────────────────────────────────────────

export async function getDayLog(alunoId, dateStr) {
  const { data } = await sb.from("daily_logs").select("data").eq("aluno_id", alunoId).eq("log_date", dateStr).single();
  return data?.data || {};
}

export async function saveDayLog(alunoId, dateStr, logData) {
  const { error } = await sb.from("daily_logs").upsert({ aluno_id: alunoId, log_date: dateStr, data: logData }, { onConflict: "aluno_id,log_date" });
  if (error) throw error;
}

export async function getLogsRange(alunoId, fromDate, toDate) {
  const { data, error } = await sb.from("daily_logs").select("log_date,data").eq("aluno_id", alunoId).gte("log_date", fromDate).lte("log_date", toDate);
  if (error) throw error;
  const map = {};
  (data || []).forEach(r => { map[r.log_date] = r.data; });
  return map;
}

// ─── DIARY ───────────────────────────────────────────────────────────────────

export async function getDiary(alunoId) {
  const { data, error } = await sb.from("diary").select("*").eq("aluno_id", alunoId).order("entry_date", { ascending: false });
  if (error) throw error;
  const map = {};
  (data || []).forEach(r => { map[r.entry_date] = { entries: r.entries, progressPhoto: r.progress_photo }; });
  return map;
}

export async function saveDiaryDay(alunoId, dateStr, entries, progressPhoto) {
  const { error } = await sb.from("diary").upsert({ aluno_id: alunoId, entry_date: dateStr, entries, progress_photo: progressPhoto || null }, { onConflict: "aluno_id,entry_date" });
  if (error) throw error;
}

// ─── MEASUREMENTS ────────────────────────────────────────────────────────────

export async function getMeasurements(alunoId) {
  const { data, error } = await sb.from("measurements").select("*").eq("aluno_id", alunoId).order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addMeasurement(alunoId, m) {
  const { error } = await sb.from("measurements").insert({ aluno_id: alunoId, ...m });
  if (error) throw error;
}

// ─── NUTRI NOTES ─────────────────────────────────────────────────────────────

export async function getNutriNotes(nutriId, alunoId) {
  const { data, error } = await sb.from("nutri_notes").select("*").eq("nutri_id", nutriId).eq("aluno_id", alunoId).order("note_date", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addNutriNote(nutriId, alunoId, text, noteDate) {
  const { error } = await sb.from("nutri_notes").insert({ nutri_id: nutriId, aluno_id: alunoId, text, note_date: noteDate });
  if (error) throw error;
}

// ─── REALTIME ────────────────────────────────────────────────────────────────

export function subscribeToAluno(alunoId, onChange) {
  return sb.channel(`aluno_${alunoId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "daily_logs", filter: `aluno_id=eq.${alunoId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "diary",      filter: `aluno_id=eq.${alunoId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "measurements",filter: `aluno_id=eq.${alunoId}` }, onChange)
    .subscribe();
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────

export async function getAllNutris() {
  const { data, error } = await sb.from("profiles")
    .select("id, name, email, plan, plan_valor, start_date, paid_until, status, blocked, created_at")
    .eq("role","nutricionista")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateNutriPlan(nutriId, plan, paidUntil, startDate, valor) {
  const { error } = await sb.from("profiles")
    .update({ plan, paid_until: paidUntil, start_date: startDate, plan_valor: valor, status: "ativo", blocked: false })
    .eq("id", nutriId);
  if (error) throw error;
}

export async function toggleBlockNutri(nutriId, block) {
  const { error } = await sb.from("profiles")
    .update({ blocked: block, status: block ? "bloqueado" : "ativo" })
    .eq("id", nutriId);
  if (error) throw error;
}
