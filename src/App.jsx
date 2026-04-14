import { useState, useEffect, useCallback } from "react";
import * as DB from "./lib/supabase.js";

// ─── constants ───────────────────────────────────────────────────────────────
const MONTHS   = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const DAYS     = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const DAYS_FULL= ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
const MEAL_EMOJIS = ["🌅","🍎","🍽️","🥗","🌙","🥤","🍵","🥑","🥩","🥦","🫙","🥐"];
const MEAL_NAMES  = ["Café da Manhã","Lanche da Manhã","Almoço","Lanche da Tarde","Jantar","Ceia","Pré-treino","Pós-treino"];
const TIMES_LIST  = ["06:00","07:00","07:30","08:00","10:00","12:00","12:30","13:00","15:00","15:30","18:00","19:00","20:00","22:00"];
const HUMOR_OPTS  = [
  { v:"otimo",  l:"Ótimo 😄",  c:"#4ade80" },
  { v:"bem",    l:"Bem 🙂",    c:"#86efac" },
  { v:"normal", l:"Normal 😐", c:"#fbbf24" },
  { v:"cansado",l:"Cansado 😴",c:"#fb923c" },
  { v:"ansioso",l:"Ansioso 😰",c:"#f87171" },
  { v:"mal",    l:"Mal 😞",    c:"#ef4444" },
];

const C = {
  bg:"#0b0f18", card:"#131929", card2:"#1a2236", border:"rgba(255,255,255,0.07)",
  accent:"#34d399", purple:"#a78bfa", amber:"#fbbf24", red:"#f87171",
  blue:"#60a5fa", muted:"#64748b", sub:"#94a3b8", text:"#f1f5f9",
};

const uid = () => Math.random().toString(36).slice(2,9);
const todayKey = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const todayDow = () => new Date().getDay();

// ─── UI atoms ────────────────────────────────────────────────────────────────
const Btn = ({children,onClick,color=C.accent,full,sm,outline,disabled,loading,style:sx={}}) => (
  <button onClick={onClick} disabled={disabled||loading} style={{width:full?"100%":undefined,background:outline?"transparent":disabled||loading?"#1e293b":color,border:`1.5px solid ${disabled||loading?"#334155":color}`,borderRadius:14,padding:sm?"8px 18px":"14px 24px",color:outline?color:disabled||loading?"#64748b":"#0b0f18",fontWeight:800,fontSize:sm?13:15,cursor:disabled||loading?"not-allowed":"pointer",fontFamily:"inherit",transition:"all 0.15s",...sx}}>
    {loading?"Carregando…":children}
  </button>
);
const Field = ({label,value,onChange,type="text",placeholder,icon,error}) => (
  <div style={{marginBottom:16}}>
    {label&&<div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{icon} {label}</div>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{width:"100%",background:C.card2,border:`1.5px solid ${error?C.red:C.border}`,borderRadius:14,padding:"13px 16px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
    {error&&<div style={{fontSize:12,color:C.red,marginTop:4}}>{error}</div>}
  </div>
);
const Chip = ({children,active,onClick,color=C.accent}) => (
  <button onClick={onClick} style={{background:active?`${color}22`:"transparent",border:`1.5px solid ${active?color:C.border}`,borderRadius:100,padding:"7px 16px",color:active?color:C.muted,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>{children}</button>
);
const Tag = ({label,onRemove,color=C.purple}) => (
  <span style={{display:"inline-flex",alignItems:"center",gap:5,background:`${color}18`,border:`1px solid ${color}44`,borderRadius:100,padding:"4px 11px",fontSize:12,color,fontWeight:600}}>
    {label}{onRemove&&<span onClick={onRemove} style={{cursor:"pointer",opacity:.7,fontSize:14,marginLeft:2}}>×</span>}
  </span>
);
const Spinner = () => <div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:48,fontSize:32}}>🌀</div>;

function MiniChart({data,color=C.accent,height=60}) {
  if (!data||data.length<2) return null;
  const vals=data.map(d=>d.v), min=Math.min(...vals), max=Math.max(...vals), range=max-min||1;
  const pts=data.map((d,i)=>`${(i/(data.length-1))*100},${height-((d.v-min)/range)*(height-12)-4}`).join(" ");
  return (
    <svg viewBox={`0 0 100 ${height}`} style={{width:"100%",height}} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts}/>
      {data.map((d,i)=>{ const x=(i/(data.length-1))*100,y=height-((d.v-min)/range)*(height-12)-4; return <circle key={i} cx={x} cy={y} r="3.5" fill={color}/>; })}
    </svg>
  );
}

function WaterTracker({water,onChange}) {
  return (
    <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:18,marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontWeight:800,fontSize:15}}>💧 Hidratação</div>
        <div style={{fontSize:13,color:C.blue,fontWeight:700}}>{water}/8 copos</div>
      </div>
      <div style={{display:"flex",gap:5,marginBottom:10}}>
        {Array.from({length:8}).map((_,i)=>(
          <button key={i} onClick={()=>onChange(i<water?i:i+1)}
            style={{flex:1,height:34,borderRadius:8,border:`1.5px solid ${i<water?C.blue:C.border}`,background:i<water?`${C.blue}30`:"transparent",cursor:"pointer",fontSize:13,transition:"all 0.15s"}}>
            {i<water?"💧":"·"}
          </button>
        ))}
      </div>
      <div style={{background:C.card2,borderRadius:100,height:4,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${(water/8)*100}%`,background:`linear-gradient(90deg,${C.blue},${C.accent})`,borderRadius:100,transition:"width 0.4s"}}/>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT — handles auth state
// ════════════════════════════════════════════════════════════════════════════
export default function NutriApp() {
  const [session, setSession] = useState(undefined); // undefined=loading
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    DB.getSession().then(async sess => {
      setSession(sess);
      if (sess?.user) {
        try { setProfile(await DB.getProfile(sess.user.id)); } catch {}
      }
    });
    const { data: { subscription } } = DB.sb.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        try { setProfile(await DB.getProfile(sess.user.id)); } catch {}
      } else {
        setProfile(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:C.text}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center"}}><div style={{fontSize:64,marginBottom:16}}>🥗</div><div style={{color:C.muted}}>Carregando…</div></div>
    </div>
  );

  if (!session) return <AuthScreen onAuth={setProfile}/>;
  if (!profile) return <Spinner/>;
  if (profile.role === "admin") return <AdminDashboard profile={profile} onSignOut={()=>DB.signOut()}/>;
  if (profile.role === "nutricionista") return <NutriDashboard profile={profile} onSignOut={()=>DB.signOut()}/>;
  return <AlunoApp profile={profile} onSignOut={()=>DB.signOut()} onProfileUpdate={setProfile}/>;
}

// ════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
function AdminDashboard({ profile, onSignOut }) {
  const [tab, setTab]             = useState("nutris");
  const [nutris, setNutris]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilter] = useState("todos");
  const [planModal, setPlanModal] = useState(null);
  const [editPlan, setEditPlan]   = useState("anual");
  const [editValor, setEditValor] = useState(599);
  const [saving, setSaving]       = useState(false);

  const PLANS = [
    { key:"mensal",    label:"Mensal",    months:1,  valor:89  },
    { key:"trimestral",label:"Trimestral",months:3,  valor:229 },
    { key:"semestral", label:"Semestral", months:6,  valor:349 },
    { key:"anual",     label:"Anual",     months:12, valor:599 },
  ];
  const statusColor = { ativo:C.accent, vencendo:C.amber, bloqueado:C.red };
  const statusLabel = { ativo:"Ativo", vencendo:"Vencendo", bloqueado:"Bloqueado" };

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await DB.sb.from("profiles")
        .select("id, name, email, plan, plan_valor, start_date, paid_until, status, blocked, created_at")
        .eq("role","nutricionista")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Count alunos per nutri
      const { data: counts } = await DB.sb.from("profiles")
        .select("nutri_id")
        .eq("role","aluno");
      const countMap = {};
      (counts||[]).forEach(r => { if(r.nutri_id) countMap[r.nutri_id]=(countMap[r.nutri_id]||0)+1; });
      setNutris((data||[]).map(n=>({ ...n, alunos: countMap[n.id]||0 })));
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const daysUntil = d => d ? Math.ceil((new Date(d)-new Date())/(86400000)) : null;

  const toggleBlock = async (nutri) => {
    const blocked = !nutri.blocked;
    const status  = blocked ? "bloqueado" : "ativo";
    await DB.sb.from("profiles").update({ blocked, status }).eq("id", nutri.id);
    setNutris(p => p.map(n => n.id===nutri.id ? {...n, blocked, status} : n));
  };

  const savePlan = async (nutri) => {
    setSaving(true);
    const plan = PLANS.find(p=>p.key===editPlan) || PLANS[3];
    const start = new Date();
    const until = new Date(start); until.setMonth(until.getMonth()+plan.months);
    const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    await DB.sb.from("profiles").update({
      plan: editPlan, plan_valor: editValor,
      start_date: fmt(start), paid_until: fmt(until),
      status: "ativo", blocked: false
    }).eq("id", nutri.id);
    setNutris(p => p.map(n => n.id===nutri.id
      ? {...n, plan:editPlan, plan_valor:editValor, start_date:fmt(start), paid_until:fmt(until), status:"ativo", blocked:false}
      : n));
    setSaving(false);
    setPlanModal(null);
  };

  const filtered = nutris
    .filter(n => filterStatus==="todos" || n.status===filterStatus)
    .filter(n => !search || n.name?.toLowerCase().includes(search.toLowerCase()) || n.email?.toLowerCase().includes(search.toLowerCase()));

  const totalMRR = nutris.filter(n=>n.status!=="bloqueado").reduce((s,n)=>{
    const months = PLANS.find(p=>p.key===n.plan)?.months || 1;
    return s + ((n.plan_valor||89)/months);
  },0);
  const totalAlunos = nutris.reduce((s,n)=>s+n.alunos,0);

  return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,maxWidth:520,margin:"0 auto"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Lora:wght@700&display=swap" rel="stylesheet"/>

      {/* Plan modal */}
      {planModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:900,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:C.card,borderRadius:"24px 24px 0 0",padding:"28px 24px 48px",width:"100%",maxWidth:520,maxHeight:"92vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Lora',serif",fontSize:18,fontWeight:700}}>Editar Plano</div>
              <button onClick={()=>setPlanModal(null)} style={{background:C.card2,border:"none",color:C.text,borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:18,fontFamily:"inherit"}}>x</button>
            </div>
            <div style={{background:C.card2,borderRadius:12,padding:14,marginBottom:20}}>
              <div style={{fontWeight:700}}>{planModal.name}</div>
              <div style={{fontSize:12,color:C.muted}}>{planModal.email}</div>
            </div>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Plano</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              {PLANS.map(p=>(
                <button key={p.key} onClick={()=>{setEditPlan(p.key);setEditValor(p.valor);}}
                  style={{background:editPlan===p.key?`${C.amber}20`:"transparent",border:`1.5px solid ${editPlan===p.key?C.amber:C.border}`,borderRadius:14,padding:"12px 10px",cursor:"pointer",fontFamily:"inherit",color:editPlan===p.key?C.amber:C.sub,textAlign:"center"}}>
                  <div style={{fontWeight:800,fontSize:14}}>{p.label}</div>
                  <div style={{fontSize:12,marginTop:2,color:C.muted}}>{p.months} {p.months===1?"mes":"meses"}</div>
                </button>
              ))}
            </div>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Valor cobrado (R$)</div>
            <input type="number" value={editValor} onChange={e=>setEditValor(Number(e.target.value))}
              style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 14px",color:C.text,fontSize:16,fontWeight:700,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:20}}/>
            <Btn color={C.amber} full loading={saving} onClick={()=>savePlan(planModal)}>Confirmar pagamento e ativar</Btn>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{padding:"52px 24px 20px",background:`linear-gradient(180deg,#0d1a2d 0%,${C.bg} 100%)`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:11,color:C.amber,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Painel Admin</div>
            <div style={{fontFamily:"'Lora',serif",fontSize:24,fontWeight:700}}>Vitalis Admin</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>{profile.email}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:C.muted}}>MRR est.</div>
            <div style={{fontSize:22,fontWeight:900,color:C.amber}}>R$ {Math.round(totalMRR)}</div>
            <button onClick={onSignOut} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:11,fontFamily:"inherit",marginTop:4}}>Sair</button>
          </div>
        </div>
        {/* KPI cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginTop:16}}>
          {[
            {label:"Total",val:nutris.length,color:C.accent},
            {label:"Ativos",val:nutris.filter(n=>n.status==="ativo").length,color:C.accent},
            {label:"Vencendo",val:nutris.filter(n=>n.status==="vencendo").length,color:C.amber},
            {label:"Bloqueados",val:nutris.filter(n=>n.status==="bloqueado").length,color:C.red},
          ].map(({label,val,color})=>(
            <div key={label} style={{background:C.card,border:`1.5px solid ${color}33`,borderRadius:14,padding:"10px 0",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:900,color}}>{val}</div>
              <div style={{fontSize:9,color:C.muted,marginTop:1}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:8,padding:"0 20px 16px",overflowX:"auto"}}>
        {[["nutris","Profissionais"],["metricas","Metricas"]].map(([k,lb])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{background:tab===k?`${C.amber}18`:"transparent",border:`1.5px solid ${tab===k?C.amber:C.border}`,borderRadius:100,padding:"8px 18px",color:tab===k?C.amber:C.muted,fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"}}>
            {lb}
          </button>
        ))}
      </div>

      <div style={{padding:"0 20px 60px"}}>
        {tab==="nutris"&&(
          <div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome ou e-mail..."
              style={{width:"100%",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 16px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:12}}/>
            <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
              {[["todos","Todos"],["ativo","Ativos"],["vencendo","Vencendo"],["bloqueado","Bloqueados"]].map(([k,lb])=>(
                <button key={k} onClick={()=>setFilter(k)}
                  style={{background:filterStatus===k?`${statusColor[k]||C.accent}20`:"transparent",border:`1.5px solid ${filterStatus===k?statusColor[k]||C.accent:C.border}`,borderRadius:100,padding:"6px 14px",color:filterStatus===k?statusColor[k]||C.accent:C.muted,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                  {lb}
                </button>
              ))}
            </div>
            {loading ? <Spinner/> : filtered.length===0
              ? <div style={{textAlign:"center",color:C.muted,padding:"40px 0"}}>Nenhum resultado</div>
              : filtered.map(n=>{
                const days = daysUntil(n.paid_until);
                const sc = statusColor[n.status] || C.muted;
                return (
                  <div key={n.id} style={{background:C.card,border:`1.5px solid ${n.status==="vencendo"?C.amber+"55":n.status==="bloqueado"?C.red+"44":C.border}`,borderRadius:20,padding:"18px 20px",marginBottom:14}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
                      <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${C.purple},${C.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:C.bg,flexShrink:0}}>{(n.name||"?")[0].toUpperCase()}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:800,fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.name||"—"}</div>
                        <div style={{fontSize:12,color:C.muted,marginTop:1}}>{n.email}</div>
                      </div>
                      <div style={{background:`${sc}20`,border:`1.5px solid ${sc}55`,borderRadius:100,padding:"3px 10px",fontSize:11,color:sc,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>
                        {statusLabel[n.status]||n.status}
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                      {[
                        {label:"Alunos",val:n.alunos,color:C.accent},
                        {label:"Plano",val:(n.plan||"—").charAt(0).toUpperCase()+(n.plan||"").slice(1),color:C.purple},
                        {label:days===null?"Sem plano":days>=0?"Restam":"Vencido",val:days===null?"—":`${Math.abs(days)}d`,color:days!==null&&days<=7?C.red:days!==null&&days<=30?C.amber:C.muted},
                      ].map(({label,val,color})=>(
                        <div key={label} style={{background:C.card2,borderRadius:12,padding:"10px 0",textAlign:"center"}}>
                          <div style={{fontSize:15,fontWeight:900,color}}>{val}</div>
                          <div style={{fontSize:10,color:C.muted,marginTop:1}}>{label}</div>
                        </div>
                      ))}
                    </div>
                    {n.paid_until&&n.status!=="bloqueado"&&(
                      <div style={{marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginBottom:4}}>
                          <span>Pago ate {n.paid_until.slice(8)}/{n.paid_until.slice(5,7)}/{n.paid_until.slice(0,4)}</span>
                          {days!==null&&<span style={{color:days<=30?C.amber:C.muted}}>{days}d restantes</span>}
                        </div>
                        <div style={{background:C.card2,borderRadius:100,height:5,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${Math.max(2,Math.min(100,(days||0)/365*100))}%`,background:days!==null&&days<=30?C.amber:C.accent,borderRadius:100}}/>
                        </div>
                      </div>
                    )}
                    <div style={{display:"flex",gap:8}}>
                      <Btn color={C.amber} sm full onClick={()=>{setEditPlan(n.plan||"anual");setEditValor(n.plan_valor||89);setPlanModal(n);}}>Editar plano</Btn>
                      <button onClick={()=>toggleBlock(n)}
                        style={{background:n.blocked?`${C.accent}15`:`${C.red}12`,border:`1.5px solid ${n.blocked?C.accent+"44":C.red+"44"}`,borderRadius:12,padding:"8px 14px",color:n.blocked?C.accent:C.red,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                        {n.blocked?"Desbloquear":"Bloquear"}
                      </button>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}
        {tab==="metricas"&&(
          <div>
            {/* Revenue by plan */}
            <div style={{background:C.card,border:`1.5px solid ${C.amber}33`,borderRadius:20,padding:20,marginBottom:16}}>
              <div style={{fontWeight:800,fontSize:16,marginBottom:16}}>Receita por plano</div>
              {["anual","semestral","trimestral","mensal"].map(pk=>{
                const grupo=nutris.filter(n=>n.plan===pk&&n.status!=="bloqueado");
                if(!grupo.length)return null;
                const total=grupo.reduce((s,n)=>s+(n.plan_valor||0),0);
                return(
                  <div key={pk} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div>
                      <div style={{fontWeight:700,textTransform:"capitalize"}}>{pk}</div>
                      <div style={{fontSize:12,color:C.muted}}>{grupo.length} profissional{grupo.length>1?"is":""}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:900,fontSize:16,color:C.amber}}>R$ {total}</div>
                      <div style={{fontSize:11,color:C.muted}}>total contrato</div>
                    </div>
                  </div>
                );
              })}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14}}>
                <div style={{fontWeight:700}}>MRR estimado</div>
                <div style={{fontWeight:900,fontSize:20,color:C.amber}}>R$ {Math.round(totalMRR)}/mes</div>
              </div>
            </div>
            {/* Alunos per nutri */}
            <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:16}}>
              <div style={{fontWeight:800,fontSize:16,marginBottom:16}}>Alunos por profissional</div>
              {[...nutris].sort((a,b)=>b.alunos-a.alunos).map(n=>(
                <div key={n.id} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:13,fontWeight:600,color:n.status==="bloqueado"?C.muted:C.text}}>{(n.name||n.email||"?").split(" ").slice(0,2).join(" ")}</span>
                    <span style={{fontSize:13,fontWeight:800,color:n.alunos>=15?C.accent:C.purple}}>{n.alunos} alunos</span>
                  </div>
                  <div style={{background:C.card2,borderRadius:100,height:7,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${Math.max(2,(n.alunos/Math.max(20,nutris.reduce((m,x)=>Math.max(m,x.alunos),1)))*100)}%`,background:n.status==="bloqueado"?C.border:n.alunos>=15?`linear-gradient(90deg,${C.accent},${C.purple})`:C.purple,borderRadius:100,opacity:n.status==="bloqueado"?.4:1}}/>
                  </div>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
                <span style={{fontWeight:700}}>Total de alunos</span>
                <span style={{fontWeight:900,fontSize:16,color:C.accent}}>{totalAlunos}</span>
              </div>
            </div>
            {/* Upcoming renewals */}
            <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20}}>
              <div style={{fontWeight:800,fontSize:16,marginBottom:14}}>Renovacoes proximas (30 dias)</div>
              {nutris.filter(n=>{const d=daysUntil(n.paid_until);return d!==null&&d>=0&&d<=30;}).length===0
                ?<div style={{color:C.muted,fontSize:13}}>Nenhuma renovacao nos proximos 30 dias</div>
                :nutris.filter(n=>{const d=daysUntil(n.paid_until);return d!==null&&d>=0&&d<=30;})
                  .sort((a,b)=>daysUntil(a.paid_until)-daysUntil(b.paid_until))
                  .map(n=>(
                    <div key={n.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                      <div>
                        <div style={{fontWeight:700,fontSize:13}}>{(n.name||n.email||"?").split(" ").slice(0,2).join(" ")}</div>
                        <div style={{fontSize:11,color:C.muted}}>Vence {n.paid_until?.slice(8)}/{n.paid_until?.slice(5,7)} - {n.plan||"—"}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontWeight:900,color:daysUntil(n.paid_until)<=7?C.red:C.amber}}>{daysUntil(n.paid_until)}d</div>
                        <div style={{fontSize:11,color:C.muted}}>R$ {n.plan_valor||0}</div>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// AUTH SCREEN — Login + Cadastro
// ════════════════════════════════════════════════════════════════════════════
function AuthScreen({ onAuth }) {
  const [mode, setMode]       = useState("login"); // login | signup
  const [role, setRole]       = useState("aluno");
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [nutriCode, setNutriCode] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        await DB.signIn({ email, password });
      } else {
        if (!name.trim()) throw new Error("Digite seu nome.");
        await DB.signUp({ email, password, name, role, nutriCode });
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
        <div style={{color:C.muted,marginTop:6,fontSize:14}}>Acompanhamento nutricional inteligente</div>
      </div>

      <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:24,padding:28}}>
        {/* Mode toggle */}
        <div style={{display:"flex",background:C.card2,borderRadius:14,padding:4,marginBottom:24}}>
          {[["login","Entrar"],["signup","Cadastrar"]].map(([m,l])=>(
            <button key={m} onClick={()=>setMode(m)} style={{flex:1,background:mode===m?C.accent:"transparent",border:"none",borderRadius:11,padding:"10px 0",color:mode===m?C.bg:C.muted,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>{l}</button>
          ))}
        </div>

        {mode==="signup"&&(
          <>
            <Field label="Nome completo" icon="👤" value={name} onChange={setName} placeholder="Seu nome"/>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Perfil</div>
              <div style={{display:"flex",gap:10}}>
                <Chip active={role==="aluno"} onClick={()=>setRole("aluno")} color={C.accent}>🏃 Sou Aluno(a)</Chip>
                <Chip active={role==="nutricionista"} onClick={()=>setRole("nutricionista")} color={C.purple}>👩‍⚕️ Sou Nutricionista</Chip>
              </div>
            </div>
          </>
        )}

        <Field label="E-mail" icon="📧" type="email" value={email} onChange={setEmail} placeholder="seu@email.com"/>
        <Field label="Senha" icon="🔒" type="password" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres"/>

        {mode==="signup"&&role==="aluno"&&(
          <Field label="Código da nutricionista (opcional)" icon="🔑" value={nutriCode} onChange={setNutriCode} placeholder="Cole o código que sua nutricionista te enviou"/>
        )}

        {error&&<div style={{background:`${C.red}15`,border:`1.5px solid ${C.red}44`,borderRadius:12,padding:"10px 14px",fontSize:14,color:C.red,marginBottom:16}}>{error}</div>}

        <Btn onClick={submit} color={role==="nutricionista"?C.purple:C.accent} full loading={loading}>
          {mode==="login"?"Entrar →":role==="nutricionista"?"Criar conta de Nutricionista":"Criar conta de Aluno"}
        </Btn>

        {mode==="signup"&&role==="nutricionista"&&(
          <div style={{background:`${C.purple}12`,border:`1.5px solid ${C.purple}33`,borderRadius:12,padding:12,marginTop:14,fontSize:13,color:C.sub,lineHeight:1.6}}>
            🔑 Após criar sua conta, seu <strong style={{color:C.text}}>ID de usuário</strong> será o código para seus alunos se cadastrarem vinculados a você. Você encontra esse código em Configurações.
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// NUTRICIONISTA DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
function NutriDashboard({ profile, onSignOut }) {
  const [alunos, setAlunos]       = useState([]);
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState("alunos"); // alunos | aluno_detail

  useEffect(() => {
    DB.getMyAlunos().then(a => { setAlunos(a); setLoading(false); });
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
            <div style={{fontFamily:"'Lora',serif",fontSize:26,fontWeight:700}}>Olá, {profile.name.split(" ")[0]}! 👩‍⚕️</div>
          </div>
          <button onClick={onSignOut} style={{background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"8px 14px",color:C.muted,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Sair</button>
        </div>

        {/* Invite code */}
        <div style={{background:`${C.purple}15`,border:`1.5px solid ${C.purple}33`,borderRadius:16,padding:16,marginTop:20}}>
          <div style={{fontSize:12,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>🔑 Seu código de convite</div>
          <div style={{fontFamily:"monospace",fontSize:13,color:C.text,wordBreak:"break-all",marginBottom:8}}>{profile.id}</div>
          <button onClick={()=>navigator.clipboard?.writeText(profile.id)} style={{background:C.purple,border:"none",borderRadius:10,padding:"6px 14px",color:C.bg,fontWeight:800,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Copiar e enviar para aluno</button>
        </div>
      </div>

      <div style={{padding:"0 20px 120px"}}>
        <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:16}}>{alunos.length} aluno{alunos.length!==1?"s":""} vinculado{alunos.length!==1?"s":""}</div>

        {loading&&<Spinner/>}

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
              {a.name[0].toUpperCase()}
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
      await DB.saveWeekDiet(aluno.id, wd);
      await DB.saveMeds(aluno.id, ms);
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

// ════════════════════════════════════════════════════════════════════════════
// ALUNO APP
// ════════════════════════════════════════════════════════════════════════════
function AlunoApp({ profile, onSignOut, onProfileUpdate }) {
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
  const [saving, setSaving]     = useState(false);

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

  const handlePhoto = (e,mealId) => {
    const file=e.target.files?.[0]; if(!file)return;
    const r=new FileReader(); r.onload=ev=>{
      const newLog={...todayLog,[mealId]:{...(todayLog[mealId]||{}),photo:ev.target.result}};
      persistLog(newLog);
    }; r.readAsDataURL(file);
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

  const getDayPct = (key=tk) => {
    const d=new Date(key+"T12:00:00"), dow=d.getDay();
    const meals=weekDiet[dow]||weekDiet["base"]||[];
    let total=0,done=0;
    meals.forEach(m=>m.foods?.forEach(f=>{ total++; if(todayLog?.[m.id]?.[f.id]==="ok")done++; }));
    return total===0?0:Math.round((done/total)*100);
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
            <button onClick={()=>(mealModal.foods||[]).forEach(f=>{ if(!getFoodStatus(mealModal.id,f.id))toggleFood(mealModal.id,f.id,"skip"); })}
              style={{width:"100%",background:`${C.red}12`,border:`1.5px dashed ${C.red}44`,borderRadius:14,padding:12,color:C.red,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:4,marginBottom:20}}>
              😓 Não consegui fazer esta refeição
            </button>
            <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>📷 Foto do prato</div>
            {todayLog[mealModal.id]?.photo?(
              <div style={{position:"relative"}}>
                <img src={todayLog[mealModal.id].photo} alt="" style={{width:"100%",borderRadius:16,maxHeight:220,objectFit:"cover"}}/>
                <label style={{position:"absolute",bottom:10,right:10,background:"rgba(0,0,0,0.65)",borderRadius:10,padding:"6px 14px",cursor:"pointer",fontSize:12,fontWeight:700,color:"#fff",display:"inline-block"}}>
                  Trocar<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>handlePhoto(e,mealModal.id)}/>
                </label>
              </div>
            ):(
              <label style={{display:"block",width:"100%",background:C.card2,border:`2px dashed ${C.border}`,borderRadius:16,padding:28,color:C.muted,cursor:"pointer",fontSize:14,textAlign:"center",boxSizing:"border-box"}}>
                + Adicionar foto do prato<input type="file" accept="image/*" style={{display:"none"}} onChange={e=>handlePhoto(e,mealModal.id)}/>
              </label>
            )}
          </div>
        </div>
      )}

      {/* Measure Modal */}
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

      {loading&&<Spinner/>}

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
                <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:C.bg}}>{profile.name[0].toUpperCase()}</div>
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

// ════════════════════════════════════════════════════════════════════════════
// WEEK DIET BUILDER (shared between aluno and nutricionista view)
// ════════════════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════════════════
// MEAL EDITOR
// ════════════════════════════════════════════════════════════════════════════
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
