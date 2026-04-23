import { useEffect, useState } from "react"
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
  const [profileError, setProfileError] = useState("")

  useEffect(() => {
    let mounted = true

    async function loadProfileFromSession(sess) {
      if (!mounted) return

      if (!sess?.user) {
        setProfile(null)
        setProfileError("")
        return
      }

      try {
        setProfileError("")

        const p = await DB.getProfile(sess.user.id)

        if (!mounted) return

        if (!p) {
          setProfile(null)
          setProfileError("Perfil não encontrado na tabela profiles.")
          return
        }

        setProfile(p)
        DB.touchLastSeen(sess.user.id)
      } catch (err) {
        if (!mounted) return
        console.error("Erro ao carregar perfil:", err)
        setProfile(null)
        setProfileError(err?.message || "Erro ao carregar perfil.")
      }
    }

    DB.getSession()
      .then(sess => {
        if (!mounted) return
        setSession(sess)
        loadProfileFromSession(sess)
      })
      .catch(err => {
        console.error("Erro ao buscar sessão:", err)
        if (!mounted) return
        setSession(null)
        setProfile(null)
        setProfileError("Erro ao buscar sessão.")
      })

    const {
      data: { subscription }
    } = DB.sb.auth.onAuthStateChange(async (_event, sess) => {
      if (!mounted) return
      setSession(sess)
      await loadProfileFromSession(sess)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await DB.signOut()
    setSession(null)
    setProfile(null)
    setProfileError("")
  }

  if (session === undefined) {
    return (
      <div
        style={{
          fontFamily: "'Outfit',sans-serif",
          background: C.bg,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: C.text
        }}
      >
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap"
          rel="stylesheet"
        />
        <div style={{ fontSize: 64, marginBottom: 16 }}>🥗</div>
        <Spinner text="Iniciando Vitalis…" />
      </div>
    )
  }

  if (!session) {
    return <AuthScreen />
  }

  if (profile === undefined) {
    return (
      <div
        style={{
          fontFamily: "'Outfit',sans-serif",
          background: C.bg,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          color: C.text
        }}
      >
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap"
          rel="stylesheet"
        />
        <Spinner text="Carregando perfil…" />
      </div>
    )
  }

  if (profile === null) {
    return (
      <div
        style={{
          fontFamily: "'Outfit',sans-serif",
          background: C.bg,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          color: C.text,
          textAlign: "center"
        }}
      >
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap"
          rel="stylesheet"
        />
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
          Não foi possível carregar o perfil
        </div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>
          {profileError || "O usuário está autenticado, mas o perfil não foi carregado."}
        </div>
        <button
          onClick={signOut}
          style={{
            marginTop: 8,
            background: "transparent",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "8px 20px",
            color: C.muted,
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "inherit"
          }}
        >
          Sair e tentar novamente
        </button>
      </div>
    )
  }

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
    <div
      style={{
        fontFamily: "'Outfit',sans-serif",
        background: C.bg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        color: C.text,
        textAlign: "center"
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
        Perfil com role inválido
      </div>
      <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>
        Role "{profile.role}" não reconhecido.
      </div>
      <button
        onClick={signOut}
        style={{
          background: C.red,
          border: "none",
          borderRadius: 12,
          padding: "10px 24px",
          color: "#fff",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          fontFamily: "inherit"
        }}
      >
        Sair
      </button>
    </div>
  )
}
