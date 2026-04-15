// src/constants.js — shared constants, colors, and pure utility functions

export const MONTHS    = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
export const DAYS      = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
export const DAYS_FULL = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
export const MEAL_EMOJIS = ["🌅","🍎","🍽️","🥗","🌙","🥤","🍵","🥑","🥩","🥦","🫙","🥐"];
export const MEAL_NAMES  = ["Café da Manhã","Lanche da Manhã","Almoço","Lanche da Tarde","Jantar","Ceia","Pré-treino","Pós-treino"];
export const TIMES_LIST  = ["06:00","07:00","07:30","08:00","10:00","12:00","12:30","13:00","15:00","15:30","18:00","19:00","20:00","22:00"];

export const HUMOR_OPTS = [
  { v:"otimo",   l:"Ótimo 😄",   c:"#4ade80" },
  { v:"bem",     l:"Bem 🙂",     c:"#86efac" },
  { v:"normal",  l:"Normal 😐",  c:"#fbbf24" },
  { v:"cansado", l:"Cansado 😴", c:"#fb923c" },
  { v:"ansioso", l:"Ansioso 😰", c:"#f87171" },
  { v:"mal",     l:"Mal 😞",     c:"#ef4444" },
];

export const C = {
  bg:"#0b0f18", card:"#131929", card2:"#1a2236", border:"rgba(255,255,255,0.07)",
  accent:"#34d399", purple:"#a78bfa", amber:"#fbbf24", red:"#f87171",
  blue:"#60a5fa", muted:"#64748b", sub:"#94a3b8", text:"#f1f5f9",
};

export const uid        = () => Math.random().toString(36).slice(2,9);
export const todayKey   = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
export const todayDow   = () => new Date().getDay();
export const getLast7Days = () => Array.from({length:7}).map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()-i); const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; return {key:k,label:`${DAYS[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`}; }).reverse();
