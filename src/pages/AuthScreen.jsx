import { useState } from "react"
import * as DB from "../lib/supabase"
import { C } from "../constants"

export default function AuthScreen() {
  const [mode, setMode] = useState("login")
  const [role, setRole] = useState("nutri")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nutriCode, setNutriCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (mode === "login") {
        await DB.signIn({ email, password })
      } else {
        await DB.signUp({
          name,
          email,
          password,
          role,
          nutriCode
        })
      }

      window.location.reload()
    } catch (err) {
      setError(err.message || "Erro ao entrar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Vitalis</h1>
        <p style={styles.subtitle}>Entre para continuar</p>

        <div style={styles.tabs}>
          <button
            type="button"
            onClick={() => setMode("login")}
            style={{
              ...styles.tab,
              background: mode === "login" ? C.accent : "transparent",
              color: mode === "login" ? "#000" : C.text
            }}
          >
            Entrar
          </button>

          <button
            type="button"
            onClick={() => setMode("signup")}
            style={{
              ...styles.tab,
              background: mode === "signup" ? C.accent : "transparent",
              color: mode === "signup" ? "#000" : C.text
            }}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <label style={styles.label}>Nome</label>
              <input
                style={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
              />

              <label style={styles.label}>Tipo de conta</label>
              <select
                style={styles.input}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="nutri">Nutricionista</option>
                <option value="aluno">Aluno</option>
              </select>

              {role === "aluno" && (
                <>
                  <label style={styles.label}>Código da nutricionista</label>
                  <input
                    style={styles.input}
                    value={nutriCode}
                    onChange={(e) => setNutriCode(e.target.value)}
                    placeholder="Código de convite"
                  />
                </>
              )}
            </>
          )}

          <label style={styles.label}>E-mail</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seuemail@gmail.com"
            required
          />

          <label style={styles.label}>Senha</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading
              ? "Carregando..."
              : mode === "login"
              ? "Entrar"
              : "Criar conta"}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "rgb(11, 15, 24)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    fontFamily: "Outfit, sans-serif",
    color: "#fff"
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "rgb(20, 26, 38)",
    borderRadius: 20,
    padding: 28,
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)"
  },
  title: {
    textAlign: "center",
    fontSize: 34,
    marginBottom: 8
  },
  subtitle: {
    textAlign: "center",
    color: "#94a3b8",
    marginBottom: 24
  },
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
    background: "rgb(30, 38, 54)",
    padding: 5,
    borderRadius: 12
  },
  tab: {
    flex: 1,
    border: "none",
    borderRadius: 10,
    padding: 10,
    fontWeight: 800,
    cursor: "pointer"
  },
  label: {
    display: "block",
    marginTop: 12,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 700
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #334155",
    background: "rgb(15, 23, 42)",
    color: "#fff",
    outline: "none",
    boxSizing: "border-box"
  },
  error: {
    background: "rgba(239,68,68,0.15)",
    color: "#f87171",
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    marginTop: 14
  },
  button: {
    width: "100%",
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    border: "none",
    background: "#7CFF6B",
    color: "#000",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 15
  }
}
