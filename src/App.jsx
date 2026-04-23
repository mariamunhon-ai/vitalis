import { useState, useEffect } from "react"
import * as DB from "./lib/supabase.js"
import { C } from "./constants.js"
import { Spinner } from "./ui.jsx"

import AuthScreen from "./pages/AuthScreen.jsx"
import AdminDashboard from "./pages/AdminDashboard.jsx"
import NutriOnboarding from "./pages/NutriOnboarding.jsx"
import NutriDashboard from "./pages/NutriDashboard.jsx"
import AlunoOnboarding from "./pages/AlunoOnboarding.jsx"
import AlunoApp from "./pages/AlunoApp.jsx"

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    DB.getSession().then(async sess => {
      setSession(sess)
      if (sess?.user) {
        try {
          const p = await DB.getProfile(sess.user.id)
          setProfile(p)
          if (p) DB.touchLastSeen(sess.user.id)
        } catch {
          setProfile(null)
        }
      }
    })

    const { data: { subscription } } = DB.sb.auth.onAuthStateChange(async (event, sess) => {
      setSession(sess)

      if (event === "SIGNED_OUT" || (!sess && event === "TOKEN_REFRESHED")) {
        setProfile(null)
        return
      }

      if (sess?.user) {
        try {
          const p = await DB.getProfile(sess.user.id)
          setProfile(p)
          if (p) DB.touchLastSeen(sess.user.id)
        } catch {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div style={{ fontFamily: "'Outfit',sans-serif", background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.text }}>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap" rel="stylesheet" />
        <div style={{ fontSize: 64, marginBottom: 16 }}>🥗</div>
        <Spinner text="Iniciando Vitalis…" />
      </div>
    )
  }

  if (!session) {
    return <AuthScreen onAuth={setProfile} />
  }

  if (!profile) {
    return (
      <div style={{ fontFamily: "'Outfit',sans-serif", background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, color: C.text }}>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap" rel="stylesheet" />
        <Spinner text="Carregando perfil…" />
        <button
          onClick={() => DB.signOut()}
          style={{ marginTop: 24, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 12, padding: "8px 20px", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
        >
          Sair e tentar novamente
        </button>
      </div>
    )
  }

  const signOut = () => DB.signOut()

  if (profile.role === "admin") {
    return <AdminDashboard profile={profile} onSignOut={signOut} />
  }

  if (profile.role === "nutri") {
    if (!profile.onboarding_done) {
      return <NutriOnboarding profile={profile} onDone={setProfile} />
    }
    return <NutriDashboard profile={profile} onSignOut={signOut} />
  }

  if (profile.role === "aluno") {
    if (!profile.onboarding_done) {
      return <AlunoOnboarding profile={profile} onDone={setProfile} />
    }
    return <AlunoApp profile={profile} onSignOut={signOut} onProfileUpdate={setProfile} />
  }

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, color: C.text, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Perfil com role inválido</div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>
        Role "{profile.role}" não reconhecido. Contate o suporte.
      </div>
      <button
        onClick={signOut}
        style={{ background: C.red, border: "none", borderRadius: 12, padding: "10px 24px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}
      >
        Sair
      </button>
    </div>
  )
}
