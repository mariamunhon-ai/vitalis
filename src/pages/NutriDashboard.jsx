import { useState, useEffect, useCallback } from "react"
import * as DB from "../lib/supabase.js"
import { C, DAYS, DAYS_FULL, MEAL_EMOJIS, MEAL_NAMES, TIMES_LIST, HUMOR_OPTS, uid, todayKey, todayDow, getLast7Days } from "../constants.js"
import { Btn, Field, Chip, Tag, Spinner, MiniChart } from "../ui.jsx"

export default function NutriDashboard({ profile, onSignOut }) {
  const [alunos, setAlunos]       = useState([]);
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState("");
  const [view, setView]           = useState("alunos"); // alunos | aluno_detail

  useEffect(() => {
    DB.getMyAlunos()
      .then(a => { setAlunos(a); setLoading(false); })
      .catch(e => { setLoadError(e.message || "Erro ao carregar alunos."); setLoading(false); });
  }, []);

  if (view==="aluno_detail"&&selectedAluno)
    return <AlunoDetail aluno={selectedAluno} nutriId={profile.id} onBack={()=>setView("alunos")}/>;

  return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,maxWidth:480,margin:"0 auto"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{padding:"52px 24px 24px",background:`linear-gradient(180deg,#0f1520 0%,${C.bg} 100%)`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:11,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Painel da Nutricionista</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:26,fontWeight:700}}>Olá, {(profile.name||"Nutricionista").split(" ")[0]}! 👩‍⚕️</div>
          </div>
          <button onClick={onSignOut} style={{background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"8px 14px",color:C.muted,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Sair</button>
        </div>

        {/* Invite code */}
        <div style={{background:`${C.purple}15`,border:`1.5px solid ${C.purple}33`,borderRadius:16,padding:16,marginTop:20}}>
          <div style={{fontSize:12,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>🔑 Seu código de convite</div>
          <div style={{fontFamily:"monospace",fontSize:24,fontWeight:900,color:C.text,letterSpacing:3,marginBottom:8}}>{profile.invite_code||"—"}</div>
          <button onClick={()=>{ navigator.clipboard?.writeText(profile.invite_code||""); }}
            style={{background:C.purple,border:"none",borderRadius:10,padding:"6px 14px",color:C.bg,fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
            Copiar código
          </button>
        </div>
      </div>

      <div style={{padding:"0 20px 120px"}}>
        <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:16}}>{alunos.length} aluno{alunos.length!==1?"s":""} vinculado{alunos.length!==1?"s":""}</div>

        {loading&&<Spinner text="Carregando alunos…"/>}
        {!loading&&loadError&&(
          <div style={{background:`${C.red}15`,border:`1.5px solid ${C.red}44`,borderRadius:14,padding:16,marginBottom:16,textAlign:"center"}}>
            <div style={{color:C.red,fontWeight:700,marginBottom:8}}>⚠️ {loadError}</div>
            <button onClick={()=>{ setLoadError(""); setLoading(true); DB.getMyAlunos().then(a=>{setAlunos(a);setLoading(false);}).catch(e=>{setLoadError(e.message);setLoading(false);}); }}
              style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"6px 16px",color:C.text,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
              Tentar novamente
            </button>
          </div>
        )}

        {!loading&&alunos.length===0&&(
          <div style={{textAlign:"center",padding:"48px 0",color:C.muted}}>
            <div style={{fontSize:52}}>👥</div>
            <div style={{marginTop:12,fontSize:14,lineHeight:1.7}}>Nenhum aluno ainda.<br/>Compartilhe seu código de convite<br/>para os alunos se vincularem.</div>
          </div>
        )}

        {alunos.map(a=>(
          <div key={a.id} onClick={()=>{ setSelectedAluno(a); setView("aluno_detail"); }}
            style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:"18px 20px",marginBottom:14,cursor:"pointer",display:"flex",alignItems:"center",gap:16,transition:"border-color 0.2s"}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:C.bg,flexShrink:0}}>
              {(a.name||"?")[0].toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:16}}>{a.name}</div>
              <div style={{fontSize:13,color:C.muted}}>{a.email}</div>
              {a.goal&&<div style={{fontSize:12,color:C.accent,marginTop:2}}>🎯 {a.goal}</div>}
            </div>
            <div style={{color:C.accent,fontSize:20}}>→</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ALUNO DETAIL (nutricionista view)
// ════════════════════════════════════════════════════════════════════════════
function AlunoDetail({ aluno, nutriId, onBack }) {
  const [tab, setTab]               = useState("hoje");
  const [weekDiet, setWeekDiet]     = useState({});
  const [meds, setMeds]             = useState([]);
  const [logs, setLogs]             = useState({});
  const [diary, setDiary]           = useState({});
  const [measurements, setMeasurements] = useState([]);
  const [notes, setNotes]           = useState([]);
  const [newNote, setNewNote]       = useState("");
  const [dietModal, setDietModal]   = useState(false);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);

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
    ]).then(([wd, ms, lg, di, me, no]) => {
      setWeekDiet(wd); setMeds(ms); setLogs(lg); setDiary(di); setMeasurements(me); setNotes(no);
      setLoading(false);
    });

    // realtime
    const sub = DB.subscribeToAluno(aluno.id, async () => {
      const [lg, di, me] = await Promise.all([DB.getLogsRange(aluno.id, getLast7Days()[0].key, tk), DB.getDiary(aluno.id), DB.getMeasurements(aluno.id)]);
      setLogs(lg); setDiary(di); setMeasurements(me);
    });
    return () => DB.sb.removeChannel(sub);
  }, [aluno.id]);

  const getLast7Days = () => Array.from({length:7}).map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()-i); const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; return {key:k,label:`${DAYS[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`}; }).reverse();

  const getDayPct = (key) => {
    const d = new Date(key+"T12:00:00"), dow = d.getDay();
    const meals = weekDiet[dow] || weekDiet["base"] || [];
    let total=0, done=0;
    meals.forEach(m=>m.foods?.forEach(f=>{ total++; if(logs[key]?.[m.id]?.[f.id]==="ok") done++; }));
    return total===0?0:Math.round((done/total)*100);
  };

  const saveWeekDiet = async (wd, ms) => {
    setSaving(true);
    try {
      try {
        await DB.saveWeekDiet(aluno.id, wd);
        await DB.saveMeds(aluno.id, ms);
      } catch(e) {
        alert("Erro ao salvar: " + (e.message||"tente novamente."));
        setSaving(false); return;
      }
      setWeekDiet(wd); setMeds(ms);
    } finally { setSaving(false); setDietModal(false); }
  };

  const postNote = async () => {
    if (!newNote.trim()) return;
    await DB.addNutriNote(nutriId, aluno.id, newNote, tk);
    setNotes(n=>[{nutri_id:nutriId,aluno_id:aluno.id,text:newNote,note_date:tk,created_at:new Date().toISOString()},...n]);
    setNewNote("");
  };

  const imc = () => {
    const last = measurements[measurements.length-1];
    if (!last?.peso||!last?.altura) return null;
    const h = parseFloat(last.altura)/100;
    return (parseFloat(last.peso)/(h*h)).toFixed(1);
  };
  const weightData = measurements.filter(m=>m.peso).map(m=>({v:parseFloat(m.peso),label:m.date}));
  const imcVal = imc();
  const days = getLast7Days();
  const avg  = Math.round(days.reduce((s,{key})=>s+getDayPct(key),0)/days.length);
  const todayMeals = weekDiet[dow] || weekDiet["base"] || [];
  const todayLog = logs[tk] || {};

  if (dietModal) return <WeekDietBuilder weekDiet={weekDiet} meds={meds} onSave={saveWeekDiet} onClose={()=>setDietModal(false)}/>;

  return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,maxWidth:480,margin:"0 auto"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{padding:"52px 24px 20px",background:`linear-gradient(180deg,#0f1520 0%,${C.bg} 100%)`}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:14,fontWeight:700,fontFamily:"inherit",marginBottom:12,padding:0}}>← Voltar</button>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:C.bg,flexShrink:0}}>
            {aluno.name[0].toUpperCase()}
          </div>
          <div>
            <div style={{fontFamily:"'Lora',serif",fontSize:22,fontWeight:700}}>{aluno.name}</div>
            <div style={{color:C.muted,fontSize:13}}>{aluno.email}{aluno.goal&&` · 🎯 ${aluno.goal}`}</div>
          </div>
        </div>
        {/* Quick stats */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:16}}>
          {[{icon:"📈",label:"Média 7d",val:`${avg}%`,color:C.accent},{icon:"⚖️",label:"IMC",val:imcVal||"—",color:C.purple},{icon:"📋",label:"Refeições",val:todayMeals.length,color:C.blue}].map(({icon,label,val,color})=>(
            <div key={label} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"12px 0",textAlign:"center"}}>
              <div style={{fontSize:16}}>{icon}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{label}</div>
              <div style={{fontSize:18,fontWeight:900,color,marginTop:2}}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:8,padding:"0 20px 16px",overflowX:"auto"}}>
        {[["hoje","📅","Hoje"],["semana","📊","Semana"],["medidas","📏","Medidas"],["diario","📓","Diário"],["cardapio","🥗","Cardápio"]].map(([k,ic,lb])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:tab===k?`${C.purple}18`:"transparent",border:`1.5px solid ${tab===k?C.purple:C.border}`,borderRadius:100,padding:"8px 16px",color:tab===k?C.purple:C.muted,fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"}}>
            {ic} {lb}
          </button>
        ))}
      </div>

      {loading&&<Spinner/>}

      {!loading&&(
        <div style={{padding:"0 20px 120px"}}>

          {/* HOJE */}
          {tab==="hoje"&&(
            <div>
              {/* nutri note */}
              <div style={{background:C.card,border:`1.5px solid ${C.purple}44`,borderRadius:20,padding:18,marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:700,color:C.purple,marginBottom:10}}>✍️ Deixar observação para o aluno</div>
                <textarea value={newNote} onChange={e=>setNewNote(e.target.value)} placeholder="Ex: Ótimo progresso esta semana! Tente aumentar a proteína no almoço…" rows={3}
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:14,color:C.text,fontSize:14,outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                <Btn onClick={postNote} color={C.purple} full sm style={{marginTop:10}}>Enviar observação</Btn>
              </div>

              {/* humor + water */}
              {todayLog.humor&&<div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:16,marginBottom:12,display:"flex",gap:12,alignItems:"center"}}>
                <span style={{fontSize:22}}>😊</span>
                <div><div style={{fontSize:12,color:C.muted}}>Humor de hoje</div><div style={{fontWeight:700}}>{HUMOR_OPTS.find(h=>h.v===todayLog.humor)?.l||"—"}</div></div>
                {todayLog.water!=null&&<><div style={{width:1,height:32,background:C.border,marginLeft:"auto"}}/>
                <div style={{textAlign:"right"}}><div style={{fontSize:12,color:C.muted}}>Água</div><div style={{fontWeight:700,color:C.blue}}>💧 {todayLog.water}/8</div></div></>}
              </div>}

              {/* today meals */}
              {todayMeals.map(meal=>{
                const ml=todayLog?.[meal.id]||{};
                const eaten=(meal.foods||[]).filter(f=>ml[f.id]==="ok").length;
                const skipped=(meal.foods||[]).filter(f=>ml[f.id]==="skip").length;
                const total=(meal.foods||[]).length;
                return (
                  <div key={meal.id} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:"16px 18px",marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                      <span style={{fontSize:28}}>{meal.emoji}</span>
                      <div style={{flex:1}}><div style={{fontWeight:800}}>{meal.name}</div><div style={{fontSize:13,color:C.muted}}>{meal.time}</div></div>
                      <div style={{display:"flex",gap:6}}>
                        {eaten>0&&<span style={{background:`${C.accent}20`,color:C.accent,borderRadius:8,padding:"2px 9px",fontSize:12,fontWeight:700}}>✓ {eaten}</span>}
                        {skipped>0&&<span style={{background:`${C.red}18`,color:C.red,borderRadius:8,padding:"2px 9px",fontSize:12,fontWeight:700}}>✕ {skipped}</span>}
                      </div>
                    </div>
                    {ml.photo&&<img src={ml.photo} alt="" style={{width:"100%",borderRadius:12,height:120,objectFit:"cover"}}/>}
                    {(meal.foods||[]).map(f=>{
                      const st=ml[f.id];
                      return <div key={f.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0",borderBottom:`1px solid ${C.border}`,opacity:st==="skip"?.4:1}}>
                        <span style={{textDecoration:st==="skip"?"line-through":"none"}}>{f.name}{f.qty&&<span style={{color:C.muted}}> — {f.qty}</span>}</span>
                        <span>{st==="ok"?"✅":st==="skip"?"❌":"⬜"}</span>
                      </div>;
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* SEMANA */}
          {tab==="semana"&&(
            <div>
              {days.map(({key,label})=>{
                const pct=getDayPct(key),humor=HUMOR_OPTS.find(h=>h.v===logs[key]?.humor),water=logs[key]?.water||0;
                return (
                  <div key={key} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:16,marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <span style={{fontWeight:700}}>{label}</span>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        {humor&&<span style={{fontSize:13,color:humor.c}}>{humor.l.split(" ")[1]}</span>}
                        {water>0&&<span style={{fontSize:12,color:C.blue}}>💧{water}</span>}
                        <span style={{fontWeight:800,color:pct>=80?C.accent:pct>=50?C.amber:C.red}}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{background:C.card2,borderRadius:100,height:8,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:pct>=80?`linear-gradient(90deg,${C.accent},${C.purple})`:pct>=50?C.amber:C.red,borderRadius:100}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MEDIDAS */}
          {tab==="medidas"&&(
            <div>
              {imcVal&&<div style={{background:`linear-gradient(135deg,${C.purple}20,${C.accent}15)`,border:`1.5px solid ${C.purple}44`,borderRadius:20,padding:22,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:11,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>IMC</div><div style={{fontSize:44,fontWeight:900,marginTop:4}}>{imcVal}</div></div>
                <div style={{textAlign:"right",fontSize:15,fontWeight:700,color:parseFloat(imcVal)<18.5?C.amber:parseFloat(imcVal)<25?C.accent:C.red}}>{parseFloat(imcVal)<18.5?"Abaixo do peso":parseFloat(imcVal)<25?"Normal ✓":parseFloat(imcVal)<30?"Sobrepeso":"Obesidade"}</div>
              </div>}
              {weightData.length>=2&&<div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
                <div style={{fontWeight:800,fontSize:15,marginBottom:8}}>⚖️ Evolução do Peso</div>
                <MiniChart data={weightData} color={C.accent} height={70}/>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginTop:4}}><span>{weightData[0].v} kg</span><span>{weightData[weightData.length-1].v} kg</span></div>
              </div>}
              {[...measurements].reverse().map((m,i)=>(
                <div key={i} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:16,marginBottom:12}}>
                  <div style={{fontSize:11,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>{m.date}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                    {[["⚖️","Peso",m.peso,"kg"],["📏","Altura",m.altura,"cm"],["〰️","Cintura",m.cintura,"cm"],["🫙","Quadril",m.quadril,"cm"],["💪","Braço",m.braco,"cm"],["🦵","Coxa",m.coxa,"cm"]].map(([ic,lb,val,u])=>
                      val?<div key={lb} style={{background:C.card2,borderRadius:12,padding:"10px 12px"}}><div style={{fontSize:16,marginBottom:2}}>{ic}</div><div style={{fontSize:10,color:C.muted}}>{lb}</div><div style={{fontSize:15,fontWeight:800}}>{val}<span style={{fontSize:10,color:C.muted}}> {u}</span></div></div>:null
                    )}
                  </div>
                </div>
              ))}
              {measurements.length===0&&<div style={{textAlign:"center",color:C.muted,padding:"40px 0"}}><div style={{fontSize:48}}>📏</div><div style={{marginTop:10,fontSize:14}}>Nenhuma avaliação ainda.</div></div>}
            </div>
          )}

          {/* DIÁRIO */}
          {tab==="diario"&&(
            <div>
              {/* nutri notes */}
              {notes.length>0&&<div style={{marginBottom:20}}>
                <div style={{fontSize:12,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Suas observações</div>
                {notes.map((n,i)=>(
                  <div key={i} style={{background:`${C.purple}10`,border:`1.5px solid ${C.purple}33`,borderRadius:14,padding:14,marginBottom:8,borderLeft:`3px solid ${C.purple}`}}>
                    <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{n.note_date}</div>
                    <div style={{fontSize:14,color:C.sub}}>{n.text}</div>
                  </div>
                ))}
              </div>}

              {Object.entries(diary).sort((a,b)=>b[0].localeCompare(a[0])).map(([date,dayData])=>(
                <div key={date}>
                  <div style={{fontSize:11,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,marginTop:16}}>{date}</div>
                  {dayData.progressPhoto&&<img src={dayData.progressPhoto} alt="" style={{width:"100%",borderRadius:14,marginBottom:8,maxHeight:200,objectFit:"cover"}}/>}
                  {(dayData.entries||[]).map((e,i)=>(
                    <div key={i} style={{background:C.card,borderRadius:14,padding:14,marginBottom:8,borderLeft:`3px solid ${C.purple}`}}>
                      <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{e.time}</div>
                      <div style={{fontSize:14,lineHeight:1.6,color:C.sub}}>{e.text}</div>
                    </div>
                  ))}
                </div>
              ))}
              {Object.keys(diary).length===0&&<div style={{textAlign:"center",color:C.muted,padding:"40px 0"}}><div style={{fontSize:48}}>📓</div><div style={{marginTop:10,fontSize:14}}>Nenhuma entrada no diário.</div></div>}
            </div>
          )}

          {/* CARDÁPIO */}
          {tab==="cardapio"&&(
            <div>
              <Btn onClick={()=>setDietModal(true)} color={C.purple} full loading={saving} style={{marginBottom:20}}>✏️ Editar Cardápio do Aluno</Btn>
              {DAYS.map((d,i)=>{
                const meals=weekDiet[i]||weekDiet["base"]||[];
                const isBase=!weekDiet[i]&&!!weekDiet["base"];
                return (
                  <div key={i} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:16,marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:meals.length?12:0}}>
                      <div style={{fontWeight:800,fontSize:15}}>{DAYS_FULL[i]}</div>
                      <Tag label={isBase?"padrão":"próprio"} color={isBase?C.muted:C.purple}/>
                    </div>
                    {meals.map(m=><div key={m.id} style={{fontSize:13,color:C.sub,display:"flex",gap:8,marginBottom:4}}><span>{m.emoji}</span><span>{m.name}</span><span style={{color:C.muted}}>{m.time}</span></div>)}
                    {meals.length===0&&<div style={{fontSize:13,color:C.muted}}>Sem plano</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WeekDietBuilder({weekDiet,meds,onSave,onClose}) {
  const [wd,setWd]=useState(()=>{ const c={}; Object.keys(weekDiet).forEach(k=>{ c[k]=(weekDiet[k]||[]).map(m=>({...m,foods:(m.foods||[]).map(f=>({...f}))})); }); return c; });
  const [localMeds,setLocalMeds]=useState(meds||[]);
  const [selectedDay,setSelectedDay]=useState("base");
  const [editMeal,setEditMeal]=useState(null);
  const [tab,setTab]=useState("diet");
  const [newMed,setNewMed]=useState({name:"",dose:"",times:[]});
  const currentMeals=wd[selectedDay]||[];
  const setDayMeals=meals=>setWd(w=>({...w,[selectedDay]:meals}));
  const saveMeal=m=>{ const meals=currentMeals; if(m.id)setDayMeals(meals.map(x=>x.id===m.id?m:x)); else setDayMeals([...meals,{...m,id:uid()}]); setEditMeal(null); };
  const copyFrom=src=>{ if(!wd[src]?.length)return; setDayMeals((wd[src]||[]).map(m=>({...m,id:uid(),foods:(m.foods||[]).map(f=>({...f,id:uid()}))}))); };
  const addMed=()=>{ if(!newMed.name.trim())return; setLocalMeds(m=>[...m,{...newMed,id:uid()}]); setNewMed({name:"",dose:"",times:[]}); };
  if(editMeal!==null)return <MealEditor meal={editMeal==="new"?null:editMeal} onSave={saveMeal} onClose={()=>setEditMeal(null)}/>;
  return (
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:950,overflowY:"auto",fontFamily:"'Outfit',sans-serif",color:C.text,maxWidth:480,margin:"0 auto"}}>
      <div style={{padding:"52px 24px 120px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontFamily:"'Lora',serif",fontSize:22,fontWeight:700}}>Editar Cardápios</div>
          <button onClick={onClose} style={{background:C.card2,border:"none",color:C.text,borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:18}}>×</button>
        </div>
        <div style={{display:"flex",gap:10,marginBottom:20}}>
          <Chip active={tab==="diet"} onClick={()=>setTab("diet")} color={C.accent}>🥗 Cardápio</Chip>
          <Chip active={tab==="meds"} onClick={()=>setTab("meds")} color={C.amber}>💊 Medicações</Chip>
        </div>
        {tab==="diet"&&<>
          <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4,marginBottom:16}}>
            <button onClick={()=>setSelectedDay("base")} style={{background:selectedDay==="base"?`${C.accent}22`:"transparent",border:`1.5px solid ${selectedDay==="base"?C.accent:C.border}`,borderRadius:12,padding:"8px 14px",color:selectedDay==="base"?C.accent:C.muted,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>📋 Padrão</button>
            {DAYS.map((d,i)=>{ const hasOwn=!!wd[i]; return <button key={i} onClick={()=>setSelectedDay(i)} style={{background:selectedDay===i?`${C.purple}22`:"transparent",border:`1.5px solid ${selectedDay===i?C.purple:hasOwn?C.purple+"55":C.border}`,borderRadius:12,padding:"8px 14px",color:selectedDay===i?C.purple:hasOwn?C.purple:C.muted,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",position:"relative"}}>{d}{hasOwn&&<span style={{position:"absolute",top:-4,right:-4,background:C.purple,borderRadius:"50%",width:8,height:8,display:"block"}}/>}</button>; })}
          </div>
          {selectedDay!=="base"&&<div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            {wd["base"]?.length>0&&<button onClick={()=>copyFrom("base")} style={{background:`${C.accent}15`,border:`1.5px solid ${C.accent}44`,borderRadius:10,padding:"7px 14px",color:C.accent,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Copiar do Padrão</button>}
            {DAYS.map((d,i)=>i!==selectedDay&&wd[i]?.length>0&&<button key={i} onClick={()=>copyFrom(i)} style={{background:`${C.purple}15`,border:`1.5px solid ${C.purple}44`,borderRadius:10,padding:"7px 14px",color:C.purple,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Copiar de {d}</button>)}
            {currentMeals.length>0&&<button onClick={()=>setWd(w=>{ const n={...w}; delete n[selectedDay]; return n; })} style={{background:`${C.red}12`,border:`1.5px solid ${C.red}33`,borderRadius:10,padding:"7px 14px",color:C.red,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Limpar</button>}
          </div>}
          <Btn onClick={()=>setEditMeal("new")} color={selectedDay==="base"?C.accent:C.purple} full style={{marginBottom:16}}>+ Adicionar Refeição</Btn>
          {currentMeals.map(m=>(
            <div key={m.id} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:"16px 18px",marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:30}}>{m.emoji}</span>
              <div style={{flex:1}}><div style={{fontWeight:800}}>{m.name}</div><div style={{fontSize:13,color:C.muted}}>{m.time} · {m.foods?.length||0} alimento(s)</div></div>
              <button onClick={()=>setEditMeal(m)} style={{background:`${C.accent}18`,border:`1px solid ${C.accent}44`,borderRadius:8,padding:"5px 12px",color:C.accent,cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>Editar</button>
              <button onClick={()=>setDayMeals(currentMeals.filter(x=>x.id!==m.id))} style={{background:`${C.red}12`,border:`1px solid ${C.red}33`,borderRadius:8,padding:"5px 10px",color:C.red,cursor:"pointer",fontSize:14}}>🗑</button>
            </div>
          ))}
          {currentMeals.length===0&&<div style={{textAlign:"center",color:C.muted,padding:"32px 0",fontSize:14}}>Nenhuma refeição para este dia.</div>}
        </>}
        {tab==="meds"&&<div>
          <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:20}}>
            <Field label="Nome" value={newMed.name} onChange={v=>setNewMed(m=>({...m,name:v}))} placeholder="Ex: Vitamina D…"/>
            <Field label="Dose" value={newMed.dose} onChange={v=>setNewMed(m=>({...m,dose:v}))} placeholder="Ex: 1 cápsula…"/>
            <div style={{marginBottom:16}}><div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Horários</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{TIMES_LIST.map(t=><Chip key={t} active={newMed.times.includes(t)} onClick={()=>setNewMed(m=>({...m,times:m.times.includes(t)?m.times.filter(x=>x!==t):[...m.times,t]}))} color={C.amber}>{t}</Chip>)}</div></div>
            <Btn onClick={addMed} color={C.amber} full>+ Adicionar</Btn>
          </div>
          {localMeds.map(m=>(
            <div key={m.id} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"14px 18px",marginBottom:10,display:"flex",gap:12,alignItems:"flex-start"}}>
              <span style={{fontSize:22}}>💊</span>
              <div style={{flex:1}}><div style={{fontWeight:800}}>{m.name}</div><div style={{fontSize:13,color:C.muted}}>{m.dose}</div>{m.times?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:6}}>{m.times.map(t=><Tag key={t} label={t} color={C.amber}/>)}</div>}</div>
              <button onClick={()=>setLocalMeds(ms=>ms.filter(x=>x.id!==m.id))} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:18,padding:0}}>🗑</button>
            </div>
          ))}
        </div>}
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(11,15,24,0.97)",backdropFilter:"blur(16px)",padding:"16px 24px 32px",borderTop:`1px solid ${C.border}`}}>
        <Btn onClick={()=>onSave(wd,localMeds)} color={C.accent} full>Salvar ✓</Btn>
      </div>
    </div>
  );
}

function MealEditor({meal,onSave,onClose}) {
  const [name,setName]=useState(meal?.name||"");
  const [time,setTime]=useState(meal?.time||"12:00");
  const [emoji,setEmoji]=useState(meal?.emoji||"🍽️");
  const [foods,setFoods]=useState(meal?.foods||[]);
  const [newFood,setNewFood]=useState({name:"",qty:"",subs:""});
  const addFood=()=>{ if(!newFood.name.trim())return; setFoods(f=>[...f,{name:newFood.name,qty:newFood.qty,subs:newFood.subs?newFood.subs.split(",").map(s=>s.trim()).filter(Boolean):[],id:uid()}]); setNewFood({name:"",qty:"",subs:""}); };
  return (
    <div style={{position:"fixed",inset:0,background:C.bg,zIndex:980,overflowY:"auto",fontFamily:"'Outfit',sans-serif",color:C.text,maxWidth:480,margin:"0 auto"}}>
      <div style={{padding:"52px 24px 120px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div style={{fontFamily:"'Lora',serif",fontSize:22,fontWeight:700}}>{meal?"Editar":"Nova"} Refeição</div>
          <button onClick={onClose} style={{background:C.card2,border:"none",color:C.text,borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:18}}>×</button>
        </div>
        <div style={{marginBottom:20}}><div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Ícone</div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{MEAL_EMOJIS.map(e=><button key={e} onClick={()=>setEmoji(e)} style={{fontSize:28,background:emoji===e?`${C.accent}25`:C.card2,border:`1.5px solid ${emoji===e?C.accent:C.border}`,borderRadius:12,width:52,height:52,cursor:"pointer"}}>{e}</button>)}</div></div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Nome</div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Almoço" style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"13px 16px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:10}}>{MEAL_NAMES.filter(n=>!name||n.toLowerCase().includes(name.toLowerCase())).slice(0,6).map(n=><Chip key={n} onClick={()=>setName(n)} color={C.accent}>{n}</Chip>)}</div>
        </div>
        <div style={{marginBottom:24}}><div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>🕐 Horário</div><input type="time" value={time} onChange={e=>setTime(e.target.value)} style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"13px 16px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/></div>
        <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>🥦 Alimentos</div>
        {foods.map((f,i)=>(
          <div key={f.id||i} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 16px",marginBottom:10,display:"flex",alignItems:"flex-start",gap:12}}>
            <div style={{flex:1}}><div style={{fontWeight:700}}>{f.name}{f.qty&&<span style={{color:C.muted,fontWeight:400,fontSize:13}}> — {f.qty}</span>}</div>{f.subs?.length>0&&<div style={{fontSize:12,color:C.blue,marginTop:3}}>↔️ {f.subs.join(", ")}</div>}</div>
            <button onClick={()=>setFoods(fs=>fs.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:18,padding:0}}>✕</button>
          </div>
        ))}
        <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:16}}>
          <div style={{display:"flex",gap:10,marginBottom:10}}>
            <input value={newFood.name} onChange={e=>setNewFood(f=>({...f,name:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addFood()} placeholder="Nome do alimento" style={{flex:2,background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
            <input value={newFood.qty} onChange={e=>setNewFood(f=>({...f,qty:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addFood()} placeholder="Qtd." style={{flex:1,background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
          </div>
          <input value={newFood.subs} onChange={e=>setNewFood(f=>({...f,subs:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addFood()} placeholder="Substitutos separados por vírgula (opcional)" style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:10}}/>
          <Btn onClick={addFood} color={C.accent} full sm>+ Adicionar alimento</Btn>
        </div>
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(11,15,24,0.97)",backdropFilter:"blur(16px)",padding:"16px 24px 32px",borderTop:`1px solid ${C.border}`}}>
        <Btn onClick={()=>{ if(!name.trim())return; onSave({...(meal||{}),name,time,emoji,foods}); }} color={C.accent} full>Salvar Refeição ✓</Btn>
      </div>
    </div>
  );
}
