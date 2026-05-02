import { useState, useEffect, useCallback } from "react"
import * as DB from "../lib/supabase.js"
import { C, DAYS, DAYS_FULL, MEAL_EMOJIS, MEAL_NAMES, TIMES_LIST, HUMOR_OPTS, uid, todayKey, todayDow, getLast7Days } from "../constants.js"
import { Btn, Field, Chip, Tag, Spinner, MiniChart } from "../ui.jsx"

// ─── NutriDashboard ────────────────────────────────────────────────────────────
export default function NutriDashboard({ profile, onSignOut }) {
  const [alunos, setAlunos]               = useState([]);
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [loadError, setLoadError]         = useState("");
  const [view, setView]                   = useState("alunos"); // alunos | aluno_detail
  const [copied, setCopied]               = useState(false);
  const [search, setSearch]               = useState("");
  const [filter, setFilter]               = useState("todos");

  const load = useCallback(async () => {
    setLoading(true); setLoadError("");
    try { setAlunos(await DB.getMyAlunos()); }
    catch(e) { setLoadError(e.message || "Erro ao carregar alunos."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const copyCode = () => {
    navigator.clipboard?.writeText(profile.invite_code || "");
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (view === "aluno_detail" && selectedAluno)
    return <AlunoDetail aluno={selectedAluno} nutriId={profile.id} onBack={() => { setView("alunos"); setSelectedAluno(null); }}/>;

  return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,maxWidth:520,margin:"0 auto"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{padding:"52px 24px 24px",background:`linear-gradient(180deg,#0f1520 0%,${C.bg} 100%)`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:11,color:C.accent,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Nutricionista</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:22,fontWeight:700}}>{(profile.name||"Nutricionista").split(" ")[0]} 👩‍⚕️</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>{profile.email}</div>
          </div>
          <button onClick={onSignOut} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Sair</button>
        </div>

        {/* Invite code */}
        <div style={{background:`${C.purple}15`,border:`1.5px solid ${C.purple}44`,borderRadius:16,padding:"14px 16px",marginTop:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
          <div>
            <div style={{fontSize:10,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>🔑 Código de convite</div>
            <div style={{fontFamily:"monospace",fontSize:20,fontWeight:900,letterSpacing:3,color:C.text}}>{profile.invite_code||"—"}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>Compartilhe com seus alunos</div>
          </div>
          <button onClick={copyCode}
            style={{background:copied?C.accent:C.purple,border:"none",borderRadius:12,padding:"8px 16px",color:C.bg,fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0}}>
            {copied?"✓ Copiado!":"Copiar"}
          </button>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14}}>
          {[
            {label:"Alunos",val:alunos.length,color:C.accent,icon:"👥"},
            {label:"Plano",val:(profile.plan||"—").charAt(0).toUpperCase()+(profile.plan||"").slice(1),color:C.purple,icon:"📋"},
          ].map(({label,val,color,icon})=>(
            <div key={label} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"14px 0",textAlign:"center"}}>
              <div style={{fontSize:20}}>{icon}</div>
              <div style={{fontSize:20,fontWeight:900,color,marginTop:4}}>{val}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:1}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Aluno list */}
      <div style={{padding:"0 20px 80px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontWeight:800,fontSize:16}}>Seus pacientes</div>
          <button onClick={load} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:700}}>↺ Atualizar</button>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar paciente por nome…"
          style={{width:"100%",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"10px 14px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:10}}/>
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          {[["todos","Todos"],["alta","Alta adesão ✓"],["baixa","Baixa adesão ⚠"]].map(([k,lb])=>(
            <button key={k} onClick={()=>setFilter(k)}
              style={{background:filter===k?`${C.accent}20`:"transparent",border:`1.5px solid ${filter===k?C.accent:C.border}`,borderRadius:100,padding:"5px 12px",color:filter===k?C.accent:C.muted,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
              {lb}
            </button>
          ))}
        </div>

        {loadError&&(
          <div style={{background:`${C.red}15`,border:`1.5px solid ${C.red}44`,borderRadius:14,padding:16,marginBottom:16,textAlign:"center"}}>
            <div style={{color:C.red,fontWeight:700,marginBottom:8}}>⚠️ {loadError}</div>
            <button onClick={load} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"6px 16px",color:C.text,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>Tentar novamente</button>
          </div>
        )}

        {loading&&<Spinner text="Carregando pacientes…"/>}

        {!loading&&!loadError&&alunos.length===0&&(
          <div style={{textAlign:"center",padding:"60px 20px"}}>
            <div style={{fontSize:52,marginBottom:12}}>👥</div>
            <div style={{fontWeight:800,fontSize:17,marginBottom:8}}>Nenhum paciente ainda</div>
            <div style={{fontSize:14,color:C.muted,lineHeight:1.7,marginBottom:16}}>Compartilhe seu código de convite para que alunos se cadastrem vinculados a você.</div>
            <div style={{background:C.card,borderRadius:14,padding:14,display:"inline-block"}}>
              <div style={{fontFamily:"monospace",fontSize:22,fontWeight:900,letterSpacing:3,color:C.purple}}>{profile.invite_code}</div>
            </div>
          </div>
        )}

        {!loading&&alunos
          .filter(a => {
            if (search && !a.name?.toLowerCase().includes(search.toLowerCase()) && !a.email?.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
          })
          .map(a => {
          const initial = (a.name||a.email||"?")[0].toUpperCase();
          return (
            <div key={a.id} onClick={() => { setSelectedAluno(a); setView("aluno_detail"); }}
              style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:"16px 18px",marginBottom:12,cursor:"pointer",transition:"border-color 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:46,height:46,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:C.bg,flexShrink:0}}>{initial}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:800,fontSize:15}}>{a.name||"—"}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:1}}>{a.email}</div>
                </div>
                <div style={{color:C.accent,fontSize:16}}>›</div>
              </div>
              <div style={{marginTop:10,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                {a.goal&&<span style={{background:`${C.accent}15`,border:`1px solid ${C.accent}33`,borderRadius:100,padding:"3px 10px",fontSize:11,color:C.accent,fontWeight:600}}>🎯 {a.goal}</span>}
                {a.allergies?.length>0&&<span style={{background:`${C.red}15`,border:`1px solid ${C.red}33`,borderRadius:100,padding:"3px 10px",fontSize:11,color:C.red,fontWeight:600}}>⚠️ {a.allergies.join(", ")}</span>}
                {a.last_seen&&<span style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:100,padding:"3px 10px",fontSize:10,color:C.muted,fontWeight:600,marginLeft:"auto"}}>
                  visto {new Date(a.last_seen).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})}
                </span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AlunoDetail — full patient view modeled after WebDiet ─────────────────────
function AlunoDetail({ aluno, nutriId, onBack }) {
  const MENU = [
    ["acompanhamento","📈","Acompanhamento"],
    ["anamnese","📋","Anamnese"],
    ["avaliacao","📏","Avaliação Física"],
    ["consultas","🗓️","Consultas"],
    ["cardapio","🥗","Planejamento"],
    ["suplementos","💊","Suplementos"],
    ["metas","🎯","Metas"],
    ["orientacoes","📝","Orientações"],
    ["fotos","📸","Fotos"],
    ["diario","📓","Diário"],
    ["questionarios","📊","Questionários"],
    ["chat","💬","Chat"],
  ];

  const [tab, setTab]                   = useState("acompanhamento");
  const [menuOpen, setMenuOpen]         = useState(false);
  const [weekDiet, setWeekDiet]         = useState({});
  const [meds, setMeds]                 = useState([]);
  const [logs, setLogs]                 = useState({});
  const [diary, setDiary]               = useState({});
  const [measurements, setMeasurements] = useState([]);
  const [notes, setNotes]               = useState([]);
  const [newNote, setNewNote]           = useState("");
  const [consultas, setConsultas]       = useState([]);
  const [novaConsulta, setNovaConsulta] = useState({ data:"", peso:"", obs:"" });
  const [metas, setMetas]               = useState([]);
  const [novaMeta, setNovaMeta]         = useState({ texto:"", prazo:"" });
  const [orientacoes, setOrientacoes]   = useState("");
  const [editOrient, setEditOrient]     = useState(false);
  const [orientText, setOrientText]     = useState("");
  const [suplementos, setSuplementos]   = useState([]);
  const [novoSupl, setNovoSupl]         = useState({ nome:"", dose:"", horario:"" });
  const [dietModal, setDietModal]       = useState(false);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput]       = useState("");
  const [chatSending, setChatSending]   = useState(false);
  const [questionnaires, setQuestionnaires] = useState([]);
  const [templateModal, setTemplateModal]   = useState(false);
  const [templateName, setTemplateName]     = useState("");
  const [templates, setTemplates]           = useState([]);
  const [photoCmp, setPhotoCmp]             = useState(null); // {left, right} dates for comparison
  const [newConsulta, setNewConsulta]       = useState({data:"",peso:"",obs:"",proxima:""});
  const [addingConsulta, setAddingConsulta] = useState(false);
  const [nutriMeta, setNutriMeta]           = useState("");
  const [nutriMetaPrazo, setNutriMetaPrazo] = useState("");

  const tk  = todayKey();
  const dow = todayDow();

  useEffect(() => {
    Promise.all([
      DB.getWeekDiet(aluno.id),
      DB.getMeds(aluno.id),
      DB.getLogsRange(aluno.id, getLast7Days()[0].key, tk),
      DB.getDiary(aluno.id),
      DB.getMeasurements(aluno.id),
      DB.getNutriNotes(nutriId, aluno.id),
      DB.getConsultas(aluno.id),
      DB.getMessages(nutriId, aluno.id),
      DB.getQuestionnaires(aluno.id),
      DB.getTemplates(nutriId),
    ]).then(([wd, ms, lg, di, me, no, co, msgs, quests, tmpls]) => {
      setWeekDiet(wd); setMeds(ms); setLogs(lg); setDiary(di);
      setMeasurements(me); setNotes(no); setConsultas(co||[]);
      setChatMessages(msgs.map(m=>({
        isNutri: m.sender_id===nutriId,
        text: m.text,
        time: new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
        id: m.id,
      })));
      setQuestionnaires(quests||[]);
      setTemplates(tmpls||[]);
      setLoading(false);
    }).catch(() => setLoading(false));

    const sub = DB.subscribeToAluno(aluno.id, async () => {
      const [lg, di, me] = await Promise.all([
        DB.getLogsRange(aluno.id, getLast7Days()[0].key, tk),
        DB.getDiary(aluno.id),
        DB.getMeasurements(aluno.id),
      ]);
      setLogs(lg); setDiary(di); setMeasurements(me);
    });
    const chatSub = DB.subscribeToMessages(nutriId, aluno.id, async () => {
      const msgs = await DB.getMessages(nutriId, aluno.id);
      setChatMessages(msgs.map(m=>({
        isNutri: m.sender_id===nutriId,
        text: m.text,
        time: new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
        id: m.id,
      })));
    });
    return () => { DB.sb.removeChannel(sub); DB.sb.removeChannel(chatSub); };
  }, [aluno.id]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const days7 = getLast7Days();
  const getDayPct = (key) => {
    const d = new Date(key+"T12:00:00"), d_dow = d.getDay();
    const meals = weekDiet[d_dow] || weekDiet["base"] || [];
    let total=0, done=0;
    meals.forEach(m=>m.foods?.forEach(f=>{ total++; if(logs[key]?.[m.id]?.[f.id]==="ok") done++; }));
    return total===0?0:Math.round((done/total)*100);
  };
  const avg7 = Math.round(days7.reduce((s,{key})=>s+getDayPct(key),0)/days7.length);
  const todayMeals = weekDiet[dow] || weekDiet["base"] || [];
  const todayLog   = logs[tk] || {};
  const lastMeasure = measurements[measurements.length-1] || {};
  const imcVal = (() => {
    if (!lastMeasure.peso||!lastMeasure.altura) return null;
    const h=parseFloat(lastMeasure.altura)/100;
    return (parseFloat(lastMeasure.peso)/(h*h)).toFixed(1);
  })();
  const weightData = measurements.filter(m=>m.peso).map(m=>({v:parseFloat(m.peso),label:m.date}));
  const pcgData    = measurements.filter(m=>m.perc_gordura).map(m=>({v:parseFloat(m.perc_gordura),label:m.date}));

  // ── Save diet ─────────────────────────────────────────────────────────────────
  const saveWeekDiet = async (wd, ms) => {
    setSaving(true);
    try {
      await DB.saveWeekDiet(aluno.id, wd);
      await DB.saveMeds(aluno.id, ms);
      setWeekDiet(wd); setMeds(ms);
    } catch(e) {
      alert("Erro ao salvar: " + (e.message||"tente novamente."));
    } finally { setSaving(false); setDietModal(false); }
  };

  const postNote = async () => {
    if (!newNote.trim()) return;
    await DB.addNutriNote(nutriId, aluno.id, newNote, tk);
    setNotes(n=>[{nutri_id:nutriId,aluno_id:aluno.id,text:newNote,note_date:tk,created_at:new Date().toISOString()},...n]);
    setNewNote("");
  };

  const saveConsulta = async () => {
    if (!newConsulta.data) return;
    setAddingConsulta(true);
    try {
      await DB.addConsulta(nutriId, aluno.id, newConsulta);
      setConsultas(cs=>[{...newConsulta,id:Date.now(),created_at:new Date().toISOString()},...cs]);
      setNewConsulta({data:"",peso:"",obs:"",proxima:""});
    } catch(e) { alert("Erro: "+e.message); }
    finally { setAddingConsulta(false); }
  };

  const sendChat = async (text) => {
    if (!text.trim()) return;
    const msg = {isNutri:true,text:text.trim(),time:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),id:Date.now()};
    setChatMessages(ms=>[...ms,msg]);
    setChatInput("");
    try { await DB.sendMessage(nutriId, aluno.id, nutriId, text.trim()); }
    catch(e) { console.error("send:",e); }
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) return;
    try {
      await DB.saveTemplate(nutriId, templateName, "", weekDiet, meds);
      const tmpls = await DB.getTemplates(nutriId);
      setTemplates(tmpls);
      setTemplateModal(false); setTemplateName("");
    } catch(e) { alert("Erro: "+e.message); }
  };

  const applyTemplate = async (tmpl) => {
    if (!window.confirm(`Aplicar template "${tmpl.name}" para ${aluno.name}? Isso substituirá o cardápio atual.`)) return;
    setSaving(true);
    try {
      await DB.saveWeekDiet(aluno.id, tmpl.data);
      await DB.saveMeds(aluno.id, tmpl.meds||[]);
      setWeekDiet(tmpl.data); setMeds(tmpl.meds||[]);
    } catch(e) { alert("Erro: "+e.message); }
    finally { setSaving(false); }
  };

  const addNutriMeta = async () => {
    if (!nutriMeta.trim()) return;
    try {
      const m = await DB.addMeta(aluno.id, nutriMeta, nutriMetaPrazo, nutriId);
      setNutriMeta(""); setNutriMetaPrazo("");
    } catch(e) { alert("Erro: "+e.message); }
  };

  const photoEntries = Object.entries(diary).filter(([,d])=>d.progressPhoto).sort(([a],[b])=>a.localeCompare(b));

  const addConsulta = () => {
    if (!novaConsulta.data) return;
    const c = { id:uid(), ...novaConsulta, created_at:new Date().toISOString() };
    setConsultas(cs=>[c,...cs]); setNovaConsulta({ data:"",peso:"",obs:"" });
  };

  const addMeta = () => {
    if (!novaMeta.texto.trim()) return;
    setMetas(ms=>[...ms,{id:uid(),...novaMeta,done:false}]); setNovaMeta({texto:"",prazo:""});
  };

  const addSupl = () => {
    if (!novoSupl.nome.trim()) return;
    setSuplementos(ss=>[...ss,{id:uid(),...novoSupl}]); setNovoSupl({nome:"",dose:"",horario:""});
  };

  if (dietModal) return <WeekDietBuilder weekDiet={weekDiet} meds={meds} onSave={saveWeekDiet} onClose={()=>setDietModal(false)}/>;

  if (templateModal) return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,maxWidth:520,margin:"0 auto",padding:"52px 24px"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap" rel="stylesheet"/>
      <button onClick={()=>setTemplateModal(false)} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"inherit",marginBottom:20,padding:0}}>← Cancelar</button>
      <div style={{fontFamily:"'Lora',serif",fontSize:22,fontWeight:700,marginBottom:6}}>💾 Salvar como template</div>
      <div style={{fontSize:13,color:C.muted,marginBottom:24}}>O cardápio atual será salvo e poderá ser aplicado rapidamente a outros alunos.</div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Nome do template</div>
        <input value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder="Ex: Emagrecimento Fase 1, Ganho de Massa…"
          style={{width:"100%",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"13px 16px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
      </div>
      <Btn onClick={saveTemplate} color={C.accent} full>Salvar template ✓</Btn>
    </div>
  );

  const activeMenu = MENU.find(([k])=>k===tab);

  return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,maxWidth:520,margin:"0 auto"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{padding:"48px 20px 16px",background:`linear-gradient(180deg,#0f1520 0%,${C.bg} 100%)`}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"inherit",marginBottom:10,padding:0}}>← Pacientes</button>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:C.bg,flexShrink:0}}>
            {(aluno.name||aluno.email||"?")[0].toUpperCase()}
          </div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Lora',serif",fontSize:20,fontWeight:700}}>{aluno.name||"—"}</div>
            <div style={{color:C.muted,fontSize:12}}>{aluno.email}{aluno.goal&&` · 🎯 ${aluno.goal}`}</div>
          </div>
        </div>

        {/* Quick KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {[
            {icon:"📈",label:"Adesão 7d",val:`${avg7}%`,color:C.accent},
            {icon:"⚖️",label:"IMC",val:imcVal||"—",color:C.purple},
            {icon:"🥗",label:"Refeições",val:todayMeals.length,color:C.blue},
            {icon:"💧",label:"Água",val:todayLog.water?`${todayLog.water/1000}L`:"—",color:"#60a5fa"},
          ].map(({icon,label,val,color})=>(
            <div key={label} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"10px 0",textAlign:"center"}}>
              <div style={{fontSize:14}}>{icon}</div>
              <div style={{fontSize:15,fontWeight:900,color,marginTop:2}}>{val}</div>
              <div style={{fontSize:9,color:C.muted,marginTop:1}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar-style menu button */}
      <div style={{padding:"0 20px 12px",display:"flex",alignItems:"center",gap:10}}>
        <button onClick={()=>setMenuOpen(m=>!m)}
          style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"8px 16px",color:C.text,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8}}>
          {activeMenu?.[1]} {activeMenu?.[2]} <span style={{color:C.muted}}>▾</span>
        </button>
      </div>

      {/* Dropdown menu */}
      {menuOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:500}} onClick={()=>setMenuOpen(false)}>
          <div style={{position:"absolute",top:180,left:20,right:20,background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,overflow:"hidden",maxHeight:400,overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.6)"}}
            onClick={e=>e.stopPropagation()}>
            {MENU.map(([k,ic,lb])=>(
              <button key={k} onClick={()=>{ setTab(k); setMenuOpen(false); }}
                style={{width:"100%",background:tab===k?`${C.purple}22`:"transparent",border:"none",borderBottom:`1px solid ${C.border}`,padding:"14px 20px",color:tab===k?C.purple:C.text,fontWeight:tab===k?800:600,fontSize:14,cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:18}}>{ic}</span> {lb}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading&&<Spinner text="Carregando dados do paciente…"/>}

      {!loading&&(
        <div style={{padding:"0 20px 120px"}}>

          {/* ── ACOMPANHAMENTO ──────────────────────────────────────────────── */}
          {tab==="acompanhamento"&&(
            <div>
              {/* Adesão 7 dias */}
              <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:14}}>📈 Adesão alimentar (7 dias)</div>
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  {days7.map(({key,label})=>{
                    const pct=getDayPct(key);
                    const color=pct>=80?C.accent:pct>=50?"#fbbf24":C.red;
                    return(
                      <div key={key} style={{flex:1,textAlign:"center"}}>
                        <div style={{background:C.card2,borderRadius:8,height:60,display:"flex",alignItems:"flex-end",justifyContent:"center",overflow:"hidden",marginBottom:4}}>
                          <div style={{width:"100%",height:`${Math.max(4,pct)}%`,background:color,borderRadius:"6px 6px 0 0",transition:"height 0.4s"}}/>
                        </div>
                        <div style={{fontSize:9,color:C.muted}}>{label.split(" ")[0]}</div>
                        <div style={{fontSize:10,fontWeight:800,color}}>{pct}%</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",paddingTop:10,borderTop:`1px solid ${C.border}`}}>
                  <span style={{fontSize:12,color:C.muted}}>Média da semana</span>
                  <span style={{fontSize:14,fontWeight:900,color:avg7>=70?C.accent:"#fbbf24"}}>{avg7}%</span>
                </div>
              </div>

              {/* Hoje */}
              <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:12}}>📅 Cardápio de hoje</div>
                {todayMeals.length===0
                  ?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>Nenhum cardápio configurado para hoje</div>
                  :todayMeals.map(m=>{
                    const done=m.foods?.filter(f=>todayLog[m.id]?.[f.id]==="ok").length||0;
                    const total=m.foods?.length||0;
                    const pct=total?Math.round((done/total)*100):0;
                    return(
                      <div key={m.id} style={{borderBottom:`1px solid ${C.border}`,paddingBottom:10,marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                          <span style={{fontWeight:700,fontSize:14}}>{m.emoji||"🍽️"} {m.name}</span>
                          <span style={{fontSize:12,color:pct===100?C.accent:C.muted,fontWeight:700}}>{done}/{total}</span>
                        </div>
                        <div style={{background:C.card2,borderRadius:100,height:4}}>
                          <div style={{height:"100%",width:`${pct}%`,background:pct===100?C.accent:"#fbbf24",borderRadius:100,transition:"width 0.4s"}}/>
                        </div>
                      </div>
                    );
                  })
                }
              </div>

              {/* Humor do dia */}
              {todayLog.humor&&(
                <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"14px 18px",marginBottom:14}}>
                  <span style={{fontSize:12,color:C.muted}}>😊 Humor hoje: </span>
                  <span style={{fontWeight:700,color:HUMOR_OPTS.find(h=>h.v===todayLog.humor)?.c||C.text}}>{HUMOR_OPTS.find(h=>h.v===todayLog.humor)?.l||todayLog.humor}</span>
                </div>
              )}

              {/* Notas da nutri */}
              <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:12}}>🔒 Notas privadas</div>
                <div style={{display:"flex",gap:8,marginBottom:14}}>
                  <input value={newNote} onChange={e=>setNewNote(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&postNote()}
                    placeholder="Anotação interna (visível só para você)…"
                    style={{flex:1,background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
                  <button onClick={postNote} style={{background:C.accent,border:"none",borderRadius:12,padding:"10px 16px",color:C.bg,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>+</button>
                </div>
                {notes.length===0?<div style={{color:C.muted,fontSize:13}}>Nenhuma nota ainda</div>:notes.slice(0,5).map((n,i)=>(
                  <div key={i} style={{borderBottom:`1px solid ${C.border}`,paddingBottom:8,marginBottom:8}}>
                    <div style={{fontSize:13}}>{n.text}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:2}}>{n.note_date}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ANAMNESE ────────────────────────────────────────────────────── */}
          {tab==="anamnese"&&(
            <div>
              <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
                <div style={{fontWeight:800,fontSize:16,marginBottom:18}}>📋 Dados clínicos</div>
                {[
                  ["👤","Nome",aluno.name],
                  ["📧","E-mail",aluno.email],
                  ["⚧","Sexo",aluno.sex==="F"?"Feminino":aluno.sex==="M"?"Masculino":"—"],
                  ["🎂","Nascimento",aluno.birth_date||"—"],
                  ["🎯","Objetivo",aluno.goal||"—"],
                  ["📝","Observações",aluno.obs||"—"],
                ].map(([ic,label,val])=>(
                  <div key={label} style={{borderBottom:`1px solid ${C.border}`,paddingBottom:12,marginBottom:12,display:"flex",gap:12}}>
                    <span style={{fontSize:18,width:28,flexShrink:0,textAlign:"center"}}>{ic}</span>
                    <div>
                      <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2}}>{label}</div>
                      <div style={{fontSize:14,color:val==="—"?C.muted:C.text}}>{val}</div>
                    </div>
                  </div>
                ))}
                {aluno.allergies?.length>0&&(
                  <div style={{borderBottom:`1px solid ${C.border}`,paddingBottom:12,marginBottom:12}}>
                    <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>⚠️ Alergias / Restrições</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {aluno.allergies.map(a=><Tag key={a} label={a} color={C.red}/>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── AVALIAÇÃO FÍSICA ────────────────────────────────────────────── */}
          {tab==="avaliacao"&&(
            <div>
              {/* Latest summary */}
              {lastMeasure.peso&&(
                <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
                  <div style={{fontWeight:800,fontSize:15,marginBottom:14}}>📊 Última avaliação — {lastMeasure.date||"—"}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                    {[
                      {label:"Peso",val:lastMeasure.peso?`${lastMeasure.peso}kg`:"—",color:C.accent},
                      {label:"IMC",val:imcVal||"—",color:C.purple},
                      {label:"% Gordura",val:lastMeasure.perc_gordura?`${lastMeasure.perc_gordura}%`:"—",color:C.amber},
                      {label:"Cintura",val:lastMeasure.cintura?`${lastMeasure.cintura}cm`:"—",color:C.blue},
                      {label:"Quadril",val:lastMeasure.quadril?`${lastMeasure.quadril}cm`:"—",color:C.blue},
                      {label:"Altura",val:lastMeasure.altura?`${lastMeasure.altura}cm`:"—",color:C.muted},
                    ].map(({label,val,color})=>(
                      <div key={label} style={{background:C.card2,borderRadius:12,padding:"12px 0",textAlign:"center"}}>
                        <div style={{fontSize:15,fontWeight:900,color}}>{val}</div>
                        <div style={{fontSize:10,color:C.muted,marginTop:2}}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Peso chart */}
              {weightData.length>1&&(
                <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
                  <div style={{fontWeight:800,fontSize:14,marginBottom:10}}>📉 Evolução do peso</div>
                  <MiniChart data={weightData} color={C.accent} height={70}/>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:11,color:C.muted}}>
                    <span>Inicial: {weightData[0]?.v}kg</span>
                    <span style={{color:weightData[weightData.length-1]?.v<weightData[0]?.v?C.accent:C.red}}>
                      Atual: {weightData[weightData.length-1]?.v}kg
                    </span>
                  </div>
                </div>
              )}

              {/* Gordura chart */}
              {pcgData.length>1&&(
                <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
                  <div style={{fontWeight:800,fontSize:14,marginBottom:10}}>🔥 Evolução % gordura</div>
                  <MiniChart data={pcgData} color={C.amber} height={60}/>
                </div>
              )}

              {/* Pollock Calculator */}
              <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:4}}>📐 Cálculo Pollock (dobras cutâneas)</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:14}}>Insira os valores em mm para calcular o % de gordura</div>
                <PollockCalc sex={aluno.sex} birthDate={aluno.birth_date}/>
              </div>

              {/* History */}
              <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:12}}>📅 Histórico de avaliações</div>
                {measurements.length===0
                  ?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>Nenhuma avaliação registrada</div>
                  :[...measurements].reverse().map((m,i)=>(
                    <div key={i} style={{borderBottom:`1px solid ${C.border}`,paddingBottom:10,marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                        <span style={{fontWeight:700,fontSize:13}}>{m.date||"—"}</span>
                        {m.perc_gordura&&<span style={{fontSize:12,color:C.amber,fontWeight:700}}>{m.perc_gordura}% gordura</span>}
                      </div>
                      <div style={{display:"flex",gap:12,fontSize:12,color:C.muted}}>
                        {m.peso&&<span>⚖️ {m.peso}kg</span>}
                        {m.cintura&&<span>📏 cin {m.cintura}cm</span>}
                        {m.quadril&&<span>🍑 quad {m.quadril}cm</span>}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* ── HISTÓRICO DE CONSULTAS ───────────────────────────────────────── */}
          {tab==="consultas"&&(
            <div>
              <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:14}}>🗓️ Nova consulta</div>
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Data</div>
                  <input type="date" value={novaConsulta.data} onChange={e=>setNovaConsulta(c=>({...c,data:e.target.value}))}
                    style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                </div>
                <Field label="Peso na consulta" value={novaConsulta.peso} onChange={v=>setNovaConsulta(c=>({...c,peso:v}))} placeholder="Ex: 68.5"/>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Observações</div>
                  <textarea value={novaConsulta.obs} onChange={e=>setNovaConsulta(c=>({...c,obs:e.target.value}))} rows={3}
                    placeholder="Relatório da consulta, evolução, ajustes…"
                    style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:13,resize:"none",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                </div>
                <Btn onClick={addConsulta} color={C.accent} full>+ Registrar consulta</Btn>
              </div>

              {consultas.length===0
                ?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"30px 0"}}>Nenhuma consulta registrada</div>
                :consultas.map((c,i)=>(
                  <div key={i} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"16px 18px",marginBottom:10}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <span style={{fontWeight:800,fontSize:14}}>🗓️ {c.data}</span>
                      {c.peso&&<span style={{fontSize:13,color:C.accent,fontWeight:700}}>⚖️ {c.peso}kg</span>}
                    </div>
                    {c.obs&&<div style={{fontSize:13,color:C.sub,lineHeight:1.5}}>{c.obs}</div>}
                  </div>
                ))
              }
            </div>
          )}

          {/* ── PLANEJAMENTO ALIMENTAR ───────────────────────────────────────── */}
          {tab==="cardapio"&&(
            <div>
              <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontWeight:800,fontSize:15}}>🥗 Planejamento alimentar</div>
                  <div style={{display:"flex",gap:8"}}>
                    <Btn onClick={()=>setDietModal(true)} color={C.accent} sm loading={saving}>
                      {Object.keys(weekDiet).length===0?"+ Criar":"✏️ Editar"}
                    </Btn>
                    {Object.keys(weekDiet).length>0&&(
                      <button onClick={()=>setTemplateModal(true)}
                        style={{background:`${C.purple}18`,border:`1.5px solid ${C.purple}44`,borderRadius:12,padding:"6px 12px",color:C.purple,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                        💾 Salvar como template
                      </button>
                    )}
                  </div>
                </div>
                {Object.keys(weekDiet).length===0
                  ?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"30px 0"}}>
                    <div style={{fontSize:40,marginBottom:10}}>🥗</div>
                    Nenhum cardápio criado ainda. Clique em "+ Criar" para montar o planejamento.
                  </div>
                  :DAYS_FULL.map((dayName, d)=>{
                    const meals = weekDiet[d] || weekDiet["base"] || [];
                    if (meals.length===0) return null;
                    return(
                      <div key={d} style={{marginBottom:14}}>
                        <div style={{fontWeight:800,fontSize:13,color:C.purple,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{dayName}</div>
                        {meals.map((m,i)=>(
                          <div key={i} style={{background:C.card2,borderRadius:12,padding:"10px 14px",marginBottom:6}}>
                            <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{m.emoji||"🍽️"} {m.name} {m.time&&<span style={{color:C.muted,fontSize:11}}>· {m.time}</span>}</div>
                            {m.foods?.map((f,j)=>(
                              <div key={j} style={{fontSize:12,color:C.sub,paddingLeft:8,borderLeft:`2px solid ${C.border}`,marginTop:3}}>
                                {f.name}{f.qtd&&<span style={{color:C.muted}}> — {f.qtd}</span>}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  })
                }
              </div>

              {/* Templates */}
              {templates.length>0&&(
                <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
                  <div style={{fontWeight:800,fontSize:14,marginBottom:12}}>💾 Templates salvos</div>
                  {templates.map(t=>(
                    <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:13}}>{t.name}</div>
                        {t.description&&<div style={{fontSize:11,color:C.muted,marginTop:1}}>{t.description}</div>}
                      </div>
                      <button onClick={()=>applyTemplate(t)}
                        style={{background:`${C.accent}18`,border:`1.5px solid ${C.accent}44`,borderRadius:10,padding:"6px 14px",color:C.accent,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                        Aplicar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Medications */}
              {meds.length>0&&(
                <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20}}>
                  <div style={{fontWeight:800,fontSize:15,marginBottom:12}}>💊 Medicações prescritas</div>
                  {meds.map((m,i)=>(
                    <div key={i} style={{borderBottom:`1px solid ${C.border}`,paddingBottom:10,marginBottom:10}}>
                      <div style={{fontWeight:700,fontSize:14}}>{m.name}</div>
                      {m.dose&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>Dose: {m.dose}</div>}
                      {m.times?.length>0&&<div style={{fontSize:12,color:C.muted,marginTop:1}}>Horários: {m.times.join(", ")}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SUPLEMENTOS ─────────────────────────────────────────────────── */}
          {tab==="suplementos"&&(
            <div>
              <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:14}}>💊 Adicionar suplemento</div>
                <Field label="Nome" value={novoSupl.nome} onChange={v=>setNovoSupl(s=>({...s,nome:v}))} placeholder="Ex: Whey Protein"/>
                <Field label="Dose" value={novoSupl.dose} onChange={v=>setNovoSupl(s=>({...s,dose:v}))} placeholder="Ex: 30g"/>
                <Field label="Horário" value={novoSupl.horario} onChange={v=>setNovoSupl(s=>({...s,horario:v}))} placeholder="Ex: Pós-treino"/>
                <Btn onClick={addSupl} color={C.amber} full>+ Adicionar</Btn>
              </div>
              {suplementos.length===0
                ?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"30px 0"}}>Nenhum suplemento prescrito</div>
                :suplementos.map((s,i)=>(
                  <div key={i} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"14px 18px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>💊 {s.nome}</div>
                      <div style={{fontSize:12,color:C.muted,marginTop:2}}>{s.dose&&`${s.dose}`}{s.horario&&` · ${s.horario}`}</div>
                    </div>
                    <button onClick={()=>setSuplementos(ss=>ss.filter((_,j)=>j!==i))}
                      style={{background:`${C.red}15`,border:"none",borderRadius:8,padding:"6px 10px",color:C.red,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>×</button>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── METAS ───────────────────────────────────────────────────────── */}
          {tab==="metas"&&(
            <div>
              <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:14}}>🎯 Prescrever meta para o aluno</div>
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Meta</div>
                  <input value={nutriMeta} onChange={e=>setNutriMeta(e.target.value)} placeholder="Ex: Alcançar 2L de água por dia"
                    style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Prazo</div>
                  <input type="date" value={nutriMetaPrazo} onChange={e=>setNutriMetaPrazo(e.target.value)}
                    style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                </div>
                <Btn onClick={addNutriMeta} color={C.purple} full>+ Prescrever meta</Btn>
              </div>
              <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:14}}>🎯 Adicionar meta livre</div>
                <Field label="Meta" value={novaMeta.texto} onChange={v=>setNovaMeta(m=>({...m,texto:v}))} placeholder="Ex: Perder 5kg em 3 meses"/>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>Prazo</div>
                  <input type="date" value={novaMeta.prazo} onChange={e=>setNovaMeta(m=>({...m,prazo:e.target.value}))}
                    style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                </div>
                <Btn onClick={addMeta} color={C.purple} full>+ Adicionar meta</Btn>
              </div>
              {metas.length===0
                ?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"30px 0"}}>Nenhuma meta definida ainda</div>
                :metas.map((m,i)=>(
                  <div key={i} style={{background:C.card,border:`1.5px solid ${m.done?C.accent:C.border}`,borderRadius:16,padding:"14px 18px",marginBottom:10,display:"flex",gap:12,alignItems:"flex-start"}}>
                    <button onClick={()=>setMetas(ms=>ms.map((mm,j)=>j===i?{...mm,done:!mm.done}:mm))}
                      style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${m.done?C.accent:C.border}`,background:m.done?C.accent:"transparent",cursor:"pointer",flexShrink:0,marginTop:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.bg,fontSize:12,fontWeight:900}}>
                      {m.done?"✓":""}
                    </button>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14,textDecoration:m.done?"line-through":undefined,color:m.done?C.muted:C.text}}>{m.texto}</div>
                      {m.prazo&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>📅 Prazo: {m.prazo}</div>}
                    </div>
                    <button onClick={()=>setMetas(ms=>ms.filter((_,j)=>j!==i))}
                      style={{background:`${C.red}15`,border:"none",borderRadius:8,padding:"6px 10px",color:C.red,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>×</button>
                  </div>
                ))
              }
            </div>
          )}

          {/* ── ORIENTAÇÕES ─────────────────────────────────────────────────── */}
          {tab==="orientacoes"&&(
            <div>
              <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div style={{fontWeight:800,fontSize:15}}>📝 Orientações nutricionais</div>
                  <button onClick={()=>{ setEditOrient(!editOrient); setOrientText(orientacoes); }}
                    style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>
                    {editOrient?"Cancelar":"✏️ Editar"}
                  </button>
                </div>
                {editOrient?(
                  <>
                    <textarea value={orientText} onChange={e=>setOrientText(e.target.value)} rows={8}
                      placeholder="Escreva orientações para o paciente…"
                      style={{width:"100%",background:C.card2,border:`1.5px solid ${C.accent}`,borderRadius:14,padding:"12px 14px",color:C.text,fontSize:13,resize:"vertical",outline:"none",boxSizing:"border-box",fontFamily:"inherit",lineHeight:1.6,marginBottom:12}}/>
                    <Btn onClick={()=>{ setOrientacoes(orientText); setEditOrient(false); }} color={C.accent} full>Salvar orientações</Btn>
                  </>
                ):(
                  orientacoes
                    ?<div style={{fontSize:13,color:C.sub,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{orientacoes}</div>
                    :<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"30px 0"}}>Nenhuma orientação registrada. Clique em "Editar" para adicionar.</div>
                )}
              </div>
            </div>
          )}

          {/* ── FOTOS ───────────────────────────────────────────────────────── */}
          {tab==="fotos"&&(
            <div>
              <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:14}}>📸 Evolução fotográfica</div>
                {Object.entries(diary)
                  .filter(([,d])=>d.progressPhoto)
                  .sort(([a],[b])=>b.localeCompare(a))
                  .slice(0,12)
                  .length===0
                  ?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"30px 0"}}>Nenhuma foto de progresso registrada pelo aluno ainda</div>
                  :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    {Object.entries(diary)
                      .filter(([,d])=>d.progressPhoto)
                      .sort(([a],[b])=>b.localeCompare(a))
                      .slice(0,12)
                      .map(([date,d])=>(
                        <div key={date} style={{background:C.card2,borderRadius:12,overflow:"hidden"}}>
                          <img src={d.progressPhoto} alt={date}
                            style={{width:"100%",height:140,objectFit:"cover",display:"block"}}/>
                          <div style={{padding:"8px 10px",fontSize:11,color:C.muted,fontWeight:600}}>{date}</div>
                        </div>
                      ))
                    }
                  </div>
                }
              </div>
            </div>
          )}

          {/* ── DIÁRIO ──────────────────────────────────────────────────────── */}
          {/* ── QUESTIONÁRIOS SEMANAIS ─────────────────────────────────────────── */}
          {tab==="questionarios"&&(
            <div>
              <div style={{fontWeight:800,fontSize:16,marginBottom:16}}>📊 Questionários semanais</div>
              {questionnaires.length===0
                ?<div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:24,textAlign:"center"}}>
                  <div style={{fontSize:36,marginBottom:10}}>📊</div>
                  <div style={{fontWeight:700,marginBottom:6}}>Nenhum questionário ainda</div>
                  <div style={{fontSize:13,color:C.muted}}>O aluno responde pelo app dele toda semana.</div>
                </div>
                :questionnaires.map((q,qi)=>{
                  const avg=Math.round(([q.energia,q.sono,q.fome,q.disposicao].filter(Boolean).reduce((s,v)=>s+v,0))/4);
                  const color=avg>=4?C.accent:avg>=3?C.amber:C.red;
                  return(
                    <div key={qi} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:20,marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                        <div style={{fontWeight:800,fontSize:14}}>Semana de {q.week_start}</div>
                        <div style={{background:`${color}20`,border:`1.5px solid ${color}44`,borderRadius:100,padding:"3px 12px",fontSize:13,color,fontWeight:800}}>Media: {avg}/5</div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:q.obs?12:0}}>
                        {[["Energia",q.energia,"⚡"],["Sono",q.sono,"😴"],["Fome",q.fome,"🍎"],["Disposicao",q.disposicao,"💪"],["Estresse",q.estresse,"😰"]].map(([lb,val,ic])=>(
                          <div key={lb} style={{background:C.card2,borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:16}}>{ic}</span>
                            <div>
                              <div style={{fontSize:10,color:C.muted}}>{lb}</div>
                              <div style={{display:"flex",gap:3,marginTop:2}}>
                                {[1,2,3,4,5].map(v=><div key={v} style={{width:12,height:12,borderRadius:3,background:v<=(val||0)?C.accent:C.card}}/>)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {q.obs&&<div style={{background:`${C.purple}10`,borderRadius:10,padding:"10px 12px",fontSize:13,color:C.sub,lineHeight:1.5}}><span style={{fontWeight:700,color:C.purple}}>Obs: </span>{q.obs}</div>}
                    </div>
                  );
                })
              }
            </div>
          )}

          {/* ── CHAT ────────────────────────────────────────────────────────────── */}
          {tab==="chat"&&(
            <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 300px)",minHeight:380}}>
              <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,paddingBottom:8}}>
                {chatMessages.length===0&&(
                  <div style={{textAlign:"center",color:C.muted,padding:"30px 0"}}>
                    <div style={{fontSize:36,marginBottom:8}}>💬</div>
                    <div>Inicie a conversa com {aluno.name}</div>
                  </div>
                )}
                {chatMessages.map((msg,mi)=>(
                  <div key={mi} style={{display:"flex",flexDirection:msg.from==="nutri"?"row-reverse":"row",gap:8,alignItems:"flex-end"}}>
                    {msg.from!=="nutri"&&<div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,fontWeight:900,color:C.bg}}>{(aluno.name||"?")[0]}</div>}
                    <div style={{background:msg.from==="nutri"?`${C.purple}22`:C.card2,border:`1px solid ${msg.from==="nutri"?C.purple+"44":C.border}`,borderRadius:msg.from==="nutri"?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"10px 14px",maxWidth:"78%"}}>
                      <div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{msg.text}</div>
                      <div style={{fontSize:10,color:C.muted,marginTop:4}}>{msg.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:10,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&sendChat(chatInput)}
                  placeholder={`Mensagem para ${aluno.name}...`}
                  style={{flex:1,background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:20,padding:"10px 16px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
                <button onClick={()=>sendChat(chatInput)}
                  style={{width:42,height:42,borderRadius:"50%",background:C.purple,border:"none",cursor:"pointer",fontSize:18,color:C.bg,flexShrink:0}}>
                  &#8593;
                </button>
              </div>
            </div>
          )}

          {/* ── COMPARATIVO FOTOS ─────────────────────────────────────────────── */}
          {tab==="fotos"&&photoEntries&&photoEntries.length>=2&&(
            <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
              <div style={{fontWeight:800,fontSize:15,marginBottom:14}}>Antes e depois</div>
              <div style={{display:"flex",gap:10,marginBottom:12}}>
                {[["Antes",photoCmp?.left||photoEntries[0]?.[0],"left"],["Depois",photoCmp?.right||photoEntries[photoEntries.length-1]?.[0],"right"]].map(([lb,sel,side])=>(
                  <div key={side} style={{flex:1}}>
                    <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",marginBottom:6}}>{lb}</div>
                    <select value={sel||""} onChange={e=>setPhotoCmp(p=>({...(p||{}), [side]:e.target.value}))}
                      style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"7px 10px",color:C.text,fontSize:12,outline:"none",fontFamily:"inherit"}}>
                      {photoEntries.map(([date])=><option key={date} value={date}>{date}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[photoCmp?.left||photoEntries[0]?.[0], photoCmp?.right||photoEntries[photoEntries.length-1]?.[0]].map((date,si)=>{
                  const entry = date?diary[date]:null;
                  return(
                    <div key={si} style={{background:C.card2,borderRadius:12,overflow:"hidden"}}>
                      {entry?.progressPhoto
                        ?<img src={entry.progressPhoto} alt={date} style={{width:"100%",height:180,objectFit:"cover",display:"block"}}/>
                        :<div style={{height:180,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:12}}>Sem foto</div>
                      }
                      <div style={{padding:"7px 10px",fontSize:11,color:C.muted,fontWeight:600,textAlign:"center"}}>{date}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab==="diario"&&(
            <div>
              <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:14}}>📓 Diário do paciente</div>
                {Object.keys(diary).length===0
                  ?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>Nenhum registro no diário</div>
                  :Object.entries(diary)
                    .sort(([a],[b])=>b.localeCompare(a))
                    .map(([date,{entries}])=>(
                      <div key={date} style={{borderBottom:`1px solid ${C.border}`,paddingBottom:12,marginBottom:12}}>
                        <div style={{fontWeight:700,fontSize:13,color:C.purple,marginBottom:6}}>{date}</div>
                        {entries?.map((e,i)=>(
                          <div key={i} style={{background:C.card2,borderRadius:10,padding:"8px 12px",marginBottom:6,fontSize:13}}>
                            <span style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",marginRight:6}}>[{e.tipo||"nota"}]</span>
                            {e.texto}
                          </div>
                        ))}
                      </div>
                    ))
                }
              </div>
            </div>
          )}

          {/* ── CHAT ──────────────────────────────────────────────────────── */}
          {tab==="chat"&&(
            <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 320px)"}}>
              <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,paddingBottom:12}}>
                {chatMessages.length===0&&(
                  <div style={{textAlign:"center",padding:"30px 0",color:C.muted}}>
                    <div style={{fontSize:36,marginBottom:8}}>💬</div>
                    <div style={{fontSize:13}}>Nenhuma mensagem ainda. Inicie a conversa!</div>
                  </div>
                )}
                {chatMessages.map((m,i)=>(
                  <div key={i} style={{display:"flex",flexDirection:m.isNutri?"row-reverse":"row",gap:8,alignItems:"flex-end"}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:m.isNutri?`linear-gradient(135deg,${C.purple},${C.accent})`:`linear-gradient(135deg,${C.blue},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>
                      {m.isNutri?"👩‍⚕️":"🧑"}
                    </div>
                    <div style={{background:m.isNutri?`${C.purple}22`:C.card2,border:`1px solid ${m.isNutri?C.purple+"44":C.border}`,borderRadius:m.isNutri?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"10px 14px",maxWidth:"78%"}}>
                      <div style={{fontSize:13,lineHeight:1.5}}>{m.text}</div>
                      <div style={{fontSize:10,color:C.muted,marginTop:3}}>{m.time}</div>
                    </div>
                  </div>
                ))}
                {chatSending&&<div style={{display:"flex",gap:4,padding:"8px 14px",background:C.card2,borderRadius:"18px 18px 18px 4px",width:"fit-content"}}>
                  {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.muted,animation:`bounce 1.2s ${i*0.2}s infinite`}}/>)}
                </div>}
              </div>
              <div style={{display:"flex",gap:10,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
                <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&chatInput.trim()&&sendChat(chatInput.trim())}
                  placeholder={`Mensagem para ${aluno.name?.split(" ")[0]}…`}
                  style={{flex:1,background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:20,padding:"10px 16px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
                <button onClick={()=>chatInput.trim()&&sendChat(chatInput.trim())}
                  style={{width:42,height:42,borderRadius:"50%",background:C.accent,border:"none",cursor:"pointer",fontSize:18,flexShrink:0}}>↑</button>
              </div>
              <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
            </div>
          )}

          {/* ── QUESTIONÁRIOS ───────────────────────────────────────────────── */}
          {tab==="questionarios"&&(
            <div>
              <div style={{fontWeight:800,fontSize:15,marginBottom:14}}>📊 Questionários semanais</div>
              {questionnaires.length===0
                ?<div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:24,textAlign:"center"}}>
                  <div style={{fontSize:40,marginBottom:10}}>📊</div>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>Nenhum questionário respondido</div>
                  <div style={{fontSize:13,color:C.muted}}>O paciente responde um questionário por semana sobre energia, sono, fome e disposição.</div>
                </div>
                :questionnaires.map((q,i)=>(
                  <div key={i} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:18,marginBottom:12}}>
                    <div style={{fontWeight:800,fontSize:14,marginBottom:12,color:C.purple}}>Semana de {q.week_start}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      {[
                        {lb:"⚡ Energia",val:q.energia},
                        {lb:"😴 Sono",val:q.sono},
                        {lb:"🍽️ Fome",val:q.fome},
                        {lb:"💪 Disposição",val:q.disposicao},
                      ].filter(x=>x.val).map(({lb,val})=>(
                        <div key={lb} style={{background:C.card2,borderRadius:12,padding:"10px 12px"}}>
                          <div style={{fontSize:12,color:C.muted,marginBottom:6}}>{lb}</div>
                          <div style={{display:"flex",gap:4}}>
                            {[1,2,3,4,5].map(n=>(
                              <div key={n} style={{width:18,height:18,borderRadius:"50%",background:n<=val?C.accent:C.card,border:`1.5px solid ${n<=val?C.accent:C.border}`}}/>
                            ))}
                          </div>
                          <div style={{fontSize:11,color:n=>n<=val?C.accent:C.muted,marginTop:4,fontWeight:700}}>{val}/5</div>
                        </div>
                      ))}
                    </div>
                    {q.obs&&<div style={{marginTop:10,fontSize:13,color:C.sub,background:C.card2,borderRadius:10,padding:"8px 12px"}}>{q.obs}</div>}
                  </div>
                ))
              }
            </div>
          )}

          {/* ── ANTES/DEPOIS ─────────────────────────────────────────────────── */}
          {tab==="antes_depois"&&(
            <div>
              <div style={{fontWeight:800,fontSize:15,marginBottom:14}}>📸 Comparativo antes/depois</div>
              {photoEntries.length<2
                ?<div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:24,textAlign:"center"}}>
                  <div style={{fontSize:40,marginBottom:10}}>📸</div>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>Fotos insuficientes</div>
                  <div style={{fontSize:13,color:C.muted}}>São necessárias pelo menos 2 fotos de progresso para o comparativo.</div>
                </div>
                :(()=>{
                  const first = photoEntries[0];
                  const last  = photoEntries[photoEntries.length-1];
                  return (
                    <div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                        <div style={{background:C.card2,borderRadius:16,overflow:"hidden"}}>
                          <div style={{padding:"8px 12px",fontSize:11,color:C.muted,fontWeight:700,borderBottom:`1px solid ${C.border}`}}>ANTES · {first[0]}</div>
                          <img src={first[1].progressPhoto} alt="antes" style={{width:"100%",height:200,objectFit:"cover",display:"block"}}/>
                        </div>
                        <div style={{background:C.card2,borderRadius:16,overflow:"hidden"}}>
                          <div style={{padding:"8px 12px",fontSize:11,color:C.accent,fontWeight:700,borderBottom:`1px solid ${C.border}`}}>DEPOIS · {last[0]}</div>
                          <img src={last[1].progressPhoto} alt="depois" style={{width:"100%",height:200,objectFit:"cover",display:"block"}}/>
                        </div>
                      </div>
                      <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:14}}>
                        <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>📅 Todas as fotos ({photoEntries.length})</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                          {photoEntries.map(([date,d])=>(
                            <div key={date} style={{borderRadius:10,overflow:"hidden",background:C.card2}}>
                              <img src={d.progressPhoto} alt={date} style={{width:"100%",height:80,objectFit:"cover",display:"block"}}/>
                              <div style={{padding:"4px 6px",fontSize:9,color:C.muted}}>{date}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()
              }
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ─── PollockCalc ──────────────────────────────────────────────────────────────
function PollockCalc({ sex, birthDate }) {
  const [protocolo, setProtocolo] = useState("pollock7");
  const [dc, setDc]               = useState({});
  const [result, setResult]       = useState(null);

  const age = birthDate ? Math.floor((new Date() - new Date(birthDate)) / 31557600000) : 30;
  const sexo = sex || "F";

  const FIELDS_7 = [
    ["triceps","Tríceps"],["subescapular","Subescapular"],["suprailiaca","Supra-ilíaca"],
    ["abdominal","Abdominal"],["coxa","Coxa"],["peitoral","Peitoral"],["axilar","Axilar medial"],
  ];
  const FIELDS_3M = [["peitoral","Peitoral"],["abdominal","Abdominal"],["coxa","Coxa"]];
  const FIELDS_3F = [["triceps","Tríceps"],["suprailiaca","Supra-ilíaca"],["coxa","Coxa"]];
  const fields = protocolo==="pollock7" ? FIELDS_7 : (sexo==="M" ? FIELDS_3M : FIELDS_3F);

  const calc = () => {
    const dcVals = {};
    fields.forEach(([k])=>{ dcVals[k]=parseFloat(dc[k])||0; });
    const fat = protocolo==="pollock7"
      ? DB.pollockFat7(sexo, age, dcVals)
      : DB.pollockFat3(sexo, age, dcVals);
    setResult(fat);
  };

  const classify = (fat) => {
    if (sexo==="F") {
      if (fat<14) return {lb:"Abaixo do essencial",c:"#60a5fa"};
      if (fat<21) return {lb:"Atleta",c:C.accent};
      if (fat<25) return {lb:"Boa forma",c:"#86efac"};
      if (fat<32) return {lb:"Aceitável",c:C.amber};
      return {lb:"Obesidade",c:C.red};
    } else {
      if (fat<6) return {lb:"Abaixo do essencial",c:"#60a5fa"};
      if (fat<14) return {lb:"Atleta",c:C.accent};
      if (fat<18) return {lb:"Boa forma",c:"#86efac"};
      if (fat<25) return {lb:"Aceitável",c:C.amber};
      return {lb:"Obesidade",c:C.red};
    }
  };

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <Chip active={protocolo==="pollock7"} onClick={()=>{setProtocolo("pollock7");setResult(null);}} color={C.purple}>7 dobras</Chip>
        <Chip active={protocolo==="pollock3"} onClick={()=>{setProtocolo("pollock3");setResult(null);}} color={C.purple}>3 dobras</Chip>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        {fields.map(([k,lb])=>(
          <div key={k}>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,marginBottom:4}}>{lb} (mm)</div>
            <input type="number" value={dc[k]||""} onChange={e=>setDc(d=>({...d,[k]:e.target.value}))} placeholder="0"
              style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"8px 12px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,color:C.muted,marginBottom:10}}>Sexo: {sexo==="F"?"Feminino":"Masculino"} · Idade calculada: {age} anos</div>
      <Btn onClick={calc} color={C.purple} full>Calcular % gordura</Btn>
      {result!==null&&!isNaN(result)&&(()=>{
        const cls = classify(result);
        return (
          <div style={{background:`${cls.c}15`,border:`2px solid ${cls.c}55`,borderRadius:14,padding:16,marginTop:14,textAlign:"center"}}>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>Resultado</div>
            <div style={{fontSize:40,fontWeight:900,color:cls.c}}>{result}%</div>
            <div style={{fontSize:14,fontWeight:700,color:cls.c,marginTop:4}}>{cls.lb}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>Protocolo {protocolo==="pollock7"?"Pollock 7":"Pollock 3"}</div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── WeekDietBuilder ──────────────────────────────────────────────────────────
function WeekDietBuilder({weekDiet,meds,onSave,onClose}) {
  const [tab,setTab]   = useState("diet");
  const [wd,setWd]     = useState(()=>JSON.parse(JSON.stringify(weekDiet)));
  const [ms,setMs]     = useState(()=>JSON.parse(JSON.stringify(meds)));
  const [dayTab,setDayTab] = useState("base");

  const addMeal = () => {
    const cur = wd[dayTab]||[];
    setWd({...wd,[dayTab]:[...cur,{id:uid(),name:"Nova refeição",emoji:"🍽️",time:"12:00",foods:[]}]});
  };
  const delMeal = (mId) => setWd({...wd,[dayTab]:(wd[dayTab]||[]).filter(m=>m.id!==mId)});
  const addFood = (mId) => setWd({...wd,[dayTab]:(wd[dayTab]||[]).map(m=>m.id===mId?{...m,foods:[...(m.foods||[]),{id:uid(),name:"",qtd:""}]}:m)});

  return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,maxWidth:520,margin:"0 auto"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap" rel="stylesheet"/>
      <div style={{padding:"52px 20px 20px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontFamily:"'Lora',serif",fontSize:20,fontWeight:700}}>🥗 Planejamento alimentar</div>
        <button onClick={onClose} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"6px 14px",color:C.text,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Cancelar</button>
      </div>
      <div style={{display:"flex",gap:10,padding:"14px 20px"}}>
        <Chip active={tab==="diet"} onClick={()=>setTab("diet")} color={C.accent}>🥗 Cardápio</Chip>
        <Chip active={tab==="meds"} onClick={()=>setTab("meds")} color={C.amber}>💊 Medicações</Chip>
      </div>
      {tab==="diet"&&<>
        {/* Day selector */}
        <div style={{display:"flex",gap:6,padding:"0 20px 12px",overflowX:"auto"}}>
          {[["base","Padrão"],...DAYS.map((d,i)=>[String(i),d])].map(([k,lb])=>(
            <button key={k} onClick={()=>setDayTab(k)}
              style={{background:dayTab===k?`${C.accent}20`:"transparent",border:`1.5px solid ${dayTab===k?C.accent:C.border}`,borderRadius:100,padding:"6px 14px",color:dayTab===k?C.accent:C.muted,fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"}}>{lb}</button>
          ))}
        </div>
        <div style={{padding:"0 20px 100px"}}>
          {(wd[dayTab]||[]).map(m=>(
            <MealEditor key={m.id} meal={m}
              onSave={updated=>setWd({...wd,[dayTab]:(wd[dayTab]||[]).map(x=>x.id===m.id?updated:x)})}
              onDelete={()=>delMeal(m.id)}
              onAddFood={()=>addFood(m.id)}/>
          ))}
          <button onClick={addMeal}
            style={{width:"100%",background:`${C.accent}12`,border:`1.5px dashed ${C.accent}44`,borderRadius:16,padding:14,color:C.accent,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginTop:8}}>
            + Adicionar refeição
          </button>
        </div>
      </>}
      {tab==="meds"&&<div style={{padding:"0 20px 80px"}}>
        {ms.map((med,i)=>(
          <div key={med.id||i} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:16,marginBottom:12}}>
            <div style={{display:"flex",gap:10,marginBottom:10}}>
              <input value={med.name} onChange={e=>setMs(ms.map((x,j)=>j===i?{...x,name:e.target.value}:x))} placeholder="Nome"
                style={{flex:2,background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
              <input value={med.dose||""} onChange={e=>setMs(ms.map((x,j)=>j===i?{...x,dose:e.target.value}:x))} placeholder="Dose"
                style={{flex:1,background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
              <button onClick={()=>setMs(ms.filter((_,j)=>j!==i))}
                style={{background:`${C.red}15`,border:"none",borderRadius:10,padding:"8px 12px",color:C.red,fontSize:16,cursor:"pointer",fontFamily:"inherit"}}>×</button>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {TIMES_LIST.map(t=>(
                <button key={t} onClick={()=>setMs(ms.map((x,j)=>j===i?{...x,times:x.times?.includes(t)?x.times.filter(tt=>tt!==t):[...(x.times||[]),t]}:x))}
                  style={{background:med.times?.includes(t)?`${C.amber}25`:"transparent",border:`1px solid ${med.times?.includes(t)?C.amber:C.border}`,borderRadius:8,padding:"4px 10px",color:med.times?.includes(t)?C.amber:C.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        ))}
        <button onClick={()=>setMs([...ms,{id:uid(),name:"",dose:"",times:[]}])}
          style={{width:"100%",background:`${C.amber}12`,border:`1.5px dashed ${C.amber}44`,borderRadius:16,padding:14,color:C.amber,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>
          + Adicionar medicação
        </button>
        <div style={{marginTop:20}}>
          <Btn onClick={()=>onSave(wd,ms)} color={C.accent} full>Salvar planejamento</Btn>
        </div>
      </div>}
      {tab==="diet"&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:520,margin:"0 auto",padding:"16px 20px",background:C.bg,borderTop:`1px solid ${C.border}`}}>
          <Btn onClick={()=>onSave(wd,ms)} color={C.accent} full>Salvar planejamento</Btn>
        </div>
      )}
    </div>
  );
}

// ─── MealEditor ───────────────────────────────────────────────────────────────
function MealEditor({meal,onSave,onDelete,onAddFood}) {
  const [open,setOpen] = useState(false);
  const update = (k,v) => onSave({...meal,[k]:v});
  const updateFood = (fId,k,v) => onSave({...meal,foods:meal.foods.map(f=>f.id===fId?{...f,[k]:v}:f)});
  const delFood = (fId) => onSave({...meal,foods:meal.foods.filter(f=>f.id!==fId)});
  return (
    <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,marginBottom:10,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <span style={{fontSize:20,cursor:"pointer"}} onClick={e=>{e.stopPropagation();const n=MEAL_EMOJIS[(MEAL_EMOJIS.indexOf(meal.emoji||"🍽️")+1)%MEAL_EMOJIS.length];update("emoji",n);}}>
          {meal.emoji||"🍽️"}
        </span>
        <input value={meal.name} onChange={e=>{e.stopPropagation();update("name",e.target.value);}} onClick={e=>e.stopPropagation()}
          style={{flex:1,background:"transparent",border:"none",color:C.text,fontSize:14,fontWeight:700,outline:"none",fontFamily:"inherit"}}/>
        <select value={meal.time||"12:00"} onChange={e=>update("time",e.target.value)} onClick={e=>e.stopPropagation()}
          style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:8,padding:"4px 8px",color:C.muted,fontSize:12,outline:"none",fontFamily:"inherit"}}>
          {TIMES_LIST.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={e=>{e.stopPropagation();onDelete();}}
          style={{background:`${C.red}15`,border:"none",borderRadius:8,padding:"5px 8px",color:C.red,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>✕</button>
        <span style={{color:C.muted,fontSize:12}}>{open?"▲":"▼"}</span>
      </div>
      {open&&<div style={{padding:"0 14px 14px"}}>
        {meal.foods?.map(f=>(
          <div key={f.id} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
            <input value={f.name} onChange={e=>updateFood(f.id,"name",e.target.value)} placeholder="Alimento"
              style={{flex:2,background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"8px 12px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
            <input value={f.qtd||""} onChange={e=>updateFood(f.id,"qtd",e.target.value)} placeholder="Qtd"
              style={{flex:1,background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"8px 10px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
            <button onClick={()=>delFood(f.id)}
              style={{background:`${C.red}15`,border:"none",borderRadius:8,padding:"8px 10px",color:C.red,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>×</button>
          </div>
        ))}
        <button onClick={onAddFood}
          style={{background:`${C.accent}12`,border:`1.5px dashed ${C.accent}44`,borderRadius:10,padding:"7px 14px",color:C.accent,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",width:"100%"}}>
          + Adicionar alimento
        </button>
      </div>}
    </div>
  );
}
