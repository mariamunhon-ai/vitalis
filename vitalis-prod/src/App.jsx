import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase, getProfile } from './lib/supabase.js'

// ─── Lazy imports (cada tela em arquivo separado) ─────────────────────────────
// Na versão de produção você vai separar cada componente.
// Por agora, importamos da demo para ir rápido.
import VitalisDemo from './VitalisDemo.jsx'

// ─── Root router ──────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession]   = useState(undefined) // undefined = loading
  const [profile, setProfile]   = useState(null)
  const isAdmin = typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/admin')

  useEffect(() => {
    // Listen to auth changes
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadProfile(data.session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (s) loadProfile(s.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(uid) {
    try {
      const p = await getProfile(uid)
      setProfile(p)
    } catch { setProfile(null) }
  }

  // Still checking auth
  if (session === undefined) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#080c14', color:'#2dd4bf', fontFamily:'sans-serif', fontSize:14 }}>
      Carregando…
    </div>
  )

  // Route to the correct experience
  return <VitalisDemo/>
}
