import { useEffect, useState } from "react"
import { sb } from "./lib/supabase"
import * as DB from "./lib/supabase"
import AuthScreen from "./pages/AuthScreen"

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(undefined)
  const [profileError, setProfileError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data } = await sb.auth.getSession()
      setSession(data.session || null)
      setLoading(false)
    }

    init()

    const { data: listener } = sb.auth.onAuthStateChange((_event, sess) => {
      setSession(sess || null)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      setProfileError("")
      return
    }

    loadProfile(session.user.id)
  }, [session])

  async function loadProfile(userId) {
    try {
      setProfile(undefined)
      setProfileError("")

      const p = await DB.getProfile(userId)

      if (!p) {
        setProfile(null)
        setProfileError("Perfil não encontrado na tabela profiles.")
        return
      }

      setProfile(p)
      DB.touchLastSeen(userId)
    } catch (err) {
      console.error("Erro ao carregar perfil:", err)
      setProfile(null)
      setProfileError(err?.message || "Erro ao carregar perfil.")
    }
  }

  async function signOut() {
    await sb.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  if (loading || session === undefined) {
    return (
      <div style={styles.center}>
        <p>Carregando...</p>
      </div>
    )
  }

  if (!session) {
    return <AuthScreen />
  }

  if (profile === undefined) {
    return (
      <div style={styles.center}>
        <p>Carregando perfil...</p>
      </div>
    )
  }

  if (profileError) {
    return (
      <div style={styles.center}>
        <h2>Erro</h2>
        <p>{profileError}</p>
        <button onClick={signOut}>Sair</button>
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={styles.center}>
        <h2>Perfil não carregado</h2>
        <button onClick={signOut}>Sair</button>
      </div>
    )
  }

  if (profile.role === "nutri") {
    return (
      <div style={styles.container}>
        <h1>Área do Nutricionista</h1>
        <p><b>Nome:</b> {profile.name}</p>
        <p><b>Email:</b> {profile.email}</p>
        <p><b>Role:</b> {profile.role}</p>
        <button onClick={signOut}>Sair</button>
      </div>
    )
  }

  if (profile.role === "aluno") {
    return (
      <div style={styles.container}>
        <h1>Área do Aluno</h1>
        <p><b>Nome:</b> {profile.name}</p>
        <p><b>Email:</b> {profile.email}</p>
        <p><b>Role:</b> {profile.role}</p>
        <button onClick={signOut}>Sair</button>
      </div>
    )
  }

  return (
    <div style={styles.center}>
      <p>Perfil inválido: {profile.role}</p>
      <button onClick={signOut}>Sair</button>
    </div>
  )
}

const styles = {
  center: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    background: "#0b0f18",
    color: "#fff",
    fontFamily: "Arial, sans-serif"
  },
  container: {
    minHeight: "100vh",
    padding: 40,
    background: "#0b0f18",
    color: "#fff",
    fontFamily: "Arial, sans-serif"
  }
}
