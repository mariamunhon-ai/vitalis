// src/App.jsx — root router
// Decides which page to show based on session and profile state.
// All UI logic lives in src/pages/. All DB calls live in src/lib/supabase.js.
//
// Flow:
//   no session           → AuthScreen
//   session + no profile → error (sign out button)
//   admin                → AdminDashboard
//   nutricionista + !onboarding → NutriOnboarding
//   nutricionista        → NutriDashboard
//   aluno + !onboarding  → AlunoOnboarding
//   aluno                → AlunoApp
//   unknown role         → error (sign out button)

import { useState, useEffect } from "react"
import * as DB from "./lib/supabase.js"
import { C } from "./constants.js"
import { Spinner } from "./ui.jsx"

import AuthScreen      from "./pages/AuthScreen.jsx"
import AdminDashboard  from "./pages/AdminDashboard.jsx"
import NutriOnboarding from "./pages/NutriOnboarding.jsx"
import NutriDashboard  from "./pages/NutriDashboard.jsx"
import AlunoOnboarding from "./pages/AlunoOnboarding.jsx"
import AlunoApp        from "./pages/AlunoApp.jsx"

export default function App() {
  const [session, setSession]         = useState(undefined) // undefined = still loading
  const [profile, setProfile]         = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError]     = useState("")

  useEffect(() => {
    // Initial session check
    DB.getSession().then(async sess => {
      setSession(sess)
      if (sess?.user) {
        setProfileLoading(true)
        try {
          const p = await DB.getProfile(sess.user.id)
          if (p) {
            setProfile(p)
            DB.touchLastSeen(sess.user.id)
          } else {
            setProfileError("Perfil não encontrado para este usuário.")
          }
        } catch(e) {
          setProfileError(e.message || "Erro ao carregar perfil.")
        } finally {
          setProfileLoading(false)
        }
      }
    })

    // Listen for auth changes (login, logout, token refresh, session expiry)
    const { data: { subscription } } = DB.sb.auth.onAuthStateChange(async (event, sess) => {
      setSession(sess)

      if (event === "SIGNED_OUT" || (!sess && event === "TOKEN_REFRESHED")) {
        setProfile(null)
        return
      }
      if (sess?.user) {
        setProfileLoading(true)
        setProfileError("")
        try {
          const p = await DB.getProfile(sess.user.id)
          if (p) {
            setProfile(p)
            DB.touchLastSeen(sess.user.id)
          } else {
            setProfileError("Perfil não encontrado. Tente criar a conta novamente.")
          }
        } catch(e) {
          setProfileError(e.message || "Erro ao carregar perfil.")
        } finally {
          setProfileLoading(false)
        }
      } else {
        setProfile(null)
        setProfileError("")
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Initial app load ──────────────────────────────────────────────────────
  if (session === undefined) {
    return (
      <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:C.text}}>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap" rel="stylesheet"/>
        <div style={{fontSize:64,marginBottom:16}}>🥗</div>
        <Spinner text="Iniciando Vitalis…"/>
      </div>
    )
  }

  // ── No session → login/signup ─────────────────────────────────────────────
  if (!session) {
    return <AuthScreen onAuth={setProfile}/>
  }

  // ── Session exists, profile still loading ────────────────────────────────
  if (profileLoading) {
    return (
      <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40,color:C.text}}>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap" rel="stylesheet"/>
        <Spinner text="Carregando perfil…"/>
      </div>
    )
  }

  // ── Session exists but profile not found or error ─────────────────────────
  if (!profile) {
    return (
      <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40,color:C.text,textAlign:"center"}}>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap" rel="stylesheet"/>
        <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
        <div style={{fontWeight:700,fontSize:18,marginBottom:8,color:C.text}}>Perfil não encontrado</div>
        <div style={{fontSize:14,color:C.muted,marginBottom:24,maxWidth:320,lineHeight:1.6}}>
          {profileError || "Não foi possível carregar seu perfil. Saia e entre novamente."}
        </div>
        <button onClick={() => DB.signOut()}
          style={{background:C.red,border:"none",borderRadius:12,padding:"10px 24px",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
          Sair
        </button>
      </div>
    )
  }

  // ── Route by role ─────────────────────────────────────────────────────────
  const signOut = () => DB.signOut()

  if (profile.role === "admin") {
    return <AdminDashboard profile={profile} onSignOut={signOut}/>
  }

  if (profile.role === "nutricionista") {
    if (!profile.onboarding_done) return <NutriOnboarding profile={profile} onDone={setProfile}/>
    return <NutriDashboard profile={profile} onSignOut={signOut}/>
  }

  if (profile.role === "aluno") {
    if (!profile.onboarding_done) return <AlunoOnboarding profile={profile} onDone={setProfile}/>
    return <AlunoApp profile={profile} onSignOut={signOut} onProfileUpdate={setProfile}/>
  }

  // ── Unknown role ──────────────────────────────────────────────────────────
  return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40,color:C.text,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
      <div style={{fontWeight:700,fontSize:18,marginBottom:8}}>Perfil com role inválido</div>
      <div style={{fontSize:14,color:C.muted,marginBottom:24}}>Role "{profile.role}" não reconhecido. Contate o suporte.</div>
      <button onClick={signOut}
        style={{background:C.red,border:"none",borderRadius:12,padding:"10px 24px",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
        Sair
      </button>
    </div>
  )
}
