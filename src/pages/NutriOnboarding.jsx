import { useState, useCallback } from "react"
import * as DB from "../lib/supabase.js"
import { C } from "../constants.js"
import { Btn, Field } from "../ui.jsx"

export default function NutriOnboarding({ profile, onDone }) {
  const [name, setName]   = useState("");
  const [obs,  setObs]    = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteCode = profile.invite_code || "—";

  const save = async () => {
    if (!name.trim()) { setError("Digite seu nome completo."); return; }
    setSaving(true);
    try {
      await DB.completeOnboarding(profile.id, { name: name.trim(), obs: obs.trim() });
      const updated = await DB.getProfile(profile.id);
      onDone(updated);
    } catch(e) {
      setError(e.message || "Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,maxWidth:480,margin:"0 auto",padding:"52px 24px 48px"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:52,marginBottom:12}}>👩‍⚕️</div>
        <div style={{fontFamily:"'Lora',serif",fontSize:26,fontWeight:700,marginBottom:6}}>Bem-vinda ao Vitalis!</div>
        <div style={{fontSize:14,color:C.muted}}>Complete seu perfil para começar</div>
      </div>

      {/* Item 7.2: show invite code prominently */}
      <div style={{background:`${C.purple}18`,border:`2px solid ${C.purple}55`,borderRadius:20,padding:20,marginBottom:28,textAlign:"center"}}>
        <div style={{fontSize:12,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>🔑 Seu código de convite</div>
        <div style={{fontFamily:"monospace",fontSize:28,fontWeight:900,color:C.text,letterSpacing:4,marginBottom:12}}>{inviteCode}</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:14,lineHeight:1.5}}>Compartilhe este código com seus alunos para que eles se cadastrem vinculados a você.</div>
        <button onClick={copyCode}
          style={{background:copied?C.accent:C.purple,border:"none",borderRadius:12,padding:"10px 24px",color:C.bg,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",transition:"background 0.2s"}}>
          {copied?"✓ Copiado!":"Copiar código"}
        </button>
      </div>

      {/* Profile fields */}
      <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:24}}>
        <Field label="Seu nome completo" icon="👤" value={name} onChange={setName} placeholder="Ex: Dra. Ana Lima"/>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>📝 Observações (opcional)</div>
          <textarea value={obs} onChange={e=>setObs(e.target.value)} rows={3}
            placeholder="Especialidade, clínica, informações para os alunos…"
            style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"13px 16px",color:C.text,fontSize:15,resize:"none",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
        </div>
        {error&&<div style={{background:`${C.red}15`,border:`1.5px solid ${C.red}44`,borderRadius:12,padding:"10px 14px",fontSize:14,color:C.red,marginBottom:16}}>{error}</div>}
        <Btn onClick={save} color={C.purple} full loading={saving}>Entrar no painel →</Btn>
      </div>
    </div>
  );
}
