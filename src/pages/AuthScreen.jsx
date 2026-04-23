import { useState } from "react"
import * as DB from "../lib/supabase.js"
import { C } from "../constants.js"
import { Btn, Field, Chip } from "../ui.jsx"

export default function AuthScreen() {
  const [mode, setMode] = useState("login")
  const [role, setRole] = useState("aluno")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nutriCode, setNutriCode] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError("")

    if (!email.trim()) return setError("Digite seu e-mail.")
    if (!password) return setError("Digite sua senha.")

    if (mode === "signup") {
      if (!name.trim()) return setError("Digite seu nome.")
      if (password.length < 6) return setError("A senha precisa ter pelo menos 6 caracteres.")
      if (role === "aluno" && !nutriCode.trim()) {
        return setError("Informe o código da nutricionista.")
      }
    }

    setLoading(true)
    try {
      if (mode === "login") {
        await DB.signIn({ email, password })
      } else {
        await DB.signUp({ email, password, name, role, nutriCode })
      }
      window.location.reload()
    } catch (e) {
      setError(e.message || "Erro desconhecido.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", background: C.bg, minHeight: "100vh", color: C.text, maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 24px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap" rel="stylesheet" />

      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🥗</div>
        <div style={{ fontFamily: "'Lora',serif", fontSize: 32, fontWeight: 700 }}>Vitalis</div>
        <div style={{ color: C.muted, marginTop: 6, fontSize: 14 }}>Nutrição personalizada, do cardápio ao resultado.</div>
      </div>

      <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 24, padding: 28 }}>
        <div style={{ display: "flex", background: C.card2, borderRadius: 14, padding: 4, marginBottom: 24 }}>
          {[["login", "Entrar"], ["signup", "Cadastrar"]].map(([m, l]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                background: mode === m ? C.accent : "transparent",
                border: "none",
                borderRadius: 11,
                padding: "10px 0",
                color: mode === m ? C.bg : C.muted,
                fontWeight: 800,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "inherit"
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {mode === "signup" && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              Você é
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Chip active={role === "aluno"} onClick={() => setRole("aluno")} color={C.accent}>
                🏃 Aluno(a)
              </Chip>
              <Chip active={role === "nutri"} onClick={() => setRole("nutri")} color={C.purple}>
                👩‍⚕️ Nutricionista
              </Chip>
            </div>
          </div>
        )}

        {mode === "signup" && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              👤 Nome
            </div>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu nome completo"
              style={{ width: "100%", background: C.card2, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "13px 16px", color: C.text, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            📧 E-mail
          </div>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            style={{ width: "100%", background: C.card2, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "13px 16px", color: C.text, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            🔒 Senha
          </div>
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              style={{ width: "100%", background: C.card2, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "13px 48px 13px 16px", color: C.text, fontSize: 15, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16 }}
            >
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {mode === "signup" && role === "aluno" && (
          <Field
            label="Código de convite da nutricionista"
            icon="🔑"
            value={nutriCode}
            onChange={setNutriCode}
            placeholder="Ex: ABCD1234"
          />
        )}

        {error && (
          <div style={{ background: `${C.red}15`, border: `1.5px solid ${C.red}44`, borderRadius: 12, padding: "10px 14px", fontSize: 14, color: C.red, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <Btn onClick={submit} color={role === "nutri" ? C.purple : C.accent} full loading={loading}>
          {mode === "login" ? "Entrar" : "Criar conta"}
        </Btn>
      </div>
    </div>
  )
}
