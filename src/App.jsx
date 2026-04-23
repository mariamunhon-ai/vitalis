import { useEffect, useState } from "react"
import { sb } from "./lib/supabaseClient"
import * as DB from "./lib/db"

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(undefined)
  const [profileError, setProfileError] = useState("")
  const [loading, setLoading] = useState(true)

  // 🔥 pega sessão inicial
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = sb.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // 🔥 carrega perfil UMA VEZ por sessão
  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      return
    }

    loadProfile(session.user.id)

  }, [session])

  // 🔥 função limpa (sem loop)
  async function loadProfile(userId) {
    try {
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
    setProfile(null)
  }

  // 🔄 loading inicial
  if (loading) {
    return (
      <div style={styles.center}>
        <p>Carregando...</p>
      </div>
    )
  }

  // 🔐 não logado
  if (!session) {
    return (
      <div style={styles.center}>
        <h2>Você não está logado</h2>
      </div>
    )
  }

  // 🔄 carregando perfil
  if (profile === undefined) {
    return (
      <div style={styles.center}>
        <p>Carregando perfil...</p>
      </div>
    )
  }

  // ❌ erro
  if (profileError) {
    return (
      <div style={styles.center}>
        <h2>Erro</h2>
        <p>{profileError}</p>
        <button onClick={signOut}>Sair</button>
      </div>
    )
  }

  // 🧠 NUTRI
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

  // 🧠 ALUNO
  if (profile.role === "aluno") {
    return (
      <div style={styles.container}>
        <h1>Área do Aluno</h1>
        <p><b>Nome:</b> {profile.name}</p>
        <p><b>Email:</b> {profile.email}</p>

        <button onClick={signOut}>Sair</button>
      </div>
    )
  }

  return (
    <div style={styles.center}>
      <p>Perfil inválido</p>
      <button onClick={signOut}>Sair</button>
    </div>
  )
}

// 🎨 estilos simples
const styles = {
  center: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    background: "#0b0f18",
    color: "#fff"
  },
  container: {
    minHeight: "100vh",
    padding: 40,
    background: "#0b0f18",
    color: "#fff"
  }
}
