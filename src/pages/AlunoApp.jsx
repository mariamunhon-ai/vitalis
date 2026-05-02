import { useState, useEffect, useCallback } from "react"
import * as DB from "../lib/supabase.js"
import { C, MONTHS, DAYS, HUMOR_OPTS, todayKey, todayDow } from "../constants.js"
import { Btn, Spinner, MiniChart, WaterTracker } from "../ui.jsx"

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

export default function AlunoApp({ profile, onSignOut, onProfileUpdate }) {
  const [view, setView]         = useState("hoje");
  const [weekDiet, setWeekDiet] = useState({});
  const [meds, setMeds]         = useState([]);
  const [todayLog, setTodayLog] = useState({});
  const [diary, setDiary]       = useState({});
  const [measurements, setMeasurements] = useState([]);
  const [nutri, setNutri]       = useState(null);
  const [nutriNotes, setNutriNotes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [mealModal, setMealModal] = useState(null);
  const [measureModal, setMeasureModal] = useState(false);
  const [dietModal, setDietModal]   = useState(false);
  const [medAlert, setMedAlert] = useState(null);
  const [diaryText, setDiaryText] = useState("");
  const [newMeasure, setNewMeasure] = useState({peso:"",altura:"",cintura:"",quadril:"",braco:"",coxa:""});
  const [notifGranted, setNotifGranted] = useState(typeof Notification!=="undefined"&&Notification.permission==="granted");
  const [notifDismissed, setNotifDismissed] = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [loadError, setLoadError]           = useState("");
  const [streakCount, setStreakCount]       = useState(0);
  const [questModal, setQuestModal]         = useState(false);
  const [questAnswers, setQuestAnswers]     = useState({energia:3,sono:3,fome:3,disposicao:3,estresse:3,obs:""});
  const [questSaved, setQuestSaved]         = useState(false);
  const [profileEdit, setProfileEdit]       = useState(false);
  const [profilePatch, setProfilePatch]     = useState({name:profile.name||"",goal:profile.goal||"",obs:profile.obs||""});
  const [drawerOpen, setDrawerOpen]         = useState(false);
  const [drawerTab, setDrawerTab]           = useState("anamnese");
  const [chatOpen, setChatOpen]             = useState(false);
  const [chatMessages, setChatMessages]     = useState([]);
  const [chatInput, setChatInput]           = useState("");
  const [chatSending, setChatSending]       = useState(false);
  const [metas, setMetas]                   = useState([]);
  const [novaMeta, setNovaMeta]             = useState({texto:"",prazo:""});
  const [suplementos, setSuplementos]       = useState([]);
  const [orientacoes, setOrientacoes]       = useState("");
  const [quiz, setQuiz]                     = useState({energia:0,sono:0,fome:0,disposicao:0,obs:""});
  const [quizSent, setQuizSent]             = useState(false);

  const tk  = todayKey();
  const dow = todayDow();
  const todayMeals = weekDiet[dow] || weekDiet["base"] || [];

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [wd, ms, tl, di, me, mt, supl, orient, streak] = await Promise.all([
        DB.getWeekDiet(profile.id),
        DB.getMeds(profile.id),
        DB.getDayLog(profile.id, tk),
        DB.getDiary(profile.id),
        DB.getMeasurements(profile.id),
        DB.getMetas(profile.id),
        DB.getSuplementos(profile.id),
        DB.getOrientacoes(profile.id),
        DB.getStreak(profile.id),
      ]);
      setWeekDiet(wd); setMeds(ms); setTodayLog(tl); setDiary(di); setMeasurements(me);
      setMetas(mt); setSuplementos(supl); setOrientacoes(orient); setStreakCount(streak);
      if (profile.nutri_id) {
        const [n, nn, msgs] = await Promise.all([
          DB.getProfile(profile.nutri_id),
          DB.getNutriNotes(profile.nutri_id, profile.id),
          DB.getMessages(profile.nutri_id, profile.id),
        ]);
        setNutri(n); setNutriNotes(nn);
        setChatMessages(msgs.map(m => ({
          isAluno: m.sender_id === profile.id,
          text: m.text,
          time: new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
          id: m.id,
        })));
      }
    } catch(e) {
      setLoadError(e.message || "Erro ao carregar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    load();

    // med alert
    const check = () => { const now=new Date(),hm=now.getHours()*60+now.getMinutes(); meds.forEach(med=>med.times?.forEach(t=>{ const [h,m]=t.split(":").map(Number); if(Math.abs(hm-(h*60+m))<=5)setMedAlert(med); })); };
    check(); const iv=setInterval(check,60000);

    // realtime chat subscription
    let chatSub;
    if (profile.nutri_id) {
      chatSub = DB.subscribeToMessages(profile.nutri_id, profile.id, async () => {
        const msgs = await DB.getMessages(profile.nutri_id, profile.id);
        setChatMessages(msgs.map(m => ({
          isAluno: m.sender_id === profile.id,
          text: m.text,
          time: new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),
          id: m.id,
        })));
      });
    }

    return () => { clearInterval(iv); if(chatSub) DB.sb.removeChannel(chatSub); };
  }, [profile.id]);

  const persistLog = async (newLog) => {
    setTodayLog(newLog);
    await DB.saveDayLog(profile.id, tk, newLog);
  };

  const toggleFood = async (mealId,foodId,status) => {
    const meal=todayLog[mealId]||{}, cur=meal[foodId];
    const newLog = {...todayLog,[mealId]:{...meal,[foodId]:cur===status?null:status}};
    await persistLog(newLog);
  };

  const getFoodStatus = (mealId,foodId) => todayLog[mealId]?.[foodId]||null;

  const handlePhoto = (e, mealId) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      const newLog = {...todayLog, [mealId]: {...(todayLog[mealId]||{}), photo: ev.target.result}};
      persistLog(newLog);
    };
    r.readAsDataURL(file);
  };

  const saveDiary = async () => {
    if (!diaryText.trim()) return;
    const today=diary[tk]||{};
    const newEntries=[...(today.entries||[]),{text:diaryText,time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}];
    await DB.saveDiaryDay(profile.id, tk, newEntries, today.progressPhoto||null);
    setDiary({...diary,[tk]:{...today,entries:newEntries}});
    setDiaryText("");
  };

  const addMeasurement = async () => {
    const m={...newMeasure,date:new Date().toLocaleDateString("pt-BR"),ts:Date.now()};
    await DB.addMeasurement(profile.id, m);
    setMeasurements(ms=>[...ms,m]);
    setNewMeasure({peso:"",altura:"",cintura:"",quadril:"",braco:"",coxa:""});
    setMeasureModal(false);
  };

  const saveWeekDiet = async (wd, ms) => {
    setSaving(true);
    try { await DB.saveWeekDiet(profile.id,wd); await DB.saveMeds(profile.id,ms); setWeekDiet(wd); setMeds(ms); }
    finally { setSaving(false); setDietModal(false); }
  };



  const progress = (() => {
    let total=0,done=0;
    todayMeals.forEach(m=>m.foods?.forEach(f=>{ total++; if(todayLog?.[m.id]?.[f.id]==="ok")done++; }));
    return total===0?0:Math.round((done/total)*100);
  })();

  const imc = () => {
    const last=measurements[measurements.length-1];
    if(!last?.peso||!last?.altura)return null;
    const h=parseFloat(last.altura)/100;
    return (parseFloat(last.peso)/(h*h)).toFixed(1);
  };

  const weightData=measurements.filter(m=>m.peso).map(m=>({v:parseFloat(m.peso),label:m.date}));
  const waistData=measurements.filter(m=>m.cintura).map(m=>({v:parseFloat(m.cintura),label:m.date}));
  const imcVal=imc();
  const now=new Date();

  if (dietModal) return <WeekDietBuilder weekDiet={weekDiet} meds={meds} onSave={saveWeekDiet} onClose={()=>setDietModal(false)}/>;

  return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,maxWidth:480,margin:"0 auto",position:"relative"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap" rel="stylesheet"/>

      {/* Med Alert */}
      {medAlert&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:C.card,border:`2px solid ${C.amber}`,borderRadius:28,padding:36,textAlign:"center",maxWidth:320,animation:"ring 1.5s infinite"}}>
            <div style={{fontSize:64,marginBottom:12}}>💊</div>
            <div style={{fontSize:20,fontWeight:800,color:C.amber,marginBottom:4}}>Hora do remédio!</div>
            <div style={{fontSize:24,fontWeight:900,marginBottom:4}}>{medAlert.name}</div>
            <div style={{color:C.muted,marginBottom:28}}>{medAlert.dose}</div>
            <Btn onClick={()=>setMedAlert(null)} color={C.amber} full>Tomei ✓</Btn>
          </div>
        </div>
      )}

      {/* Meal Modal */}
      {mealModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:900,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:C.card,borderRadius:"28px 28px 0 0",padding:"28px 24px 48px",width:"100%",maxWidth:480,maxHeight:"88vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div>
                <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{mealModal.time}</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:24,fontWeight:700}}>{mealModal.emoji} {mealModal.name}</div>
              </div>
              <button onClick={()=>setMealModal(null)} style={{background:C.card2,border:"none",color:C.text,borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:18}}>×</button>
            </div>
            {(()=>{ const mm=meds.filter(m=>m.times?.includes(mealModal.time)); return mm.length>0?(
              <div style={{background:`${C.amber}12`,border:`1.5px solid ${C.amber}44`,borderRadius:16,padding:"14px 18px",marginBottom:20}}>
                <div style={{fontSize:12,color:C.amber,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>💊 Tomar com esta refeição</div>
                {mm.map(m=><div key={m.id} style={{display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:4}}><span style={{fontWeight:700}}>{m.name}</span><span style={{color:C.amber}}>{m.dose}</span></div>)}
              </div>
            ):null; })()}
            <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Alimentos</div>
            {(mealModal.foods||[]).map(f=>{ const st=getFoodStatus(mealModal.id,f.id); return (
              <div key={f.id} style={{background:st==="ok"?`${C.accent}10`:st==="skip"?`${C.red}08`:C.card2,border:`1.5px solid ${st==="ok"?C.accent+"44":st==="skip"?C.red+"33":C.border}`,borderRadius:16,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12,transition:"all 0.2s"}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15,textDecoration:st==="skip"?"line-through":"none",opacity:st==="skip"?.5:1}}>{f.name}</div>
                  {f.qty&&<div style={{fontSize:13,color:C.muted}}>{f.qty}</div>}
                  {f.subs?.length>0&&<div style={{fontSize:12,color:C.blue,marginTop:4}}>↔️ {f.subs.join(", ")}</div>}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>toggleFood(mealModal.id,f.id,"ok")} style={{background:st==="ok"?C.accent:`${C.accent}18`,border:`1.5px solid ${C.accent}`,color:st==="ok"?C.bg:C.accent,borderRadius:10,padding:"7px 16px",cursor:"pointer",fontWeight:800,fontSize:13,fontFamily:"inherit",transition:"all 0.15s",transform:st==="ok"?"scale(1.05)":"scale(1)"}}>✓ Comi</button>
                  <button onClick={()=>toggleFood(mealModal.id,f.id,"skip")} style={{background:st==="skip"?C.red:`${C.red}18`,border:`1.5px solid ${C.red}`,color:st==="skip"?"#fff":C.red,borderRadius:10,padding:"7px 12px",cursor:"pointer",fontWeight:800,fontSize:14,fontFamily:"inherit",transition:"all 0.15s"}}>✕ Pulei</button>
                </div>
              </div>
            ); })}
            <button onClick={()=>(mealModal.foods||[]).forEach(f=>{ if(!getFoodStatus(mealModal.id,f.id))toggleFood(mealModal.id,f.id,"skip"); })}
              style={{width:"100%",background:`${C.red}12`,border:`1.5px dashed ${C.red}44`,borderRadius:14,padding:12,color:C.red,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:4,marginBottom:20}}>
              😓 Não consegui fazer esta refeição
            </button>
            <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>📷 Foto do prato</div>
            {todayLog[mealModal.id]?.photo ? (
              <div style={{position:"relative"}}>
                <img src={todayLog[mealModal.id].photo} alt="" style={{width:"100%",borderRadius:16,maxHeight:220,objectFit:"cover"}}/>
                <label style={{position:"absolute",bottom:10,right:10,background:"rgba(0,0,0,0.65)",borderRadius:10,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:700,color:"#fff",display:"inline-block"}}>
                  Trocar
                  <input type="file" accept="image/*" onChange={e=>handlePhoto(e, mealModal.id)} style={{display:"none"}}/>
                </label>
              </div>
            ) : (
              <label style={{display:"block",background:C.card2,border:`1.5px dashed ${C.border}`,borderRadius:14,padding:"22px 16px",textAlign:"center",cursor:"pointer",color:C.muted,fontSize:13,fontWeight:600}}>
                📸 Adicionar foto do prato
                <input type="file" accept="image/*" onChange={e=>handlePhoto(e, mealModal.id)} style={{display:"none"}}/>
              </label>
            )}
          </div>
        </div>
      )}

      {measureModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:900,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:C.card,borderRadius:"28px 28px 0 0",padding:"28px 24px 44px",width:"100%",maxWidth:480}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
              <div style={{fontFamily:"'Lora',serif",fontSize:22,fontWeight:700}}>📏 Nova Avaliação</div>
              <button onClick={()=>setMeasureModal(false)} style={{background:C.card2,border:"none",color:C.text,borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:18}}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {[["peso","Peso","kg","⚖️"],["altura","Altura","cm","📏"],["cintura","Cintura","cm","〰️"],["quadril","Quadril","cm","🫙"],["braco","Braço","cm","💪"],["coxa","Coxa","cm","🦵"]].map(([k,l,u,ic])=>(
                <div key={k}>
                  <div style={{fontSize:12,color:C.muted,marginBottom:6}}>{ic} {l} ({u})</div>
                  <input type="number" placeholder="0" value={newMeasure[k]} onChange={e=>setNewMeasure(p=>({...p,[k]:e.target.value}))}
                    style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"11px 14px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                </div>
              ))}
            </div>
            <Btn onClick={addMeasurement} color={C.purple} full style={{marginTop:24}}>Salvar Avaliação</Btn>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{padding:"52px 24px 20px",background:`linear-gradient(180deg,#0f1520 0%,${C.bg} 100%)`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:11,color:C.accent,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>{DAYS[now.getDay()]}, {now.getDate()} de {MONTHS[now.getMonth()]}</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:26,fontWeight:700,lineHeight:1.2}}>Olá, {profile.name.split(" ")[0]}!</div>
            {nutri&&<div style={{fontSize:12,color:C.purple,marginTop:4}}>👩‍⚕️ {nutri.name}</div>}
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:2}}>hoje</div>
            <div style={{fontSize:34,fontWeight:900,color:progress>=80?C.accent:C.text}}>{progress}%</div>
          </div>
        </div>
        <div style={{marginTop:14,background:C.card2,borderRadius:100,height:5,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${progress}%`,background:`linear-gradient(90deg,${C.accent},${C.purple})`,borderRadius:100,transition:"width 0.5s"}}/>
        </div>
      </div>

      {/* Nav */}
      <div style={{display:"flex",gap:8,padding:"0 20px 16px",overflowX:"auto"}}>
        {[["hoje","🍽️","Hoje"],["diario","📓","Diário"],["medidas","📊","Medidas"],["config","⚙️","Config"]].map(([k,ic,lb])=>(
          <button key={k} onClick={()=>setView(k)} style={{background:view===k?`${C.accent}18`:"transparent",border:`1.5px solid ${view===k?C.accent:C.border}`,borderRadius:100,padding:"8px 18px",color:view===k?C.accent:C.muted,fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"}}>
            {ic} {lb}
          </button>
        ))}
      </div>

      {loading&&<Spinner text="Carregando seu plano…"/>}
      {!loading&&loadError&&(
        <div style={{margin:"0 20px",background:`${C.red}15`,border:`1.5px solid ${C.red}44`,borderRadius:14,padding:16,textAlign:"center"}}>
          <div style={{color:C.red,fontWeight:700,marginBottom:8}}>&#9888;&#65039; {loadError}</div>
          <button onClick={()=>{ setLoadError(""); load(); }}
            style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"6px 16px",color:C.text,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
            Tentar novamente
          </button>
        </div>
      )}

      {!loading&&<>
        {/* HOJE */}
        {view==="hoje"&&(
          <div style={{padding:"0 20px 120px"}}>
            {!notifGranted&&!notifDismissed&&typeof Notification!=="undefined"&&Notification.permission!=="denied"&&(
              <div style={{background:`${C.amber}15`,border:`1.5px solid ${C.amber}44`,borderRadius:18,padding:"14px 18px",marginBottom:14,display:"flex",gap:12,alignItems:"center"}}>
                <span style={{fontSize:24}}>🔔</span>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>Ativar notificações</div><div style={{fontSize:12,color:C.muted}}>Alertas mesmo com o app fechado.</div></div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={async()=>{ const ok=await(async()=>{ if(!("Notification"in window))return false; if(Notification.permission==="granted")return true; return(await Notification.requestPermission())==="granted"; })(); setNotifGranted(ok); }} style={{background:C.amber,border:"none",borderRadius:10,padding:"7px 14px",color:C.bg,fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Ativar</button>
                  <button onClick={()=>setNotifDismissed(true)} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:20,lineHeight:1}}>×</button>
                </div>
              </div>
            )}

            {/* nutri notes banner */}
            {nutriNotes.length>0&&nutriNotes[0].note_date===tk&&(
              <div style={{background:`${C.purple}15`,border:`1.5px solid ${C.purple}44`,borderRadius:18,padding:16,marginBottom:14}}>
                <div style={{fontSize:12,color:C.purple,fontWeight:700,marginBottom:6}}>💬 Observação da nutricionista</div>
                <div style={{fontSize:14,color:C.sub,lineHeight:1.6}}>{nutriNotes[0].text}</div>
              </div>
            )}

            {/* humor */}
            <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:18,marginBottom:14}}>
              <div style={{fontSize:13,fontWeight:700,color:C.sub,marginBottom:12}}>Como você está hoje?</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {HUMOR_OPTS.map(h=>(
                  <button key={h.v} onClick={async()=>{ const nl={...todayLog,humor:h.v===todayLog.humor?null:h.v}; await persistLog(nl); }}
                    style={{background:todayLog.humor===h.v?`${h.c}22`:"transparent",border:`1.5px solid ${todayLog.humor===h.v?h.c:C.border}`,borderRadius:100,padding:"6px 12px",color:todayLog.humor===h.v?h.c:C.muted,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    {h.l}
                  </button>
                ))}
              </div>
            </div>

            <WaterTracker water={todayLog.water||0} onChange={async n=>{ await persistLog({...todayLog,water:n}); }}/>

            {todayMeals.length===0?(
              <div style={{textAlign:"center",padding:"50px 20px"}}>
                <div style={{fontSize:64}}>🥗</div>
                <div style={{fontFamily:"'Lora',serif",fontSize:20,fontWeight:700,marginTop:16,marginBottom:8}}>Sem plano para hoje</div>
                <div style={{color:C.muted,marginBottom:20,lineHeight:1.6,fontSize:14}}>{nutri?"Aguarde sua nutricionista configurar o cardápio.":"Configure seu cardápio na aba Config."}</div>
                {!nutri&&<Btn onClick={()=>setView("config")} color={C.accent}>Configurar Cardápio →</Btn>}
              </div>
            ):(
              todayMeals.map(meal=>{
                const ml=todayLog?.[meal.id]||{};
                const eaten=(meal.foods||[]).filter(f=>ml[f.id]==="ok").length;
                const skipped=(meal.foods||[]).filter(f=>ml[f.id]==="skip").length;
                const total=(meal.foods||[]).length;
                const mealMeds=meds.filter(m=>m.times?.includes(meal.time));
                return (
                  <div key={meal.id} onClick={()=>setMealModal(meal)} style={{background:C.card,border:`1.5px solid ${eaten===total&&total>0?C.accent+"55":C.border}`,borderRadius:20,padding:"18px 20px",marginBottom:14,cursor:"pointer"}}>
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                      <div style={{fontSize:34,lineHeight:1}}>{meal.emoji}</div>
                      <div style={{flex:1}}><div style={{fontWeight:800,fontSize:16}}>{meal.name}</div><div style={{fontSize:13,color:C.muted}}>{meal.time} · {total} item{total!==1?"s":""}</div></div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                        {eaten>0&&<span style={{background:`${C.accent}20`,color:C.accent,borderRadius:8,padding:"2px 9px",fontSize:12,fontWeight:700}}>✓ {eaten}</span>}
                        {skipped>0&&<span style={{background:`${C.red}18`,color:C.red,borderRadius:8,padding:"2px 9px",fontSize:12,fontWeight:700}}>✕ {skipped}</span>}
                        {mealMeds.length>0&&<span style={{background:`${C.amber}18`,color:C.amber,borderRadius:8,padding:"2px 9px",fontSize:11,fontWeight:700}}>💊 {mealMeds.length}</span>}
                      </div>
                    </div>
                    {todayLog[meal.id]?.photo&&<img src={todayLog[meal.id].photo} alt="" style={{width:"100%",borderRadius:12,marginTop:12,height:110,objectFit:"cover"}}/>}
                    <div style={{marginTop:12,background:C.card2,borderRadius:100,height:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${total?((eaten+skipped)/total)*100:0}%`,background:skipped>0?`linear-gradient(90deg,${C.accent},${C.red})`:C.accent,borderRadius:100}}/>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* DIÁRIO */}
        {view==="diario"&&(
          <div style={{padding:"0 20px 120px"}}>
            {nutriNotes.length>0&&(
              <div style={{marginBottom:20}}>
                <div style={{fontSize:12,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>💬 Da sua nutricionista</div>
                {nutriNotes.slice(0,3).map((n,i)=>(
                  <div key={i} style={{background:`${C.purple}10`,border:`1.5px solid ${C.purple}33`,borderRadius:14,padding:14,marginBottom:8,borderLeft:`3px solid ${C.purple}`}}>
                    <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{n.note_date}</div>
                    <div style={{fontSize:14,color:C.sub}}>{n.text}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:700,color:C.purple,marginBottom:12}}>✍️ Como foi hoje?</div>
              <textarea value={diaryText} onChange={e=>setDiaryText(e.target.value)} placeholder="Como se sentiu? O que comeu diferente? Registre sua jornada…"
                style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:14,padding:16,color:C.text,fontSize:15,minHeight:100,resize:"none",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
              <Btn onClick={saveDiary} color={C.purple} full style={{marginTop:12}}>Salvar ✓</Btn>
            </div>
            {Object.keys(diary).length===0&&(
              <div style={{textAlign:"center",padding:"30px 20px",color:C.muted}}>
                <div style={{fontSize:40,marginBottom:10}}>📓</div>
                <div style={{fontWeight:700,fontSize:15,marginBottom:6,color:C.sub}}>Diário vazio</div>
                <div style={{fontSize:13}}>Seus registros aparecerão aqui depois de salvar entradas acima.</div>
              </div>
            )}
            {Object.entries(diary).sort((a,b)=>b[0].localeCompare(a[0])).map(([date,dayData])=>(
              <div key={date}>
                <div style={{fontSize:11,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,marginTop:16}}>{date}</div>
                {dayData.progressPhoto&&<img src={dayData.progressPhoto} alt="" style={{width:"100%",borderRadius:14,marginBottom:8,maxHeight:200,objectFit:"cover"}}/>}
                {(dayData.entries||[]).map((e,i)=>(
                  <div key={i} style={{background:C.card,borderRadius:14,padding:14,marginBottom:8,borderLeft:`3px solid ${C.purple}`}}>
                    <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{e.time}</div>
                    <div style={{fontSize:14,lineHeight:1.65,color:C.sub}}>{e.text}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* MEDIDAS */}
        {view==="medidas"&&(
          <div style={{padding:"0 20px 120px"}}>
            {imcVal&&<div style={{background:`linear-gradient(135deg,${C.purple}20,${C.accent}15)`,border:`1.5px solid ${C.purple}44`,borderRadius:20,padding:22,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:11,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>IMC Atual</div><div style={{fontSize:44,fontWeight:900,marginTop:4}}>{imcVal}</div></div>
              <div style={{textAlign:"right",fontSize:15,fontWeight:700,color:parseFloat(imcVal)<18.5?C.amber:parseFloat(imcVal)<25?C.accent:C.red}}>{parseFloat(imcVal)<18.5?"Abaixo do peso":parseFloat(imcVal)<25?"Normal ✓":parseFloat(imcVal)<30?"Sobrepeso":"Obesidade"}</div>
            </div>}
            {weightData.length>=2&&<div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
              <div style={{fontWeight:800,fontSize:15,marginBottom:8}}>⚖️ Evolução do Peso</div>
              <MiniChart data={weightData} color={C.accent} height={70}/>
            </div>}
            {waistData.length>=2&&<div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
              <div style={{fontWeight:800,fontSize:15,marginBottom:8}}>〰️ Evolução da Cintura</div>
              <MiniChart data={waistData} color={C.purple} height={70}/>
            </div>}
            <Btn onClick={()=>setMeasureModal(true)} color={C.purple} full style={{marginBottom:24}}>+ Nova Avaliação Antropométrica</Btn>
            {measurements.length===0&&(
              <div style={{textAlign:"center",padding:"30px 20px",color:C.muted}}>
                <div style={{fontSize:40,marginBottom:10}}>📏</div>
                <div style={{fontWeight:700,fontSize:15,marginBottom:6,color:C.sub}}>Nenhuma avaliação ainda</div>
                <div style={{fontSize:13}}>Adicione sua primeira avaliação antropométrica usando o botão acima.</div>
              </div>
            )}
          {measurements.length>0&&[...measurements].reverse().map((m,i)=>(
              <div key={i} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:18,marginBottom:14}}>
                <div style={{fontSize:11,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>{m.date}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                  {[["⚖️","Peso",m.peso,"kg"],["📏","Altura",m.altura,"cm"],["〰️","Cintura",m.cintura,"cm"],["🫙","Quadril",m.quadril,"cm"],["💪","Braço",m.braco,"cm"],["🦵","Coxa",m.coxa,"cm"]].map(([ic,lb,val,u])=>val?<div key={lb} style={{background:C.card2,borderRadius:14,padding:"12px 14px"}}><div style={{fontSize:18,marginBottom:4}}>{ic}</div><div style={{fontSize:11,color:C.muted}}>{lb}</div><div style={{fontSize:17,fontWeight:800}}>{val}<span style={{fontSize:11,color:C.muted}}> {u}</span></div></div>:null)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONFIG */}
        {view==="config"&&(
          <div style={{padding:"0 20px 120px"}}>
            <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:16}}>
              <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:14}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:C.bg}}>{(profile.name||"?")[0].toUpperCase()}</div>
                <div><div style={{fontWeight:800,fontSize:18}}>{profile.name}</div><div style={{color:C.muted,fontSize:13}}>{profile.email}</div></div>
              </div>
              {nutri&&<div style={{background:`${C.purple}15`,borderRadius:12,padding:"10px 14px",fontSize:13,color:C.purple,fontWeight:600}}>👩‍⚕️ Nutricionista: {nutri.name}</div>}
              <div style={{display:"flex",gap:10,marginTop:12}}>
                <button onClick={()=>{setQuestSaved(false);setQuestModal(true);}}
                  style={{flex:1,background:`${C.amber}15`,border:`1.5px solid ${C.amber}44`,borderRadius:12,padding:"11px 0",color:C.amber,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                  📊 Questionário semanal
                </button>
                <button onClick={()=>setProfileEdit(true)}
                  style={{flex:1,background:`${C.accent}12`,border:`1.5px solid ${C.accent}33`,borderRadius:12,padding:"11px 0",color:C.accent,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                  ✏️ Editar perfil
                </button>
              </div>
            </div>
            {!nutri&&<button onClick={()=>setDietModal(true)} style={{width:"100%",background:C.card,border:`1.5px solid ${C.accent}55`,borderRadius:20,padding:20,color:C.text,cursor:"pointer",textAlign:"left",fontFamily:"inherit",marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontWeight:800,fontSize:16}}>🥗 Meu Cardápio</div><div style={{color:C.muted,fontSize:13,marginTop:2}}>{Object.keys(weekDiet).length} configuração(ões)</div></div>
                <div style={{color:C.accent,fontSize:22}}>→</div>
              </div>
            </button>}
            {nutri&&<div style={{background:`${C.purple}10`,border:`1.5px solid ${C.purple}33`,borderRadius:16,padding:14,marginBottom:14,fontSize:13,color:C.sub,lineHeight:1.6}}>
              Seu cardápio é gerenciado pela sua nutricionista. Qualquer alteração será feita por ela.
            </div>}
            <button onClick={()=>{ if(window.confirm("Sair da sua conta?")) onSignOut(); }}
              style={{width:"100%",background:"transparent",border:`1.5px solid ${C.red}44`,borderRadius:20,padding:16,color:C.red,cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:14}}>
              Sair da conta
            </button>
          </div>
        )}
      </>}

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(11,15,24,0.97)",backdropFilter:"blur(20px)",borderTop:`1px solid ${C.border}`,padding:"12px 20px 30px",display:"flex",justifyContent:"space-around"}}>
        {[["hoje","🍽️","Hoje"],["diario","📓","Diário"],["medidas","📊","Medidas"],["config","⚙️","Config"]].map(([k,ic,lb])=>(
          <button key={k} onClick={()=>setView(k)} style={{background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",color:view===k?C.accent:C.muted,fontWeight:view===k?800:600,fontSize:11,padding:0,fontFamily:"inherit"}}>
            <span style={{fontSize:22}}>{ic}</span>{lb}
          </button>
        ))}
        <button onClick={()=>setDrawerOpen(true)} style={{background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",color:C.purple,fontWeight:700,fontSize:11,padding:0,fontFamily:"inherit"}}>
          <span style={{fontSize:22}}>☰</span>Mais
        </button>
        <button onClick={()=>setChatOpen(true)} style={{background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",color:C.amber,fontWeight:700,fontSize:11,padding:0,fontFamily:"inherit",position:"relative"}}>
          <span style={{fontSize:22}}>💬</span>Chat
        </button>
      </div>
      <style>{`@keyframes ring{0%,100%{box-shadow:0 0 0 0 rgba(251,191,36,.5)}50%{box-shadow:0 0 0 20px rgba(251,191,36,0)}}*{-webkit-tap-highlight-color:transparent}::-webkit-scrollbar{width:0}@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>

      {/* ── QUESTIONÁRIO SEMANAL ────────────────────────────────────────── */}
      {questModal&&(
        <>
          <div onClick={()=>setQuestModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:800,animation:"fadeIn 0.2s ease"}}/>
          <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:C.card,zIndex:801,borderRadius:"24px 24px 0 0",padding:"24px 20px 48px",animation:"slideIn 0.25s cubic-bezier(.34,1.1,.64,1)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div>
                <div style={{fontFamily:"'Lora',serif",fontSize:20,fontWeight:700}}>📊 Como foi sua semana?</div>
                <div style={{fontSize:12,color:C.muted,marginTop:2}}>Responda 1 (péssimo) a 5 (ótimo)</div>
              </div>
              <button onClick={()=>setQuestModal(false)} style={{background:C.card2,border:"none",borderRadius:10,width:34,height:34,cursor:"pointer",fontSize:16,color:C.muted}}>×</button>
            </div>
            {[["energia","⚡","Energia"],["sono","😴","Sono"],["fome","🍎","Fome/Saciedade"],["disposicao","💪","Disposição"],["estresse","😰","Estresse"]].map(([k,ic,lb])=>(
              <div key={k} style={{marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:700,marginBottom:6}}>{ic} {lb}</div>
                <div style={{display:"flex",gap:6}}>
                  {[1,2,3,4,5].map(v=>(
                    <button key={v} onClick={()=>setQuestAnswers(a=>({...a,[k]:v}))}
                      style={{flex:1,height:36,borderRadius:10,border:`1.5px solid ${questAnswers[k]===v?C.accent:C.border}`,background:questAnswers[k]===v?`${C.accent}25`:"transparent",color:questAnswers[k]===v?C.accent:C.muted,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <textarea value={questAnswers.obs} onChange={e=>setQuestAnswers(a=>({...a,obs:e.target.value}))}
              placeholder="Observações adicionais para sua nutricionista…" rows={2}
              style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 12px",color:C.text,fontSize:13,resize:"none",outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:14}}/>
            {questSaved
              ?<div style={{textAlign:"center",color:C.accent,fontWeight:700,padding:"10px 0"}}>✓ Questionário salvo!</div>
              :<button onClick={async()=>{
                const mon=new Date(); mon.setDate(mon.getDate()-mon.getDay()+1);
                const wk=`${mon.getFullYear()}-${String(mon.getMonth()+1).padStart(2,"0")}-${String(mon.getDate()).padStart(2,"0")}`;
                try{ await DB.saveQuestionnaire(profile.id,wk,questAnswers); setQuestSaved(true); setTimeout(()=>setQuestModal(false),1200); }catch(e){console.error(e);}
              }}
                style={{width:"100%",background:C.accent,border:"none",borderRadius:14,padding:"14px 0",color:C.bg,fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>
                Enviar para a nutricionista →
              </button>
            }
          </div>
        </>
      )}

      {/* ── EDITAR PERFIL ────────────────────────────────────────────────── */}
      {profileEdit&&(
        <>
          <div onClick={()=>setProfileEdit(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:800,animation:"fadeIn 0.2s ease"}}/>
          <div style={{position:"fixed",top:0,right:0,bottom:0,width:"85%",maxWidth:360,background:C.card,zIndex:801,display:"flex",flexDirection:"column",animation:"slideIn 0.25s cubic-bezier(.34,1.1,.64,1)",boxShadow:"-20px 0 60px rgba(0,0,0,0.5)"}}>
            <div style={{padding:"52px 20px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontFamily:"'Lora',serif",fontSize:20,fontWeight:700}}>Atualizar Perfil</div>
              <button onClick={()=>setProfileEdit(false)} style={{background:C.card2,border:"none",borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:18,color:C.muted}}>×</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:"20px 20px 32px"}}>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>👤 Nome</div>
                <input value={profilePatch.name} onChange={e=>setProfilePatch(p=>({...p,name:e.target.value}))}
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"11px 14px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>🎯 Objetivo</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {["Emagrecimento","Ganho de massa","Manutenção","Condicionamento","Saúde geral","Controle médico"].map(g=>(
                    <button key={g} onClick={()=>setProfilePatch(p=>({...p,goal:g}))}
                      style={{background:profilePatch.goal===g?`${C.accent}22`:"transparent",border:`1.5px solid ${profilePatch.goal===g?C.accent:C.border}`,borderRadius:12,padding:"10px 8px",color:profilePatch.goal===g?C.accent:C.sub,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>📝 Observações</div>
                <textarea value={profilePatch.obs} onChange={e=>setProfilePatch(p=>({...p,obs:e.target.value}))} rows={3}
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:13,resize:"none",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
              </div>
              <button onClick={async()=>{
                try{
                  await DB.completeOnboarding(profile.id, profilePatch);
                  const updated = await DB.getProfile(profile.id);
                  if(onProfileUpdate) onProfileUpdate(updated);
                  setProfileEdit(false);
                }catch(e){alert("Erro ao salvar: "+e.message);}
              }}
                style={{width:"100%",background:C.accent,border:"none",borderRadius:14,padding:"14px 0",color:C.bg,fontWeight:900,fontSize:15,cursor:"pointer",fontFamily:"inherit"}}>
                Salvar alterações ✓
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── DRAWER LATERAL ─────────────────────────────────────────────── */}
      {drawerOpen&&(
        <>
          <div onClick={()=>setDrawerOpen(false)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:800,animation:"fadeIn 0.2s ease"}}/>
          <div style={{position:"fixed",top:0,right:0,bottom:0,width:"82%",maxWidth:360,background:C.card,zIndex:801,display:"flex",flexDirection:"column",animation:"slideIn 0.25s cubic-bezier(.34,1.1,.64,1)",boxShadow:"-20px 0 60px rgba(0,0,0,0.5)"}}>
            {/* Drawer header */}
            <div style={{padding:"52px 20px 16px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontFamily:"'Lora',serif",fontSize:20,fontWeight:700}}>Meu Perfil</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2}}>{profile.name}</div>
                </div>
                <button onClick={()=>setDrawerOpen(false)}
                  style={{background:C.card2,border:"none",borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:18,color:C.muted,fontFamily:"inherit"}}>×</button>
              </div>
            </div>

            {/* Drawer menu */}
            <div style={{display:"flex",gap:6,padding:"12px 16px",overflowX:"auto",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
              {[["anamnese","📋","Dados"],["metas","🎯","Metas"],["suplementos","💊","Suplementos"],["orientacoes","📝","Orientações"],["fotos","📸","Fotos"],["questionario","📊","Semana"]].map(([k,ic,lb])=>(
                <button key={k} onClick={()=>setDrawerTab(k)}
                  style={{background:drawerTab===k?`${C.purple}22`:"transparent",border:`1.5px solid ${drawerTab===k?C.purple:C.border}`,borderRadius:100,padding:"6px 12px",color:drawerTab===k?C.purple:C.muted,fontWeight:700,fontSize:11,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0}}>
                  {ic} {lb}
                </button>
              ))}
            </div>

            {/* Drawer content */}
            <div style={{flex:1,overflowY:"auto",padding:"16px 16px 32px"}}>

              {/* ANAMNESE */}
              {drawerTab==="anamnese"&&(
                <div>
                  <div style={{fontWeight:800,fontSize:15,marginBottom:16}}>📋 Seus dados clínicos</div>
                  {[
                    ["👤","Nome",profile.name||"—"],
                    ["📧","E-mail",profile.email||"—"],
                    ["⚧","Sexo",profile.sex==="F"?"Feminino":profile.sex==="M"?"Masculino":"—"],
                    ["🎂","Nascimento",profile.birth_date||"—"],
                    ["🎯","Objetivo",profile.goal||"—"],
                    ["📝","Observações",profile.obs||"—"],
                  ].map(([ic,lb,val])=>(
                    <div key={lb} style={{borderBottom:`1px solid ${C.border}`,paddingBottom:12,marginBottom:12,display:"flex",gap:12}}>
                      <span style={{fontSize:18,width:26,flexShrink:0}}>{ic}</span>
                      <div>
                        <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:2}}>{lb}</div>
                        <div style={{fontSize:13,color:val==="—"?C.muted:C.text}}>{val}</div>
                      </div>
                    </div>
                  ))}
                  {profile.allergies?.length>0&&(
                    <div>
                      <div style={{fontSize:10,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>⚠️ Alergias / Restrições</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {profile.allergies.map(a=>(
                          <span key={a} style={{background:`${C.red}18`,border:`1px solid ${C.red}44`,borderRadius:100,padding:"3px 10px",fontSize:11,color:C.red,fontWeight:600}}>{a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {nutri&&(
                    <div style={{background:`${C.purple}15`,border:`1.5px solid ${C.purple}33`,borderRadius:14,padding:"12px 16px",marginTop:16}}>
                      <div style={{fontSize:11,color:C.purple,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>👩‍⚕️ Minha nutricionista</div>
                      <div style={{fontWeight:700,fontSize:14}}>{nutri.name}</div>
                      <div style={{fontSize:12,color:C.muted,marginTop:2}}>{nutri.email}</div>
                    </div>
                  )}
                </div>
              )}

              {/* METAS */}
              {drawerTab==="metas"&&(
                <div>
                  <div style={{fontWeight:800,fontSize:15,marginBottom:14}}>🎯 Minhas metas</div>
                  {/* Add new meta */}
                  <div style={{background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:16,padding:14,marginBottom:16}}>
                    <input value={novaMeta.texto} onChange={e=>setNovaMeta(m=>({...m,texto:e.target.value}))}
                      placeholder="Nova meta (ex: tomar 3L de água por dia)"
                      style={{width:"100%",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:8}}/>
                    <div style={{display:"flex",gap:8,marginBottom:10}}>
                      <input type="date" value={novaMeta.prazo} onChange={e=>setNovaMeta(m=>({...m,prazo:e.target.value}))}
                        style={{flex:1,background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"8px 10px",color:C.text,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
                      <button onClick={async()=>{ if(!novaMeta.texto.trim())return; const m=await DB.addMeta(profile.id,novaMeta.texto,novaMeta.prazo,null); setMetas(ms=>[m,...ms]); setNovaMeta({texto:"",prazo:""}); }}
                        style={{background:C.purple,border:"none",borderRadius:10,padding:"8px 18px",color:C.bg,fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
                        + Adicionar
                      </button>
                    </div>
                  </div>
                  {/* Nutri notes as goals if no user metas */}
                  {nutriNotes.length>0&&metas.length===0&&(
                    <div style={{background:`${C.purple}10`,border:`1.5px solid ${C.purple}33`,borderRadius:14,padding:14,marginBottom:14}}>
                      <div style={{fontSize:11,color:C.purple,fontWeight:700,marginBottom:8}}>🎯 Da sua nutricionista</div>
                      {nutriNotes.slice(0,2).map((n,i)=><div key={i} style={{fontSize:13,color:C.sub,marginBottom:4}}>· {n.text}</div>)}
                    </div>
                  )}
                  {metas.length===0
                    ?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"24px 0"}}>Nenhuma meta definida ainda. Crie sua primeira meta acima!</div>
                    :metas.map((m,i)=>(
                      <div key={m.id} style={{background:m.done?`${C.accent}10`:C.card2,border:`1.5px solid ${m.done?C.accent:C.border}`,borderRadius:14,padding:"12px 14px",marginBottom:10,display:"flex",gap:10,alignItems:"flex-start"}}>
                        <button onClick={()=>{ const nd=!m.done; DB.toggleMeta(m.id,nd).catch(()=>{}); setMetas(ms=>ms.map(mm=>mm.id===m.id?{...mm,done:nd}:mm)); }}
                          style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${m.done?C.accent:C.border}`,background:m.done?C.accent:"transparent",cursor:"pointer",flexShrink:0,marginTop:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.bg,fontSize:11,fontWeight:900}}>
                          {m.done?"✓":""}
                        </button>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:700,textDecoration:m.done?"line-through":undefined,color:m.done?C.muted:C.text}}>{m.texto}</div>
                          {m.prazo&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>📅 {m.prazo}</div>}
                        </div>
                        <button onClick={()=>{ DB.deleteMeta(m.id).catch(()=>{}); setMetas(ms=>ms.filter(mm=>mm.id!==m.id)); }}
                          style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,padding:0}}>×</button>
                      </div>
                    ))
                  }
                </div>
              )}

              {/* SUPLEMENTOS */}
              {drawerTab==="suplementos"&&(
                <div>
                  <div style={{fontWeight:800,fontSize:15,marginBottom:14}}>💊 Meus suplementos</div>
                  {meds.length>0&&(
                    <div>
                      <div style={{fontSize:11,color:C.amber,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Prescritos pela nutricionista</div>
                      {meds.map((m,i)=>(
                        <div key={i} style={{background:`${C.amber}10`,border:`1.5px solid ${C.amber}33`,borderRadius:14,padding:"12px 14px",marginBottom:10}}>
                          <div style={{fontWeight:700,fontSize:14}}>💊 {m.name}</div>
                          {m.dose&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>Dose: {m.dose}</div>}
                          {m.times?.length>0&&<div style={{fontSize:12,color:C.muted,marginTop:1}}>Horários: {m.times.join(", ")}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginTop:16,marginBottom:10}}>Que tomo por conta</div>
                  <div style={{background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:16,padding:14,marginBottom:14}}>
                    <input value={suplementos[suplementos.length]?.nome||""} placeholder="Nome do suplemento"
                      id="supl-nome"
                      style={{width:"100%",background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:8}}/>
                    <div style={{display:"flex",gap:8}}>
                      <input placeholder="Dose" id="supl-dose"
                        style={{flex:1,background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"8px 10px",color:C.text,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
                      <input placeholder="Horário" id="supl-hora"
                        style={{flex:1,background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"8px 10px",color:C.text,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
                      <button onClick={()=>{
                        const n=document.getElementById("supl-nome")?.value?.trim();
                        const d=document.getElementById("supl-dose")?.value?.trim();
                        const h=document.getElementById("supl-hora")?.value?.trim();
                        if(!n)return;
                        DB.addSuplemento(profile.id, {nome:n,dose:d,horario:h}).then(s=>setSuplementos(ss=>[...ss,s])).catch(()=>{});
                        ["supl-nome","supl-dose","supl-hora"].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=""; });
                      }}
                        style={{background:C.amber,border:"none",borderRadius:10,padding:"8px 14px",color:C.bg,fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>+</button>
                    </div>
                  </div>
                  {suplementos.length===0&&meds.length===0&&<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>Nenhum suplemento registrado</div>}
                  {suplementos.map((s,i)=>(
                    <div key={s.id} style={{background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 14px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:13}}>💊 {s.nome}</div>
                        <div style={{fontSize:11,color:C.muted,marginTop:2}}>{[s.dose,s.horario].filter(Boolean).join(" · ")}</div>
                      </div>
                      <button onClick={()=>setSuplementos(ss=>ss.filter((_,j)=>j!==i))}
                        style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}} onClick={()=>{ DB.deleteSuplemento(s.id).catch(()=>{}); setSuplementos(ss=>ss.filter(x=>x.id!==s.id)); }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              {/* ORIENTAÇÕES */}
              {drawerTab==="orientacoes"&&(
                <div>
                  <div style={{fontWeight:800,fontSize:15,marginBottom:14}}>📝 Orientações da nutricionista</div>
                  {orientacoes
                    ?<div style={{background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:16,padding:16,fontSize:13,color:C.sub,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{orientacoes}</div>
                    :<div style={{background:`${C.purple}10`,border:`1.5px solid ${C.purple}33`,borderRadius:16,padding:20,textAlign:"center"}}>
                      <div style={{fontSize:36,marginBottom:10}}>📝</div>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:6}}>Nenhuma orientação ainda</div>
                      <div style={{fontSize:13,color:C.muted}}>Sua nutricionista adicionará orientações personalizadas aqui.</div>
                    </div>
                  }
                  {nutriNotes.length>0&&(
                    <div style={{marginTop:16}}>
                      <div style={{fontSize:11,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Anotações recentes</div>
                      {nutriNotes.slice(0,3).map((n,i)=>(
                        <div key={i} style={{background:`${C.purple}10`,border:`1.5px solid ${C.purple}22`,borderRadius:12,padding:"10px 14px",marginBottom:8}}>
                          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{n.note_date}</div>
                          <div style={{fontSize:13,color:C.sub}}>{n.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* QUESTIONÁRIO SEMANAL */}
              {drawerTab==="questionario"&&(
                <div>
                  <div style={{fontWeight:800,fontSize:15,marginBottom:6}}>📊 Como foi sua semana?</div>
                  <div style={{fontSize:13,color:C.muted,marginBottom:16}}>Responda uma vez por semana. Sua nutricionista acompanha.</div>
                  {quizSent?(
                    <div style={{background:`${C.accent}15`,border:`1.5px solid ${C.accent}44`,borderRadius:16,padding:20,textAlign:"center"}}>
                      <div style={{fontSize:32,marginBottom:8}}>✅</div>
                      <div style={{fontWeight:700,fontSize:14}}>Questionário enviado!</div>
                      <div style={{fontSize:13,color:C.muted,marginTop:4}}>Sua nutricionista vai ver em breve.</div>
                    </div>
                  ):(
                    <div>
                      {[
                        {k:"energia",lb:"⚡ Nível de energia"},
                        {k:"sono",lb:"😴 Qualidade do sono"},
                        {k:"fome",lb:"🍽️ Controle da fome"},
                        {k:"disposicao",lb:"💪 Disposição geral"},
                      ].map(({k,lb})=>(
                        <div key={k} style={{background:C.card2,borderRadius:14,padding:"12px 14px",marginBottom:10}}>
                          <div style={{fontSize:13,fontWeight:700,marginBottom:10}}>{lb}</div>
                          <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                            {[1,2,3,4,5].map(n=>(
                              <button key={n} onClick={()=>setQuiz(q=>({...q,[k]:n}))}
                                style={{width:36,height:36,borderRadius:"50%",border:`2px solid ${quiz[k]>=n?C.accent:C.border}`,background:quiz[k]>=n?`${C.accent}25`:"transparent",cursor:"pointer",fontSize:14,fontWeight:800,color:quiz[k]>=n?C.accent:C.muted,fontFamily:"inherit"}}>
                                {n}
                              </button>
                            ))}
                          </div>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginTop:6}}>
                            <span>Péssimo</span><span>Excelente</span>
                          </div>
                        </div>
                      ))}
                      <div style={{marginBottom:10}}>
                        <div style={{fontSize:12,color:C.muted,fontWeight:700,marginBottom:6}}>Observações (opcional)</div>
                        <textarea value={quiz.obs} onChange={e=>setQuiz(q=>({...q,obs:e.target.value}))} rows={3}
                          placeholder="Como se sentiu em relação à dieta, ao treino, ao seu corpo…"
                          style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 12px",color:C.text,fontSize:13,resize:"none",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                      </div>
                      <button onClick={async()=>{
                        const monday = new Date(); monday.setDate(monday.getDate()-monday.getDay()+1);
                        const wk=`${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,"0")}-${String(monday.getDate()).padStart(2,"0")}`;
                        await DB.saveQuestionnaire(profile.id, wk, quiz);
                        setQuizSent(true);
                      }}
                        style={{width:"100%",background:C.accent,border:"none",borderRadius:12,padding:"12px 0",color:C.bg,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                        Enviar questionário ✓
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* FOTOS */}
              {drawerTab==="fotos"&&(
                <div>
                  <div style={{fontWeight:800,fontSize:15,marginBottom:14}}>📸 Evolução fotográfica</div>
                  {Object.entries(diary).filter(([,d])=>d.progressPhoto).length===0
                    ?<div style={{background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:16,padding:24,textAlign:"center"}}>
                      <div style={{fontSize:40,marginBottom:10}}>📸</div>
                      <div style={{fontWeight:700,marginBottom:6}}>Nenhuma foto ainda</div>
                      <div style={{fontSize:13,color:C.muted}}>Adicione fotos de progresso no Diário para acompanhar sua evolução.</div>
                    </div>
                    :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      {Object.entries(diary)
                        .filter(([,d])=>d.progressPhoto)
                        .sort(([a],[b])=>b.localeCompare(a))
                        .map(([date,d])=>(
                          <div key={date} style={{background:C.card2,borderRadius:12,overflow:"hidden"}}>
                            <img src={d.progressPhoto} alt={date} style={{width:"100%",height:120,objectFit:"cover",display:"block"}}/>
                            <div style={{padding:"6px 8px",fontSize:10,color:C.muted,fontWeight:600}}>{date}</div>
                          </div>
                        ))
                      }
                    </div>
                  }
                </div>
              )}

            </div>
          </div>
        </>
      )}

      {/* ── CHAT COM NUTRICIONISTA ─────────────────────────────────────── */}
      {chatOpen&&(
        <>
          <div onClick={()=>setChatOpen(false)}
            style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:800,animation:"fadeIn 0.2s ease"}}/>
          <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,height:"80vh",background:C.card,zIndex:801,borderRadius:"24px 24px 0 0",display:"flex",flexDirection:"column",animation:"slideIn 0.25s cubic-bezier(.34,1.1,.64,1)",boxShadow:"0 -20px 60px rgba(0,0,0,0.5)"}}>
            {/* Chat header */}
            <div style={{padding:"20px 20px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${C.purple},${C.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>👩‍⚕️</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:15}}>{nutri?.name||"Sua Nutricionista"}</div>
                <div style={{fontSize:11,color:C.accent,marginTop:1}}>● online</div>
              </div>
              <button onClick={()=>setChatOpen(false)}
                style={{background:C.card2,border:"none",borderRadius:10,width:32,height:32,cursor:"pointer",fontSize:16,color:C.muted}}>×</button>
            </div>

            {/* Messages */}
            <div style={{flex:1,overflowY:"auto",padding:"16px 16px 8px",display:"flex",flexDirection:"column",gap:10}}>
              {/* Welcome message */}
              {chatMessages.length===0&&(
                <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.purple},${C.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>👩‍⚕️</div>
                  <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:"18px 18px 18px 4px",padding:"10px 14px",maxWidth:"78%"}}>
                    <div style={{fontSize:13,color:C.text,lineHeight:1.5}}>Olá! 😊 Aqui você pode tirar dúvidas, compartilhar como está se sentindo ou dar feedbacks sobre o seu plano.</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:4}}>Nutricionista</div>
                  </div>
                </div>
              )}
              {chatMessages.map((msg,i)=>(
                <div key={i} style={{display:"flex",flexDirection:msg.isAluno?"row-reverse":"row",gap:8,alignItems:"flex-end"}}>
                  {!msg.isAluno&&<div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.purple},${C.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>👩‍⚕️</div>}
                  <div style={{background:msg.isAluno?`${C.accent}22`:C.card2,border:`1px solid ${msg.isAluno?C.accent+"44":C.border}`,borderRadius:msg.isAluno?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"10px 14px",maxWidth:"78%"}}>
                    <div style={{fontSize:13,color:C.text,lineHeight:1.5}}>{msg.text}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:4,textAlign:msg.isAluno?"right":"left"}}>{msg.time}</div>
                  </div>
                </div>
              ))}
              {chatSending&&(
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.purple},${C.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>👩‍⚕️</div>
                  <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:"18px 18px 18px 4px",padding:"10px 18px"}}>
                    <div style={{display:"flex",gap:4}}>
                      {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:C.muted,animation:`ring 1.2s ${i*0.2}s infinite`}}/>)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{padding:"12px 16px 32px",borderTop:`1px solid ${C.border}`,display:"flex",gap:10,flexShrink:0}}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)}
                onKeyDown={e=>{
                  if(e.key==="Enter"&&chatInput.trim()){
                    if (!chatInput.trim() || !profile.nutri_id) return;
                    const msgText = chatInput.trim();
                    const now=new Date(); const time=`${now.getHours()}:${String(now.getMinutes()).padStart(2,"0")}`;
                    setChatMessages(ms=>[...ms,{from:"aluno",text:msgText,time}]);
                    setChatInput("");
                    try {
                      await DB.sendMessage(profile.nutri_id, profile.id, profile.id, msgText);
                    } catch(e) { console.error("send message:", e); }
                  }
                }}
                placeholder="Mensagem para sua nutricionista…"
                style={{flex:1,background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:20,padding:"10px 16px",color:C.text,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
              <button onClick={()=>{
                if(!chatInput.trim()) return;
                if (!chatInput.trim() || !profile.nutri_id) return;
                const msgText2 = chatInput.trim();
                const now2=new Date(); const time2=`${now2.getHours()}:${String(now2.getMinutes()).padStart(2,"0")}`;
                setChatMessages(ms=>[...ms,{from:"aluno",text:msgText2,time:time2}]);
                setChatInput("");
                try { await DB.sendMessage(profile.nutri_id, profile.id, profile.id, msgText2); }
                catch(e) { console.error("send:", e); }
              }}
                style={{width:44,height:44,borderRadius:"50%",background:C.accent,border:"none",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                ↑
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
