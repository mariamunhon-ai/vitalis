import { useState, useEffect, useRef } from "react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:"#080c14", card:"#0f1623", card2:"#171f30", card3:"#1c2640",
  border:"rgba(255,255,255,0.06)", borderHover:"rgba(255,255,255,0.12)",
  accent:"#2dd4bf", accentDark:"#0d9488",
  purple:"#a78bfa", purpleDark:"#7c3aed",
  amber:"#fbbf24", red:"#f87171", blue:"#60a5fa", pink:"#f472b6",
  green:"#4ade80", orange:"#fb923c",
  muted:"#4b5563", sub:"#9ca3af", text:"#f0f4f8",
};

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS    = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const DAYS      = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const DAYS_FULL = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
const HUMOR_OPTS = [
  {v:"otimo",l:"Ótimo 😄",c:"#4ade80"},{v:"bem",l:"Bem 🙂",c:"#86efac"},
  {v:"normal",l:"Normal 😐",c:"#fbbf24"},{v:"cansado",l:"Cansado 😴",c:"#fb923c"},
  {v:"ansioso",l:"Ansioso 😰",c:"#f87171"},{v:"mal",l:"Mal 😞",c:"#ef4444"},
];
const MEAL_EMOJIS = ["🌅","🍎","🍽️","🥗","🌙","🥤","🍵","🥑","🥩","🥦","🫙","🥐"];
const MEAL_NAMES  = ["Café da Manhã","Lanche da Manhã","Almoço","Lanche da Tarde","Jantar","Ceia","Pré-treino","Pós-treino"];

// ─── Suggested meal plans by goal ────────────────────────────────────────────
const SUGGESTED_DIETS = {
  "Emagrecimento": [
    {id:"sg1",name:"Café da Manhã",time:"07:30",emoji:"🌅",foods:[{id:"sf1",name:"Ovos mexidos",qty:"2 unidades"},{id:"sf2",name:"Pão integral",qty:"1 fatia"},{id:"sf3",name:"Café preto",qty:"200ml"}]},
    {id:"sg2",name:"Lanche da Manhã",time:"10:00",emoji:"🍎",foods:[{id:"sf4",name:"Maçã",qty:"1 unidade"},{id:"sf5",name:"Castanhas",qty:"20g"}]},
    {id:"sg3",name:"Almoço",time:"12:30",emoji:"🍽️",foods:[{id:"sf6",name:"Frango grelhado",qty:"150g"},{id:"sf7",name:"Salada verde",qty:"à vontade"},{id:"sf8",name:"Arroz integral",qty:"2 colheres"}]},
    {id:"sg4",name:"Lanche da Tarde",time:"15:30",emoji:"🥗",foods:[{id:"sf9",name:"Iogurte grego",qty:"170g"},{id:"sf10",name:"Frutas vermelhas",qty:"50g"}]},
    {id:"sg5",name:"Jantar",time:"19:00",emoji:"🌙",foods:[{id:"sf11",name:"Peixe ao forno",qty:"130g"},{id:"sf12",name:"Legumes cozidos",qty:"150g"}]},
  ],
  "Ganho de massa": [
    {id:"sg1",name:"Café da Manhã",time:"07:00",emoji:"🌅",foods:[{id:"sf1",name:"Aveia",qty:"80g"},{id:"sf2",name:"Banana",qty:"2 unidades"},{id:"sf3",name:"Ovos",qty:"3 unidades"},{id:"sf4",name:"Leite integral",qty:"300ml"}]},
    {id:"sg2",name:"Lanche da Manhã",time:"10:00",emoji:"🥤",foods:[{id:"sf5",name:"Whey protein",qty:"30g"},{id:"sf6",name:"Amendoim",qty:"40g"}]},
    {id:"sg3",name:"Almoço",time:"12:30",emoji:"🍽️",foods:[{id:"sf7",name:"Frango",qty:"200g"},{id:"sf8",name:"Arroz",qty:"6 colheres"},{id:"sf9",name:"Feijão",qty:"2 conchas"},{id:"sf10",name:"Batata doce",qty:"150g"}]},
    {id:"sg4",name:"Pré-treino",time:"16:00",emoji:"🏋️",foods:[{id:"sf11",name:"Banana",qty:"2 unidades"},{id:"sf12",name:"Pasta de amendoim",qty:"2 col sopa"}]},
    {id:"sg5",name:"Pós-treino",time:"18:30",emoji:"🥤",foods:[{id:"sf13",name:"Whey protein",qty:"40g"},{id:"sf14",name:"Maltodextrina",qty:"30g"}]},
    {id:"sg6",name:"Jantar",time:"20:00",emoji:"🌙",foods:[{id:"sf15",name:"Carne vermelha magra",qty:"180g"},{id:"sf16",name:"Macarrão integral",qty:"100g"}]},
  ],
  "Saúde geral": [
    {id:"sg1",name:"Café da Manhã",time:"07:30",emoji:"🌅",foods:[{id:"sf1",name:"Tapioca",qty:"1 unidade"},{id:"sf2",name:"Queijo branco",qty:"50g"},{id:"sf3",name:"Suco natural",qty:"200ml"}]},
    {id:"sg2",name:"Almoço",time:"12:30",emoji:"🍽️",foods:[{id:"sf4",name:"Arroz integral",qty:"4 colheres"},{id:"sf5",name:"Feijão",qty:"2 conchas"},{id:"sf6",name:"Proteína variada",qty:"150g"},{id:"sf7",name:"Salada",qty:"à vontade"}]},
    {id:"sg3",name:"Lanche da Tarde",time:"15:30",emoji:"🍎",foods:[{id:"sf8",name:"Fruta da estação",qty:"1 unidade"},{id:"sf9",name:"Iogurte",qty:"150g"}]},
    {id:"sg4",name:"Jantar",time:"19:00",emoji:"🌙",foods:[{id:"sf10",name:"Sopa de legumes",qty:"300ml"},{id:"sf11",name:"Pão integral",qty:"2 fatias"}]},
  ],
};

// ─── Demo data ────────────────────────────────────────────────────────────────
const tk = (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();

const DEMO_ALUNOS = [
  {id:"a1",name:"Ana Carolina Silva",  email:"ana@email.com",  goal:"Emagrecimento", lastSeen:tk,        adherence7d:82, alerts:0},
  {id:"a2",name:"Pedro Henrique Lima", email:"pedro@email.com",goal:"Ganho de massa", lastSeen:"2026-04-04",adherence7d:45, alerts:1},
  {id:"a3",name:"Juliana Ferreira",    email:"ju@email.com",   goal:"Saúde geral",   lastSeen:"2026-04-06",adherence7d:71, alerts:0},
  {id:"a4",name:"Rafael Moura",        email:"rafael@email.com",goal:"Condicionamento",lastSeen:tk,       adherence7d:91, alerts:0},
];

const DEMO_TEMPLATES = [
  {id:"t1", name:"Protocolo Emagrecimento", goal:"Emagrecimento", meals: SUGGESTED_DIETS["Emagrecimento"]},
  {id:"t2", name:"Protocolo Ganho de Massa", goal:"Ganho de massa", meals: SUGGESTED_DIETS["Ganho de massa"]},
  {id:"t3", name:"Dieta Low Carb", goal:"Emagrecimento", meals: SUGGESTED_DIETS["Saúde geral"]},
];

const DEMO_MEASUREMENTS = [
  {id:"m1",date:"01/01/2026",by:"nutri",peso:"72.5",altura:"165",cintura:"82",quadril:"98",braco:"33",antebraco:"22",coxa:"57",panturrilha:"36",pescoco:"34",torax:"90",abdomen:"88",
   dc_triceps:"18",dc_subescapular:"16",dc_suprailiaca:"20",dc_abdominal:"24",dc_coxa:"22",dc_peitoral:"14",dc_axilar:"15",protocolo:"pollock7",sex:"F",age:"30"},
  {id:"m2",date:"01/02/2026",by:"nutri",peso:"70.8",altura:"165",cintura:"80",quadril:"96",braco:"32",antebraco:"21",coxa:"56",panturrilha:"36",pescoco:"34",torax:"89",abdomen:"85",
   dc_triceps:"16",dc_subescapular:"14",dc_suprailiaca:"18",dc_abdominal:"21",dc_coxa:"20",dc_peitoral:"12",dc_axilar:"13",protocolo:"pollock7",sex:"F",age:"30"},
  {id:"m3",date:"07/04/2026",by:"nutri",peso:"67.9",altura:"165",cintura:"76",quadril:"93",braco:"31",antebraco:"21",coxa:"54",panturrilha:"35",pescoco:"33",torax:"88",abdomen:"80",
   dc_triceps:"14",dc_subescapular:"12",dc_suprailiaca:"15",dc_abdominal:"18",dc_coxa:"17",dc_peitoral:"10",dc_axilar:"11",protocolo:"pollock7",sex:"F",age:"30"},
];

const DEMO_LOGS_TODAY = {
  sg1:{sf1:"ok",sf2:"ok",sf3:"ok"},
  sg2:{sf4:"ok",sf5:"skip"},
  sg3:{sf6:"ok",sf7:"ok",sf8:"ok",sf9:"ok"},
  humor:"bem", water:2500,
};

const DEMO_WEEK_LOGS = {
  [tk]:        {adherence:85,humor:"bem",    water:2500},
  "2026-04-06":{adherence:60,humor:"cansado",water:2000},
  "2026-04-05":{adherence:100,humor:"otimo", water:3000},
  "2026-04-04":{adherence:75,humor:"normal", water:2500},
  "2026-04-03":{adherence:90,humor:"bem",    water:3500},
  "2026-04-02":{adherence:50,humor:"ansioso",water:1500},
  "2026-04-01":{adherence:80,humor:"bem",    water:3000},
};

const DEMO_PHOTOS = [
  {id:"ph1", date:"2026-02-01", label:"Início", url:null},
  {id:"ph2", date:"2026-03-01", label:"1 mês",  url:null},
  {id:"ph3", date:"2026-04-01", label:"2 meses", url:null},
];

const DEMO_FREE_FOODS = [
  {id:"ff1", date:tk, time:"10:30", text:"Comi um biscoito integral no trabalho — 2 unidades", type:"extra"},
  {id:"ff2", date:tk, time:"16:00", text:"Tomei um suco de laranja natural (300ml)", type:"extra"},
  {id:"ff3", date:"2026-04-07", time:"20:00", text:"Pizza no jantar com família 🍕 — fugi do cardápio", type:"desvio"},
];

const DEMO_PRIVATE_NOTES = [
  {id:"pn1", date:"2026-04-07", text:"Ana está se sentindo pressionada pelo cronograma. Aumentar proteína gradualmente. Próxima consulta foco em gestão de ansiedade alimentar.", emoji:"🔒"},
  {id:"pn2", date:"2026-03-15", text:"Exames mostraram ferritina baixa. Reforçar alimentos ricos em ferro. Sugerir suplementação de B12.", emoji:"🩸"},
];

const DEMO_DIARY = {
  [tk]:{entries:[{text:"Hoje me senti bem disposta! Consegui fazer todas as refeições no horário certo. O almoço ficou delicioso.",time:"20:15"}]},
  "2026-04-05":{entries:[{text:"Finalmente consegui fazer a salada de atum que a Dra. Mariana sugeriu. Amei!",time:"19:45"}]},
};

const DEMO_NUTRI_NOTES = [
  {note_date:tk, text:"Ana, parabéns pela evolução! Continue caprichando na proteína do jantar. Você está no caminho certo! 💪"},
  {note_date:"2026-04-01", text:"Lembre de beber água antes de cada refeição. Vai ajudar com a saciedade."},
];

const DEMO_CHAT = [
  {id:"c1", from:"nutri", text:"Oi Ana! Vi que você bateu 100% ontem, parabéns! 🎉", time:"08:12", date:tk},
  {id:"c2", from:"aluno", text:"Obrigada Dra! Tô me sentindo muito mais disposta essa semana", time:"08:45", date:tk},
  {id:"c3", from:"nutri", text:"Ótimo sinal! Lembre de tomar água antes de cada refeição. Você chegou a 3L ontem?", time:"09:01", date:tk},
  {id:"c4", from:"aluno", text:"Cheguei a 2.5L… tentei mas esqueci no final do dia 😅", time:"09:10", date:tk},
  {id:"c5", from:"nutri", text:"Sem problema! Coloca um alarme às 20h para o último gole. Vai ajudar muito!", time:"09:15", date:tk},
];

const DEMO_BADGES = [
  {id:"b1", icon:"🔥", name:"Streak de 5 dias", desc:"Registrou refeições 5 dias seguidos", earned:true, date:"07/04"},
  {id:"b2", icon:"💧", name:"Hidratação perfeita", desc:"Atingiu 3L em 3 dias consecutivos", earned:true, date:"05/04"},
  {id:"b3", icon:"💪", name:"Avaliação completa", desc:"Fez avaliação antropométrica", earned:true, date:"01/03"},
  {id:"b4", icon:"🥗", name:"Semana impecável", desc:"100% de adesão por 7 dias seguidos", earned:false, progress:5, total:7},
  {id:"b5", icon:"🏆", name:"30 dias no Vitalis", desc:"Complete 30 dias de uso contínuo", earned:false, progress:22, total:30},
  {id:"b6", icon:"⚖️", name:"Meta de peso", desc:"Atingiu a meta de peso estabelecida", earned:false, progress:60, total:100},
];

const DEMO_ADMIN_NUTRIS = [
  {id:"n1", name:"Dra. Mariana Costa",    email:"mariana@nutri.com",  alunos:12, plan:"anual",   planMonths:12, startDate:"2026-01-10", paidUntil:"2027-01-10", status:"ativo",    lastAccess:tk,           valor:599},
  {id:"n2", name:"Dr. Felipe Andrade",    email:"felipe@nutri.com",   alunos:8,  plan:"semestral",planMonths:6, startDate:"2025-11-01", paidUntil:"2026-05-01", status:"ativo",    lastAccess:"2026-04-07",  valor:349},
  {id:"n3", name:"Dra. Camila Rocha",     email:"camila@nutri.com",   alunos:20, plan:"anual",   planMonths:12, startDate:"2025-08-15", paidUntil:"2026-08-15", status:"ativo",    lastAccess:tk,           valor:599},
  {id:"n4", name:"Dra. Beatriz Lima",     email:"beatriz@nutri.com",  alunos:5,  plan:"mensal",  planMonths:1,  startDate:"2026-03-20", paidUntil:"2026-04-20", status:"vencendo", lastAccess:"2026-04-05",  valor:89},
  {id:"n5", name:"Dr. Ricardo Souza",     email:"ricardo@nutri.com",  alunos:0,  plan:"mensal",  planMonths:1,  startDate:"2026-02-10", paidUntil:"2026-03-10", status:"bloqueado",lastAccess:"2026-03-08",  valor:89},
  {id:"n6", name:"Dra. Juliana Ferreira", email:"juliana@nutri.com",  alunos:15, plan:"anual",   planMonths:12, startDate:"2026-02-01", paidUntil:"2027-02-01", status:"ativo",    lastAccess:"2026-04-06",  valor:599},
];

const DEMO_DIET = {base: SUGGESTED_DIETS["Emagrecimento"]};
const DEMO_MEDS = [
  {id:"med1",name:"Vitamina D",dose:"1 cápsula",times:["07:30"]},
  {id:"med2",name:"Ômega 3",dose:"2 cápsulas",times:["12:30"]},
];

// ─── Body fat calculations ────────────────────────────────────────────────────
function calcBodyFat(m) {
  if (!m.protocolo || !m.sex || !m.age) return null;
  const age = parseFloat(m.age);
  const isFemale = m.sex === "F";

  if (m.protocolo === "pollock3") {
    const t = parseFloat(m.dc_triceps||0), s = parseFloat(m.dc_suprailiaca||0), c = parseFloat(m.dc_coxa||0);
    const p = parseFloat(m.dc_peitoral||0), ab = parseFloat(m.dc_abdominal||0);
    if (isFemale) {
      const sum = t + s + c;
      const d = 1.0994921 - (0.0009929 * sum) + (0.0000023 * sum * sum) - (0.0001392 * age);
      return ((4.95 / d) - 4.50) * 100;
    } else {
      const sum = p + ab + c;
      const d = 1.1093800 - (0.0008267 * sum) + (0.0000016 * sum * sum) - (0.0002574 * age);
      return ((4.95 / d) - 4.50) * 100;
    }
  }
  if (m.protocolo === "pollock7") {
    const t=parseFloat(m.dc_triceps||0),sb=parseFloat(m.dc_subescapular||0),si=parseFloat(m.dc_suprailiaca||0),
          ab=parseFloat(m.dc_abdominal||0),co=parseFloat(m.dc_coxa||0),pe=parseFloat(m.dc_peitoral||0),ax=parseFloat(m.dc_axilar||0);
    const sum = t+sb+si+ab+co+pe+ax;
    if (isFemale) {
      const d = 1.097 - (0.00046971*sum) + (0.00000056*sum*sum) - (0.00012828*age);
      return ((4.95/d)-4.50)*100;
    } else {
      const d = 1.112 - (0.00043499*sum) + (0.00000055*sum*sum) - (0.00028826*age);
      return ((4.95/d)-4.50)*100;
    }
  }
  if (m.protocolo === "durnin") {
    const bi=parseFloat(m.dc_biceps||0),t=parseFloat(m.dc_triceps||0),sb=parseFloat(m.dc_subescapular||0),si=parseFloat(m.dc_suprailiaca||0);
    const sum = bi+t+sb+si;
    const logSum = Math.log10(sum);
    let d;
    if (isFemale) {
      if(age<17) d=1.1369-(0.0598*logSum);
      else if(age<20) d=1.1549-(0.0678*logSum);
      else if(age<30) d=1.1599-(0.0717*logSum);
      else if(age<40) d=1.1423-(0.0632*logSum);
      else if(age<50) d=1.1333-(0.0612*logSum);
      else d=1.1339-(0.0645*logSum);
    } else {
      if(age<17) d=1.1533-(0.0643*logSum);
      else if(age<20) d=1.1620-(0.0630*logSum);
      else if(age<30) d=1.1631-(0.0632*logSum);
      else if(age<40) d=1.1422-(0.0544*logSum);
      else if(age<50) d=1.1620-(0.0700*logSum);
      else d=1.1715-(0.0779*logSum);
    }
    return ((4.95/d)-4.50)*100;
  }
  return null;
}

function fatClassification(pct, isFemale) {
  if (isFemale) {
    if (pct < 14) return {label:"Atlético",color:C.blue};
    if (pct < 21) return {label:"Boa forma ✓",color:C.accent};
    if (pct < 25) return {label:"Aceitável",color:C.amber};
    if (pct < 32) return {label:"Excesso",color:C.orange};
    return {label:"Obesidade",color:C.red};
  } else {
    if (pct < 6) return {label:"Atlético",color:C.blue};
    if (pct < 14) return {label:"Boa forma ✓",color:C.accent};
    if (pct < 18) return {label:"Aceitável",color:C.amber};
    if (pct < 25) return {label:"Excesso",color:C.orange};
    return {label:"Obesidade",color:C.red};
  }
}

function calcIMC(peso, altura) {
  if (!peso||!altura) return null;
  const h = parseFloat(altura)/100;
  return (parseFloat(peso)/(h*h)).toFixed(1);
}

function calcMassaMagra(peso, pctGordura) {
  if (!peso||!pctGordura) return null;
  const gordura = (parseFloat(peso) * pctGordura) / 100;
  return (parseFloat(peso) - gordura).toFixed(1);
}

// ─── QR Code generator (pure JS, no lib) ─────────────────────────────────────
function QRPlaceholder({value, size=160}) {
  // Simple visual QR placeholder — in production use a real QR lib
  return (
    <div style={{width:size,height:size,background:"#fff",borderRadius:12,padding:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {Array.from({length:49}).map((_,i)=>{
          const row=Math.floor(i/7),col=i%7;
          const isCorner=(row<3&&col<3)||(row<3&&col>3)||(row>3&&col<3);
          const isData=(i+row)%3===0;
          return <div key={i} style={{width:8,height:8,background:isCorner||isData?"#111":"transparent",borderRadius:1}}/>;
        })}
      </div>
      <div style={{fontSize:7,color:"#666",marginTop:4,textAlign:"center",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value}</div>
    </div>
  );
}

// ─── UI atoms ─────────────────────────────────────────────────────────────────
const Btn = ({children,onClick,color=C.accent,full,sm,xs,outline,disabled,style:sx={}}) => (
  <button onClick={onClick} disabled={disabled} style={{
    width:full?"100%":undefined,
    background:outline?"transparent":disabled?"#1a2236":color,
    border:`1.5px solid ${disabled?"#2d3748":color}`,
    borderRadius:14,padding:xs?"5px 12px":sm?"9px 18px":"14px 24px",
    color:outline?color:disabled?"#4b5563":"#080c14",
    fontWeight:800,fontSize:xs?11:sm?13:15,
    cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",transition:"all 0.15s",...sx
  }}>{children}</button>
);

const Field = ({label,value,onChange,type="text",placeholder,icon,error,small}) => (
  <div style={{marginBottom:small?10:16}}>
    {label&&<div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{icon} {label}</div>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{width:"100%",background:C.card2,border:`1.5px solid ${error?C.red:C.border}`,borderRadius:12,padding:small?"9px 12px":"13px 16px",color:C.text,fontSize:small?13:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
    {error&&<div style={{fontSize:11,color:C.red,marginTop:3}}>{error}</div>}
  </div>
);

const Chip = ({children,active,onClick,color=C.accent,sm}) => (
  <button onClick={onClick} style={{background:active?`${color}20`:"transparent",border:`1.5px solid ${active?color:C.border}`,borderRadius:100,padding:sm?"5px 12px":"7px 16px",color:active?color:C.muted,fontWeight:700,fontSize:sm?12:13,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>{children}</button>
);

const Tag = ({label,color=C.purple,sm}) => (
  <span style={{display:"inline-flex",alignItems:"center",background:`${color}18`,border:`1px solid ${color}44`,borderRadius:100,padding:sm?"3px 9px":"4px 11px",fontSize:sm?11:12,color,fontWeight:600}}>{label}</span>
);

function MiniChart({data,color=C.accent,height=60}) {
  if (!data||data.length<2) return null;
  const vals=data.map(d=>d.v),min=Math.min(...vals),max=Math.max(...vals),range=max-min||1;
  const pts=data.map((d,i)=>`${(i/(data.length-1))*100},${height-((d.v-min)/range)*(height-12)-4}`).join(" ");
  return (
    <svg viewBox={`0 0 100 ${height}`} style={{width:"100%",height}} preserveAspectRatio="none">
      <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".25"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <polygon fill="url(#cg)" points={`0,${height} ${pts} 100,${height}`}/>
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts}/>
      {data.map((d,i)=>{const x=(i/(data.length-1))*100,y=height-((d.v-min)/range)*(height-12)-4;return <circle key={i} cx={x} cy={y} r="3.5" fill={color}/>;}) }
    </svg>
  );
}

function WaterTracker({water,onChange}) {
  // water = ml value (0, 500, 1000, ... 5000)
  const STEPS = [0,500,1000,1500,2000,2500,3000,3500,4000,4500,5000];
  const GOAL  = 3000; // 3L meta recomendada
  const idx   = STEPS.indexOf(water) === -1 ? 0 : STEPS.indexOf(water);
  const pct   = Math.min(100, Math.round((water / GOAL) * 100));
  const label = water >= 1000 ? `${(water/1000).toFixed(water%1000===0?0:1)}L` : `${water}ml`;
  const color = water >= GOAL ? C.accent : C.blue;
  return (
    <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:18,marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontWeight:800,fontSize:15}}>💧 Hidratação</div>
        <div style={{fontSize:13,color,fontWeight:700}}>{label} / 3L</div>
      </div>
      {/* +/- controls */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
        <button onClick={()=>onChange(Math.max(0,water-500))}
          style={{width:44,height:44,borderRadius:12,border:`1.5px solid ${C.border}`,background:C.card2,cursor:"pointer",fontSize:22,color:C.sub,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>-</button>
        <div style={{flex:1,textAlign:"center"}}>
          <div style={{fontSize:28,fontWeight:900,color,lineHeight:1}}>{label}</div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>{water===0?"Adicione agua bebida":water>=GOAL?"Meta atingida!":pct+"% da meta"}</div>
        </div>
        <button onClick={()=>onChange(Math.min(5000,water+500))}
          style={{width:44,height:44,borderRadius:12,border:`1.5px solid ${C.border}`,background:C.card2,cursor:"pointer",fontSize:22,color:C.sub,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
      </div>
      {/* Step indicators */}
      <div style={{display:"flex",gap:3,marginBottom:10}}>
        {STEPS.filter(s=>s>0).map(s=>(
          <button key={s} onClick={()=>onChange(s)}
            style={{flex:1,height:28,borderRadius:6,border:`1.5px solid ${s<=water?color:C.border}`,background:s<=water?`${color}25`:"transparent",cursor:"pointer",fontSize:9,color:s<=water?color:C.muted,fontWeight:700,transition:"all 0.15s",padding:0}}>
            {s>=1000?`${s/1000}L`:`${s}`}
          </button>
        ))}
      </div>
      {/* Progress bar */}
      <div style={{background:C.card2,borderRadius:100,height:5,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${C.blue},${color})`,borderRadius:100,transition:"width 0.4s"}}/>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  // Detect if running on /admin route (or ?admin for demo purposes)
  const isAdminRoute = typeof window !== "undefined" && (
    window.location.pathname === "/admin" ||
    window.location.search.includes("admin")
  );
  const [screen, setScreen] = useState("welcome");

  if (isAdminRoute) {
    return <AdminPortal/>;
  }

  return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",color:C.text,maxWidth:480,margin:"0 auto"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet"/>
      {screen==="welcome"    && <WelcomeScreen   onSelect={setScreen}/>}
      {screen==="login"      && <LoginScreen     onBack={()=>setScreen("welcome")} onSelect={setScreen}/>}
      {screen==="invite"     && <InviteScreen    onBack={()=>setScreen("welcome")} onSelect={setScreen}/>}
      {screen==="onboarding" && <OnboardingScreen onBack={()=>setScreen("invite")} onDone={()=>setScreen("aluno")}/>}
      {screen==="aluno"      && <AlunoApp        onBack={()=>setScreen("welcome")}/>}
      {screen==="nutri"      && <NutriApp        onBack={()=>setScreen("welcome")}/>}
      {screen==="blocked"    && <BlockedScreen   onBack={()=>setScreen("welcome")}/>}
    </div>
  );
}

// ─── Welcome ──────────────────────────────────────────────────────────────────
function WelcomeScreen({onSelect}) {
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",background:`radial-gradient(ellipse at top,#0d1f35 0%,${C.bg} 60%)`}}>
      <div style={{textAlign:"center",marginBottom:48}}>
        <div style={{fontSize:80,marginBottom:16,filter:"drop-shadow(0 0 30px rgba(45,212,191,0.3))"}}>🥗</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:38,fontWeight:900,lineHeight:1.1,marginBottom:8}}>Vitalis</div>
        <div style={{color:C.sub,fontSize:14}}>Versão demo — escolha um fluxo</div>
      </div>
      <div style={{width:"100%",display:"flex",flexDirection:"column",gap:12}}>
        {[
          {key:"login",    icon:"🔐", title:"Tela de login",       sub:"Entrada polida com validação",      color:C.accent},
          {key:"invite",   icon:"🔗", title:"Link de convite",      sub:"Aluno acessa pelo link da nutri",   color:C.blue},
          {key:"onboarding",icon:"✨",title:"Onboarding do aluno",  sub:"Com cardápio sugerido por objetivo",color:C.purple},
          {key:"aluno",    icon:"🏃", title:"App do Aluno",         sub:"Ana Carolina · Emagrecimento",      color:C.green},
          {key:"nutri",    icon:"👩‍⚕️",title:"Painel da Nutricionista",sub:"Resumo + templates + QR Code",  color:C.pink},
          {key:"blocked",  icon:"🔒", title:"Tela de bloqueio",     sub:"Quando a assinatura vence",         color:C.red},

        ].map(({key,icon,title,sub,color})=>(
          <button key={key} onClick={()=>onSelect(key)}
            style={{background:C.card,border:`1.5px solid ${color}33`,borderRadius:20,padding:"18px 20px",cursor:"pointer",textAlign:"left",fontFamily:"inherit",color:C.text,transition:"all 0.2s",display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:46,height:46,borderRadius:14,background:`${color}20`,border:`1.5px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{icon}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:15}}>{title}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>{sub}</div>
            </div>
            <div style={{color,fontSize:18}}>→</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({onBack, onSelect}) {
  const [mode,setMode]     = useState("login");
  const [email,setEmail]   = useState("");
  const [pass,setPass]     = useState("");
  const [name,setName]     = useState("");
  const [errors,setErrors] = useState({});
  const [loading,setLoading] = useState(false);
  const [showPass,setShowPass] = useState(false);

  const validate = () => {
    const e = {};
    if (!email.includes("@")) e.email = "E-mail inválido";
    if (pass.length < 6)      e.pass  = "Mínimo 6 caracteres";
    if (mode==="signup"&&!name.trim()) e.name = "Digite seu nome";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); onSelect("nutri"); }, 1200);
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",padding:"0 0 40px",background:`radial-gradient(ellipse at top,#0d1f35 0%,${C.bg} 60%)`}}>
      <div style={{padding:"52px 24px 0"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",padding:0,marginBottom:32}}>← Voltar</button>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:56,marginBottom:12}}>🥗</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:900,marginBottom:6}}>Vitalis</div>
          <div style={{color:C.sub,fontSize:14}}>Acompanhamento nutricional inteligente</div>
        </div>
      </div>

      <div style={{flex:1,padding:"0 24px"}}>
        {/* Mode toggle */}
        <div style={{display:"flex",background:C.card2,borderRadius:16,padding:4,marginBottom:28,border:`1.5px solid ${C.border}`}}>
          {[["login","Entrar"],["signup","Cadastrar"]].map(([m,l])=>(
            <button key={m} onClick={()=>setMode(m)} style={{flex:1,background:mode===m?C.accent:"transparent",border:"none",borderRadius:13,padding:"11px 0",color:mode===m?C.bg:C.muted,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>{l}</button>
          ))}
        </div>

        {mode==="signup"&&(
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>👤 Nome completo</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome"
              style={{width:"100%",background:C.card2,border:`1.5px solid ${errors.name?C.red:C.border}`,borderRadius:12,padding:"13px 16px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit",transition:"border 0.2s"}}/>
            {errors.name&&<div style={{fontSize:11,color:C.red,marginTop:3}}>⚠ {errors.name}</div>}
          </div>
        )}

        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>📧 E-mail</div>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"
            style={{width:"100%",background:C.card2,border:`1.5px solid ${errors.email?C.red:email&&email.includes("@")?C.accent:C.border}`,borderRadius:12,padding:"13px 16px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit",transition:"border 0.2s"}}/>
          {errors.email&&<div style={{fontSize:11,color:C.red,marginTop:3}}>⚠ {errors.email}</div>}
          {email&&email.includes("@")&&!errors.email&&<div style={{fontSize:11,color:C.accent,marginTop:3}}>✓ E-mail válido</div>}
        </div>

        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>🔒 Senha</div>
          <div style={{position:"relative"}}>
            <input type={showPass?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} placeholder="Mínimo 6 caracteres"
              style={{width:"100%",background:C.card2,border:`1.5px solid ${errors.pass?C.red:pass.length>=6?C.accent:C.border}`,borderRadius:12,padding:"13px 48px 13px 16px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit",transition:"border 0.2s"}}/>
            <button onClick={()=>setShowPass(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>{showPass?"🙈":"👁"}</button>
          </div>
          {errors.pass&&<div style={{fontSize:11,color:C.red,marginTop:3}}>⚠ {errors.pass}</div>}
          {pass.length>0&&<div style={{marginTop:6,display:"flex",gap:4}}>
            {Array.from({length:4}).map((_,i)=>(
              <div key={i} style={{flex:1,height:3,borderRadius:100,background:pass.length>i*2?pass.length>=6?C.accent:C.amber:C.card3,transition:"background 0.3s"}}/>
            ))}
          </div>}
        </div>

        <button onClick={submit} disabled={loading}
          style={{width:"100%",background:loading?C.card2:`linear-gradient(135deg,${C.accent},${C.accentDark})`,border:"none",borderRadius:16,padding:"16px",color:loading?C.muted:C.bg,fontWeight:900,fontSize:16,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",transition:"all 0.3s",marginBottom:16}}>
          {loading?"⏳ Entrando…":mode==="login"?"Entrar no app →":"Criar conta →"}
        </button>

        {mode==="signup"&&(
          <div style={{background:`${C.purple}12`,border:`1.5px solid ${C.purple}33`,borderRadius:14,padding:14,fontSize:13,color:C.sub,lineHeight:1.6,textAlign:"center"}}>
            🔑 Para se cadastrar como <strong style={{color:C.text}}>aluno</strong>, você precisa do link da sua nutricionista.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Invite Screen (aluno via link) ───────────────────────────────────────────
function InviteScreen({onBack, onSelect}) {
  const nutriCode = "nutri-abc123";
  const url = `vitalis.app/nutri/${nutriCode}`;

  return (
    <div style={{minHeight:"100vh",padding:"52px 24px 40px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",padding:0,marginBottom:24}}>← Voltar</button>

      {/* Nutri side — how she shares */}
      <div style={{background:`linear-gradient(135deg,${C.purple}20,${C.blue}10)`,border:`1.5px solid ${C.purple}44`,borderRadius:24,padding:24,marginBottom:20}}>
        <div style={{fontSize:12,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>👩‍⚕️ Painel da Nutricionista</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,marginBottom:16}}>Compartilhe com seus alunos</div>

        <div style={{background:C.card,borderRadius:16,padding:16,marginBottom:14}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>🔗 Link de acesso</div>
          <div style={{fontFamily:"monospace",fontSize:13,color:C.text,wordBreak:"break-all",marginBottom:10,lineHeight:1.5}}>{url}</div>
          <Btn color={C.accent} full sm>Copiar link</Btn>
        </div>

        <div style={{background:C.card,borderRadius:16,padding:16,display:"flex",flexDirection:"column",alignItems:"center"}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>📱 QR Code para imprimir</div>
          <QRPlaceholder value={url} size={140}/>
          <div style={{fontSize:12,color:C.muted,marginTop:10,textAlign:"center"}}>Imprima e entregue na consulta</div>
          <Btn color={C.purple} full sm style={{marginTop:12}}>Baixar QR Code</Btn>
        </div>
      </div>

      {/* Aluno side — what they see */}
      <div style={{background:`linear-gradient(135deg,${C.accent}15,${C.green}08)`,border:`1.5px solid ${C.accent}44`,borderRadius:24,padding:24}}>
        <div style={{fontSize:12,color:C.accent,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>🏃 O que o Aluno vê ao abrir o link</div>
        <div style={{background:C.card,borderRadius:16,padding:20,textAlign:"center"}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:`linear-gradient(135deg,${C.purple},${C.purpleDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,margin:"0 auto 12px"}}>👩‍⚕️</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,marginBottom:4}}>Dra. Mariana Costa</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Convidou você para o Vitalis</div>
          <div style={{background:`${C.accent}15`,border:`1.5px solid ${C.accent}33`,borderRadius:12,padding:"10px 16px",fontSize:13,color:C.sub,marginBottom:20,lineHeight:1.6}}>
            Você está sendo vinculado(a) automaticamente à nutricionista. Basta criar sua conta!
          </div>
          <Btn onClick={()=>onSelect("onboarding")} color={C.accent} full>Criar minha conta →</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Onboarding Screen ────────────────────────────────────────────────────────
function OnboardingScreen({onBack, onDone}) {
  const [step,setStep] = useState(0);
  const [profile,setProfile] = useState({name:"",birth:"",sex:"",goal:"",allergies:[],obs:""});
  const [useSuggested,setUseSuggested] = useState(null);
  const [allergyInput,setAllergyInput] = useState("");
  const setP = (k,v) => setProfile(p=>({...p,[k]:v}));

  const steps = ["Bem-vindo(a)!","Seus dados","Objetivo","Seu cardápio","Tudo pronto!"];
  const totalSteps = steps.length;

  const addAllergy = () => { if(!allergyInput.trim())return; setP("allergies",[...profile.allergies,allergyInput.trim()]); setAllergyInput(""); };

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      {/* Progress */}
      <div style={{height:4,background:C.card2}}>
        <div style={{height:"100%",width:`${((step+1)/totalSteps)*100}%`,background:`linear-gradient(90deg,${C.accent},${C.purple})`,transition:"width 0.4s"}}/>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"40px 24px 120px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",padding:0}}>←</button>}
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5}}>Passo {step+1} de {totalSteps}</div>
        </div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:900,marginBottom:24,lineHeight:1.2}}>{steps[step]}</div>

        {step===0&&<div>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontSize:72,marginBottom:16}}>🥗</div>
            <div style={{background:`${C.purple}15`,border:`1.5px solid ${C.purple}33`,borderRadius:16,padding:16,textAlign:"left"}}>
              <div style={{fontSize:13,color:C.purple,fontWeight:700,marginBottom:10}}>Você foi convidada por</div>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${C.purple},${C.purpleDark})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>👩‍⚕️</div>
                <div><div style={{fontWeight:800,fontSize:16}}>Dra. Mariana Costa</div><div style={{fontSize:12,color:C.muted}}>Nutricionista</div></div>
              </div>
            </div>
          </div>
          {[["✅","Cardápio personalizado por dia"],["🔥","Streak e progresso diário"],["📊","Medidas e evolução corporal"],["💊","Alertas de remédios e suplementos"],["💬","Mensagens da sua nutricionista"]].map(([ic,t])=>(
            <div key={t} style={{display:"flex",gap:14,alignItems:"center",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 16px",marginBottom:10}}>
              <span style={{fontSize:20}}>{ic}</span><span style={{fontSize:14,color:C.sub}}>{t}</span>
            </div>
          ))}
        </div>}

        {step===1&&<div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>👤 Nome completo</div>
            <input value={profile.name} onChange={e=>setP("name",e.target.value)} placeholder="Seu nome"
              style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"13px 16px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>🎂 Data de nascimento</div>
            <input type="date" value={profile.birth} onChange={e=>setP("birth",e.target.value)}
              style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"13px 16px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>⚧ Sexo biológico</div>
            <div style={{display:"flex",gap:10}}>
              <Chip active={profile.sex==="F"} onClick={()=>setP("sex","F")} color={C.pink}>Feminino</Chip>
              <Chip active={profile.sex==="M"} onClick={()=>setP("sex","M")} color={C.blue}>Masculino</Chip>
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>🚫 Alergias / Intolerâncias</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>{profile.allergies.map((a,i)=><Tag key={i} label={a} color={C.red}/>)}</div>
            <div style={{display:"flex",gap:8}}>
              <input value={allergyInput} onChange={e=>setAllergyInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addAllergy()} placeholder="Ex: Lactose, Glúten…"
                style={{flex:1,background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"11px 14px",color:C.text,fontSize:14,outline:"none",fontFamily:"inherit"}}/>
              <button onClick={addAllergy} style={{background:`${C.red}20`,border:`1.5px solid ${C.red}`,borderRadius:12,padding:"0 16px",color:C.red,fontWeight:800,cursor:"pointer",fontSize:18}}>+</button>
            </div>
          </div>
        </div>}

        {step===2&&<div>
          {[["🔥","Emagrecimento","Perda de gordura corporal"],["💪","Ganho de massa","Aumentar massa muscular"],["⚖️","Manutenção","Manter o peso atual"],["🏃","Condicionamento","Melhorar performance"],["💚","Saúde geral","Equilibrar alimentação"],["🩺","Controle médico","Dieta para condição de saúde"]].map(([ic,g,d])=>(
            <div key={g} onClick={()=>setP("goal",g)} style={{background:profile.goal===g?`${C.accent}15`:C.card,border:`1.5px solid ${profile.goal===g?C.accent:C.border}`,borderRadius:18,padding:"18px 20px",marginBottom:12,cursor:"pointer",display:"flex",alignItems:"center",gap:16,transition:"all 0.2s"}}>
              <span style={{fontSize:28}}>{ic}</span>
              <div style={{flex:1}}><div style={{fontWeight:800,fontSize:16,color:profile.goal===g?C.accent:C.text}}>{g}</div><div style={{fontSize:13,color:C.muted}}>{d}</div></div>
              {profile.goal===g&&<div style={{color:C.accent,fontSize:20}}>✓</div>}
            </div>
          ))}
        </div>}

        {step===3&&<div>
          <div style={{color:C.sub,fontSize:14,lineHeight:1.6,marginBottom:20}}>
            Sua nutricionista vai personalizar seu cardápio na primeira consulta. Mas enquanto isso, quer começar com uma sugestão?
          </div>
          {profile.goal&&SUGGESTED_DIETS[profile.goal]?(
            <div>
              <div style={{background:`${C.accent}12`,border:`1.5px solid ${C.accent}33`,borderRadius:20,padding:20,marginBottom:14}}>
                <div style={{fontWeight:800,fontSize:15,color:C.accent,marginBottom:14}}>✨ Sugestão para {profile.goal}</div>
                {SUGGESTED_DIETS[profile.goal].map(m=>(
                  <div key={m.id} style={{display:"flex",gap:10,alignItems:"center",marginBottom:10,padding:"10px 14px",background:C.card2,borderRadius:14}}>
                    <span style={{fontSize:22}}>{m.emoji}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14}}>{m.name}</div>
                      <div style={{fontSize:12,color:C.muted}}>{m.time} · {m.foods.length} alimentos</div>
                    </div>
                  </div>
                ))}
                <div style={{display:"flex",gap:10,marginTop:14}}>
                  <Btn onClick={()=>setUseSuggested(true)} color={C.accent} full sm>Usar este cardápio ✓</Btn>
                  <Btn onClick={()=>setUseSuggested(false)} color={C.muted} outline full sm>Começar vazio</Btn>
                </div>
              </div>
              {useSuggested!==null&&<div style={{background:useSuggested?`${C.accent}15`:`${C.muted}15`,border:`1.5px solid ${useSuggested?C.accent:C.border}`,borderRadius:14,padding:12,textAlign:"center",fontSize:13,color:useSuggested?C.accent:C.muted}}>
                {useSuggested?"✓ Cardápio de sugestão selecionado!":"Você pode configurar seu cardápio depois em Config."}
              </div>}
            </div>
          ):(
            <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:20,textAlign:"center",color:C.muted}}>
              <div style={{fontSize:40,marginBottom:8}}>🍽️</div>
              <div style={{fontSize:14}}>Sua nutricionista irá configurar seu cardápio na consulta.</div>
            </div>
          )}
        </div>}

        {step===4&&<div style={{textAlign:"center"}}>
          <div style={{fontSize:80,marginBottom:24}}>🎉</div>
          <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:24,textAlign:"left",marginBottom:20}}>
            <div style={{fontWeight:800,color:C.accent,marginBottom:14}}>Seu perfil</div>
            {profile.name&&<div style={{display:"flex",gap:10,marginBottom:8,fontSize:14}}><span>👤</span><span style={{color:C.sub}}>{profile.name}</span></div>}
            {profile.goal&&<div style={{display:"flex",gap:10,marginBottom:8,fontSize:14}}><span>🎯</span><span style={{color:C.sub}}>{profile.goal}</span></div>}
            {profile.sex&&<div style={{display:"flex",gap:10,marginBottom:8,fontSize:14}}><span>⚧</span><span style={{color:C.sub}}>{profile.sex==="F"?"Feminino":"Masculino"}</span></div>}
            <div style={{display:"flex",gap:10,fontSize:14}}><span>👩‍⚕️</span><span style={{color:C.sub}}>Vinculada à Dra. Mariana Costa</span></div>
          </div>
          <div style={{background:`${C.purple}15`,border:`1.5px solid ${C.purple}33`,borderRadius:14,padding:14,fontSize:13,color:C.sub,lineHeight:1.6}}>
            Seu cardápio {useSuggested?"de sugestão foi ativado! Sua nutricionista irá personalizá-lo na consulta.":"será configurado pela sua nutricionista."}
          </div>
        </div>}
      </div>

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(8,12,20,0.97)",backdropFilter:"blur(16px)",padding:"16px 24px 32px",borderTop:`1px solid ${C.border}`}}>
        <button onClick={()=>{ if(step<totalSteps-1) setStep(s=>s+1); else onDone(); }}
          style={{width:"100%",background:`linear-gradient(135deg,${C.accent},${C.accentDark})`,border:"none",borderRadius:16,padding:"16px",color:C.bg,fontWeight:900,fontSize:16,cursor:"pointer",fontFamily:"inherit"}}>
          {step===totalSteps-1?"Começar agora 🚀":"Continuar →"}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ALUNO APP
// ════════════════════════════════════════════════════════════════════════════
function AlunoApp({onBack}) {
  const [view,setView]           = useState("hoje");
  const [logs,setLogs]           = useState({[tk]:{...DEMO_LOGS_TODAY}});
  const [mealModal,setMealModal] = useState(null);
  const [measureModal,setMeasureModal] = useState(false);
  const [measurements,setMeasurements] = useState(DEMO_MEASUREMENTS);
  const [freeFoods,setFreeFoods] = useState(DEMO_FREE_FOODS);
  const [newFreeFood,setNewFreeFood] = useState("");
  const [freeFoodType,setFreeFoodType] = useState("extra");
  const [photos,setPhotos]       = useState(DEMO_PHOTOS);
  const [humorHistory]           = useState(
    Object.entries({...DEMO_WEEK_LOGS,[tk]:{...(DEMO_WEEK_LOGS[tk]||{}),humor:"bem"}})
      .sort(([a],[b])=>a.localeCompare(b))
  );
  const [chatMsgs,setChatMsgs]   = useState(DEMO_CHAT);
  const [chatInput,setChatInput] = useState("");
  const [chatUnread,setChatUnread] = useState(2);
  const chatEndRef = useRef(null);
  const todayLog = logs[tk]||{};
  const now = new Date();

  const toggleFood=(mealId,foodId,status)=>{
    setLogs(p=>{ const d=p[tk]||{},m=d[mealId]||{},c=m[foodId]; return {...p,[tk]:{...d,[mealId]:{...m,[foodId]:c===status?null:status}}}; });
  };
  const getFoodStatus=(mealId,foodId)=>logs[tk]?.[mealId]?.[foodId]||null;

  const progress=(()=>{ let t=0,d=0; DEMO_DIET.base.forEach(m=>m.foods?.forEach(f=>{ t++; if(logs[tk]?.[m.id]?.[f.id]==="ok")d++; })); return t===0?0:Math.round((d/t)*100); })();

  const latestM = measurements[measurements.length-1];
  const bf = latestM ? calcBodyFat(latestM) : null;
  const imc = latestM ? calcIMC(latestM.peso, latestM.altura) : null;
  const weightData = measurements.map(m=>({v:parseFloat(m.peso),label:m.date}));
  const waistData  = measurements.map(m=>({v:parseFloat(m.cintura),label:m.date}));
  const bfData     = measurements.map(m=>{ const b=calcBodyFat(m); return b?{v:parseFloat(b.toFixed(1)),label:m.date}:null; }).filter(Boolean);

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,maxWidth:480,margin:"0 auto",position:"relative"}}>
      {/* Meal Modal */}
      {mealModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:900,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:C.card,borderRadius:"28px 28px 0 0",padding:"28px 24px 48px",width:"100%",maxWidth:480,maxHeight:"88vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div>
                <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{mealModal.time}</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700}}>{mealModal.emoji} {mealModal.name}</div>
              </div>
              <button onClick={()=>setMealModal(null)} style={{background:C.card2,border:"none",color:C.text,borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:18}}>×</button>
            </div>
            {(()=>{ const mm=DEMO_MEDS.filter(m=>m.times?.includes(mealModal.time)); return mm.length>0?(
              <div style={{background:`${C.amber}12`,border:`1.5px solid ${C.amber}44`,borderRadius:16,padding:"14px 18px",marginBottom:20}}>
                <div style={{fontSize:12,color:C.amber,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>💊 Tomar com esta refeição</div>
                {mm.map(m=><div key={m.id} style={{display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:4}}><span style={{fontWeight:700}}>{m.name}</span><span style={{color:C.amber}}>{m.dose}</span></div>)}
              </div>
            ):null; })()}
            {(mealModal.foods||[]).map(f=>{ const st=getFoodStatus(mealModal.id,f.id); return (
              <div key={f.id} style={{background:st==="ok"?`${C.accent}10`:st==="skip"?`${C.red}08`:C.card2,border:`1.5px solid ${st==="ok"?C.accent+"44":st==="skip"?C.red+"33":C.border}`,borderRadius:14,padding:"13px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12,transition:"all 0.2s"}}>
                <div style={{flex:1}}><div style={{fontWeight:700,textDecoration:st==="skip"?"line-through":"none",opacity:st==="skip"?.5:1}}>{f.name}</div>{f.qty&&<div style={{fontSize:13,color:C.muted}}>{f.qty}</div>}</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>toggleFood(mealModal.id,f.id,"ok")} style={{background:st==="ok"?C.accent:`${C.accent}18`,border:`1.5px solid ${C.accent}`,color:st==="ok"?C.bg:C.accent,borderRadius:10,padding:"7px 14px",cursor:"pointer",fontWeight:800,fontSize:13,fontFamily:"inherit"}}>✓</button>
                  <button onClick={()=>toggleFood(mealModal.id,f.id,"skip")} style={{background:st==="skip"?C.red:`${C.red}18`,border:`1.5px solid ${C.red}`,color:st==="skip"?"#fff":C.red,borderRadius:10,padding:"7px 12px",cursor:"pointer",fontWeight:800,fontSize:14,fontFamily:"inherit"}}>✕</button>
                </div>
              </div>
            ); })}
            <button onClick={()=>setMealModal(null)} style={{width:"100%",background:`${C.red}10`,border:`1.5px dashed ${C.red}44`,borderRadius:14,padding:12,color:C.red,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:4}}>😓 Não consegui fazer esta refeição</button>
          </div>
        </div>
      )}

      {/* Measure Modal */}
      {measureModal&&<MeasureModal onClose={()=>setMeasureModal(false)} onSave={m=>{ setMeasurements(ms=>[...ms,m]); setMeasureModal(false); }} byRole="aluno"/>}

      {/* Header */}
      <div style={{padding:"52px 24px 20px",background:`linear-gradient(180deg,#0d1a2d 0%,${C.bg} 100%)`}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",padding:0,marginBottom:8}}>← Demo</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:11,color:C.accent,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>{DAYS[now.getDay()]}, {now.getDate()} de {MONTHS[now.getMonth()]}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700,lineHeight:1.2}}>Olá, Ana! 👋</div>
            <div style={{fontSize:12,color:C.purple,marginTop:4}}>👩‍⚕️ Dra. Mariana Costa</div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <button onClick={()=>setView("conquistas")} style={{background:`${C.amber}18`,border:`1.5px solid ${C.amber}33`,borderRadius:14,padding:"8px 14px",textAlign:"center",cursor:"pointer",fontFamily:"inherit"}}>
              <div style={{fontSize:22,animation:"pulse 1.5s infinite"}}>🔥</div>
              <div style={{fontSize:13,fontWeight:900,color:C.amber}}>5 dias</div>
              <div style={{fontSize:9,color:C.muted}}>ver badges</div>
            </button>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:2}}>hoje</div>
              <div style={{fontSize:34,fontWeight:900,color:progress>=80?C.accent:C.text}}>{progress}%</div>
            </div>
          </div>
        </div>
        <div style={{marginTop:14,background:C.card2,borderRadius:100,height:5,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${progress}%`,background:`linear-gradient(90deg,${C.accent},${C.purple})`,borderRadius:100,transition:"width 0.5s"}}/>
        </div>
      </div>

      {/* Nav pill scroll */}
      <div style={{display:"flex",gap:8,padding:"0 20px 16px",overflowX:"auto"}}>
        {[["hoje","🍽️","Hoje"],["diario","📓","Diário"],["medidas","📊","Medidas"],["fotos","📸","Fotos"],["conquistas","🏆","Badges"],["config","⚙️","Config"]].map(([k,ic,lb])=>(
          <button key={k} onClick={()=>setView(k)} style={{background:view===k?`${C.accent}18`:"transparent",border:`1.5px solid ${view===k?C.accent:C.border}`,borderRadius:100,padding:"8px 18px",color:view===k?C.accent:C.muted,fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",transition:"all 0.15s",position:"relative"}}>
            {ic} {lb}
          </button>
        ))}
      </div>

      {/* HOJE */}
      {view==="hoje"&&<div style={{padding:"0 20px 120px"}}>
        <div style={{background:`${C.purple}12`,border:`1.5px solid ${C.purple}33`,borderRadius:18,padding:16,marginBottom:14}}>
          <div style={{fontSize:12,color:C.purple,fontWeight:700,marginBottom:6}}>💬 Dra. Mariana</div>
          <div style={{fontSize:14,color:C.sub,lineHeight:1.6}}>{DEMO_NUTRI_NOTES[0].text}</div>
        </div>
        <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:18,marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:C.sub,marginBottom:12}}>Como você está hoje?</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {HUMOR_OPTS.map(h=>(
              <button key={h.v} onClick={()=>setLogs(p=>({...p,[tk]:{...p[tk],humor:h.v===todayLog.humor?null:h.v}}))}
                style={{background:todayLog.humor===h.v?`${h.c}22`:"transparent",border:`1.5px solid ${todayLog.humor===h.v?h.c:C.border}`,borderRadius:100,padding:"6px 12px",color:todayLog.humor===h.v?h.c:C.muted,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
                {h.l}
              </button>
            ))}
          </div>
        </div>
        <WaterTracker water={todayLog.water||0} onChange={n=>setLogs(p=>({...p,[tk]:{...p[tk],water:n}}))}/>
        {DEMO_DIET.base.map(meal=>{
          const ml=logs[tk]?.[meal.id]||{};
          const eaten=(meal.foods||[]).filter(f=>ml[f.id]==="ok").length;
          const skipped=(meal.foods||[]).filter(f=>ml[f.id]==="skip").length;
          const total=(meal.foods||[]).length;
          const mm=DEMO_MEDS.filter(m=>m.times?.includes(meal.time));
          return (
            <div key={meal.id} onClick={()=>setMealModal(meal)} style={{background:C.card,border:`1.5px solid ${eaten===total&&total>0?C.accent+"44":C.border}`,borderRadius:20,padding:"18px 20px",marginBottom:14,cursor:"pointer",transition:"border-color 0.2s"}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:34,lineHeight:1}}>{meal.emoji}</div>
                <div style={{flex:1}}><div style={{fontWeight:800,fontSize:16}}>{meal.name}</div><div style={{fontSize:13,color:C.muted}}>{meal.time} · {total} itens</div></div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
                  {eaten>0&&<span style={{background:`${C.accent}20`,color:C.accent,borderRadius:8,padding:"2px 9px",fontSize:12,fontWeight:700}}>✓ {eaten}</span>}
                  {skipped>0&&<span style={{background:`${C.red}18`,color:C.red,borderRadius:8,padding:"2px 9px",fontSize:12,fontWeight:700}}>✕ {skipped}</span>}
                  {mm.length>0&&<span style={{background:`${C.amber}18`,color:C.amber,borderRadius:8,padding:"2px 9px",fontSize:11,fontWeight:700}}>💊 {mm.length}</span>}
                </div>
              </div>
              <div style={{marginTop:12,background:C.card2,borderRadius:100,height:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${total?((eaten+skipped)/total)*100:0}%`,background:skipped>0?`linear-gradient(90deg,${C.accent},${C.red})`:C.accent,borderRadius:100,transition:"width 0.3s"}}/>
              </div>
            </div>
          );
        })}
      </div>}

      {/* DIÁRIO */}
      {view==="diario"&&<div style={{padding:"0 20px 120px"}}>
        {/* Diário livre */}
        <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:C.purple,marginBottom:12}}>✍️ Como foi hoje?</div>
          <textarea placeholder="Registre sua jornada…" rows={3} style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:14,padding:16,color:C.text,fontSize:15,resize:"none",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
          <Btn color={C.purple} full style={{marginTop:12}}>Salvar ✓</Btn>
        </div>
        {/* Diário alimentar livre */}
        <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:C.amber,marginBottom:4}}>🍽️ Registrar alimento extra</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Algo fora do cardápio? Registre aqui para a nutricionista ver.</div>
          <textarea value={newFreeFood} onChange={e=>setNewFreeFood(e.target.value)} placeholder="Ex: Comi uma fruta às 10h…" rows={2} style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:14,padding:14,color:C.text,fontSize:14,resize:"none",outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:10}}/>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            {[["extra","🍎","Extra"],["desvio","⚠️","Desvio"],["duvida","❓","Dúvida"]].map(([v,ic,lb])=>(
              <button key={v} onClick={()=>setFreeFoodType(v)} style={{flex:1,background:freeFoodType===v?`${C.amber}20`:"transparent",border:`1.5px solid ${freeFoodType===v?C.amber:C.border}`,borderRadius:10,padding:"7px 0",color:freeFoodType===v?C.amber:C.muted,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{ic} {lb}</button>
            ))}
          </div>
          <Btn color={C.amber} full sm onClick={()=>{
            if(!newFreeFood.trim())return;
            const now2=new Date();
            setFreeFoods(p=>[{id:"ff"+Date.now(),date:tk,time:`${String(now2.getHours()).padStart(2,"0")}:${String(now2.getMinutes()).padStart(2,"0")}`,text:newFreeFood.trim(),type:freeFoodType},...p]);
            setNewFreeFood("");
          }}>Registrar</Btn>
          {freeFoods.filter(f=>f.date===tk).length>0&&<div style={{marginTop:14}}>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Hoje</div>
            {freeFoods.filter(f=>f.date===tk).map(f=>(
              <div key={f.id} style={{background:f.type==="desvio"?`${C.red}08`:f.type==="duvida"?`${C.purple}08`:`${C.amber}08`,border:`1.5px solid ${f.type==="desvio"?C.red+"33":f.type==="duvida"?C.purple+"33":C.amber+"33"}`,borderRadius:12,padding:"10px 14px",marginBottom:8,display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:16}}>{f.type==="desvio"?"⚠️":f.type==="duvida"?"❓":"🍎"}</span>
                <div style={{flex:1}}><div style={{fontSize:13,color:C.sub,lineHeight:1.5}}>{f.text}</div><div style={{fontSize:11,color:C.muted,marginTop:3}}>{f.time}</div></div>
              </div>
            ))}
          </div>}
        </div>
        {/* Humor history */}
        <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:C.sub,marginBottom:14}}>😊 Humor — últimos 7 dias</div>
          <div style={{display:"flex",gap:6,justifyContent:"space-between"}}>
            {humorHistory.slice(-7).map(([date,d])=>{
              const h=HUMOR_OPTS.find(x=>x.v===d.humor);
              const dd=new Date(date+"T12:00:00");
              return (
                <div key={date} style={{flex:1,textAlign:"center"}}>
                  <div style={{fontSize:18,marginBottom:4}}>{h?h.l.split(" ")[0]:"·"}</div>
                  <div style={{fontSize:9,color:C.muted}}>{DAYS[dd.getDay()]}</div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Journal entries */}
        {Object.entries(DEMO_DIARY).map(([date,dayData])=>(
          <div key={date}>
            <div style={{fontSize:11,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,marginTop:20}}>{date}</div>
            {(dayData.entries||[]).map((e,i)=>(
              <div key={i} style={{background:C.card,borderRadius:14,padding:14,marginBottom:8,borderLeft:`3px solid ${C.purple}`}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{e.time}</div>
                <div style={{fontSize:14,lineHeight:1.65,color:C.sub}}>{e.text}</div>
              </div>
            ))}
          </div>
        ))}
      </div>}

      {/* MEDIDAS */}
      {view==="medidas"&&<div style={{padding:"0 20px 120px"}}>
        {/* IMC + %gordura cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          {imc&&<div style={{background:`linear-gradient(135deg,${C.purple}20,${C.accent}12)`,border:`1.5px solid ${C.purple}33`,borderRadius:18,padding:16}}>
            <div style={{fontSize:11,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>IMC</div>
            <div style={{fontSize:36,fontWeight:900,marginTop:4}}>{imc}</div>
            <div style={{fontSize:12,color:C.accent,marginTop:2}}>Normal ✓</div>
          </div>}
          {bf&&<div style={{background:`linear-gradient(135deg,${C.pink}20,${C.amber}10)`,border:`1.5px solid ${C.pink}33`,borderRadius:18,padding:16}}>
            <div style={{fontSize:11,color:C.pink,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>% Gordura</div>
            <div style={{fontSize:36,fontWeight:900,marginTop:4}}>{bf.toFixed(1)}%</div>
            <div style={{fontSize:12,color:fatClassification(bf,true).color,marginTop:2}}>{fatClassification(bf,true).label}</div>
          </div>}
        </div>
        {/* massa magra */}
        {bf&&latestM?.peso&&<div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:16,marginBottom:14,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,textAlign:"center"}}>
          {[["💪","Massa Magra",calcMassaMagra(latestM.peso,bf)+"kg"],["🫧","Massa Gorda",((parseFloat(latestM.peso)*bf)/100).toFixed(1)+"kg"],["⚖️","Peso Total",latestM.peso+"kg"]].map(([ic,lb,val])=>(
            <div key={lb}><div style={{fontSize:20,marginBottom:4}}>{ic}</div><div style={{fontSize:10,color:C.muted,marginBottom:2}}>{lb}</div><div style={{fontWeight:900,fontSize:16}}>{val}</div></div>
          ))}
        </div>}
        {/* Charts */}
        {weightData.length>=2&&<div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:18,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontWeight:800}}>⚖️ Evolução do Peso</div>
            <div style={{fontSize:12,color:C.muted}}>{weightData[0].v} → <strong style={{color:C.text}}>{weightData[weightData.length-1].v} kg</strong></div>
          </div>
          <MiniChart data={weightData} color={C.accent} height={60}/>
        </div>}
        {bfData.length>=2&&<div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:18,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontWeight:800}}>📉 Evolução % Gordura</div>
            <div style={{fontSize:12,color:C.muted}}>{bfData[0].v}% → <strong style={{color:C.text}}>{bfData[bfData.length-1].v}%</strong></div>
          </div>
          <MiniChart data={bfData} color={C.pink} height={60}/>
        </div>}
        {waistData.length>=2&&<div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:18,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontWeight:800}}>〰️ Cintura</div>
            <div style={{fontSize:12,color:C.muted}}>{waistData[0].v} → <strong style={{color:C.text}}>{waistData[waistData.length-1].v} cm</strong></div>
          </div>
          <MiniChart data={waistData} color={C.purple} height={60}/>
        </div>}
        <Btn onClick={()=>setMeasureModal(true)} color={C.purple} full style={{marginBottom:20}}>+ Nova Avaliação Antropométrica</Btn>
        {/* Latest full measurement */}
        {latestM&&<MeasurementCard m={latestM}/>}
      </div>}

      {/* FOTOS */}
      {view==="fotos"&&<div style={{padding:"0 20px 120px"}}>
        <div style={{background:`${C.purple}10`,border:`1.5px solid ${C.purple}33`,borderRadius:16,padding:14,marginBottom:18,fontSize:14,color:C.sub,lineHeight:1.6}}>
          📸 Registre seu progresso visual. As fotos ficam <strong style={{color:C.text}}>visíveis apenas para você e sua nutricionista</strong>.
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
          {photos.map((ph,i)=>(
            <div key={ph.id} style={{textAlign:"center"}}>
              <div style={{width:"100%",paddingTop:"133%",borderRadius:16,background:C.card,border:`1.5px solid ${C.border}`,position:"relative",overflow:"hidden",marginBottom:6,cursor:"pointer"}}>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
                  <span style={{fontSize:28}}>🖼️</span>
                  <span style={{fontSize:10,color:C.muted}}>Toque p/ ver</span>
                </div>
              </div>
              <div style={{fontSize:11,fontWeight:700,color:C.sub}}>{ph.label}</div>
              <div style={{fontSize:10,color:C.muted}}>{ph.date.slice(5).replace("-","/")}</div>
            </div>
          ))}
          {/* Add new */}
          <div style={{textAlign:"center"}}>
            <div onClick={()=>setPhotos(p=>[...p,{id:"ph"+Date.now(),date:tk,label:"Nova foto",url:null}])}
              style={{width:"100%",paddingTop:"133%",borderRadius:16,background:"transparent",border:`2px dashed ${C.border}`,position:"relative",overflow:"hidden",marginBottom:6,cursor:"pointer"}}>
              <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
                <span style={{fontSize:28,color:C.muted}}>+</span>
                <span style={{fontSize:10,color:C.muted}}>Nova foto</span>
              </div>
            </div>
          </div>
        </div>
        <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:18}}>
          <div style={{fontWeight:800,marginBottom:4}}>📊 Comparativo Visual</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:14}}>Coloque duas fotos lado a lado para ver a evolução.</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {["Antes","Depois"].map(lb=>(
              <div key={lb} style={{textAlign:"center"}}>
                <div style={{width:"100%",paddingTop:"133%",borderRadius:14,background:C.card2,border:`1.5px solid ${C.border}`,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:24}}>🖼️</span>
                    <span style={{fontSize:11,color:C.muted,marginTop:4}}>{lb}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {/* CONQUISTAS */}
      {view==="conquistas"&&<div style={{padding:"0 20px 120px"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,marginBottom:4}}>🏆 Conquistas</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Ganhas e em progresso</div>
        {/* Earned */}
        <div style={{fontSize:11,color:C.accent,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Desbloqueadas</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
          {DEMO_BADGES.filter(b=>b.earned).map(b=>(
            <div key={b.id} style={{background:`linear-gradient(135deg,${C.card},${C.card2})`,border:`1.5px solid ${C.accent}44`,borderRadius:20,padding:18,textAlign:"center",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:8,right:10,fontSize:9,color:C.muted,fontWeight:700}}>{b.date}</div>
              <div style={{fontSize:36,marginBottom:8}}>{b.icon}</div>
              <div style={{fontWeight:800,fontSize:13,marginBottom:4}}>{b.name}</div>
              <div style={{fontSize:11,color:C.muted,lineHeight:1.4}}>{b.desc}</div>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${C.accent},${C.purple})`}}/>
            </div>
          ))}
        </div>
        {/* In progress */}
        <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:12}}>Em progresso</div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {DEMO_BADGES.filter(b=>!b.earned).map(b=>(
            <div key={b.id} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:16,display:"flex",gap:14,alignItems:"center"}}>
              <div style={{fontSize:34,opacity:.5}}>{b.icon}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:14,marginBottom:2}}>{b.name}</div>
                <div style={{fontSize:12,color:C.muted,marginBottom:8}}>{b.desc}</div>
                <div style={{background:C.card2,borderRadius:100,height:6,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.round((b.progress/b.total)*100)}%`,background:`linear-gradient(90deg,${C.purple},${C.accent})`,borderRadius:100,transition:"width 0.4s"}}/>
                </div>
                <div style={{fontSize:11,color:C.muted,marginTop:4}}>{b.progress}/{b.total} {b.id==="b6"?"%":"dias"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>}

      {/* CHAT */}
      {view==="chat"&&<div style={{display:"flex",flexDirection:"column",height:"100vh",paddingTop:0}}>
        {/* Chat header */}
        <div style={{padding:"52px 20px 14px",background:`linear-gradient(180deg,#0d1a2d,${C.bg})`,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${C.purple},${C.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>👩</div>
            <div>
              <div style={{fontWeight:800,fontSize:15}}>Dra. Mariana Costa</div>
              <div style={{fontSize:11,color:C.accent}}>● Online agora</div>
            </div>
          </div>
        </div>
        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 16px 0",display:"flex",flexDirection:"column",gap:10}}>
          {chatMsgs.map(m=>{
            const isMe = m.from==="aluno";
            return (
              <div key={m.id} style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start"}}>
                {!isMe&&<div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${C.purple},${C.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,marginRight:8,flexShrink:0,alignSelf:"flex-end"}}>👩</div>}
                <div style={{maxWidth:"75%"}}>
                  <div style={{background:isMe?C.accent:C.card,color:isMe?C.bg:C.text,borderRadius:isMe?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"10px 14px",fontSize:14,lineHeight:1.5,fontWeight:isMe?500:400}}>
                    {m.text}
                  </div>
                  <div style={{fontSize:10,color:C.muted,marginTop:3,textAlign:isMe?"right":"left"}}>{m.time}</div>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef}/>
        </div>
        {/* Input */}
        <div style={{padding:"12px 16px 100px",background:C.bg,borderTop:`1px solid ${C.border}`,display:"flex",gap:10,alignItems:"flex-end",flexShrink:0}}>
          <textarea value={chatInput} onChange={e=>setChatInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); if(!chatInput.trim())return; const now2=new Date(); setChatMsgs(p=>[...p,{id:"c"+Date.now(),from:"aluno",text:chatInput.trim(),time:`${String(now2.getHours()).padStart(2,"0")}:${String(now2.getMinutes()).padStart(2,"0")}`,date:tk}]); setChatInput(""); setTimeout(()=>chatEndRef.current?.scrollIntoView({behavior:"smooth"}),50); }}}
            placeholder="Mensagem…" rows={1} style={{flex:1,background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"10px 14px",color:C.text,fontSize:14,resize:"none",outline:"none",fontFamily:"inherit",maxHeight:100,overflowY:"auto"}}/>
          <button onClick={()=>{ if(!chatInput.trim())return; const now2=new Date(); setChatMsgs(p=>[...p,{id:"c"+Date.now(),from:"aluno",text:chatInput.trim(),time:`${String(now2.getHours()).padStart(2,"0")}:${String(now2.getMinutes()).padStart(2,"0")}`,date:tk}]); setChatInput(""); setTimeout(()=>chatEndRef.current?.scrollIntoView({behavior:"smooth"}),50); }}
            style={{width:44,height:44,borderRadius:"50%",background:chatInput.trim()?C.accent:C.card2,border:"none",color:chatInput.trim()?C.bg:C.muted,fontSize:20,cursor:chatInput.trim()?"pointer":"default",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",fontFamily:"inherit"}}>&#8593;</button>
        </div>
      </div>}

      {/* CONFIG */}
      {view==="config"&&<div style={{padding:"0 20px 120px"}}>
        <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:16}}>
          <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:14}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:C.bg}}>A</div>
            <div><div style={{fontWeight:800,fontSize:18}}>Ana Carolina Silva</div><div style={{color:C.muted,fontSize:13}}>ana@email.com</div></div>
          </div>
          <Tag label="🎯 Emagrecimento" color={C.accent}/>{" "}
          <Tag label="🚫 Lactose" color={C.red}/>
        </div>
        <div style={{background:`${C.purple}10`,border:`1.5px solid ${C.purple}33`,borderRadius:16,padding:14,marginBottom:14,fontSize:14,color:C.sub,lineHeight:1.6}}>
          👩‍⚕️ Seu cardápio é gerenciado pela <strong style={{color:C.text}}>Dra. Mariana Costa</strong>.
        </div>
        <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:18,marginBottom:14}}>
          <div style={{fontWeight:800,marginBottom:12}}>💊 Medicações</div>
          {DEMO_MEDS.map(m=><div key={m.id} style={{display:"flex",gap:12,alignItems:"center",marginBottom:10,background:C.card2,borderRadius:12,padding:"10px 14px"}}>
            <span style={{fontSize:20}}>💊</span>
            <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{m.name}</div><div style={{fontSize:12,color:C.muted}}>{m.dose} · {m.times.join(", ")}</div></div>
          </div>)}
        </div>
      </div>}

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(8,12,20,0.97)",backdropFilter:"blur(20px)",borderTop:`1px solid ${C.border}`,padding:"12px 10px 30px",display:"flex",justifyContent:"space-around"}}>
        {[["hoje","🍽️","Hoje"],["diario","📓","Diário"],["medidas","📊","Medidas"],["chat","💬","Chat"],["config","⚙️","Config"]].map(([k,ic,lb])=>(
          <button key={k} onClick={()=>{ setView(k); if(k==="chat")setChatUnread(0); }} style={{background:"none",border:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",color:view===k?C.accent:C.muted,fontWeight:view===k?800:600,fontSize:11,padding:0,fontFamily:"inherit",position:"relative"}}>
            <span style={{fontSize:20,position:"relative"}}>
              {ic}
              {k==="chat"&&chatUnread>0&&<span style={{position:"absolute",top:-4,right:-6,background:C.red,color:"#fff",borderRadius:100,fontSize:9,fontWeight:900,padding:"1px 5px",minWidth:16,textAlign:"center"}}>{chatUnread}</span>}
            </span>
            {lb}
          </button>
        ))}
      </div>
      <style>{`*{-webkit-tap-highlight-color:transparent}::-webkit-scrollbar{width:0}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}`}</style>
    </div>
  );
}

// ─── Measurement card (shared) ───────────────────────────────────────────────
function MeasurementCard({m}) {
  const bf = calcBodyFat(m);
  const isFemale = m.sex==="F";
  const bfClass  = bf ? fatClassification(bf, isFemale) : null;
  return (
    <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:11,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{m.date}</div>
        <div style={{display:"flex",gap:6}}>
          <Tag label={m.by==="nutri"?"👩‍⚕️ Nutricionista":"🏃 Autoavaliação"} color={m.by==="nutri"?C.purple:C.accent} sm/>
          {m.protocolo&&<Tag label={m.protocolo==="pollock7"?"Pollock 7":"Pollock 3"} color={C.blue} sm/>}
        </div>
      </div>

      {/* Circumferences */}
      <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Circunferências</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
        {[["⚖️","Peso",m.peso,"kg"],["📏","Altura",m.altura,"cm"],["〰️","Cintura",m.cintura,"cm"],["🫙","Quadril",m.quadril,"cm"],["💪","Braço",m.braco,"cm"],["🦵","Coxa",m.coxa,"cm"],["🦵","Panturrilha",m.panturrilha,"cm"],["🫁","Tórax",m.torax,"cm"],["🟫","Abdômen",m.abdomen,"cm"],["💪","Antebraço",m.antebraco,"cm"],["🦒","Pescoço",m.pescoco,"cm"]].map(([ic,lb,val,u])=>val?(
          <div key={lb} style={{background:C.card2,borderRadius:12,padding:"10px 12px"}}>
            <div style={{fontSize:16,marginBottom:2}}>{ic}</div>
            <div style={{fontSize:10,color:C.muted}}>{lb}</div>
            <div style={{fontSize:15,fontWeight:800}}>{val}<span style={{fontSize:10,color:C.muted}}> {u}</span></div>
          </div>
        ):null)}
      </div>

      {/* Skinfolds */}
      {(m.dc_triceps||m.dc_peitoral)&&<>
        <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Dobras Cutâneas (mm)</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          {[["Tríceps",m.dc_triceps],["Subescapular",m.dc_subescapular],["Suprailiaca",m.dc_suprailiaca],["Abdominal",m.dc_abdominal],["Coxa",m.dc_coxa],["Peitoral",m.dc_peitoral],["Axilar Média",m.dc_axilar],["Bíceps",m.dc_biceps]].map(([lb,val])=>val?(
            <div key={lb} style={{background:C.card2,borderRadius:10,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:C.sub}}>{lb}</span>
              <span style={{fontSize:14,fontWeight:800,color:C.text}}>{val} mm</span>
            </div>
          ):null)}
        </div>
        {bf&&<div style={{background:`linear-gradient(135deg,${C.pink}15,${C.amber}08)`,border:`1.5px solid ${C.pink}33`,borderRadius:14,padding:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>% Gordura calculado</div>
            <div style={{fontSize:28,fontWeight:900,marginTop:2}}>{bf.toFixed(1)}%</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:14,fontWeight:700,color:bfClass.color}}>{bfClass.label}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>Massa gorda: {((parseFloat(m.peso||0)*bf)/100).toFixed(1)} kg</div>
            <div style={{fontSize:11,color:C.muted}}>Massa magra: {calcMassaMagra(m.peso,bf)} kg</div>
          </div>
        </div>}
      </>}
    </div>
  );
}

// ─── Measure Modal ────────────────────────────────────────────────────────────
function MeasureModal({onClose, onSave, byRole="aluno"}) {
  const [tab,setTab]         = useState("circunf");
  const [protocolo,setProtocolo] = useState("pollock7");
  const [sex,setSex]         = useState("F");
  const [age,setAge]         = useState("");
  const [vals,setVals]       = useState({});
  const set = (k,v) => setVals(p=>({...p,[k]:v}));

  const previewBF = (() => {
    const m={...vals,protocolo,sex,age};
    const b=calcBodyFat(m);
    return b?b.toFixed(1):null;
  })();

  const circunf = [["peso","Peso","kg"],["altura","Altura","cm"],["cintura","Cintura","cm"],["quadril","Quadril","cm"],["braco","Braço","cm"],["antebraco","Antebraço","cm"],["coxa","Coxa","cm"],["panturrilha","Panturrilha","cm"],["pescoco","Pescoço","cm"],["torax","Tórax","cm"],["abdomen","Abdômen","cm"]];
  const dobras7  = [["dc_triceps","Tríceps"],["dc_subescapular","Subescapular"],["dc_suprailiaca","Suprailiaca"],["dc_abdominal","Abdominal"],["dc_coxa","Coxa"],["dc_peitoral","Peitoral"],["dc_axilar","Axilar Média"]];
  const dobras3F = [["dc_triceps","Tríceps"],["dc_suprailiaca","Suprailiaca"],["dc_coxa","Coxa"]];
  const dobras3M = [["dc_peitoral","Peitoral"],["dc_abdominal","Abdominal"],["dc_coxa","Coxa"]];
  const dobras4  = [["dc_biceps","Bíceps"],["dc_triceps","Tríceps"],["dc_subescapular","Subescapular"],["dc_suprailiaca","Suprailiaca"]];
  const dobrasList = protocolo==="pollock7"?dobras7:(sex==="F"?dobras3F:dobras3M);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:950,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:C.card,borderRadius:"28px 28px 0 0",padding:"28px 24px 48px",width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700}}>📏 Nova Avaliação</div>
          <button onClick={onClose} style={{background:C.card2,border:"none",color:C.text,borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:18}}>×</button>
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:8,marginBottom:20,overflowX:"auto"}}>
          <Chip active={tab==="circunf"} onClick={()=>setTab("circunf")} color={C.accent} sm>📐 Circunferências</Chip>
          <Chip active={tab==="dobras"}  onClick={()=>setTab("dobras")}  color={C.pink}   sm>📌 Dobras Cutâneas</Chip>
        </div>

        {tab==="circunf"&&<div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {circunf.map(([k,lb,u])=>(
              <div key={k}>
                <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{lb} ({u})</div>
                <input type="number" placeholder="0" value={vals[k]||""} onChange={e=>set(k,e.target.value)}
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
              </div>
            ))}
          </div>
        </div>}

        {tab==="dobras"&&<div>
          {/* Protocol + sex + age */}
          <div style={{background:C.card2,borderRadius:16,padding:16,marginBottom:16}}>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Protocolo</div>
            <div style={{fontSize:11,color:C.muted,marginBottom:10,lineHeight:1.5}}>{protocolo==="pollock7"?"Triceps, Subescap., Suprailíaca, Abdominal, Coxa, Peitoral, Axilar":"Triceps + Suprailíaca + Coxa (Fem) / Peitoral + Abdominal + Coxa (Mas)"}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
              <Chip active={protocolo==="pollock7"} onClick={()=>setProtocolo("pollock7")} color={C.accent} sm>Pollock 7 dobras</Chip>
              <Chip active={protocolo==="pollock3"} onClick={()=>setProtocolo("pollock3")} color={C.blue}   sm>Pollock 3 dobras</Chip>
            </div>
            <div style={{display:"flex",gap:12,alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Sexo biológico</div>
                <div style={{display:"flex",gap:8}}>
                  <Chip active={sex==="F"} onClick={()=>setSex("F")} color={C.pink} sm>Fem</Chip>
                  <Chip active={sex==="M"} onClick={()=>setSex("M")} color={C.blue} sm>Mas</Chip>
                </div>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Idade</div>
                <input type="number" placeholder="ex: 30" value={age} onChange={e=>setAge(e.target.value)}
                  style={{width:"100%",background:C.card3,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"8px 12px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
              </div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {dobrasList.map(([k,lb])=>(
              <div key={k}>
                <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{lb} (mm)</div>
                <input type="number" placeholder="0" value={vals[k]||""} onChange={e=>set(k,e.target.value)}
                  style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:10,padding:"10px 12px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
              </div>
            ))}
          </div>

          {previewBF&&<div style={{background:`${C.pink}15`,border:`1.5px solid ${C.pink}33`,borderRadius:14,padding:14,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <div>
              <div style={{fontSize:11,color:C.pink,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>% Gordura estimado</div>
              <div style={{fontSize:32,fontWeight:900,marginTop:2}}>{previewBF}%</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:13,fontWeight:700,color:fatClassification(parseFloat(previewBF),sex==="F").color}}>{fatClassification(parseFloat(previewBF),sex==="F").label}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:4}}>Protocolo: {protocolo==="pollock7"?"Pollock 7 dobras":"Pollock 3 dobras"}</div>
            </div>
          </div>}
        </div>}

        <Btn onClick={()=>onSave({...vals,protocolo,sex,age,date:new Date().toLocaleDateString("pt-BR"),by:byRole,id:"new-"+Date.now()})} color={C.purple} full style={{marginTop:20}}>
          Salvar Avaliação ✓
        </Btn>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// NUTRICIONISTA APP
// ════════════════════════════════════════════════════════════════════════════
function NutriApp({onBack}) {
  const [tab,setTab]             = useState("alunos");
  const [selectedAluno,setSelectedAluno] = useState(null);
  const [alunoTab,setAlunoTab]   = useState("hoje");
  const [measureModal,setMeasureModal] = useState(false);
  const [templateModal,setTemplateModal] = useState(false);
  const [templates,setTemplates] = useState(DEMO_TEMPLATES);
  const [measurements,setMeasurements] = useState(DEMO_MEASUREMENTS);
  const [privateNotes,setPrivateNotes] = useState(DEMO_PRIVATE_NOTES);
  const [newPrivNote,setNewPrivNote] = useState("");
  const [notesOpen,setNotesOpen] = useState(false);
  const [nutriChat,setNutriChat] = useState(DEMO_CHAT);
  const [nutriChatInput,setNutriChatInput] = useState("");
  const chatEndRef2 = useRef(null);
  const now = new Date();
  const daysLeft = 280;

  const days = Array.from({length:7}).map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()-i); const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; return {key:k,label:`${DAYS[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`}; }).reverse();

  // Alerts summary
  const alertAlunos = DEMO_ALUNOS.filter(a=>a.alerts>0);
  const lowAdherence = DEMO_ALUNOS.filter(a=>a.adherence7d<60);
  const inactiveAlunos = DEMO_ALUNOS.filter(a=>a.lastSeen!==tk&&a.lastSeen!=="2026-04-06");

  const nutriCode = "nutri-abc123";
  const url = `vitalis.app/nutri/${nutriCode}`;

  const weightData = measurements.map(m=>({v:parseFloat(m.peso),label:m.date}));
  const bfData = measurements.map(m=>{ const b=calcBodyFat(m); return b?{v:parseFloat(b.toFixed(1)),label:m.date}:null; }).filter(Boolean);
  const latestM = measurements[measurements.length-1];
  const bf = latestM?calcBodyFat(latestM):null;

  if (selectedAluno) return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,maxWidth:480,margin:"0 auto"}}>
      {measureModal&&<MeasureModal onClose={()=>setMeasureModal(false)} onSave={m=>{ setMeasurements(ms=>[...ms,m]); setMeasureModal(false); }} byRole="nutri"/>}
      <div style={{padding:"52px 24px 20px",background:`linear-gradient(180deg,#0d1a2d 0%,${C.bg} 100%)`}}>
        <button onClick={()=>setSelectedAluno(null)} style={{background:"none",border:"none",color:C.purple,cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit",marginBottom:12,padding:0}}>← Voltar</button>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:C.bg,flexShrink:0}}>{selectedAluno.name[0]}</div>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700}}>{selectedAluno.name}</div>
            <div style={{color:C.muted,fontSize:13}}>{selectedAluno.email} · 🎯 {selectedAluno.goal}</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:16}}>
          {[{icon:"📈",label:"Média 7d",val:`${selectedAluno.adherence7d}%`,color:selectedAluno.adherence7d>=80?C.accent:C.amber},
            {icon:"⚖️",label:"IMC",val:calcIMC(latestM?.peso,latestM?.altura)||"—",color:C.purple},
            {icon:"📉",label:"% Gordura",val:bf?bf.toFixed(1)+"%":"—",color:C.pink}].map(({icon,label,val,color})=>(
            <div key={label} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"12px 0",textAlign:"center"}}>
              <div style={{fontSize:16}}>{icon}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{label}</div>
              <div style={{fontSize:18,fontWeight:900,color,marginTop:2}}>{val}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:8,padding:"0 20px 16px",overflowX:"auto"}}>
        {[["hoje","📅","Hoje"],["semana","📊","Semana"],["medidas","📏","Medidas"],["diario","📓","Diário"],["fotos","📸","Fotos"],["chat","💬","Chat"],["cardapio","🥗","Cardápio"]].map(([k,ic,lb])=>(
          <button key={k} onClick={()=>setAlunoTab(k)} style={{background:alunoTab===k?`${C.purple}18`:"transparent",border:`1.5px solid ${alunoTab===k?C.purple:C.border}`,borderRadius:100,padding:"8px 16px",color:alunoTab===k?C.purple:C.muted,fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"}}>{ic} {lb}</button>
        ))}
      </div>
      <div style={{padding:"0 20px 80px"}}>
        {alunoTab==="hoje"&&<div>
          <div style={{background:C.card,border:`1.5px solid ${C.purple}44`,borderRadius:20,padding:18,marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:700,color:C.purple,marginBottom:10}}>✍️ Observação para {selectedAluno.name.split(" ")[0]}</div>
            <textarea placeholder="Ex: Ótimo progresso! Tente aumentar a proteína…" rows={3} style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:14,color:C.text,fontSize:14,outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
            <Btn color={C.purple} full sm style={{marginTop:10}}>Enviar observação</Btn>
          </div>
          {/* Private notes — only nutricionista sees */}
          <div style={{background:`${C.amber}08`,border:`1.5px solid ${C.amber}33`,borderRadius:20,padding:18,marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:notesOpen?14:0}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:C.amber}}>🔒 Notas Privadas</div>
                <div style={{fontSize:11,color:C.muted}}>Visíveis apenas para você</div>
              </div>
              <button onClick={()=>setNotesOpen(p=>!p)} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:10,padding:"5px 12px",color:C.text,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>{notesOpen?"Fechar":"Ver"}</button>
            </div>
            {notesOpen&&<div>
              <textarea value={newPrivNote} onChange={e=>setNewPrivNote(e.target.value)} placeholder="Anotação interna… não aparece para o aluno." rows={3} style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:14,color:C.text,fontSize:14,outline:"none",resize:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:10}}/>
              <Btn color={C.amber} full sm onClick={()=>{
                if(!newPrivNote.trim())return;
                const d=new Date(); const ds=`${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()}`;
                setPrivateNotes(p=>[{id:"pn"+Date.now(),date:ds,text:newPrivNote.trim(),emoji:"🔒"},...p]);
                setNewPrivNote("");
              }}>Salvar nota privada</Btn>
              <div style={{marginTop:14}}>
                {privateNotes.map(n=>(
                  <div key={n.id} style={{background:C.card,borderRadius:14,padding:14,marginBottom:8,borderLeft:`3px solid ${C.amber}`}}>
                    <div style={{fontSize:11,color:C.amber,fontWeight:700,marginBottom:4}}>{n.emoji} {n.date}</div>
                    <div style={{fontSize:13,color:C.sub,lineHeight:1.6}}>{n.text}</div>
                  </div>
                ))}
              </div>
            </div>}
          </div>
          <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:16,marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:22}}>😊</span><div><div style={{fontSize:12,color:C.muted}}>Humor</div><div style={{fontWeight:700}}>Bem 🙂</div></div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:12,color:C.muted}}>Água</div><div style={{fontWeight:700,color:C.blue}}>💧 5/8</div></div>
          </div>
          {DEMO_DIET.base.map(meal=>{
            const ml=DEMO_LOGS_TODAY?.[meal.id]||{};
            const eaten=(meal.foods||[]).filter(f=>ml[f.id]==="ok").length;
            const total=(meal.foods||[]).length;
            return (
              <div key={meal.id} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:"16px 18px",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                  <span style={{fontSize:26}}>{meal.emoji}</span>
                  <div style={{flex:1}}><div style={{fontWeight:800,fontSize:15}}>{meal.name}</div><div style={{fontSize:12,color:C.muted}}>{meal.time}</div></div>
                  <span style={{background:eaten===total?`${C.accent}20`:`${C.amber}18`,color:eaten===total?C.accent:C.amber,borderRadius:8,padding:"2px 9px",fontSize:12,fontWeight:700}}>{eaten}/{total}</span>
                </div>
                {meal.foods.map(f=>{ const st=ml[f.id]; return <div key={f.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0",borderBottom:`1px solid ${C.border}`,opacity:st==="skip"?.4:1}}><span style={{textDecoration:st==="skip"?"line-through":"none",color:C.sub}}>{f.name} {f.qty&&<span style={{color:C.muted}}>— {f.qty}</span>}</span><span>{st==="ok"?"✅":st==="skip"?"❌":"⬜"}</span></div>; })}
              </div>
            );
          })}
        </div>}
        {alunoTab==="semana"&&<div>
          {days.map(({key,label})=>{
            const d=DEMO_WEEK_LOGS[key]||{adherence:0};
            const h=HUMOR_OPTS.find(x=>x.v===d.humor);
            return <div key={key} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:16,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontWeight:700,fontSize:14}}>{label}</span>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  {h&&<span style={{fontSize:13,color:h.c}}>{h.l.split(" ")[1]}</span>}
                  {d.water>0&&<span style={{fontSize:12,color:C.blue}}>💧{d.water>=1000?(d.water/1000).toFixed(1)+"L":d.water+"ml"}</span>}
                  <span style={{fontWeight:800,color:d.adherence>=80?C.accent:d.adherence>=50?C.amber:C.red}}>{d.adherence}%</span>
                </div>
              </div>
              <div style={{background:C.card2,borderRadius:100,height:8,overflow:"hidden"}}><div style={{height:"100%",width:`${d.adherence}%`,background:d.adherence>=80?`linear-gradient(90deg,${C.accent},${C.purple})`:d.adherence>=50?C.amber:C.red,borderRadius:100}}/></div>
            </div>;
          })}
        </div>}
        {alunoTab==="medidas"&&<div>
          <Btn onClick={()=>setMeasureModal(true)} color={C.purple} full style={{marginBottom:16}}>+ Lançar Nova Avaliação</Btn>
          {bfData.length>=2&&<div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:18,marginBottom:12}}>
            <div style={{fontWeight:800,marginBottom:8}}>📉 Evolução % Gordura</div>
            <MiniChart data={bfData} color={C.pink} height={60}/>
          </div>}
          {weightData.length>=2&&<div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:18,marginBottom:12}}>
            <div style={{fontWeight:800,marginBottom:8}}>⚖️ Evolução Peso</div>
            <MiniChart data={weightData} color={C.accent} height={60}/>
          </div>}
          {measurements.map((m,i)=><MeasurementCard key={i} m={m}/>)}
        </div>}
        {alunoTab==="diario"&&<div>
          {DEMO_NUTRI_NOTES.map((n,i)=>(
            <div key={i} style={{background:`${C.purple}10`,border:`1.5px solid ${C.purple}33`,borderRadius:14,padding:14,marginBottom:8,borderLeft:`3px solid ${C.purple}`}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Sua obs. — {n.note_date}</div>
              <div style={{fontSize:14,color:C.sub}}>{n.text}</div>
            </div>
          ))}
          {/* Alimentos extras registrados pelo aluno */}
          {DEMO_FREE_FOODS.length>0&&<div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:C.amber,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>🍽️ Registros alimentares extras</div>
            {DEMO_FREE_FOODS.map(f=>(
              <div key={f.id} style={{background:f.type==="desvio"?`${C.red}08`:f.type==="duvida"?`${C.purple}08`:`${C.amber}08`,border:`1.5px solid ${f.type==="desvio"?C.red+"33":f.type==="duvida"?C.purple+"33":C.amber+"33"}`,borderRadius:12,padding:"10px 14px",marginBottom:8,display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:16}}>{f.type==="desvio"?"⚠️":f.type==="duvida"?"❓":"🍎"}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,color:C.sub,lineHeight:1.5}}>{f.text}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:3}}>{f.date===tk?"Hoje":f.date} {f.time}</div>
                </div>
                {f.type==="duvida"&&<span style={{background:`${C.purple}20`,color:C.purple,borderRadius:8,padding:"2px 8px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>Responder</span>}
              </div>
            ))}
          </div>}
          {Object.entries(DEMO_DIARY).map(([date,dayData])=>(
            <div key={date}>
              <div style={{fontSize:11,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8,marginTop:16}}>{date}</div>
              {(dayData.entries||[]).map((e,i)=>(
                <div key={i} style={{background:C.card,borderRadius:14,padding:14,marginBottom:8,borderLeft:`3px solid ${C.purple}`}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{e.time}</div>
                  <div style={{fontSize:14,lineHeight:1.6,color:C.sub}}>{e.text}</div>
                </div>
              ))}
            </div>
          ))}
        </div>}
        {alunoTab==="fotos"&&<div>
          <div style={{background:`${C.purple}10`,border:`1.5px solid ${C.purple}33`,borderRadius:16,padding:14,marginBottom:18,fontSize:14,color:C.sub,lineHeight:1.6}}>
            📸 Fotos de progresso de <strong style={{color:C.text}}>{selectedAluno.name.split(" ")[0]}</strong>. Visíveis apenas para você e o aluno.
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
            {DEMO_PHOTOS.map(ph=>(
              <div key={ph.id} style={{textAlign:"center"}}>
                <div style={{width:"100%",paddingTop:"133%",borderRadius:14,background:C.card,border:`1.5px solid ${C.border}`,position:"relative",overflow:"hidden",marginBottom:6}}>
                  <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
                    <span style={{fontSize:24}}>🖼️</span>
                    <span style={{fontSize:9,color:C.muted}}>Ver foto</span>
                  </div>
                </div>
                <div style={{fontSize:11,fontWeight:700,color:C.sub}}>{ph.label}</div>
                <div style={{fontSize:10,color:C.muted}}>{ph.date.slice(5).replace("-","/")}</div>
              </div>
            ))}
          </div>
          <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:18}}>
            <div style={{fontWeight:800,marginBottom:10}}>📊 Comparativo</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {["Antes","Depois"].map(lb=>(
                <div key={lb} style={{textAlign:"center"}}>
                  <div style={{width:"100%",paddingTop:"133%",borderRadius:14,background:C.card2,border:`1.5px solid ${C.border}`,position:"relative"}}>
                    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:22}}>🖼️</span>
                      <span style={{fontSize:11,color:C.muted,marginTop:4}}>{lb}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>}

        {alunoTab==="chat"&&<div style={{display:"flex",flexDirection:"column",height:"70vh",marginTop:-8}}>
          <div style={{flex:1,overflowY:"auto",padding:"0 0 8px",display:"flex",flexDirection:"column",gap:8}}>
            {nutriChat.map(m=>{
              const isNutri = m.from==="nutri";
              return (
                <div key={m.id} style={{display:"flex",justifyContent:isNutri?"flex-start":"flex-end"}}>
                  {isNutri&&<div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${C.purple},${C.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,marginRight:8,flexShrink:0,alignSelf:"flex-end"}}>👩</div>}
                  <div style={{maxWidth:"78%"}}>
                    <div style={{background:isNutri?C.card:C.purple,color:isNutri?C.text:"#fff",borderRadius:isNutri?"16px 16px 16px 4px":"16px 16px 4px 16px",padding:"9px 13px",fontSize:13,lineHeight:1.5}}>
                      {m.text}
                    </div>
                    <div style={{fontSize:10,color:C.muted,marginTop:2,textAlign:isNutri?"left":"right"}}>{m.time}</div>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef2}/>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"flex-end",paddingTop:10,borderTop:`1px solid ${C.border}`}}>
            <input value={nutriChatInput} onChange={e=>setNutriChatInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&nutriChatInput.trim()){ const now3=new Date(); setNutriChat(p=>[...p,{id:"nc"+Date.now(),from:"nutri",text:nutriChatInput.trim(),time:`${String(now3.getHours()).padStart(2,"0")}:${String(now3.getMinutes()).padStart(2,"0")}`,date:tk}]); setNutriChatInput(""); setTimeout(()=>chatEndRef2.current?.scrollIntoView({behavior:"smooth"}),50); }}}
              placeholder="Mensagem para o aluno…" style={{flex:1,background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
            <button onClick={()=>{ if(!nutriChatInput.trim())return; const now3=new Date(); setNutriChat(p=>[...p,{id:"nc"+Date.now(),from:"nutri",text:nutriChatInput.trim(),time:`${String(now3.getHours()).padStart(2,"0")}:${String(now3.getMinutes()).padStart(2,"0")}`,date:tk}]); setNutriChatInput(""); setTimeout(()=>chatEndRef2.current?.scrollIntoView({behavior:"smooth"}),50); }}
              style={{width:40,height:40,borderRadius:"50%",background:nutriChatInput.trim()?C.purple:C.card2,border:"none",color:nutriChatInput.trim()?"#fff":C.muted,fontSize:18,cursor:"pointer",flexShrink:0,transition:"all 0.2s",fontFamily:"inherit"}}>&#8593;</button>
          </div>
        </div>}

        {alunoTab==="cardapio"&&<div>
          <Btn color={C.purple} full style={{marginBottom:16}}>✏️ Editar Cardápio</Btn>
          <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:16,marginBottom:12}}>
            <div style={{fontWeight:700,marginBottom:12,fontSize:15}}>📋 Usar template</div>
            {templates.map(t=>(
              <div key={t.id} style={{background:C.card2,borderRadius:12,padding:"10px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontWeight:700,fontSize:13}}>{t.name}</div><div style={{fontSize:11,color:C.muted}}>{t.goal} · {t.meals.length} refeições</div></div>
                <Btn color={C.purple} xs>Aplicar</Btn>
              </div>
            ))}
          </div>
          {DAYS_FULL.map((d,i)=>(
            <div key={i} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:16,padding:14,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontWeight:700}}>{d}</div>
                <Tag label="padrão" color={C.muted} sm/>
              </div>
              {DEMO_DIET.base.map(m=><div key={m.id} style={{fontSize:12,color:C.sub,display:"flex",gap:8,marginBottom:3}}><span>{m.emoji}</span><span>{m.name}</span><span style={{color:C.muted}}>{m.time}</span></div>)}
            </div>
          ))}
        </div>}
      </div>
    </div>
  );

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,maxWidth:480,margin:"0 auto"}}>
      {templateModal&&<TemplateModal templates={templates} onClose={()=>setTemplateModal(false)} onSave={t=>{ setTemplates(ts=>[...ts,t]); setTemplateModal(false); }}/>}

      {/* Header */}
      <div style={{padding:"52px 24px 24px",background:`linear-gradient(180deg,#0d1a2d 0%,${C.bg} 100%)`}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",padding:0,marginBottom:8}}>← Demo</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:11,color:C.purple,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Painel Nutricionista</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700}}>Dra. Mariana 👩‍⚕️</div>
          </div>
          <div style={{background:`${C.accent}12`,border:`1.5px solid ${C.accent}33`,borderRadius:14,padding:"10px 16px",textAlign:"center"}}>
            <div style={{fontSize:11,color:C.muted}}>assinatura</div>
            <div style={{fontSize:16,fontWeight:800,color:C.accent}}>{daysLeft}d</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:8,padding:"0 20px 16px",overflowX:"auto"}}>
        {[["alunos","👥","Alunos"],["resumo","📊","Resumo"],["convite","🔗","Convite"],["templates","📋","Templates"]].map(([k,ic,lb])=>(
          <button key={k} onClick={()=>setTab(k)} style={{background:tab===k?`${C.purple}18`:"transparent",border:`1.5px solid ${tab===k?C.purple:C.border}`,borderRadius:100,padding:"8px 16px",color:tab===k?C.purple:C.muted,fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"}}>{ic} {lb}</button>
        ))}
      </div>

      <div style={{padding:"0 20px 80px"}}>

        {/* ALUNOS */}
        {tab==="alunos"&&<div>
          {DEMO_ALUNOS.map(a=>{
            const isToday = a.lastSeen===tk;
            const adherenceColor = a.adherence7d>=80?C.accent:a.adherence7d>=60?C.amber:C.red;
            return (
              <div key={a.id} onClick={()=>setSelectedAluno(a)}
                style={{background:C.card,border:`1.5px solid ${a.alerts>0?C.amber+"55":C.border}`,borderRadius:20,padding:"18px 20px",marginBottom:14,cursor:"pointer",transition:"all 0.2s"}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{position:"relative"}}>
                    <div style={{width:48,height:48,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:C.bg,flexShrink:0}}>{a.name[0]}</div>
                    {isToday&&<div style={{position:"absolute",bottom:0,right:0,width:12,height:12,background:C.accent,borderRadius:"50%",border:`2px solid ${C.bg}`}}/>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:16}}>{a.name}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:2}}>🎯 {a.goal} · {isToday?"Ativo hoje":"Último acesso "+a.lastSeen.slice(5).replace("-","/")}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:20,fontWeight:900,color:adherenceColor}}>{a.adherence7d}%</div>
                    <div style={{fontSize:11,color:C.muted}}>7 dias</div>
                  </div>
                  {a.alerts>0&&<div style={{background:`${C.amber}20`,border:`1.5px solid ${C.amber}`,borderRadius:100,padding:"3px 10px",fontSize:12,color:C.amber,fontWeight:700}}>⚠️ {a.alerts}</div>}
                </div>
                <div style={{marginTop:10,background:C.card2,borderRadius:100,height:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${a.adherence7d}%`,background:a.adherence7d>=80?`linear-gradient(90deg,${C.accent},${C.purple})`:a.adherence7d>=60?C.amber:C.red,borderRadius:100}}/>
                </div>
              </div>
            );
          })}
        </div>}

        {/* RESUMO */}
        {tab==="resumo"&&<div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,marginBottom:16}}>Resumo de Hoje</div>
          {alertAlunos.length>0&&<div style={{background:`${C.amber}12`,border:`1.5px solid ${C.amber}44`,borderRadius:18,padding:16,marginBottom:12}}>
            <div style={{fontWeight:700,color:C.amber,marginBottom:10}}>⚠️ Requer atenção</div>
            {alertAlunos.map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:6,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontWeight:600}}>{a.name}</span><span style={{color:C.amber,fontSize:12}}>ver detalhes →</span>
            </div>)}
          </div>}
          {lowAdherence.length>0&&<div style={{background:`${C.red}10`,border:`1.5px solid ${C.red}33`,borderRadius:18,padding:16,marginBottom:12}}>
            <div style={{fontWeight:700,color:C.red,marginBottom:10}}>📉 Baixa adesão esta semana</div>
            {lowAdherence.map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:14,marginBottom:6}}>
              <span>{a.name}</span><span style={{fontWeight:800,color:C.red}}>{a.adherence7d}%</span>
            </div>)}
          </div>}
          {inactiveAlunos.length>0&&<div style={{background:`${C.muted}10`,border:`1.5px solid ${C.muted}33`,borderRadius:18,padding:16,marginBottom:12}}>
            <div style={{fontWeight:700,color:C.sub,marginBottom:10}}>😴 Sem registro há mais de 2 dias</div>
            {inactiveAlunos.map(a=><div key={a.id} style={{fontSize:14,marginBottom:4,color:C.sub}}>{a.name} — último acesso {a.lastSeen.slice(5).replace("-","/")}</div>)}
          </div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
            {[{icon:"📈",label:"Média geral 7d",val:`${Math.round(DEMO_ALUNOS.reduce((s,a)=>s+a.adherence7d,0)/DEMO_ALUNOS.length)}%`,color:C.accent},
              {icon:"👥",label:"Alunos ativos",val:`${DEMO_ALUNOS.filter(a=>a.lastSeen===tk).length}/${DEMO_ALUNOS.length}`,color:C.purple},
              {icon:"⚠️",label:"Com alertas",val:alertAlunos.length,color:C.amber},
              {icon:"📉",label:"Baixa adesão",val:lowAdherence.length,color:C.red}].map(({icon,label,val,color})=>(
              <div key={label} style={{background:C.card,border:`1.5px solid ${color}33`,borderRadius:18,padding:18}}>
                <div style={{fontSize:24,marginBottom:8}}>{icon}</div>
                <div style={{fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:.8,marginBottom:4}}>{label}</div>
                <div style={{fontSize:28,fontWeight:900,color}}>{val}</div>
              </div>
            ))}
          </div>
          {/* Comparativo anônimo por objetivo */}
          <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,padding:18,marginBottom:14}}>
            <div style={{fontWeight:800,marginBottom:14}}>📊 Performance por Objetivo</div>
            {Object.entries(
              DEMO_ALUNOS.reduce((acc,a)=>{
                if(!acc[a.goal])acc[a.goal]={total:0,sum:0,count:0};
                acc[a.goal].sum+=a.adherence7d; acc[a.goal].count++;
                return acc;
              },{})
            ).map(([goal,{sum,count}])=>{
              const avg=Math.round(sum/count);
              const color=avg>=80?C.accent:avg>=60?C.amber:C.red;
              return (
                <div key={goal} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:13,fontWeight:600}}>🎯 {goal}</span>
                    <span style={{fontSize:13,fontWeight:800,color}}>{avg}% ({count} aluno{count>1?"s":""})</span>
                  </div>
                  <div style={{background:C.card2,borderRadius:100,height:6,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${avg}%`,background:color,borderRadius:100,transition:"width 0.4s"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>}

        {/* CONVITE */}
        {tab==="convite"&&<div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,marginBottom:16}}>Convidar Alunos</div>
          <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
            <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>🔗 Link de convite</div>
            <div style={{background:C.card2,borderRadius:12,padding:"12px 16px",fontFamily:"monospace",fontSize:13,color:C.text,wordBreak:"break-all",marginBottom:12,lineHeight:1.5}}>{url}</div>
            <div style={{display:"flex",gap:10}}>
              <Btn color={C.accent} full sm>Copiar link</Btn>
              <Btn color={C.purple} outline full sm>Enviar WhatsApp</Btn>
            </div>
          </div>
          <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,display:"flex",flexDirection:"column",alignItems:"center"}}>
            <div style={{fontSize:12,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>📱 QR Code para consulta</div>
            <QRPlaceholder value={url} size={160}/>
            <div style={{fontSize:12,color:C.muted,marginTop:10,textAlign:"center",lineHeight:1.6}}>Imprima e entregue na consulta. O aluno aponta a câmera e já cai no cadastro vinculado a você.</div>
            <Btn color={C.purple} full sm style={{marginTop:14}}>Baixar QR Code (PNG)</Btn>
          </div>
        </div>}

        {/* TEMPLATES */}
        {tab==="templates"&&<div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,marginBottom:8}}>Templates de Cardápio</div>
          <div style={{color:C.sub,fontSize:14,lineHeight:1.6,marginBottom:20}}>Crie modelos que você reutiliza entre alunos. Aplique com um clique e personalize depois.</div>
          <Btn onClick={()=>setTemplateModal(true)} color={C.purple} full style={{marginBottom:20}}>+ Criar novo template</Btn>
          {templates.map(t=>(
            <div key={t.id} style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{fontWeight:800,fontSize:16}}>{t.name}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2}}>🎯 {t.goal} · {t.meals.length} refeições</div>
                </div>
                <Btn color={C.purple} xs>Aplicar</Btn>
              </div>
              {t.meals.slice(0,3).map(m=>(
                <div key={m.id} style={{display:"flex",gap:10,alignItems:"center",marginBottom:6,background:C.card2,borderRadius:10,padding:"8px 12px"}}>
                  <span style={{fontSize:18}}>{m.emoji}</span>
                  <div style={{flex:1,fontSize:13,fontWeight:600}}>{m.name}</div>
                  <div style={{fontSize:12,color:C.muted}}>{m.time}</div>
                </div>
              ))}
              {t.meals.length>3&&<div style={{fontSize:12,color:C.muted,marginTop:4,textAlign:"center"}}>+ {t.meals.length-3} refeição(ões)</div>}
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}

// ─── Template Modal ───────────────────────────────────────────────────────────
function TemplateModal({templates, onClose, onSave}) {
  const [name,setName] = useState("");
  const [goal,setGoal] = useState("Emagrecimento");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",zIndex:950,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:C.card,borderRadius:"28px 28px 0 0",padding:"28px 24px 44px",width:"100%",maxWidth:480}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700}}>Novo Template</div>
          <button onClick={onClose} style={{background:C.card2,border:"none",color:C.text,borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:18}}>×</button>
        </div>
        <Field label="Nome do template" value={name} onChange={setName} placeholder="Ex: Protocolo Low Carb" icon="📋"/>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>🎯 Objetivo</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["Emagrecimento","Ganho de massa","Saúde geral","Manutenção"].map(g=>(
              <Chip key={g} active={goal===g} onClick={()=>setGoal(g)} color={C.purple} sm>{g}</Chip>
            ))}
          </div>
        </div>
        <div style={{background:`${C.accent}10`,border:`1.5px solid ${C.accent}33`,borderRadius:14,padding:12,fontSize:13,color:C.sub,marginBottom:20}}>
          ✨ O cardápio sugerido para <strong style={{color:C.text}}>{goal}</strong> será usado como base. Você pode editar depois.
        </div>
        <Btn onClick={()=>{ if(!name.trim())return; onSave({id:"t"+Date.now(),name,goal,meals:SUGGESTED_DIETS[goal]||SUGGESTED_DIETS["Saúde geral"]}); }} color={C.purple} full>Criar Template ✓</Btn>
      </div>
    </div>
  );
}

// ─── Admin Portal (separate access at /admin) ────────────────────────────────
function AdminPortal() {
  const [authed, setAuthed]   = useState(false);
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  // Demo credentials
  const ADMIN_EMAIL = "admin@vitalis.app";
  const ADMIN_PASS  = "vitalis2026";

  const handleLogin = () => {
    setError("");
    if (!email.trim() || !pass.trim()) { setError("Preencha e-mail e senha."); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (email.trim().toLowerCase() === ADMIN_EMAIL && pass === ADMIN_PASS) {
        setAuthed(true);
      } else {
        setError("Credenciais inválidas. Tente novamente.");
      }
    }, 900);
  };

  if (authed) return <AdminApp onBack={()=>setAuthed(false)}/>;

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",background:`radial-gradient(ellipse at top,#0d1a2d 0%,${C.bg} 60%)`,fontFamily:"'Outfit',sans-serif",color:C.text,maxWidth:480,margin:"0 auto"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet"/>
      {/* Logo */}
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{fontSize:64,marginBottom:12,filter:"drop-shadow(0 0 24px rgba(245,158,11,0.4))"}}>🛡️</div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:900,marginBottom:4}}>Vitalis Admin</div>
        <div style={{fontSize:13,color:C.muted}}>Acesso restrito — somente administradores</div>
      </div>
      {/* Form */}
      <div style={{width:"100%",background:C.card,border:`1.5px solid ${C.amber}33`,borderRadius:24,padding:"28px 24px"}}>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>E-mail</div>
          <input
            type="email" value={email} onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleLogin()}
            placeholder="admin@vitalis.app"
            style={{width:"100%",background:C.card2,border:`1.5px solid ${error?C.red:C.border}`,borderRadius:14,padding:"14px 16px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}
          />
        </div>
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Senha</div>
          <div style={{position:"relative"}}>
            <input
              type={showPass?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              placeholder="••••••••"
              style={{width:"100%",background:C.card2,border:`1.5px solid ${error?C.red:C.border}`,borderRadius:14,padding:"14px 48px 14px 16px",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}
            />
            <button onClick={()=>setShowPass(p=>!p)}
              style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,fontFamily:"inherit"}}>
              {showPass?"🙈":"👁️"}
            </button>
          </div>
        </div>
        {error&&<div style={{background:`${C.red}12`,border:`1px solid ${C.red}44`,borderRadius:12,padding:"10px 14px",fontSize:13,color:C.red,marginBottom:16}}>{error}</div>}
        <button onClick={handleLogin} disabled={loading}
          style={{width:"100%",background:loading?"#333":`linear-gradient(135deg,${C.amber},#f59e0b)`,border:"none",borderRadius:14,padding:"15px 0",color:"#000",fontSize:15,fontWeight:900,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>
          {loading?"Verificando…":"Entrar no Admin"}
        </button>
        {/* Demo hint */}
        <div style={{marginTop:16,background:`${C.amber}08`,border:`1px solid ${C.amber}22`,borderRadius:12,padding:"10px 14px",fontSize:12,color:C.muted,textAlign:"center",lineHeight:1.6}}>
          Demo: <span style={{color:C.amber,fontWeight:700}}>admin@vitalis.app</span> / <span style={{color:C.amber,fontWeight:700}}>vitalis2026</span>
        </div>
      </div>
      <div style={{marginTop:24,fontSize:12,color:C.muted,textAlign:"center",lineHeight:1.6}}>
        Este painel é acessado em<br/>
        <span style={{color:C.amber,fontWeight:700}}>vitalis.app/admin</span>
      </div>
    </div>
  );
}

// ─── Admin App ────────────────────────────────────────────────────────────────
function AdminApp({onBack}) {
  const [tab,setTab]               = useState("nutris");
  const [nutris,setNutris]         = useState(DEMO_ADMIN_NUTRIS);
  const [filterStatus,setFilterStatus] = useState("todos");
  const [searchQ,setSearchQ]       = useState("");
  const [planModal,setPlanModal]   = useState(null);
  const [editPlan,setEditPlan]     = useState("anual");
  const [editValor,setEditValor]   = useState(599);

  const PLANS = [
    {key:"mensal",   label:"Mensal",    months:1,  valor:89},
    {key:"trimestral",label:"Trimestral",months:3, valor:229},
    {key:"semestral",label:"Semestral", months:6,  valor:349},
    {key:"anual",    label:"Anual",     months:12, valor:599},
  ];

  const statusColor = {ativo:C.accent, vencendo:C.amber, bloqueado:C.red};
  const statusLabel = {ativo:"Ativo", vencendo:"Vencendo", bloqueado:"Bloqueado"};
  const statusIcon  = {ativo:"✅", vencendo:"⚠️", bloqueado:"🔒"};

  const filtered = nutris
    .filter(n=>filterStatus==="todos"||n.status===filterStatus)
    .filter(n=>!searchQ||n.name.toLowerCase().includes(searchQ.toLowerCase())||n.email.toLowerCase().includes(searchQ.toLowerCase()));

  const totalMRR = nutris.filter(n=>n.status!=="bloqueado").reduce((s,n)=>s+(
    n.plan==="mensal"?n.valor:n.plan==="trimestral"?n.valor/3:n.plan==="semestral"?n.valor/6:n.valor/12
  ),0);
  const totalAlunos = nutris.reduce((s,n)=>s+n.alunos,0);

  const daysUntil = d=>Math.ceil((new Date(d)-new Date())/(1000*60*60*24));

  const toggleBlock = id=>{
    setNutris(p=>p.map(n=>n.id===id?{...n,status:n.status==="bloqueado"?"ativo":"bloqueado"}:n));
  };

  const savePlan = nutri=>{
    const plan=PLANS.find(p=>p.key===editPlan)||PLANS[3];
    const start=new Date(); const until=new Date(start); until.setMonth(until.getMonth()+plan.months);
    const fmt=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    setNutris(p=>p.map(n=>n.id===nutri.id?{...n,plan:editPlan,planMonths:plan.months,startDate:fmt(start),paidUntil:fmt(until),status:"ativo",valor:editValor}:n));
    setPlanModal(null);
  };

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,maxWidth:480,margin:"0 auto"}}>
      {/* Plan modal */}
      {planModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.93)",zIndex:900,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:C.card,borderRadius:"28px 28px 0 0",padding:"28px 24px 48px",width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700}}>📋 Editar Plano</div>
              <button onClick={()=>setPlanModal(null)} style={{background:C.card2,border:"none",color:C.text,borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:18,fontFamily:"inherit"}}>x</button>
            </div>
            <div style={{background:C.card2,borderRadius:14,padding:14,marginBottom:20}}>
              <div style={{fontWeight:700}}>{planModal.name}</div>
              <div style={{fontSize:12,color:C.muted}}>{planModal.email}</div>
            </div>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Plano</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              {PLANS.map(p=>(
                <button key={p.key} onClick={()=>{setEditPlan(p.key);setEditValor(p.valor);}}
                  style={{background:editPlan===p.key?`${C.amber}20`:"transparent",border:`1.5px solid ${editPlan===p.key?C.amber:C.border}`,borderRadius:14,padding:"12px 10px",cursor:"pointer",fontFamily:"inherit",color:editPlan===p.key?C.amber:C.sub,textAlign:"center"}}>
                  <div style={{fontWeight:800,fontSize:14}}>{p.label}</div>
                  <div style={{fontSize:13,color:editPlan===p.key?C.amber:C.muted,marginTop:2}}>R$ {p.valor}</div>
                  <div style={{fontSize:11,color:C.muted}}>{p.months} {p.months===1?"mes":"meses"}</div>
                </button>
              ))}
            </div>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Valor cobrado (R$)</div>
            <input type="number" value={editValor} onChange={e=>setEditValor(Number(e.target.value))}
              style={{width:"100%",background:C.card2,border:`1.5px solid ${C.border}`,borderRadius:12,padding:"12px 14px",color:C.text,fontSize:16,fontWeight:700,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:20}}/>
            <Btn color={C.amber} full onClick={()=>savePlan(planModal)}>Confirmar pagamento e ativar</Btn>
          </div>
        </div>
      )}
      {/* Header */}
      <div style={{padding:"52px 24px 20px",background:`linear-gradient(180deg,#0d1a2d 0%,${C.bg} 100%)`}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",padding:0,marginBottom:8}}>&#8592; Sair</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:11,color:C.amber,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5,marginBottom:4}}>Painel Admin</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:700}}>&#128737; Vitalis Admin</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:C.muted}}>MRR estimado</div>
            <div style={{fontSize:24,fontWeight:900,color:C.amber}}>R$ {Math.round(totalMRR)}</div>
          </div>
        </div>
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
          <button key={k} onClick={()=>setTab(k)} style={{background:tab===k?`${C.amber}18`:"transparent",border:`1.5px solid ${tab===k?C.amber:C.border}`,borderRadius:100,padding:"8px 18px",color:tab===k?C.amber:C.muted,fontWeight:700,fontSize:13,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"}}>{lb}</button>
        ))}
      </div>
      <div style={{padding:"0 20px 60px"}}>
        {tab==="nutris"&&<div>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Buscar profissional..."
            style={{width:"100%",background:C.card,border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 16px",color:C.text,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:12}}/>
          <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
            {["todos","ativo","vencendo","bloqueado"].map(s=>(
              <button key={s} onClick={()=>setFilterStatus(s)}
                style={{background:filterStatus===s?`${statusColor[s]||C.accent}20`:"transparent",border:`1.5px solid ${filterStatus===s?statusColor[s]||C.accent:C.border}`,borderRadius:100,padding:"6px 14px",color:filterStatus===s?statusColor[s]||C.accent:C.muted,fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",textTransform:"capitalize"}}>
                {s==="todos"?"Todos":statusLabel[s]}
              </button>
            ))}
          </div>
          {filtered.map(n=>{
            const days=daysUntil(n.paidUntil);
            const sc=statusColor[n.status];
            return (
              <div key={n.id} style={{background:C.card,border:`1.5px solid ${n.status==="vencendo"?C.amber+"55":n.status==="bloqueado"?C.red+"44":C.border}`,borderRadius:20,padding:"18px 20px",marginBottom:14}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${C.purple},${C.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:C.bg,flexShrink:0}}>{n.name[4]||n.name[0]}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:800,fontSize:15,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.name}</div>
                    <div style={{fontSize:12,color:C.muted,marginTop:1}}>{n.email}</div>
                  </div>
                  <div style={{background:`${sc}20`,border:`1.5px solid ${sc}55`,borderRadius:100,padding:"3px 10px",fontSize:11,color:sc,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>{statusIcon[n.status]} {statusLabel[n.status]}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                  {[
                    {label:"Alunos",val:n.alunos,color:C.accent},
                    {label:"Plano",val:n.plan.charAt(0).toUpperCase()+n.plan.slice(1),color:C.purple},
                    {label:n.status==="bloqueado"?"Vencido":days>=0?"Restam":"Vencido",val:`${Math.abs(days)}d`,color:days<=7&&n.status!=="bloqueado"?C.amber:n.status==="bloqueado"?C.red:C.muted},
                  ].map(({label,val,color})=>(
                    <div key={label} style={{background:C.card2,borderRadius:12,padding:"10px 0",textAlign:"center"}}>
                      <div style={{fontSize:15,fontWeight:900,color}}>{val}</div>
                      <div style={{fontSize:10,color:C.muted,marginTop:1}}>{label}</div>
                    </div>
                  ))}
                </div>
                {n.status!=="bloqueado"&&<div style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted,marginBottom:4}}>
                    <span>Pago ate {n.paidUntil.slice(8)}/{n.paidUntil.slice(5,7)}/{n.paidUntil.slice(0,4)}</span>
                    <span style={{color:days<=30?C.amber:C.muted}}>{days}d restantes</span>
                  </div>
                  <div style={{background:C.card2,borderRadius:100,height:5,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${Math.max(2,Math.min(100,(days/365)*100))}%`,background:days<=30?C.amber:C.accent,borderRadius:100}}/>
                  </div>
                </div>}
                <div style={{display:"flex",gap:8}}>
                  <Btn color={C.amber} sm full onClick={()=>{setEditPlan(n.plan);setEditValor(n.valor);setPlanModal(n);}}>Editar plano</Btn>
                  <button onClick={()=>toggleBlock(n.id)}
                    style={{background:n.status==="bloqueado"?`${C.accent}15`:`${C.red}12`,border:`1.5px solid ${n.status==="bloqueado"?C.accent+"44":C.red+"44"}`,borderRadius:12,padding:"8px 14px",color:n.status==="bloqueado"?C.accent:C.red,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                    {n.status==="bloqueado"?"Desbloquear":"Bloquear"}
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length===0&&<div style={{textAlign:"center",color:C.muted,padding:"40px 0",fontSize:14}}>Nenhum resultado</div>}
        </div>}
        {tab==="metricas"&&<div>
          <div style={{background:C.card,border:`1.5px solid ${C.amber}33`,borderRadius:20,padding:20,marginBottom:16}}>
            <div style={{fontWeight:800,fontSize:16,marginBottom:16}}>Receita por plano</div>
            {["anual","semestral","trimestral","mensal"].map(pk=>{
              const grupo=nutris.filter(n=>n.plan===pk&&n.status!=="bloqueado");
              if(!grupo.length)return null;
              const total=grupo.reduce((s,n)=>s+n.valor,0);
              return (
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
          <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20,marginBottom:16}}>
            <div style={{fontWeight:800,fontSize:16,marginBottom:16}}>Alunos por profissional</div>
            {[...nutris].sort((a,b)=>b.alunos-a.alunos).map(n=>(
              <div key={n.id} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:13,fontWeight:600,color:n.status==="bloqueado"?C.muted:C.text}}>{n.name.split(" ").slice(0,2).join(" ")}</span>
                  <span style={{fontSize:13,fontWeight:800,color:n.alunos>=15?C.accent:C.purple}}>{n.alunos} alunos</span>
                </div>
                <div style={{background:C.card2,borderRadius:100,height:7,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.max(2,(n.alunos/20)*100)}%`,background:n.status==="bloqueado"?C.border:n.alunos>=15?`linear-gradient(90deg,${C.accent},${C.purple})`:C.purple,borderRadius:100,opacity:n.status==="bloqueado"?.4:1}}/>
                </div>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",marginTop:14,paddingTop:14,borderTop:`1px solid ${C.border}`}}>
              <span style={{fontWeight:700}}>Total de alunos</span>
              <span style={{fontWeight:900,fontSize:16,color:C.accent}}>{totalAlunos}</span>
            </div>
          </div>
          <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:20}}>
            <div style={{fontWeight:800,fontSize:16,marginBottom:14}}>Renovacoes proximas (30d)</div>
            {nutris.filter(n=>{const d=daysUntil(n.paidUntil);return d>=0&&d<=30;}).length===0
              ?<div style={{color:C.muted,fontSize:13}}>Nenhuma renovacao nos proximos 30 dias</div>
              :nutris.filter(n=>{const d=daysUntil(n.paidUntil);return d>=0&&d<=30;}).sort((a,b)=>daysUntil(a.paidUntil)-daysUntil(b.paidUntil)).map(n=>(
                <div key={n.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:13}}>{n.name.split(" ").slice(0,2).join(" ")}</div>
                    <div style={{fontSize:11,color:C.muted}}>Vence {n.paidUntil.slice(8)}/{n.paidUntil.slice(5,7)} - {n.plan}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:900,color:daysUntil(n.paidUntil)<=7?C.red:C.amber}}>{daysUntil(n.paidUntil)}d</div>
                    <div style={{fontSize:11,color:C.muted}}>R$ {n.valor}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>}
      </div>
    </div>
  );
}

// ─── Blocked Screen ───────────────────────────────────────────────────────────
function BlockedScreen({onBack}) {
  const [type,setType] = useState("vencido");
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center",background:`radial-gradient(ellipse at top,#1a0a0a 0%,${C.bg} 60%)`}}>
      <button onClick={onBack} style={{position:"absolute",top:52,left:24,background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit"}}>← Demo</button>
      <div style={{display:"flex",gap:10,marginBottom:36}}>
        <Chip active={type==="vencido"} onClick={()=>setType("vencido")} color={C.amber}>⏰ Vencido</Chip>
        <Chip active={type==="bloqueado"} onClick={()=>setType("bloqueado")} color={C.red}>🔒 Bloqueado</Chip>
      </div>
      <div style={{fontSize:80,marginBottom:20,filter:`drop-shadow(0 0 30px ${type==="bloqueado"?C.red:C.amber}55)`}}>{type==="bloqueado"?"🔒":"⏰"}</div>
      <div style={{fontFamily:"'Playfair Display',serif",fontSize:30,fontWeight:900,marginBottom:12}}>
        {type==="bloqueado" ? "Acesso Bloqueado" : "Assinatura Expirada"}
      </div>
      <div style={{color:C.sub,fontSize:15,lineHeight:1.75,marginBottom:32,maxWidth:300}}>
        {type==="bloqueado"
          ? "Sua conta foi suspensa. Entre em contato com o suporte para reativar."
          : "Seu plano anual terminou. Renove para continuar acompanhando seus alunos sem interrupção."}
      </div>
      <div style={{background:C.card,border:`1.5px solid ${C.border}`,borderRadius:20,padding:24,width:"100%",maxWidth:340,marginBottom:20}}>
        <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>Dra. Mariana Costa</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:12}}>mariana@nutri.com</div>
        {type==="vencido"&&<div style={{fontSize:12,color:C.red,background:`${C.red}12`,border:`1.5px solid ${C.red}33`,borderRadius:10,padding:"8px 12px"}}>⏰ Venceu em 07/04/2026</div>}
        {type==="bloqueado"&&<div style={{fontSize:12,color:C.amber,background:`${C.amber}12`,border:`1.5px solid ${C.amber}33`,borderRadius:10,padding:"8px 12px"}}>🔒 Bloqueado manualmente em 07/04/2026</div>}
      </div>
      <div style={{background:`${C.amber}12`,border:`1.5px solid ${C.amber}33`,borderRadius:16,padding:16,width:"100%",maxWidth:340,marginBottom:28,fontSize:14,color:C.sub,lineHeight:1.7}}>
        📱 Entre em contato para renovar sua assinatura anual e continuar usando o Vitalis.
      </div>
      <button style={{background:"transparent",border:`1.5px solid ${C.border}`,borderRadius:14,padding:"12px 28px",color:C.muted,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Sair da conta</button>
    </div>
  );
}
