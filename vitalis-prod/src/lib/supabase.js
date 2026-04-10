import { createClient } from '@supabase/supabase-js'

// These values come from your Supabase project settings
// You will replace them with your real values in the .env file
const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

// ─── Nutri helpers ────────────────────────────────────────────────────────────

export async function getMyAlunos(nutriId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('nutri_id', nutriId)
    .eq('role', 'aluno')
  if (error) throw error
  return data
}

export async function getLogs(alunoId, dateFrom, dateTo) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('aluno_id', alunoId)
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function getMeasurements(alunoId) {
  const { data, error } = await supabase
    .from('measurements')
    .select('*')
    .eq('aluno_id', alunoId)
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

export async function getChatMessages(nutriId, alunoId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .or(`and(from_id.eq.${nutriId},to_id.eq.${alunoId}),and(from_id.eq.${alunoId},to_id.eq.${nutriId})`)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function sendMessage(fromId, toId, text) {
  const { error } = await supabase
    .from('chat_messages')
    .insert({ from_id: fromId, to_id: toId, text })
  if (error) throw error
}

// ─── Admin helpers ────────────────────────────────────────────────────────────

export async function getAllNutris() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, aluno_count:profiles!nutri_id(count)')
    .eq('role', 'nutri')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateNutriPlan(nutriId, plan, paidUntil, valor) {
  const { error } = await supabase
    .from('profiles')
    .update({ plan, paid_until: paidUntil, plan_valor: valor, status: 'ativo', blocked: false })
    .eq('id', nutriId)
  if (error) throw error
}

export async function toggleBlockNutri(nutriId, block) {
  const { error } = await supabase
    .from('profiles')
    .update({ blocked: block, status: block ? 'bloqueado' : 'ativo' })
    .eq('id', nutriId)
  if (error) throw error
}
