import { useState, useEffect, useCallback } from "react"
import * as DB from "../lib/supabase.js"
import { C, MONTHS, DAYS, HUMOR_OPTS, todayKey, todayDow } from "../constants.js"
import { Btn, Spinner, MiniChart, WaterTracker } from "../ui.jsx"

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

  const tk  = todayKey();
  const dow = todayDow();
  const todayMeals = weekDiet[dow] || weekDiet["base"] || [];

  useEffect(() => {
    const load = async () => {
      const [wd, ms, tl, di, me] = await Promise.all([
        DB.getWeekDiet(profile.id),
        DB.getMeds(profile.id),
        DB.getDayLog(profile.id, tk),
        DB.getDiary(profile.id),
        DB.getMeasurements(profile.id),
      ]);
      setWeekDiet(wd); setMeds(ms); setTodayLog(tl); setDiary(di); setMeasurements(me);
      if (profile.nutri_id) {
        const [n, nn] = await Promise.all([DB.getProfile(profile.nutri_id), DB.getNutriNotes(profile.nutri_id, profile.id)]);
        setNutri(n); setNutriNotes(nn);
      }
      setLoading(false);
    };
    load();

    // med alert
    const check = () => { const now=new Date(),hm=now.getHours()*60+now.getMinutes(); meds.forEach(med=>med.times?.forEach(t=>{ const [h,m]=t.split(":").map(Number); if(Math.abs(hm-(h*60+m))<=5)setMedAlert(med); })); };
    check(); const iv=setInterval(check,60000); return ()=>clearInterval(iv);
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
                  <button onClick={()=>toggleFood(mealModal.id,f.id,"ok")} style={{background:st==="ok"?C.accent:`${C.accent}18`,border:`1.5px solid ${C.accent}`,color:st==="ok"?C.bg:C.accent,borderRadius:10,padding:"7px 16px",cursor:"pointer",fontWeight:800,fontSize:13,fontFamily:"inherit"}}>✓</button>
                  <button onClick={()=>toggleFood(mealModal.id,f.id,"skip")} style={{background:st==="skip"?C.red:`${C.red}18`,border:`1.5px solid ${C.red}`,color:st==="skip"?"#fff":C.red,borderRadius:10,padding:"7px 12px",cursor:"pointer",fontWeight:800,fontSize:14,fontFamily:"inherit"}}>✕</button>
                </div>
              </div>
            ); })}
           <button
  onClick={() => (mealModal.foods || []).forEach(f => {
    if (!getFoodStatus(mealModal.id, f.id)) toggleFood(mealModal.id, f.id, "skip");
  })}
  style={{
    width: "100%",
    background: `${C.red}12`,
    border: `1.5px dashed ${C.red}44`,
    borderRadius: 14,
    padding: 12,
    color: C.red,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
    marginTop: 4,
    marginBottom: 20
  }}
>
  😓 Não consegui fazer esta refeição
</button>

<div style={{ fontSize: 12, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
  📷 Foto do prato
</div>

{todayLog[mealModal.id]?.photo ? (
  <div style={{ position: "relative" }}>
    <img
      src={todayLog[mealModal.id].photo}
      alt=""
      style={{ width: "100%", borderRadius: 16, maxHeight: 220, objectFit: "cover" }}
    />
    <label
      style={{
        position: "absolute",
        bottom: 10,
        right: 10,
        background: "rgba(0,0,0,0.65)",
        borderRadius: 10,
        padding: "6px 14px",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 700,
        color: "#fff",
        display: "inline-block"
      }}
    >
      Trocar
      <input type="file" accept="image/*" style={{ display: "none" }} />
    </label>
  </div>
) : null}

{measureModal && (
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
            {[...measurements].reverse().map((m,i)=>(
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

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(11,15,24,0.97)",backdropFilter:"blur(20px)",borderTop:`1px solid ${C.border}`,padding:"12px 24px 30px",display:"flex",justifyContent:"space-around"}}>
        {[["hoje","🍽️","Hoje"],["diario","📓","Diário"],["medidas","📊","Medidas"],["config","⚙️","Config"]].map(([k,ic,lb])=>(
          <button key={k} onClick={()=>setView(k)} style={{background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",color:view===k?C.accent:C.muted,fontWeight:view===k?800:600,fontSize:11,padding:0,fontFamily:"inherit"}}>
            <span style={{fontSize:22}}>{ic}</span>{lb}
          </button>
        ))}
      </div>
      <style>{`@keyframes ring{0%,100%{box-shadow:0 0 0 0 rgba(251,191,36,.5)}50%{box-shadow:0 0 0 20px rgba(251,191,36,0)}}*{-webkit-tap-highlight-color:transparent}::-webkit-scrollbar{width:0}`}</style>
    </div>
  );
}
