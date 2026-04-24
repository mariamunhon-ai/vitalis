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
  const [profile, setProfile] = useState(undefined)

  useEffect(() => {
    async function start() {
      const sess = await DB.getSession()
      setSession(sess || null)

      if (sess?.user) {
        try {
          const p = await DB.getProfile(sess.user.id)
          setProfile(p || null)
          if (p) DB.touchLastSeen(sess.user.id)
        } catch {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
    }

    start()

    const { data: { subscription } } = DB.sb.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess || null)

      if (sess?.user) {
        try {
          const p = await DB.getProfile(sess.user.id)
          setProfile(p || null)
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

  const signOut = () => DB.signOut()

  if (session === undefined || profile === undefined) {
    return (
      <div style={styles.center}>
        <Spinner text="Iniciando Vitalis…" />
      </div>
    )
  }

  if (!session) {
    return <AuthScreen />
  }

  if (!profile) {
    return (
      <div style={styles.center}>
        <Spinner text="Carregando perfil…" />
        <button onClick={signOut} style={styles.btn}>Sair e tentar novamente</button>
      </div>
    )
  }

  if (profile.role === "admin") {
    return <AdminDashboard profile={profile} onSignOut={signOut} />
  }

  if (profile.role === "nutri" || profile.role === "nutricionista") {
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
    <div style={styles.center}>
      <h2>Perfil inválido</h2>
      <p>Role: {profile.role}</p>
      <button onClick={signOut} style={styles.btn}>Sair</button>
    </div>
  )
}

const styles = {
  center: {
    fontFamily: "'Outfit', sans-serif",
    background: C.bg,
    minHeight: "100vh",
    color: C.text,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 40
  },
  btn: {
    marginTop: 24,
    background: "transparent",
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: "8px 20px",
    color: C.muted,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit"
  }
}
