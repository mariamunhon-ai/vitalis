// src/lib/supabase.js
// All Supabase interactions centralised here.
// Fill in the two env vars in your .env file.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
}

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON)

// ─── AUTH ────────────────────────────────────────────────────────────────────

export async function signUp({ email, password, role, nutriCode }) {
  if (!email?.trim())              throw new Error('Digite seu e-mail.')
  if (!password || password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.')
  if (!['nutricionista', 'aluno'].includes(role)) throw new Error('Perfil inválido.')

  let nutri_id = null

  if (role === 'aluno') {
  if (!nutriCode?.trim()) throw new Error('Informe o código da nutricionista.')

  const { data: nutri, error: nutriError } = await sb
      .from('profiles')
      .select('id')
      .eq('invite_code', nutriCode.trim().toUpperCase())
      .eq('role', 'nutricionista')
      .maybeSingle()

  if (nutriError) throw nutriError
  if (!nutri) throw new Error('Código da nutricionista inválido. Verifique com ela e tente novamente.')

    nutri_id = nutri.id
  }

  const { data, error } = await sb.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) throw new Error(translateAuthError(error.message))

  const userId = data?.user?.id
  if (!userId) throw new Error('Erro ao criar usuário. Tente novamente.')

  const profileData = {
    id:              userId,
    email:           email.trim().toLowerCase(),
    role,
    nutri_id,
    onboarding_done: false,
  }

    if (role === 'nutricionista') {
    profileData.invite_code = userId.slice(0, 8).toUpperCase()
  }

  const { error: profileError } = await sb.from('profiles').upsert(profileData)
  if (profileError) throw new Error('Conta criada mas erro ao salvar perfil. Contate o suporte.')

  return data.user
}

export async function signIn({ email, password }) {
  if (!email?.trim()) throw new Error('Digite seu e-mail.')
  if (!password)      throw new Error('Digite sua senha.')

  const { data, error } = await sb.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })
  if (error) throw new Error(translateAuthError(error.message))

    const profile = await getProfile(data.user.id)
  if (profile?.blocked) {
    await sb.auth.signOut()
    throw new Error('Sua conta está temporariamente bloqueada. Entre em contato com o suporte.')
  }
  // Optional: check plan expiry for nutricionistas
  if (profile?.role === 'nutricionista' && profile?.paid_until) {
    const expired = new Date(profile.paid_until) < new Date()
    if (expired && profile?.status === 'bloqueado') {
      await sb.auth.signOut()
      throw new Error('Seu plano venceu. Entre em contato para renovar.')
    }
  }

  return data.user
}

export async function signOut() {
  await sb.auth.signOut()
}

export async function getSession() {
  const { data } = await sb.auth.getSession()
  return data.session
}

export async function getProfile(userId) {
      const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data // null if not found — caller handles this
}

export async function touchLastSeen(userId) {
  // fire-and-forget, don't block login flow
  sb.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', userId).then(() => {})
}

export async function completeOnboarding(userId, patch) {
  const { error } = await sb
    .from('profiles')
    .update({
      ...patch,
      onboarding_done:  true,
      updated_at:       new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw error
}

// ─── NUTRICIONISTA — aluno list ───────────────────────────────────────────────

export async function getMyAlunos() {
  const { data, error } = await sb.rpc('get_my_alunos')
  if (error) throw error
  return data || []
}

// ─── WEEK DIET ────────────────────────────────────────────────────────────────

export async function getWeekDiet(alunoId) {
  const { data } = await sb.from('week_diet')
    .select('data').eq('aluno_id', alunoId).maybeSingle()
  return data?.data || {}
}

export async function saveWeekDiet(alunoId, weekDietObj) {
  const { error } = await sb.from('week_diet').upsert(
    { aluno_id: alunoId, data: weekDietObj, updated_at: new Date().toISOString() },
    { onConflict: 'aluno_id' }
  )
  if (error) throw error
}

// ─── MEDICATIONS ──────────────────────────────────────────────────────────────

export async function getMeds(alunoId) {
  const { data, error } = await sb.from('medications')
    .select('*').eq('aluno_id', alunoId).order('name')
  if (error) throw error
  return data || []
}

export async function saveMeds(alunoId, medsArray) {
  await sb.from('medications').delete().eq('aluno_id', alunoId)
  if (!medsArray.length) return
  const rows = medsArray.map(m => ({
    id:       m.id,
    aluno_id: alunoId,
    name:     m.name,
    dose:     m.dose,
    times:    m.times || [],
  }))
  const { error } = await sb.from('medications').insert(rows)
  if (error) throw error
}

// ─── DAILY LOGS ───────────────────────────────────────────────────────────────

export async function getDayLog(alunoId, dateStr) {
  const { data } = await sb.from('daily_logs')
    .select('data').eq('aluno_id', alunoId).eq('log_date', dateStr).maybeSingle()
  return data?.data || {}
}

export async function saveDayLog(alunoId, dateStr, logData) {
  const { error } = await sb.from('daily_logs').upsert(
    { aluno_id: alunoId, log_date: dateStr, data: logData },
    { onConflict: 'aluno_id,log_date' }
  )
  if (error) throw error
}

export async function getLogsRange(alunoId, fromDate, toDate) {
  const { data, error } = await sb.from('daily_logs')
    .select('log_date,data')
    .eq('aluno_id', alunoId)
    .gte('log_date', fromDate)
    .lte('log_date', toDate)
  if (error) throw error
  const map = {}
  ;(data || []).forEach(r => { map[r.log_date] = r.data })
  return map
}

// ─── DIARY ────────────────────────────────────────────────────────────────────

export async function getDiary(alunoId) {
  const { data, error } = await sb.from('diary')
    .select('*').eq('aluno_id', alunoId).order('entry_date', { ascending: false })
  if (error) throw error
  const map = {}
  ;(data || []).forEach(r => {
    map[r.entry_date] = { entries: r.entries || [], progressPhoto: r.progress_photo }
  })
  return map
}

export async function saveDiaryDay(alunoId, dateStr, entries, progressPhoto) {
  const { error } = await sb.from('diary').upsert(
    { aluno_id: alunoId, entry_date: dateStr, entries, progress_photo: progressPhoto || null },
    { onConflict: 'aluno_id,entry_date' }
  )
  if (error) throw error
}

// ─── MEASUREMENTS ─────────────────────────────────────────────────────────────

export async function getMeasurements(alunoId) {
  const { data, error } = await sb.from('measurements')
    .select('*').eq('aluno_id', alunoId).order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function addMeasurement(alunoId, m) {
  const { error } = await sb.from('measurements').insert({ aluno_id: alunoId, ...m })
  if (error) throw error
}

// ─── NUTRI NOTES ──────────────────────────────────────────────────────────────

export async function getNutriNotes(nutriId, alunoId) {
  const { data, error } = await sb.from('nutri_notes')
    .select('*')
    .eq('nutri_id', nutriId)
    .eq('aluno_id', alunoId)
    .order('note_date', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addNutriNote(nutriId, alunoId, text, noteDate) {
  const { error } = await sb.from('nutri_notes').insert({
    nutri_id: nutriId, aluno_id: alunoId, text, note_date: noteDate,
  })
  if (error) throw error
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export async function getAdminNutris() {
  const { data, error } = await sb.from('profiles')
    .select('id, name, email, plan, plan_valor, start_date, paid_until, status, blocked, created_at, invite_code')
    .eq('role', 'nutricionista')
    .order('created_at', { ascending: false })
  if (error) throw error
  const { data: counts } = await sb.from('profiles')
    .select('nutri_id').eq('role', 'aluno')
  const countMap = {}
  ;(counts || []).forEach(r => {
    if (r.nutri_id) countMap[r.nutri_id] = (countMap[r.nutri_id] || 0) + 1
  })
  return (data || []).map(n => ({ ...n, alunos: countMap[n.id] || 0 }))
}

export async function adminUpdateNutriPlan(nutriId, plan, paidUntil, startDate, valor) {
  const { error } = await sb.from('profiles').update({
    plan, paid_until: paidUntil, start_date: startDate,
    plan_valor: valor, status: 'ativo', blocked: false,
  }).eq('id', nutriId)
  if (error) throw error
}

export async function adminToggleBlock(nutriId, block) {
  const { error } = await sb.from('profiles').update({
    blocked: block, status: block ? 'bloqueado' : 'ativo',
  }).eq('id', nutriId)
  if (error) throw error
}

// ─── REALTIME ─────────────────────────────────────────────────────────────────

export function subscribeToAluno(alunoId, onChange) {
  return sb.channel(`aluno_${alunoId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_logs',   filter: `aluno_id=eq.${alunoId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'diary',        filter: `aluno_id=eq.${alunoId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'measurements', filter: `aluno_id=eq.${alunoId}` }, onChange)
    .subscribe()
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function translateAuthError(msg) {
  if (!msg) return 'Erro desconhecido.'
  if (msg.includes('Invalid login'))       return 'E-mail ou senha incorretos.'
  if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar. (Ou desative a confirmação no Supabase.)'
  if (msg.includes('already registered')) return 'Este e-mail já está cadastrado. Faça login.'
  if (msg.includes('Password should'))    return 'A senha precisa ter pelo menos 6 caracteres.'
  if (msg.includes('Unable to validate')) return 'Sessão expirada. Faça login novamente.'
  if (msg.includes('network'))            return 'Sem conexão. Verifique sua internet.'
  return msg
}
