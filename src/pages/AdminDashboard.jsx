import { useState, useEffect, useCallback } from "react"
import * as DB from "../lib/supabase.js"
import { C } from "../constants.js"
import { Btn, Spinner } from "../ui.jsx"

export default function AdminDashboard({ profile, onSignOut }) {
  const [tab, setTab]             = useState("nutris");
  const [nutris, setNutris]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState("");
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
      const data = await DB.getAdminNutris();
      setNutris(data);
    } catch(e) {
      setLoadError(e.message || "Erro ao carregar dados.");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const daysUntil = d => d ? Math.ceil((new Date(d)-new Date())/(86400000)) : null;

  const toggleBlock = async (nutri) => {
    const blocked = !nutri.blocked;
    const status  = blocked ? "bloqueado" : "ativo";
    await DB.adminToggleBlock(nutri.id, blocked);
    setNutris(p => p.map(n => n.id===nutri.id ? {...n, blocked, status} : n));
  };

  const savePlan = async (nutri) => {
    setSaving(true);
    const plan = PLANS.find(p=>p.key===editPlan) || PLANS[3];
    const start = new Date();
    const until = new Date(start); until.setMonth(until.getMonth()+plan.months);
    const fmt = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    await DB.adminUpdateNutriPlan(nutri.id, editPlan, fmt(until), fmt(start), editValor);
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
        {loadError&&(
          <div style={{background:`${C.red}15`,border:`1.5px solid ${C.red}44`,borderRadius:14,padding:16,marginBottom:16,textAlign:"center"}}>
            <div style={{color:C.red,fontWeight:700,marginBottom:8}}>&#9888; {loadError}</div>
            <button onClick={()=>{ setLoadError(""); load(); }}
              style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"6px 16px",color:C.text,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
              Tentar novamente
            </button>
          </div>
        )}
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
