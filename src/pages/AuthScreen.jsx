import { useState, useCallback } from "react"
import * as DB from "../lib/supabase.js"
import { C } from "../constants.js"
import { Btn, Field, Chip } from "../ui.jsx"

export default function AuthScreen({ onAuth }) {
  const [mode, setMode]       = useState("login"); // login | signup
  const [role, setRole]       = useState("aluno");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [nutriCode, setNutriCode] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  // Item 5.3+5.4: no name field; validate code only for aluno signup
  const submit = async () => {
    setError("");
    if (!email.trim())     { setError("Digite seu e-mail."); return; }
    if (!password)         { setError("Digite sua senha."); return; }
    if (mode === "signup" && password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres."); return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await DB.signIn({ email, password });
      } else {
        // Item 5.3: no name in signUp call
        await DB.signUp({ email, password, role, nutriCode });
      }
    } catch (e) {
      setError(e.message || "Erro desconhecido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,maxWidth:480,margin:"0 auto",display:"flex",flexDirection:"column",justifyContent:"center",padding:"40px 24px"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap" rel="stylesheet"/>

      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{fontSize:64,marginBottom:12}}>🥗</div>
        <div style={{fontFamily:"'Lora',serif",fontSize:32,fontWeight:700,lineHeight:1.2}}>Vitalis</div>
        <div style={{color:C.muted,marginTop:6,fontSize:14}}>Nutrição personalizada, do cardápio ao resultado.</div>
      </div>

      <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:24,padding:28}}>
        {/* Mode toggle */}
        <div style={{display:"flex",background:C.card2,borderRadius:14,padding:4,marginBottom:24}}>
          {[["login","Entrar"],["signup","Cadastrar"]].map(([m,l])=>(
            <button key={m} onClick={()=>setMode(m)} style={{flex:1,background:mode===m?C.accent:"transparent",border:"none",borderRadius:11,padding:"10px 0",color:mode===m?C.bg:C.muted,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>{l}</button>
          ))}
        </div>

        {mode==="signup"&&(
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Você é</div>
            <div style={{display:"flex",gap:10}}>
              <Chip active={role==="aluno"} onClick={()=>setRole("aluno")} color={C.accent}>🏃 Aluno(a)</Chip>
              <Chip active={role==="nutricionista"} onClick={()=>setRole("nutricionista")} color={C.purple}>👩‍⚕️ Nutricionista</Chip>
            </div>
          </div>
        )}

        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>📧 E-mail</div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="seu@email.com" autoComplete="email"
            style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"13px 16px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
        </div>
        <div style={{marginBottom:16,position:"relative"}}>
          <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>🔒 Senha</div>
          <div style={{position:"relative"}}>
            <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&submit()}
              placeholder="Mínimo 6 caracteres"
              style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"13px 48px 13px 16px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
            <button onClick={()=>setShowPass(p=>!p)} type="button"
              style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>
              {showPass?"🙈":"👁️"}
            </button>
          </div>
        </div>

        {mode==="signup"&&role==="aluno"&&(
          <div style={{marginBottom:16}}>
          <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>🔑 Código de convite da nutricionista</div>
          <input value={nutriCode} onChange={e=>setNutriCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="Ex: ABCD1234" autoCapitalize="characters" autoCorrect="off" spellCheck={false}
            style={{width:"100%",background:C.card2,border:`1.5px solid ${C.purple}44`,borderRadius:14,padding:"13px 16px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit",letterSpacing:2,fontWeight:700}}/>
          <div style={{fontSize:11,color:C.muted,marginTop:5}}>Peça o código para sua nutricionista.</div>
        </div>
        )}

        {error&&<div style={{background:`${C.red}15`,border:`1.5px solid ${C.red}44`,borderRadius:12,padding:"10px 14px",fontSize:14,color:C.red,marginBottom:16}}>{error}</div>}

        <Btn onClick={submit} color={role==="nutricionista"?C.purple:C.accent} full loading={loading}>
          {mode==="login" ? "Entrar" : role==="nutricionista" ? "Criar conta" : "Criar conta"}
        </Btn>

        {mode==="signup"&&role==="nutricionista"&&(
          <div style={{background:`${C.purple}12`,border:`1.5px solid ${C.purple}33`,borderRadius:12,padding:12,marginTop:14,fontSize:13,color:C.sub,lineHeight:1.6}}>
            Após criar sua conta, você receberá um <strong style={{color:C.text}}>código de convite</strong> para compartilhar com seus alunos.
          </div>
        )}
      </div>
    </div>
  );
}
