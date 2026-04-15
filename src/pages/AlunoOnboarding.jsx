import { useState, useCallback } from "react"
import * as DB from "../lib/supabase.js"
import { C } from "../constants.js"
import { Btn, Field, Chip, Tag } from "../ui.jsx"

export default function AlunoOnboarding({ profile, onDone }) {
  const [name,       setName]      = useState("");
  const [goal,       setGoal]      = useState("");
  const [sex,        setSex]       = useState("");
  const [birthDate,  setBirthDate] = useState("");
  const [allergies,  setAllergies] = useState([]);
  const [allergyInput, setAllergyInput] = useState("");
  const [obs,        setObs]       = useState("");
  const [error,      setError]     = useState("");
  const [saving,     setSaving]    = useState(false);

  const GOALS = [
    { v:"emagrecimento", l:"🔥 Emagrecer" },
    { v:"ganho_massa",   l:"💪 Ganhar massa" },
    { v:"manutencao",    l:"⚖️ Manutenção" },
    { v:"condicionamento",l:"🏃 Condicionamento" },
    { v:"saude",         l:"💚 Saúde geral" },
    { v:"controle",      l:"🩺 Controle médico" },
  ];

  const addAllergy = () => {
    const a = allergyInput.trim();
    if (a && !allergies.includes(a)) setAllergies(p=>[...p, a]);
    setAllergyInput("");
  };

  const save = async () => {
    if (!name.trim()) { setError("Digite seu nome."); return; }
    if (!goal)        { setError("Selecione seu objetivo."); return; }
    setSaving(true);
    try {
      await DB.completeOnboarding(profile.id, {
        name:       name.trim(),
        goal,
        sex,
        birth_date: birthDate || null,
        allergies:  allergies.length ? allergies : null,
        obs:        obs.trim() || null,
      });
      const updated = await DB.getProfile(profile.id);
      onDone(updated);
    } catch(e) {
      setError(e.message || "Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,maxWidth:480,margin:"0 auto",padding:"52px 24px 80px"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:52,marginBottom:10}}>🥗</div>
        <div style={{fontFamily:"'Lora',serif",fontSize:26,fontWeight:700,marginBottom:4}}>Olá! Vamos começar</div>
        <div style={{fontSize:14,color:C.muted}}>Preencha seus dados para personalizar seu plano</div>
      </div>
      <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:24}}>
        <Field label="Seu nome" icon="👤" value={name} onChange={setName} placeholder="Como prefere ser chamado(a)"/>

        {/* Goal */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>🎯 Objetivo</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {GOALS.map(g=>(
              <button key={g.v} onClick={()=>setGoal(g.v)}
                style={{background:goal===g.v?`${C.accent}22`:"transparent",border:`1.5px solid ${goal===g.v?C.accent:C.border}`,borderRadius:12,padding:"10px 12px",color:goal===g.v?C.accent:C.sub,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
                {g.l}
              </button>
            ))}
          </div>
        </div>

        {/* Sex */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>⚧ Sexo biológico</div>
          <div style={{display:"flex",gap:10}}>
            {[["F","Feminino"],["M","Masculino"]].map(([v,l])=>(
              <Chip key={v} active={sex===v} onClick={()=>setSex(v)} color={C.purple}>{l}</Chip>
            ))}
          </div>
        </div>

        {/* Birth date */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>🎂 Data de nascimento</div>
          <input type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)}
            style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"13px 16px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
        </div>

        {/* Allergies */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>🚫 Alergias / Restrições</div>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <input value={allergyInput} onChange={e=>setAllergyInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&addAllergy()}
              placeholder="Ex: Lactose, glúten…"
              style={{flex:1,background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
            <button onClick={addAllergy}
              style={{background:C.accent,border:"none",borderRadius:12,padding:"10px 16px",color:C.bg,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>+</button>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {allergies.map(a=>(
              <Tag key={a} label={a} onRemove={()=>setAllergies(p=>p.filter(x=>x!==a))} color={C.red}/>
            ))}
          </div>
        </div>

        {/* Observations */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>📝 Observações para a nutricionista</div>
          <textarea value={obs} onChange={e=>setObs(e.target.value)} rows={3}
            placeholder="Rotina, histórico, algo que a nutri deva saber…"
            style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"13px 16px",color:C.text,fontSize:15,resize:"none",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
        </div>

        {error&&<div style={{background:`${C.red}15`,border:`1.5px solid ${C.red}44`,borderRadius:12,padding:"10px 14px",fontSize:14,color:C.red,marginBottom:16}}>{error}</div>}
        <Btn onClick={save} color={C.accent} full loading={saving}>Começar meu plano →</Btn>
      </div>
    </div>
  );
}
