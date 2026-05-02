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
  if (profileError) {
    // Rollback: delete the auth user so there's no half-created state
    try { await sb.auth.admin.deleteUser(userId) } catch {}
    await sb.auth.signOut()
    throw new Error('Erro ao criar seu perfil. Tente novamente. Se o problema persistir, contate o suporte.')
  }

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

export async function getProfile(userId, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data, error } = await sb
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (error) throw error
      return data // null if not found — caller handles
    } catch (e) {
      if (attempt === retries) throw e
      await new Promise(r => setTimeout(r, 400 * (attempt + 1)))
    }
  }
} = await sb
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
  if (!msg) return 'Erro desconhecido. Tente novamente.'
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos. Verifique e tente novamente.'
  if (msg.includes('Invalid login'))             return 'E-mail ou senha incorretos.'
  if (msg.includes('Email not confirmed'))       return 'E-mail não confirmado. Desative a confirmação no Supabase ou confirme o e-mail.'
  if (msg.includes('already registered'))        return 'Este e-mail já está cadastrado. Clique em "Entrar" para fazer login.'
  if (msg.includes('User already registered'))   return 'Este e-mail já está cadastrado. Clique em "Entrar" para fazer login.'
  if (msg.includes('Password should'))           return 'Senha fraca: use pelo menos 6 caracteres.'
  if (msg.includes('password'))                  return 'Senha muito fraca. Use pelo menos 6 caracteres com letras e números.'
  if (msg.includes('Unable to validate'))        return 'Sessão expirada. Faça login novamente.'
  if (msg.includes('JWT'))                       return 'Sessão inválida. Saia e entre novamente.'
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('NetworkError')) return 'Sem conexão com a internet. Verifique e tente novamente.'
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
  if (msg.includes('Signup is disabled'))        return 'Cadastro desativado. Entre em contato com o suporte.'
  return msg
}

// ═══════════════════════════════════════════════════════════════════════════
// CHAT
// ═══════════════════════════════════════════════════════════════════════════

export async function getMessages(nutriId, alunoId, limit = 60) {
  const { data, error } = await sb.rpc('get_messages', {
    p_nutri_id: nutriId, p_aluno_id: alunoId, p_limit: limit
  })
  if (error) throw error
  return data || []
}

export async function sendMessage(nutriId, alunoId, senderId, text) {
  const { error } = await sb.from('messages').insert({
    nutri_id: nutriId, aluno_id: alunoId, sender_id: senderId, text
  })
  if (error) throw error
}

export async function markMessagesRead(nutriId, alunoId) {
  await sb.from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('nutri_id', nutriId).eq('aluno_id', alunoId)
    .is('read_at', null)
    .neq('sender_id', (await sb.auth.getUser()).data.user?.id || '')
}

export function subscribeToMessages(nutriId, alunoId, onChange) {
  return sb.channel(`chat_${nutriId}_${alunoId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'messages',
      filter: `nutri_id=eq.${nutriId}`
    }, onChange)
    .subscribe()
}

// ═══════════════════════════════════════════════════════════════════════════
// METAS
// ═══════════════════════════════════════════════════════════════════════════

export async function getMetas(alunoId) {
  const { data, error } = await sb.from('metas')
    .select('*').eq('aluno_id', alunoId).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addMeta(alunoId, texto, prazo, nutriId = null) {
  const { data, error } = await sb.from('metas')
    .insert({ aluno_id: alunoId, nutri_id: nutriId, texto, prazo: prazo || null })
    .select().single()
  if (error) throw error
  return data
}

export async function toggleMeta(metaId, done) {
  const { error } = await sb.from('metas')
    .update({ done, done_at: done ? new Date().toISOString() : null })
    .eq('id', metaId)
  if (error) throw error
}

export async function deleteMeta(metaId) {
  const { error } = await sb.from('metas').delete().eq('id', metaId)
  if (error) throw error
}

// ═══════════════════════════════════════════════════════════════════════════
// DIET TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════

export async function getTemplates(nutriId) {
  const { data, error } = await sb.from('diet_templates')
    .select('*').eq('nutri_id', nutriId).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function saveTemplate(nutriId, name, description, data, meds) {
  const { error } = await sb.from('diet_templates')
    .insert({ nutri_id: nutriId, name, description, data, meds })
  if (error) throw error
}

export async function deleteTemplate(templateId) {
  const { error } = await sb.from('diet_templates').delete().eq('id', templateId)
  if (error) throw error
}

// ═══════════════════════════════════════════════════════════════════════════
// QUESTIONÁRIO SEMANAL
// ═══════════════════════════════════════════════════════════════════════════

export async function getQuestionnaires(alunoId, limit = 12) {
  const { data, error } = await sb.from('weekly_questionnaire')
    .select('*').eq('aluno_id', alunoId)
    .order('week_start', { ascending: false }).limit(limit)
  if (error) throw error
  return data || []
}

export async function saveQuestionnaire(alunoId, weekStart, answers) {
  const { error } = await sb.from('weekly_questionnaire').upsert(
    { aluno_id: alunoId, week_start: weekStart, ...answers },
    { onConflict: 'aluno_id,week_start' }
  )
  if (error) throw error
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSULTAS
// ═══════════════════════════════════════════════════════════════════════════

export async function getConsultas(alunoId) {
  const { data, error } = await sb.from('consultas')
    .select('*').eq('aluno_id', alunoId).order('data', { ascending: false })
  if (error) throw error
  return data || []
}

export async function addConsulta(nutriId, alunoId, consulta) {
  const { error } = await sb.from('consultas')
    .insert({ nutri_id: nutriId, aluno_id: alunoId, ...consulta })
  if (error) throw error
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPLEMENTOS
// ═══════════════════════════════════════════════════════════════════════════

export async function getSuplementos(alunoId) {
  const { data, error } = await sb.from('suplementos')
    .select('*').eq('aluno_id', alunoId).order('created_at')
  if (error) throw error
  return data || []
}

export async function addSuplemento(alunoId, supl, nutriId = null) {
  const { data, error } = await sb.from('suplementos')
    .insert({ aluno_id: alunoId, nutri_id: nutriId, prescrito: !!nutriId, ...supl })
    .select().single()
  if (error) throw error
  return data
}

export async function deleteSuplemento(suplId) {
  const { error } = await sb.from('suplementos').delete().eq('id', suplId)
  if (error) throw error
}

// ═══════════════════════════════════════════════════════════════════════════
// ORIENTAÇÕES
// ═══════════════════════════════════════════════════════════════════════════

export async function getOrientacoes(alunoId) {
  const { data } = await sb.from('orientacoes')
    .select('texto').eq('aluno_id', alunoId).maybeSingle()
  return data?.texto || ''
}

export async function saveOrientacoes(alunoId, nutriId, texto) {
  const { error } = await sb.from('orientacoes').upsert(
    { aluno_id: alunoId, nutri_id: nutriId, texto, updated_at: new Date().toISOString() },
    { onConflict: 'aluno_id' }
  )
  if (error) throw error
}

// ═══════════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS (web push via service worker)
// ═══════════════════════════════════════════════════════════════════════════

export async function savePushToken(userId, token) {
  const { error } = await sb.from('push_tokens').upsert(
    { user_id: userId, token, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
  if (error) throw error
}

// ═══════════════════════════════════════════════════════════════════════════
// STREAK calculation (derived from daily_logs)
// ═══════════════════════════════════════════════════════════════════════════

export async function getStreak(alunoId) {
  // Get last 60 days of logs to calculate streak
  const to   = new Date()
  const from = new Date(); from.setDate(from.getDate() - 60)
  const fmt  = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  const { data } = await sb.from('daily_logs')
    .select('log_date, data')
    .eq('aluno_id', alunoId)
    .gte('log_date', fmt(from))
    .lte('log_date', fmt(to))
    .order('log_date', { ascending: false })
  if (!data?.length) return 0
  // Count consecutive days with any food logged
  let streak = 0
  const today = fmt(new Date())
  const logSet = new Set(data.filter(r => {
    const d = r.data || {}
    return Object.values(d).some(v => v && typeof v === 'object' && Object.keys(v).length > 0)
  }).map(r => r.log_date))
  let day = new Date()
  // Allow today or yesterday as starting point
  if (!logSet.has(fmt(day))) day.setDate(day.getDate() - 1)
  while (logSet.has(fmt(day))) {
    streak++
    day.setDate(day.getDate() - 1)
  }
  return streak
}

// ═══════════════════════════════════════════════════════════════════════════
// POLLOCK body fat calculation helpers (deterministic, no external deps)
// ═══════════════════════════════════════════════════════════════════════════

export function pollockFat7(sex, age, dc) {
  // dc = { triceps, subescapular, suprailiaca, abdominal, coxa, peitoral, axilar }
  const { triceps=0, subescapular=0, suprailiaca=0, abdominal=0, coxa=0, peitoral=0, axilar=0 } = dc
  const sum7 = triceps + subescapular + suprailiaca + abdominal + coxa + peitoral + axilar
  let d
  if (sex === 'M') {
    d = 1.112 - 0.00043499 * sum7 + 0.00000055 * sum7 ** 2 - 0.00028826 * age
  } else {
    d = 1.097 - 0.00046971 * sum7 + 0.00000056 * sum7 ** 2 - 0.00012828 * age
  }
  return parseFloat(((495 / d - 450)).toFixed(1))
}

export function pollockFat3(sex, age, dc) {
  // Male: peitoral, abdominal, coxa | Female: triceps, suprailiaca, coxa
  let sum3, d
  if (sex === 'M') {
    sum3 = (dc.peitoral||0) + (dc.abdominal||0) + (dc.coxa||0)
    d = 1.10938 - 0.0008267 * sum3 + 0.0000016 * sum3 ** 2 - 0.0002574 * age
  } else {
    sum3 = (dc.triceps||0) + (dc.suprailiaca||0) + (dc.coxa||0)
    d = 1.0994921 - 0.0009929 * sum3 + 0.0000023 * sum3 ** 2 - 0.0001392 * age
  }
  return parseFloat(((495 / d - 450)).toFixed(1))
}

export function leanMass(peso, fatPct) {
  return parseFloat((peso * (1 - fatPct / 100)).toFixed(1))
}
