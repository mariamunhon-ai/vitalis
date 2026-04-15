// src/ui.jsx — shared UI primitives used across all pages

import { useState } from "react"
import { C } from "./constants.js"

export const Btn = ({children,onClick,color=C.accent,full,sm,outline,disabled,loading,style:sx={}}) => (
  <button onClick={onClick} disabled={disabled||loading} style={{width:full?"100%":undefined,background:outline?"transparent":disabled||loading?"#1e293b":color,border:`1.5px solid ${disabled||loading?"#334155":color}`,borderRadius:14,padding:sm?"8px 18px":"14px 24px",color:outline?color:disabled||loading?"#64748b":"#0b0f18",fontWeight:800,fontSize:sm?13:15,cursor:disabled||loading?"not-allowed":"pointer",fontFamily:"inherit",transition:"all 0.15s",...sx}}>
    {loading?"Carregando…":children}
  </button>
);

export const Field = ({label,value,onChange,type="text",placeholder,icon,error}) => (
  <div style={{marginBottom:16}}>
    {label&&<div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{icon} {label}</div>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{width:"100%",background:C.card2,border:`1.5px solid ${error?C.red:C.border}`,borderRadius:14,padding:"13px 16px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
    {error&&<div style={{fontSize:12,color:C.red,marginTop:4}}>{error}</div>}
  </div>
);

export const Chip = ({children,active,onClick,color=C.accent}) => (
  <button onClick={onClick} style={{background:active?`${color}22`:"transparent",border:`1.5px solid ${active?color:C.border}`,borderRadius:100,padding:"7px 16px",color:active?color:C.muted,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>{children}</button>
);

export const Tag = ({label,onRemove,color=C.purple}) => (
  <span style={{display:"inline-flex",alignItems:"center",gap:5,background:`${color}18`,border:`1px solid ${color}44`,borderRadius:100,padding:"4px 11px",fontSize:12,color,fontWeight:600}}>
    {label}{onRemove&&<span onClick={onRemove} style={{cursor:"pointer",opacity:.7,fontSize:14,marginLeft:2}}>×</span>}
  </span>
);

export const Spinner = ({ text="Carregando…" }) => (
  <div style={{display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:64,gap:16}}>
    <div style={{width:40,height:40,border:`3px solid rgba(255,255,255,0.1)`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
    <div style={{fontSize:13,color:C.muted}}>{text}</div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export function MiniChart({data,color=C.accent,height=60}) {
  if (!data||data.length<2) return null;
  const vals = data.map(d=>d.v);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max-min||1;
  const w=300, h=height;
  const pts = vals.map((v,i)=>`${(i/(vals.length-1))*w},${h-((v-min)/range)*(h*0.8)-h*0.1}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{width:"100%",height}} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

export function WaterTracker({water,onChange}) {
  const GOAL=3000;
  const pct=Math.min(100,Math.round((water/GOAL)*100));
  const label=water>=1000?`${(water/1000).toFixed(water%1000===0?0:1)}L`:`${water}ml`;
  const color=water>=GOAL?C.accent:C.blue;
  const STEPS=[0,500,1000,1500,2000,2500,3000,3500,4000,4500,5000];
  return (
    <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:18,marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:15}}>💧 Hidratação</div>
        <div style={{fontSize:13,color,fontWeight:700}}>{label} / 3L</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
        <button onClick={()=>onChange(Math.max(0,water-500))}
          style={{width:44,height:44,borderRadius:12,border:`1.5px solid ${C.border}`,background:C.card2,cursor:"pointer",fontSize:22,color:C.sub,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>-</button>
        <div style={{flex:1,textAlign:"center"}}>
          <div style={{fontSize:28,fontWeight:900,color,lineHeight:1}}>{label}</div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>{water===0?"Registre sua hidratação":water>=GOAL?"✓ Meta atingida!":pct+"% da meta"}</div>
        </div>
        <button onClick={()=>onChange(Math.min(5000,water+500))}
          style={{width:44,height:44,borderRadius:12,border:`1.5px solid ${C.border}`,background:C.card2,cursor:"pointer",fontSize:22,color:C.sub,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
      </div>
      <div style={{display:"flex",gap:3,marginBottom:10}}>
        {STEPS.filter(s=>s>0).map(s=>(
          <button key={s} onClick={()=>onChange(s)}
            style={{flex:1,height:28,borderRadius:6,border:`1.5px solid ${s<=water?color:C.border}`,background:s<=water?`${color}25`:"transparent",cursor:"pointer",fontSize:9,color:s<=water?color:C.muted,fontWeight:700,transition:"all 0.15s",padding:0}}>
            {s>=1000?`${s/1000}L`:s}
          </button>
        ))}
      </div>
      <div style={{background:C.card2,borderRadius:100,height:5,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${C.blue},${color})`,borderRadius:100,transition:"width 0.4s"}}/>
      </div>
    </div>
  );
}
