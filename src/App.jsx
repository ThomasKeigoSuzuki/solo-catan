import { useState, useEffect, useCallback, useMemo, useRef } from "react";

const useIsPC = () => {
  const [isPC, setIsPC] = useState(window.innerWidth >= 900);
  useEffect(() => {
    const fn = () => setIsPC(window.innerWidth >= 900);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isPC;
};

const HEX=36,S3=Math.sqrt(3),DEPTH=8;
const TC={forest:4,hill:3,pasture:4,field:4,mountain:3,desert:1};
const TCOL={forest:['#15803d','#22c55e','#86efac'],hill:['#c2410c','#ea580c','#fb923c'],pasture:['#65a30d','#a3e635','#d9f99d'],field:['#a16207','#eab308','#fde047'],mountain:['#57534e','#78716c','#d6d3d1'],desert:['#b08050','#d4a86a','#f0dcc0']};
const TSIDE={forest:'#14532d',hill:'#92400e',pasture:'#3f6212',field:'#854d0e',mountain:'#44403c',desert:'#8a6a40'};
const RMAP={forest:'wood',hill:'brick',pasture:'sheep',field:'wheat',mountain:'ore'};
const REMJ={wood:'🪵',brick:'🧱',sheep:'🐑',wheat:'🌾',ore:'⛏️'};
const RCOL={wood:'#6d4c2a',brick:'#c1440e',sheep:'#5da040',wheat:'#daa520',ore:'#7a7a8a'};
const RK=['wood','brick','sheep','wheat','ore'];
const NUMS=[2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12];
const PIPS={2:1,3:2,4:3,5:4,6:5,8:5,9:4,10:3,11:2,12:1,0:0};
const COST={road:{wood:1,brick:1,sheep:0,wheat:0,ore:0},settlement:{wood:1,brick:1,sheep:1,wheat:1,ore:0},city:{wood:0,brick:0,sheep:0,wheat:2,ore:3},devcard:{wood:0,brick:0,sheep:1,wheat:1,ore:1}};
const DEVDECK=[...Array(14).fill('knight'),...Array(5).fill('vp')];
const OW={P:'player',N1:'npc1',N2:'npc2'};
const OCOL={
  player:{m:'#f59e0b',l:'#fef3c7',s:'#d97706',bg:'rgba(245,158,11,.1)',name:'あなた',emoji:'✨'},
  npc1:{m:'#ef4444',l:'#fee2e2',s:'#dc2626',bg:'rgba(239,68,68,.1)',name:'赤',emoji:'🔥'},
  npc2:{m:'#3b82f6',l:'#dbeafe',s:'#2563eb',bg:'rgba(59,130,246,.1)',name:'青',emoji:'💧'},
};
const SEATS={player:{x:0,y:188},npc1:{x:-175,y:-120},npc2:{x:175,y:-120}};
const HEXPOS=[{q:0,r:0},{q:1,r:0},{q:0,r:1},{q:-1,r:1},{q:-1,r:0},{q:0,r:-1},{q:1,r:-1},{q:2,r:0},{q:1,r:1},{q:0,r:2},{q:-1,r:2},{q:-2,r:2},{q:-2,r:1},{q:-2,r:0},{q:-1,r:-1},{q:0,r:-2},{q:1,r:-2},{q:2,r:-2},{q:2,r:-1}];
const PORTTYPES=['3:1','wood','3:1','sheep','3:1','ore','3:1','wheat','brick'];
const SVG_W=520,SVG_H=520;

const shuf=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=0|Math.random()*(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};
const h2p=(q,r)=>({x:HEX*(S3*q+S3/2*r),y:HEX*1.5*r});
const hC=(cx,cy)=>Array.from({length:6},(_,i)=>{const a=Math.PI/180*(60*i-30);return{x:cx+HEX*Math.cos(a),y:cy+HEX*Math.sin(a)};});
const rkk=(x,y)=>`${Math.round(x*10)/10},${Math.round(y*10)/10}`;
const canAff=(r,c)=>RK.every(k=>(r[k]||0)>=(c[k]||0));
const sub=(r,c)=>{const o={...r};RK.forEach(k=>{o[k]-=(c[k]||0);});return o;};
const emR=()=>({wood:0,brick:0,sheep:0,wheat:0,ore:0});

function genBoard(){const tp=[];for(const[t,c]of Object.entries(TC))for(let i=0;i<c;i++)tp.push(t);const sT=shuf(tp),sN=shuf([...NUMS]);let ni=0;const tiles=[],vM=new Map(),V=[],eM=new Map(),E=[];
HEXPOS.forEach((p,ti)=>{const{x:cx,y:cy}=h2p(p.q,p.r);const t=sT[ti];const n=t==='desert'?0:sN[ni++];const cs=hC(cx,cy),vids=[],eids=[];
cs.forEach(c=>{const k=rkk(c.x,c.y);if(!vM.has(k)){const id=V.length;vM.set(k,id);V.push({id,x:c.x,y:c.y,b:null,o:null,tids:[],port:null,av:[],ae:[]});}const vid=vM.get(k);if(!V[vid].tids.includes(ti))V[vid].tids.push(ti);vids.push(vid);});
for(let i=0;i<6;i++){const v1=vids[i],v2=vids[(i+1)%6];const ek=`${Math.min(v1,v2)}-${Math.max(v1,v2)}`;if(!eM.has(ek)){const id=E.length;eM.set(ek,id);E.push({id,o:null,vs:[v1,v2]});}eids.push(eM.get(ek));}
tiles.push({id:ti,type:t,num:n,rob:t==='desert',cx,cy,vids,eids,q:p.q,r:p.r});});
E.forEach(e=>{const[v1,v2]=e.vs;if(!V[v1].av.includes(v2))V[v1].av.push(v2);if(!V[v2].av.includes(v1))V[v2].av.push(v1);if(!V[v1].ae.includes(e.id))V[v1].ae.push(e.id);if(!V[v2].ae.includes(e.id))V[v2].ae.push(e.id);});
const outerV=new Set(V.filter(v=>v.tids.length<3).map(v=>v.id));const outerE=E.filter(e=>outerV.has(e.vs[0])&&outerV.has(e.vs[1]));
const sorted=[...outerE].sort((a,b)=>{const ax=(V[a.vs[0]].x+V[a.vs[1]].x)/2,ay=(V[a.vs[0]].y+V[a.vs[1]].y)/2,bx=(V[b.vs[0]].x+V[b.vs[1]].x)/2,by=(V[b.vs[0]].y+V[b.vs[1]].y)/2;return Math.atan2(ay,ax)-Math.atan2(by,bx);});
const step=Math.max(1,Math.floor(sorted.length/9));const sP=shuf([...PORTTYPES]);const pE=[];
for(let i=0;i<9&&i*step<sorted.length;i++){const e=sorted[i*step];pE.push({eid:e.id,type:sP[i]});e.vs.forEach(vid=>{if(!V[vid].port)V[vid].port=sP[i];});}
return {tiles,V,E,robId:tiles.findIndex(t=>t.type==='desert'),ports:pE};}

function lRoad(E,ow){const adj={};E.forEach(e=>{if(e.o!==ow)return;const[v1,v2]=e.vs;if(!adj[v1])adj[v1]=[];if(!adj[v2])adj[v2]=[];adj[v1].push({eid:e.id,to:v2});adj[v2].push({eid:e.id,to:v1});});let mx=0;const vis=new Set();function d(v,l){mx=Math.max(mx,l);for(const{eid,to}of(adj[v]||[])){if(!vis.has(eid)){vis.add(eid);d(to,l+1);vis.delete(eid);}}}Object.keys(adj).forEach(v=>{vis.clear();d(+v,0);});return mx;}
function scoreV(vid,tiles,V){const v=V[vid];let s=0;const rt=new Set();v.tids.forEach(tid=>{const t=tiles[tid];if(t.type!=='desert'){s+=(PIPS[t.num]||0);rt.add(RMAP[t.type]);}});s+=rt.size*1.5;if(v.port)s+=2;return s;}

// v5: BUG-2 - Place ONE settlement+road for NPC (returns {board, vid} for initial resource calc)
function npcPlaceOne(ow, B) {
  const b = JSON.parse(JSON.stringify(B));
  let bv = -1, bs = -1;
  b.V.forEach(v => {
    if (v.b) return;
    if (v.av.some(a => b.V[a].b)) return;
    const sc = scoreV(v.id, b.tiles, b.V);
    if (sc > bs) { bs = sc; bv = v.id; }
  });
  if (bv < 0) return { board: b, vid: -1 };
  b.V[bv].b = 'settlement'; b.V[bv].o = ow;
  const ae = b.V[bv].ae.map(eid => b.E[eid]).filter(e => !e.o);
  if (ae.length > 0) {
    let be = ae[0], bn = -1;
    ae.forEach(e => { const ot = e.vs[0] === bv ? e.vs[1] : e.vs[0]; const sc = scoreV(ot, b.tiles, b.V); if (sc > bn) { bn = sc; be = e; } });
    b.E[be.id].o = ow;
  }
  return { board: b, vid: bv };
}

function npcBuild(ow,B,st,dk){const b=JSON.parse(JSON.stringify(B));const s=JSON.parse(JSON.stringify(st));let d=[...dk];const acts=[];
const tryB=()=>{if(canAff(s.resources,COST.city)&&s.cL>0){const ss=b.V.filter(v=>v.b==='settlement'&&v.o===ow);if(ss.length>0){let bv=ss[0],bs=0;ss.forEach(v=>{const sc=scoreV(v.id,b.tiles,b.V);if(sc>bs){bs=sc;bv=v;}});b.V[bv.id].b='city';s.resources=sub(s.resources,COST.city);s.cL--;s.sL++;acts.push({type:'city',ow,msg:`${OCOL[ow].name}が都市建設`});return true;}}
if(canAff(s.resources,COST.settlement)&&s.sL>0){const cs=b.V.filter(v=>{if(v.b)return false;if(v.av.some(a=>b.V[a].b))return false;return v.ae.some(eid=>b.E[eid].o===ow);});if(cs.length>0){let bv=cs[0],bs=-1;cs.forEach(v=>{const sc=scoreV(v.id,b.tiles,b.V);if(sc>bs){bs=sc;bv=v;}});b.V[bv.id].b='settlement';b.V[bv.id].o=ow;s.resources=sub(s.resources,COST.settlement);s.sL--;acts.push({type:'settle',ow,msg:`${OCOL[ow].name}が開拓地建設`});return true;}}
if(canAff(s.resources,COST.road)&&s.rL>0){const myV=new Set();b.E.forEach(e=>{if(e.o===ow){myV.add(e.vs[0]);myV.add(e.vs[1]);}});b.V.filter(v=>v.b&&v.o===ow).forEach(v=>myV.add(v.id));let be=null,bs=-1;myV.forEach(vid=>{b.V[vid].ae.forEach(eid=>{const e=b.E[eid];if(e.o)return;const ot=e.vs[0]===vid?e.vs[1]:e.vs[0];const sc=scoreV(ot,b.tiles,b.V);if(sc>bs){bs=sc;be=e;}});});if(be){b.E[be.id].o=ow;s.resources=sub(s.resources,COST.road);s.rL--;acts.push({type:'road',ow,msg:`${OCOL[ow].name}が道路建設`});return true;}}
if(canAff(s.resources,COST.devcard)&&d.length>0){const c=d.shift();s.resources=sub(s.resources,COST.devcard);s.devCards.push({type:c,used:false});acts.push({type:'dev',ow,msg:`${OCOL[ow].name}が${c==='vp'?'VP':'騎士'}カード`});return true;}return false;};
for(let i=0;i<3;i++)if(!tryB())break;
// v5: BUG-1 - NPC knight with steal (simplified: move robber to best player tile)
const ki=s.devCards.findIndex(c=>c.type==='knight'&&!c.used);if(ki>=0){const nv=b.V.filter(v=>v.o===ow&&v.b);const aff=new Set();nv.forEach(v=>v.tids.forEach(tid=>{if(b.tiles[tid].rob&&b.tiles[tid].type!=='desert')aff.add(tid);}));if(aff.size>0){
  // Find best tile to move robber to (one with player settlements)
  let targetTid = -1, bestTarget = -1;
  b.tiles.forEach(t => { if (t.type === 'desert' || t.rob) return; let pCount = 0; t.vids.forEach(vid => { if (b.V[vid].o && b.V[vid].o !== ow && b.V[vid].b) pCount++; }); if (pCount > bestTarget) { bestTarget = pCount; targetTid = t.id; } });
  if (targetTid < 0) targetTid = b.tiles.findIndex(t => t.type === 'desert');
  b.tiles.forEach(t => { t.rob = t.id === targetTid; }); b.robId = targetTid;
  s.devCards[ki].used = true; s.kP++;
  // v5: steal from adjacent player
  const tile = b.tiles[targetTid]; const victims = [];
  tile.vids.forEach(vid => { const v = b.V[vid]; if (v.o && v.o !== ow && v.b) victims.push(v.o); });
  let stolenMsg = '';
  if (victims.length > 0) {
    const target = victims[Math.floor(Math.random() * victims.length)];
    // We can't directly setP here since this is a pure function - return steal info in acts
    const targetRes = target === OW.P ? null : s; // handled in caller
    acts.push({ type: 'knight', ow, msg: `${OCOL[ow].name}が騎士使用`, stealFrom: target });
  } else {
    acts.push({ type: 'knight', ow, msg: `${OCOL[ow].name}が騎士使用` });
  }
}}
return {board:b,state:s,dk:d,acts};}

// ═══════════════════════════════════════════════════
// SVG SUB-COMPONENTS (unchanged from v4)
// ═══════════════════════════════════════════════════
function Hex3D({t,showR,robId,onClick,glow}){
  const cs=hC(t.cx,t.cy); const top=cs.map(c=>`${c.x},${c.y}`).join(' ');
  const sides=[]; for(let i=1;i<=3;i++){const c1=cs[i],c2=cs[(i+1)%6];sides.push(`${c1.x},${c1.y} ${c2.x},${c2.y} ${c2.x},${c2.y+DEPTH} ${c1.x},${c1.y+DEPTH}`);}
  const rc=showR&&t.id!==robId; const sideCol=TSIDE[t.type]||'#333';
  return <g onClick={()=>{if(rc&&onClick)onClick(t.id);}} style={{cursor:rc?'pointer':'default'}}>
    {sides.map((s,i)=><polygon key={`s${i}`} points={s} fill={sideCol} stroke="#1a0e04" strokeWidth=".5" opacity={t.rob&&t.type!=='desert'?.3:1}/>)}
    <polygon points={top} fill="rgba(0,0,0,.2)" transform={`translate(2,${DEPTH+2})`}/>
    <polygon points={top} fill={`url(#tg_${t.type})`} stroke="#2a1a0a" strokeWidth="1.5" opacity={t.rob&&t.type!=='desert'?.35:1}/>
    <polygon points={hC(t.cx,t.cy).map(c=>`${c.x*.92+t.cx*.08},${c.y*.92+t.cy*.08}`).join(' ')} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth=".5"/>
    <TerrainDeco type={t.type} cx={t.cx} cy={t.cy}/>
    {t.num>0&&!t.rob&&<g><circle cx={t.cx} cy={t.cy+10} r="9" fill="#fffbeb" stroke="#d97706" strokeWidth="1.2" filter="url(#hs)"/><text x={t.cx} y={t.cy+13.5} textAnchor="middle" fontSize="10" fontWeight="bold" fill={t.num===6||t.num===8?'#dc2626':'#1c1917'} style={{pointerEvents:'none'}}>{t.num}</text><text x={t.cx} y={t.cy+19} textAnchor="middle" fontSize="4.5" fill={t.num===6||t.num===8?'#dc2626':'#a8a29e'} style={{pointerEvents:'none'}}>{'•'.repeat(PIPS[t.num]||0)}</text></g>}
    {t.rob&&t.type!=='desert'&&<text x={t.cx} y={t.cy+6} textAnchor="middle" fontSize="18" style={{pointerEvents:'none'}}>🦹</text>}
    {rc&&<polygon points={top} fill="rgba(249,115,22,.15)" stroke="#f97316" strokeWidth="2" strokeDasharray="4,2" style={{animation:'shimmer 1s infinite'}}/>}
    {glow&&<polygon points={top} fill="rgba(253,224,71,.4)" stroke="#f59e0b" strokeWidth="2" filter="url(#glow)" style={{animation:'tileGlow 1.4s ease-out forwards',pointerEvents:'none'}}/>}
  </g>;
}
function TerrainDeco({type, cx, cy}) {
  const icons = {forest:'🌲',hill:'🧱',pasture:'🐑',field:'🌾',mountain:'⛰️',desert:'🏜️'};
  return <g>
    <text x={cx} y={cy-10} textAnchor="middle" fontSize="15" style={{pointerEvents:'none',filter:'drop-shadow(0 1px 1px rgba(0,0,0,.2))'}}>{icons[type]}</text>
  </g>;
}
function Settlement({x,y,owner}){const c=OCOL[owner];return <g transform={`translate(${x},${y})`} style={{animation:'popIn .4s ease-out'}}><polygon points="-6,2 -6,-2 0,-7 6,-2 6,2" fill={c.l} stroke={c.s} strokeWidth="1.2"/><rect x="-6" y="2" width="12" height="5" fill={c.l} stroke={c.s} strokeWidth="1"/><rect x="-2" y="3" width="4" height="4" fill={c.m} opacity=".4"/></g>;}
function CityB({x,y,owner}){const c=OCOL[owner];return <g transform={`translate(${x},${y})`} style={{animation:'popIn .4s ease-out'}}><rect x="-8" y="-2" width="16" height="9" fill={c.l} stroke={c.s} strokeWidth="1"/><rect x="-9" y="-6" width="6" height="8" fill={c.l} stroke={c.s} strokeWidth="1"/><polygon points="-9,-6 -6,-10 -3,-6" fill={c.m} stroke={c.s} strokeWidth=".8"/><rect x="3" y="-4" width="5" height="6" fill={c.l} stroke={c.s} strokeWidth="1"/><polygon points="3,-4 5.5,-8 8,-4" fill={c.m} stroke={c.s} strokeWidth=".8"/></g>;}
function Road({x1,y1,x2,y2,owner}){const c=OCOL[owner];return <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,.3)" strokeWidth="5" strokeLinecap="round"/><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c.s} strokeWidth="4" strokeLinecap="round"/><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c.m} strokeWidth="2.5" strokeLinecap="round"/></g>;}
function Avatar({x,y,owner,vp,active}){const c=OCOL[owner];
  return <g transform={`translate(${x},${y})`} style={{filter:active?'drop-shadow(0 0 6px '+c.m+')':'none'}}>
    {active && <circle cx="0" cy="0" r="25" fill="none" stroke={c.m} strokeWidth="1.5" opacity=".4" strokeDasharray="4,3" style={{animation:'pulse 1.5s infinite'}}/>}
    <ellipse cx="0" cy="-18" rx="10" ry="4" fill="none" stroke={c.m} strokeWidth="1.2" opacity=".6" style={{animation:active?'pulse 2s infinite':'none'}}/>
    <circle cx="0" cy="-10" r="9" fill={c.l} stroke={c.s} strokeWidth="1.5"/>
    <circle cx="-3" cy="-11" r="1.5" fill={c.s}/><circle cx="3" cy="-11" r="1.5" fill={c.s}/>
    <circle cx="-2.5" cy="-11.5" r=".5" fill="#fff"/><circle cx="3.5" cy="-11.5" r=".5" fill="#fff"/>
    <path d="M-3,-7 Q0,-4 3,-7" fill="none" stroke={c.s} strokeWidth=".8" strokeLinecap="round"/>
    <path d="M-7,0 Q-8,-6 0,-1 Q8,-6 7,0 Q7,8 0,10 Q-7,8 -7,0Z" fill={c.m} opacity=".7" stroke={c.s} strokeWidth=".8"/>
    <text x="10" y="-14" fontSize="8" style={{pointerEvents:'none'}}>{c.emoji}</text>
    <text x="0" y="18" textAnchor="middle" fontSize="8" fill={c.m} fontWeight="700" style={{pointerEvents:'none'}}>{c.name}</text>
    <text x="0" y="26" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="900" style={{pointerEvents:'none'}}>{vp}VP</text>
  </g>;
}
function ResCards({x,y,res,owner}){
  return <g transform={`translate(${x},${y})`}>{RK.map((r,i)=>{const cx=(i-2)*18;const count=res[r]||0;
    return <g key={r} transform={`translate(${cx},0)`}><rect x="-7" y="-10" width="14" height="20" rx="2" fill="rgba(0,0,0,.04)" stroke={count>0?RCOL[r]:'rgba(255,255,255,.1)'} strokeWidth={count>0?1.2:.5}/><text x="0" y="-1" textAnchor="middle" fontSize="9" style={{pointerEvents:'none'}}>{REMJ[r]}</text><text x="0" y="8" textAnchor="middle" fontSize="7" fontWeight="800" fill={count>0?'#fff':'#555'} style={{pointerEvents:'none'}}>{count}</text></g>;
  })}</g>;
}

function PlayerCard({owner, vp, res, active}) {
  const c = OCOL[owner];
  return (
    <div style={{
      border: `1.5px solid ${active ? c.s : 'rgba(0,0,0,.07)'}`,
      borderRadius: 12,
      padding: '6px 10px',
      background: active ? c.l : '#ffffff',
      boxShadow: active ? `0 4px 16px ${c.m}33` : '0 1px 4px rgba(0,0,0,.04)',
      transition: 'all .3s',
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
        <span style={{color:c.s, fontWeight:700, fontSize:13}}>{c.emoji} {c.name}</span>
        <span style={{color:'#f59e0b', fontWeight:900, fontSize:18}}>{vp}VP</span>
      </div>
      <div style={{display:'flex', gap:6}}>
        {RK.map(r => (
          <div key={r} style={{textAlign:'center', flex:1, opacity:(res[r]||0)>0?1:.3}}>
            <div style={{fontSize:14}}>{REMJ[r]}</div>
            <div style={{fontSize:11, color:'#1c1917', fontWeight:700}}>{res[r]||0}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════
export default function SoloCatan(){
  const [screen,setScreen]=useState('title');
  const [mode,setMode]=useState('score_attack');
  const [hs,setHs]=useState({sa:0,tt:999});
  const [B,setB]=useState(null);
  const [turn,setTurn]=useState(1);
  const [phase,setPhase]=useState('init');
  const [pSt,setPSt]=useState(0); // v5: BUG-2 steps 0-7
  const [P,setP]=useState(null);
  const [npcs,setNpcs]=useState({});
  const [dice,setDice]=useState(null);
  const [rolling,setRolling]=useState(false);
  const [showTrade,setShowTrade]=useState(false);
  const [showRobber,setShowRobber]=useState(false);
  const [devDk,setDevDk]=useState([]);
  const [log,setLog]=useState([]);
  const [tGive,setTGive]=useState(null);
  const [tGet,setTGet]=useState(null);
  const [npcActive,setNpcActive]=useState(false);
  const [npcMsg,setNpcMsg]=useState(null);
  const [flyCards,setFlyCards]=useState([]);
  const [glowTiles,setGlowTiles]=useState(new Set());
  // v5: BUG-3 - track special card owners
  const [armyOwner,setArmyOwner]=useState(null);
  const [roadOwner,setRoadOwner]=useState(null);
  const [selectedAction,setSelectedAction]=useState(null);

  const isPC = useIsPC();

  useEffect(()=>{
    const link=document.createElement('link');link.href='https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;600;700;900&display=swap';link.rel='stylesheet';document.head.appendChild(link);
    const sty=document.createElement('style');sty.textContent=`
      @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
      @keyframes popIn{0%{transform:scale(0);opacity:0}50%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}
      @keyframes shimmer{0%{opacity:.2}50%{opacity:.6}100%{opacity:.2}}
      @keyframes tileGlow{0%{opacity:0}20%{opacity:.6}60%{opacity:.4}100%{opacity:0}}
      @keyframes npcSlide{0%{transform:translateY(-16px);opacity:0}15%{opacity:1;transform:translateY(0)}85%{opacity:1}100%{opacity:0;transform:translateY(8px)}}
      @keyframes diceShake{0%,100%{transform:rotate(0)}25%{transform:rotate(-12deg) scale(1.1)}75%{transform:rotate(10deg)}}
      @keyframes flyCard{
        0%{transform:translate(var(--sx),var(--sy)) scale(.3) rotate(calc(var(--rot)*1deg));opacity:0;filter:brightness(2)}
        12%{opacity:1;transform:translate(var(--sx),var(--sy)) scale(1.2) rotate(calc(var(--rot)*.4deg));filter:brightness(1.4)}
        40%{transform:translate(calc(var(--sx)*.4),calc(var(--sy)*.3)) scale(1) rotate(calc(var(--rot)*.1deg))}
        85%{opacity:.9}
        100%{transform:translate(0,0) scale(.6) rotate(0deg);opacity:0}}
      @keyframes waveBob{0%,100%{transform:translateY(0)}50%{transform:translateY(3px)}}
      button:hover{transform:translateY(-1px)} button:active{transform:translateY(0)}
    `;document.head.appendChild(sty);
    return ()=>{try{document.head.removeChild(link);document.head.removeChild(sty);}catch(e){}};
  },[]);

  useEffect(()=>{(async()=>{try{const r=await window.storage.get('catan_hs5');if(r?.value)setHs(JSON.parse(r.value));}catch(e){}})();},[]);
  const saveHs=useCallback(async s=>{try{await window.storage.set('catan_hs5',JSON.stringify(s));}catch(e){}},[]);
  const addLog=useCallback(m=>setLog(p=>[m,...p].slice(0,40)),[]);

  const spawnFlyCards=useCallback((sources,owner)=>{
    const seat=SEATS[owner]; const cards=[];let delay=0;
    sources.forEach(({res,count,tileCx,tileCy})=>{
      for(let i=0;i<count;i++){
        const sx=tileCx-seat.x, sy=tileCy-seat.y-30;
        cards.push({id:Date.now()+Math.random()+delay,res,emoji:REMJ[res],color:RCOL[res],owner,tx:seat.x,ty:seat.y+32,sx,sy,rot:(Math.random()-.5)*30,delay:delay*.13});
        delay++;
      }
    });
    setFlyCards(p=>[...p,...cards]);
    setTimeout(()=>setFlyCards(p=>p.filter(c=>!cards.find(n=>n.id===c.id))),delay*.13*1000+1400);
  },[]);

  const collectRes=useCallback((b,sum)=>{
    const g={player:emR(),npc1:emR(),npc2:emR()};
    const sources={player:[],npc1:[],npc2:[]};
    b.tiles.forEach(t=>{if(t.num!==sum||t.rob||t.type==='desert')return;const res=RMAP[t.type];if(!res)return;
      const counts={player:0,npc1:0,npc2:0};
      t.vids.forEach(vid=>{const v=b.V[vid];if(!v.o)return;const amt=v.b==='city'?2:1;g[v.o][res]+=amt;counts[v.o]+=amt;});
      Object.entries(counts).forEach(([ow,cnt])=>{if(cnt>0)sources[ow].push({tileId:t.id,res,count:cnt,tileCx:t.cx,tileCy:t.cy});});
    });
    return {g,sources};
  },[]);

  // v5: BUG-3 - calcVP uses armyOwner/roadOwner
  const calcVP=useCallback((b,ow,st)=>{
    if(!b||!st)return 0; let vp=0;
    b.V.forEach(v=>{if(v.o!==ow)return;if(v.b==='settlement')vp+=1;if(v.b==='city')vp+=2;});
    st.devCards.forEach(c=>{if(c.type==='vp')vp+=1;});
    if(armyOwner===ow)vp+=2;
    if(roadOwner===ow)vp+=2;
    return vp;
  },[armyOwner,roadOwner]);

  // v5: BUG-3 - update special card holders
  const updateSpecials=useCallback((b,pState,ns)=>{
    const armies={[OW.P]:pState.kP,[OW.N1]:ns.npc1?.kP||0,[OW.N2]:ns.npc2?.kP||0};
    const roads={[OW.P]:lRoad(b.E,OW.P),[OW.N1]:lRoad(b.E,OW.N1),[OW.N2]:lRoad(b.E,OW.N2)};
    const maxA=Math.max(...Object.values(armies));
    if(maxA>=3){const cs=Object.entries(armies).filter(([,v])=>v===maxA);if(cs.length===1)setArmyOwner(cs[0][0]);}
    const maxR=Math.max(...Object.values(roads));
    if(maxR>=5){const cs=Object.entries(roads).filter(([,v])=>v===maxR);if(cs.length===1)setRoadOwner(cs[0][0]);}
  },[]);

  const bc=useMemo(()=>{if(!B)return {x:0,y:0};const xs=B.tiles.map(t=>t.cx),ys=B.tiles.map(t=>t.cy);return {x:(Math.max(...xs)+Math.min(...xs))/2,y:(Math.max(...ys)+Math.min(...ys))/2};},[B]);
  const coast=useMemo(()=>{if(!B)return null;const cx2=bc.x,cy2=bc.y;const ov=B.V.filter(v=>v.tids.length<3);const so=[...ov].sort((a,b)=>Math.atan2(a.y-cy2,a.x-cx2)-Math.atan2(b.y-cy2,b.x-cx2));const mk=exp=>so.map(v=>{const dx=v.x-cx2,dy=v.y-cy2,d=Math.sqrt(dx*dx+dy*dy)||1;return `${v.x+dx/d*exp},${v.y+dy/d*exp+DEPTH}`;}).join(' ');return {beach:mk(14),shore:mk(22)};},[B,bc]);

  const pVP=useMemo(()=>calcVP(B,OW.P,P),[B,P,calcVP]);
  const n1VP=useMemo(()=>calcVP(B,OW.N1,npcs.npc1),[B,npcs,calcVP]);
  const n2VP=useMemo(()=>calcVP(B,OW.N2,npcs.npc2),[B,npcs,calcVP]);

  // v5: BUG-2 - startGame without NPC pre-placement
  const startGame=useCallback(m=>{
    const b=genBoard(); // v5: no npcInit here
    setB(b);setMode(m);setTurn(1);setPhase('init');setPSt(0);
    setP({resources:emR(),sL:5,cL:4,rL:15,devCards:[],kP:0});
    setNpcs({npc1:{resources:emR(),sL:3,cL:4,rL:13,devCards:[],kP:0},npc2:{resources:emR(),sL:3,cL:4,rL:13,devCards:[],kP:0}});
    setDice(null);setDevDk(shuf(DEVDECK));setLog(['🎮 開拓地①を配置してください']);
    setScreen('playing');setShowTrade(false);setShowRobber(false);setNpcActive(false);setNpcMsg(null);setFlyCards([]);setGlowTiles(new Set());setArmyOwner(null);setRoadOwner(null);setSelectedAction(null);
  },[]);

  // v5: BUG-2 - NPC auto-placement during init phase
  // Steps: 0=P拠点①, 1=P道路①, 2=NPC1配置, 3=NPC2配置, 4=NPC2二巡目, 5=NPC1二巡目, 6=P拠点②, 7=P道路②
  useEffect(()=>{
    if(phase!=='init'||!B)return;
    const npcSteps={2:{ow:OW.N1,r2:false},3:{ow:OW.N2,r2:false},4:{ow:OW.N2,r2:true},5:{ow:OW.N1,r2:true}};
    const step=npcSteps[pSt];
    if(!step)return;
    const timer=setTimeout(()=>{
      const{board:nb,vid}=npcPlaceOne(step.ow,B);
      setB(nb);
      // v5: 2巡目は初期リソース付与
      if(step.r2 && vid>=0){
        const gained=emR();
        nb.V[vid].tids.forEach(tid=>{const t=nb.tiles[tid];const r=RMAP[t.type];if(r)gained[r]++;});
        setNpcs(prev=>{const k=step.ow;const nr={...prev[k].resources};RK.forEach(rk=>{nr[rk]+=gained[rk];});return {...prev,[k]:{...prev[k],resources:nr,sL:prev[k].sL-1,rL:prev[k].rL-1}};});
      } else {
        setNpcs(prev=>{const k=step.ow;return {...prev,[k]:{...prev[k],sL:prev[k].sL-1,rL:prev[k].rL-1}};});
      }
      addLog(`${OCOL[step.ow].emoji} ${OCOL[step.ow].name}が配置`);
      setPSt(s=>s+1);
    },700);
    return ()=>clearTimeout(timer);
  },[phase,pSt,B,addLog]);

  // v5: BUG-2 - updated hVC for steps 0,6
  const hVC=useCallback(vid=>{
    if(!B||npcActive)return;const v=B.V[vid];
    if(phase==='init'&&(pSt===0||pSt===6)){
      if(v.b||v.av.some(a=>B.V[a].b)){addLog('⚠️ 建てられません');return;}
      const nb=JSON.parse(JSON.stringify(B));nb.V[vid].b='settlement';nb.V[vid].o=OW.P;setB(nb);
      setP(p=>({...p,sL:p.sL-1}));setPSt(s=>s+1);
      addLog(`🏠 開拓地${pSt===0?'①':'②'}`);
      // v5: 2巡目(pSt===6)で初期リソース付与
      if(pSt===6){
        const g={};v.tids.forEach(tid=>{const t=B.tiles[tid];const r=RMAP[t.type];if(r)g[r]=(g[r]||0)+1;});
        if(Object.keys(g).length>0){
          setP(p=>{const r={...p.resources};Object.entries(g).forEach(([k,val])=>{r[k]+=val;});return {...p,resources:r};});
          addLog(`📦 初期資源獲得`);
        }
      }
    } else if(phase==='build'){
      if(v.b==='settlement'&&v.o===OW.P){if(!canAff(P.resources,COST.city)||P.cL<=0)return;const nb=JSON.parse(JSON.stringify(B));nb.V[vid].b='city';setB(nb);setP(p=>({...p,resources:sub(p.resources,COST.city),cL:p.cL-1,sL:p.sL+1}));addLog('🏰 都市化！');setSelectedAction(null);}
      else if(!v.b){if(!canAff(P.resources,COST.settlement)||P.sL<=0)return;if(!v.ae.some(eid=>B.E[eid].o===OW.P)){addLog('⚠️ 道路に繋げて');return;}if(v.av.some(a=>B.V[a].b)){addLog('⚠️ 近すぎます');return;}const nb=JSON.parse(JSON.stringify(B));nb.V[vid].b='settlement';nb.V[vid].o=OW.P;setB(nb);setP(p=>({...p,resources:sub(p.resources,COST.settlement),sL:p.sL-1}));addLog('🏠 開拓地！');setSelectedAction(null);}
    }
  },[B,phase,pSt,P,npcActive,addLog]);

  // v5: BUG-2 - updated hEC for steps 1,7
  const hEC=useCallback(eid=>{
    if(!B||npcActive)return;const e=B.E[eid];if(e.o)return;
    if(phase==='init'&&(pSt===1||pSt===7)){
      if(!e.vs.some(vid=>B.V[vid].b==='settlement'&&B.V[vid].o===OW.P)){addLog('⚠️ 開拓地に繋げて');return;}
      const nb=JSON.parse(JSON.stringify(B));nb.E[eid].o=OW.P;setB(nb);setP(p=>({...p,rL:p.rL-1}));
      const nx=pSt+1;setPSt(nx);addLog(`🛤️ 道路${pSt===1?'①':'②'}`);
      if(nx>=8){setPhase('dice');addLog('🎲 ダイスを振ろう！');}
    } else if(phase==='build'){
      if(!canAff(P.resources,COST.road)||P.rL<=0)return;
      const con=e.vs.some(vid=>{const v=B.V[vid];if(v.b&&v.o===OW.P)return true;return v.ae.some(ae=>ae!==eid&&B.E[ae].o===OW.P);});
      if(!con){addLog('⚠️ 繋がっていません');return;}
      const nb=JSON.parse(JSON.stringify(B));nb.E[eid].o=OW.P;setB(nb);setP(p=>({...p,resources:sub(p.resources,COST.road),rL:p.rL-1}));addLog('🛤️ 道路建設');setSelectedAction(null);
    }
  },[B,phase,pSt,P,npcActive,addLog]);

  // v5: BUG-1 - robber steal on tile click
  const hTC=useCallback(tid=>{
    if(!showRobber||!B)return;if(tid===B.robId)return;
    const nb=JSON.parse(JSON.stringify(B));nb.tiles.forEach(t=>{t.rob=t.id===tid;});nb.robId=tid;setB(nb);setShowRobber(false);
    // Steal from NPC on that tile
    const tile=nb.tiles[tid]; const victims=[];
    tile.vids.forEach(vid=>{const v=nb.V[vid];if(v.o&&v.o!==OW.P&&v.b)victims.push(v.o);});
    if(victims.length>0){
      const target=victims[Math.floor(Math.random()*victims.length)];
      setNpcs(prev=>{
        const nk=target;const tr=prev[nk]?.resources;if(!tr)return prev;
        const avail=RK.filter(k=>(tr[k]||0)>0);
        if(avail.length===0){addLog('🦹 盗賊移動（手札なし）');return prev;}
        const stolen=avail[Math.floor(Math.random()*avail.length)];
        setP(p=>({...p,resources:{...p.resources,[stolen]:(p.resources[stolen]||0)+1}}));
        addLog(`🦹 ${OCOL[target].name}から${REMJ[stolen]}を奪った！`);
        return {...prev,[nk]:{...prev[nk],resources:{...tr,[stolen]:tr[stolen]-1}}};
      });
    } else { addLog('🦹 盗賊移動'); }
    setPhase('build');
  },[showRobber,B,addLog]);

  const rollDice=useCallback(()=>{
    if(phase!=='dice'||rolling)return;setRolling(true);let cnt=0;
    const iv=setInterval(()=>{setDice([1+Math.random()*6|0,1+Math.random()*6|0]);if(++cnt>=10){clearInterval(iv);
      const d1=1+Math.random()*6|0,d2=1+Math.random()*6|0,sum=d1+d2;setDice([d1,d2]);setRolling(false);
      if(sum===7){addLog(`🎲 ${d1}+${d2}=7 盗賊！`);setShowRobber(true);}else{
        const{g,sources}=collectRes(B,sum);
        const pg=g.player;if(RK.some(k=>pg[k]>0)){setP(p=>{const r={...p.resources};RK.forEach(k=>{r[k]+=pg[k];});return {...p,resources:r};});}
        setNpcs(prev=>{const n={...prev};[OW.N1,OW.N2].forEach(o=>{const gg=g[o];if(RK.some(k=>gg[k]>0)){n[o]={...n[o],resources:{...n[o].resources}};RK.forEach(k=>{n[o].resources[k]+=gg[k];});}});return n;});
        const allGlow=new Set();
        [OW.P,OW.N1,OW.N2].forEach(ow=>{if(sources[ow].length>0){spawnFlyCards(sources[ow],ow);sources[ow].forEach(s=>allGlow.add(s.tileId));}});
        if(allGlow.size>0){setGlowTiles(allGlow);setTimeout(()=>setGlowTiles(new Set()),1400);}
        const parts=[`🎲 ${d1}+${d2}=${sum}`];
        if(RK.some(k=>pg[k]>0))parts.push(RK.filter(k=>pg[k]>0).map(k=>`${REMJ[k]}×${pg[k]}`).join(' '));else parts.push('なし');
        addLog(parts.join(' → '));setPhase('build');
      }}},70);
  },[phase,rolling,B,collectRes,spawnFlyCards,addLog]);

  const buyDev=useCallback(()=>{if(!canAff(P.resources,COST.devcard)||devDk.length===0)return;const c=devDk[0];setDevDk(d=>d.slice(1));setP(p=>({...p,resources:sub(p.resources,COST.devcard),devCards:[...p.devCards,{type:c,used:false}]}));addLog(c==='vp'?'🃏 VP！':'🃏 騎士！');},[P,devDk,addLog]);

  // v5: ADD-2 - Knight triggers robber UI instead of auto-return to desert
  const useKnight=useCallback(()=>{
    const i=P.devCards.findIndex(c=>c.type==='knight'&&!c.used);
    if(i<0)return;
    setP(p=>{const dc=[...p.devCards];dc[i]={...dc[i],used:true};return {...p,devCards:dc,kP:p.kP+1};});
    setShowRobber(true);
    addLog('⚔️ 騎士！盗賊を移動してください');
  },[P,addLog]);

  const getRate=useCallback(res=>{if(!B)return 4;const pv=B.V.filter(v=>v.o===OW.P&&v.b);for(const v of pv){if(v.port===res)return 2;}for(const v of pv){if(v.port==='3:1')return 3;}return 4;},[B]);
  const doTrade=useCallback(()=>{if(!tGive||!tGet||tGive===tGet)return;const rate=getRate(tGive);if((P.resources[tGive]||0)<rate){addLog('⚠️ 不足');return;}setP(p=>{const r={...p.resources};r[tGive]-=rate;r[tGet]+=1;return {...p,resources:r};});addLog(`🔄 ${REMJ[tGive]}×${rate}→${REMJ[tGet]}`);setShowTrade(false);},[tGive,tGet,P,getRate,addLog]);

  // v5: BUG-4 + BUG-3 - finishTurn checks NPC 10VP in both modes
  const finishTurn=useCallback((b,ns,dk)=>{
    const newT=turn+1;
    // v5: BUG-3 - update specials before VP calc
    updateSpecials(b,P,ns);
    const pv=calcVP(b,OW.P,P);const n1=calcVP(b,OW.N1,ns.npc1);const n2=calcVP(b,OW.N2,ns.npc2);
    // v5: BUG-4 - NPC 10VP ends game in ANY mode
    if(n1>=10||n2>=10){setPhase('game_over');setScreen('gameover');addLog('🏁 AI勝利…');setNpcActive(false);return;}
    if(mode==='score_attack'&&newT>15){setPhase('game_over');setScreen('gameover');if(pv>hs.sa){const s={...hs,sa:pv};setHs(s);saveHs(s);}addLog('🏁 終了！');setNpcActive(false);return;}
    if(mode==='time_trial'&&pv>=10){setPhase('game_over');setScreen('gameover');if(turn<hs.tt){const s={...hs,tt:turn};setHs(s);saveHs(s);}addLog('🏁 10VP！');setNpcActive(false);return;}
    setTurn(newT);setPhase('dice');setDice(null);addLog(`── ターン${newT} ──`);setNpcActive(false);setSelectedAction(null);
  },[turn,mode,hs,P,calcVP,updateSpecials,saveHs,addLog]);

  // v5: ADD-1 - endTurn with NPC dice roll + resource collection + build
  const endTurn=useCallback(()=>{
    if(phase!=='build'||npcActive)return;
    setNpcActive(true);
    // v5: BUG-3 update specials after player build
    updateSpecials(B,P,npcs);

    const npcOrder=[OW.N1,OW.N2];
    let curBoard=JSON.parse(JSON.stringify(B));
    let curNpcs={...npcs};
    let curDk=[...devDk];
    let stepIdx=0;

    const processNpc=()=>{
      if(stepIdx>=npcOrder.length){
        setNpcMsg(null);setB(curBoard);setNpcs(curNpcs);setDevDk(curDk);
        finishTurn(curBoard,curNpcs,curDk);return;
      }
      const ow=npcOrder[stepIdx];
      // Step 1: Show NPC turn
      setNpcMsg({msg:`${OCOL[ow].name}のターン`,ow});
      addLog(`${OCOL[ow].emoji} ${OCOL[ow].name}のターン`);

      // Step 2: NPC dice roll (after delay)
      setTimeout(()=>{
        const d1=1+Math.random()*6|0,d2=1+Math.random()*6|0,sum=d1+d2;
        setDice([d1,d2]);
        addLog(`🎲 ${OCOL[ow].name}: ${d1}+${d2}=${sum}`);

        if(sum===7){
          // NPC robber: move to tile with most player buildings
          let bestTid=-1,bestCount=0;
          curBoard.tiles.forEach(t=>{if(t.type==='desert'||t.rob)return;let pc=0;t.vids.forEach(vid=>{if(curBoard.V[vid].o&&curBoard.V[vid].o!==ow&&curBoard.V[vid].b)pc++;});if(pc>bestCount){bestCount=pc;bestTid=t.id;}});
          if(bestTid>=0){curBoard.tiles.forEach(t=>{t.rob=t.id===bestTid;});curBoard.robId=bestTid;addLog(`🦹 ${OCOL[ow].name}が盗賊移動`);}
        } else {
          // Collect resources for everyone
          const{g,sources}=collectRes(curBoard,sum);
          // Apply to player
          const pg=g.player;if(RK.some(k=>pg[k]>0)){setP(p=>{const r={...p.resources};RK.forEach(k=>{r[k]+=pg[k];});return {...p,resources:r};});}
          // Apply to NPCs
          [OW.N1,OW.N2].forEach(o=>{const gg=g[o];if(RK.some(k=>gg[k]>0)){const nk=o;curNpcs={...curNpcs,[nk]:{...curNpcs[nk],resources:{...curNpcs[nk].resources}}};RK.forEach(k=>{curNpcs[nk].resources[k]+=gg[k];});}});
          setNpcs(curNpcs);
          // Fly cards
          const allGlow=new Set();
          [OW.P,OW.N1,OW.N2].forEach(o2=>{if(sources[o2].length>0){spawnFlyCards(sources[o2],o2);sources[o2].forEach(s=>allGlow.add(s.tileId));}});
          if(allGlow.size>0){setGlowTiles(allGlow);setTimeout(()=>setGlowTiles(new Set()),1200);}
        }

        // Step 3: NPC build (after another delay)
        setTimeout(()=>{
          const r=npcBuild(ow,curBoard,curNpcs[ow],curDk);
          curBoard=r.board;curNpcs={...curNpcs,[ow]:r.state};curDk=r.dk;
          // Show build actions sequentially
          let ai=0;
          const showAct=()=>{
            if(ai>=r.acts.length){
              setB(curBoard);setNpcs(curNpcs);setDevDk(curDk);
              stepIdx++;
              setTimeout(processNpc,500);return;
            }
            setNpcMsg({msg:r.acts[ai].msg,ow});addLog(r.acts[ai].msg);
            ai++;setTimeout(showAct,700);
          };
          if(r.acts.length>0){showAct();}else{
            setB(curBoard);setNpcs(curNpcs);setDevDk(curDk);
            stepIdx++;setTimeout(processNpc,500);
          }
        },800);
      },600);
    };
    setTimeout(processNpc,300);
  },[phase,npcActive,B,npcs,P,devDk,collectRes,spawnFlyCards,updateSpecials,finishTurn,addLog]);

  const svgW = isPC ? 700 : SVG_W;
  const svgH = isPC ? 700 : SVG_H;
  const boardScale = isPC ? 1.35 : 1;
  const ox = svgW/2, oy = svgH/2;
  // v5: BUG-2 - clickable vertices/edges updated for 8-step init
  const clickV=phase==='init'?(pSt===0||pSt===6):phase==='build';
  const clickE=phase==='init'?(pSt===1||pSt===7):phase==='build'&&canAff(P?.resources||emR(),COST.road)&&(P?.rL||0)>0;
  const initHints=['🏠 ボード上の頂点をタップして開拓地①を配置','🛤️ 開拓地に隣接する辺をタップして道路①を配置','🤖 赤が配置中…','🤖 青が配置中…','🤖 青が配置中…','🤖 赤が配置中…','🏠 ボード上の頂点をタップして開拓地②を配置','🛤️ 開拓地に隣接する辺をタップして道路②を配置'];
  const hint=phase==='init'?initHints[pSt]||null:null;
  const hasK=P?.devCards.some(c=>c.type==='knight'&&!c.used);

  // ══════════ TITLE ══════════
  if(screen==='title')return <div style={isPC ? S.ctnPC : S.ctn}>{isPC ? (
    <div style={{display:'flex',minHeight:'100vh',alignItems:'center',justifyContent:'center',gap:80,padding:'0 60px'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:100,marginBottom:16}}>🏝️</div>
        <h1 style={{...S.h1,fontSize:52}}>ソロカタン</h1>
        <p style={{color:'#78716c',letterSpacing:4,marginTop:8,fontSize:15}}>Island of Divine Settlers</p>
        <div style={{display:'flex',gap:20,marginTop:20,justifyContent:'center'}}>{[OW.P,OW.N1,OW.N2].map(o=><span key={o} style={{color:OCOL[o].m,fontSize:14,fontWeight:600}}>{OCOL[o].emoji} {OCOL[o].name}</span>)}</div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:16,width:360}}>
        <button style={{...S.mB,padding:'24px 28px'}} onClick={()=>startGame('score_attack')}><span style={{fontSize:36}}>🎯</span><div><div style={{fontSize:20,fontWeight:700,color:'#f97316'}}>スコアアタック</div><div style={{fontSize:13,color:'#78716c',marginTop:4}}>15ターンでVP最大化</div></div>{hs.sa>0&&<div style={S.hsT}>🏆 {hs.sa}</div>}</button>
        <button style={{...S.mB,padding:'24px 28px'}} onClick={()=>startGame('time_trial')}><span style={{fontSize:36}}>⏱️</span><div><div style={{fontSize:20,fontWeight:700,color:'#f97316'}}>タイムトライアル</div><div style={{fontSize:13,color:'#78716c',marginTop:4}}>10VP最速到達 vs AI</div></div>{hs.tt<999&&<div style={S.hsT}>🏆 {hs.tt}T</div>}</button>
      </div>
    </div>
  ) : (
    <div style={S.tW}>
      <div style={{fontSize:64}}>🏝️</div>
      <h1 style={S.h1}>ソロカタン</h1>
      <p style={{fontSize:13,color:'#78716c',letterSpacing:3}}>Island of Divine Settlers</p>
      <div style={S.tBs}>
        <button style={S.mB} onClick={()=>startGame('score_attack')}><span style={{fontSize:28}}>🎯</span><div><div style={{fontSize:15,fontWeight:700,color:'#f97316'}}>スコアアタック</div><div style={{fontSize:11,color:'#78716c'}}>15ターンVP最大化</div></div>{hs.sa>0&&<div style={S.hsT}>🏆{hs.sa}</div>}</button>
        <button style={S.mB} onClick={()=>startGame('time_trial')}><span style={{fontSize:28}}>⏱️</span><div><div style={{fontSize:15,fontWeight:700,color:'#f97316'}}>タイムトライアル</div><div style={{fontSize:11,color:'#78716c'}}>10VP最速到達</div></div>{hs.tt<999&&<div style={S.hsT}>🏆{hs.tt}T</div>}</button>
      </div>
      <div style={{display:'flex',gap:16,marginTop:12}}>{[OW.P,OW.N1,OW.N2].map(o=><span key={o} style={{color:OCOL[o].m,fontSize:13}}>{OCOL[o].emoji} {OCOL[o].name}</span>)}</div>
    </div>
  )}</div>;

  // ══════════ GAME OVER ══════════
  if(screen==='gameover'){const pv=calcVP(B,OW.P,P),n1=calcVP(B,OW.N1,npcs.npc1),n2=calcVP(B,OW.N2,npcs.npc2);const w=pv>=n1&&pv>=n2?'player':n1>=n2?'npc1':'npc2';
  return <div style={isPC ? S.ctnPC : S.ctn}><div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:isPC?40:20,gap:isPC?24:18}}>
    <div style={{fontSize:isPC?72:56}}>{w==='player'?'🎉':'😢'}</div>
    <h1 style={{...S.h1,fontSize:isPC?48:32}}>{w==='player'?'勝利！':'敗北…'}</h1>
    <div style={{...S.goS,maxWidth:isPC?400:300}}>{[{o:'player',vp:pv},{o:'npc1',vp:n1},{o:'npc2',vp:n2}].sort((a,b)=>b.vp-a.vp).map(({o,vp},i)=>
      <div key={o} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',borderLeft:`4px solid ${OCOL[o].m}`,background:o===w?'rgba(245,158,11,.06)':'transparent',borderRadius:4}}>
        <span style={{color:OCOL[o].m,fontWeight:700}}>{i===0?'👑 ':''}{OCOL[o].name}</span><span style={{color:OCOL[o].m,fontWeight:900,fontSize:20}}>{vp}VP</span></div>)}
      <div style={{display:'flex',justifyContent:'space-between',padding:'6px 12px',color:'#78716c'}}><span>ターン</span><span style={{color:'#f59e0b'}}>{turn}</span></div>
    </div>
    <div style={{display:'flex',gap:isPC?16:10,marginTop:isPC?20:14}}>
      <button style={{...S.gB,padding:isPC?'14px 32px':'10px 20px',fontSize:isPC?16:14}} onClick={()=>startGame(mode)}>もう一度</button>
      <button style={{...S.sB,padding:isPC?'14px 24px':'10px 14px'}} onClick={()=>setScreen('title')}>タイトル</button>
    </div>
  </div></div>;}

  // ══════════ MAIN GAME ══════════
  return <div style={isPC ? S.ctnPC : S.ctn}>
    <div style={S.hdr}>
      <span style={{fontSize:isPC?14:12,color:'#78716c'}}>{mode==='score_attack'?'🎯':'⏱️'} T{turn}{mode==='score_attack'?'/15':''}</span>
      <span style={{fontSize:isPC?12:10,color:'#a8a29e',fontWeight:700}}>🏆{mode==='score_attack'?hs.sa:hs.tt<999?hs.tt+'T':'-'}</span>
    </div>

    {hint&&<div style={S.hint}>{hint}</div>}
    {selectedAction&&phase==='build'&&!npcActive&&<div style={{textAlign:'center',padding:'6px 16px',fontSize:12,fontWeight:700,color:'#f97316',background:'rgba(249,115,22,.08)',borderBottom:'1px solid rgba(249,115,22,.15)',display:'flex',alignItems:'center',justifyContent:'center',gap:8,flexShrink:0}}>
      {selectedAction==='road'&&'🛤️ ボード上の辺をタップして道路を配置'}
      {selectedAction==='settlement'&&'🏠 ボード上の頂点をタップして開拓地を配置'}
      {selectedAction==='city'&&'🏰 アップグレードしたい開拓地をタップ'}
      <button onClick={()=>setSelectedAction(null)} style={{background:'none',border:'1px solid rgba(249,115,22,.3)',borderRadius:6,padding:'2px 8px',fontSize:11,color:'#f97316',cursor:'pointer',fontFamily:'inherit'}}>✕</button>
    </div>}
    {npcMsg&&<div key={npcMsg.msg+turn+String(Math.random()).slice(2,6)} style={{...S.npcT,borderColor:OCOL[npcMsg.ow].m}}><span style={{color:OCOL[npcMsg.ow].m}}>{OCOL[npcMsg.ow].emoji} {npcMsg.msg}</span></div>}

    <div style={isPC ? {display:'flex', flex:1, overflow:'hidden', minHeight:0} : {display:'flex', flexDirection:'column', flex:1, minHeight:0}}>
      {/* Board column */}
      <div style={isPC ? {flex:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight:0, minWidth:0, overflow:'hidden'} : S.bW}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{width:'100%',height:'100%', ...(isPC ? {maxWidth:'calc(100vh - 60px)',maxHeight:'calc(100vh - 60px)'} : {})}}>
          <defs>
            <filter id="hs"><feDropShadow dx="1" dy="2" stdDeviation="1.5" floodOpacity=".3"/></filter>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <radialGradient id="ocean" cx="50%" cy="45%"><stop offset="0%" stopColor="#7dd3fc"/><stop offset="35%" stopColor="#38bdf8"/><stop offset="70%" stopColor="#0ea5e9"/><stop offset="100%" stopColor="#0284c7"/></radialGradient>
            {Object.entries(TCOL).map(([t,cs])=><radialGradient key={t} id={`tg_${t}`} cx="40%" cy="30%"><stop offset="0%" stopColor={cs[2]}/><stop offset="55%" stopColor={cs[1]}/><stop offset="100%" stopColor={cs[0]}/></radialGradient>)}
            <pattern id="seaShimmer" width="80" height="40" patternUnits="userSpaceOnUse"><ellipse cx="40" cy="20" rx="30" ry="8" fill="rgba(255,255,255,.06)"/><ellipse cx="0" cy="10" rx="20" ry="5" fill="rgba(255,255,255,.04)"/></pattern>
          </defs>
          <rect width={svgW} height={svgH} fill="url(#ocean)"/>
          <rect width={svgW} height={svgH} fill="url(#seaShimmer)" style={{animation:'waveBob 4s ease-in-out infinite'}}/>
          {[0,1,2,3,4].map(i=><ellipse key={i} cx={svgW/2} cy={svgH/2} rx={100+i*28} ry={80+i*22} fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="2" style={{animation:`waveBob ${2+i*.3}s ease-in-out ${i*.2}s infinite`}}/>)}
          <g transform={`translate(${ox},${oy}) scale(${boardScale}) translate(${-bc.x},${-bc.y - 8})`}>
            {coast&&<g><polygon points={coast.shore} fill="rgba(56,189,248,.25)" stroke="rgba(14,165,233,.3)" strokeWidth="1.5"/><polygon points={coast.beach} fill="#f5deb3" stroke="#d4a855" strokeWidth="2" opacity=".85"/></g>}
            {B&&[...B.tiles].sort((a,b)=>a.cy-b.cy).map(t=><Hex3D key={t.id} t={t} showR={showRobber} robId={B.robId} onClick={hTC} glow={glowTiles.has(t.id)}/>)}
            {B?.ports?.map((pe,i)=>{const e=B.E[pe.eid];if(!e)return null;const v1=B.V[e.vs[0]],v2=B.V[e.vs[1]];const mx=(v1.x+v2.x)/2,my=(v1.y+v2.y)/2;const d=Math.sqrt(mx*mx+my*my)||1;const px=mx+(mx/d)*12,py=my+(my/d)*12;const lb=pe.type==='3:1'?'3:1':'2:1';const re=pe.type!=='3:1'?REMJ[pe.type]:'⚓';
              return <g key={i}><line x1={mx} y1={my} x2={px} y2={py} stroke="#8B6914" strokeWidth="3" strokeLinecap="round"/><rect x={px-4} y={py-3} width="8" height="6" rx="1" fill="#6b4c2a" stroke="#4a3018" strokeWidth=".6"/><text x={px} y={py+11} textAnchor="middle" fontSize="6" fill="#f59e0b" fontWeight="bold" style={{pointerEvents:'none'}}>{lb}</text><text x={px} y={py+18} textAnchor="middle" fontSize="7" style={{pointerEvents:'none'}}>{re}</text></g>;})}
            {B?.E.map(e=>{const v1=B.V[e.vs[0]],v2=B.V[e.vs[1]];
              if(e.o)return <Road key={`e${e.id}`} x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} owner={e.o}/>;
              const canPlaceRoad=selectedAction==='road'&&phase==='build'&&!e.o&&e.vs.some(vid=>{const vv=B.V[vid];if(vv.b&&vv.o===OW.P)return true;return vv.ae.some(ae=>ae!==e.id&&B.E[ae].o===OW.P);});
              if(canPlaceRoad)return <line key={`e${e.id}`} x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} stroke="#f97316" strokeWidth="4" strokeLinecap="round" strokeDasharray="6,4" opacity=".7" style={{cursor:'pointer',animation:'pulse 1.5s infinite'}} onClick={ev=>{ev.stopPropagation();hEC(e.id);}}/>;
              if(clickE&&!showRobber&&!selectedAction)return <line key={`e${e.id}`} x1={v1.x} y1={v1.y} x2={v2.x} y2={v2.y} stroke="transparent" strokeWidth="12" style={{cursor:'pointer'}} onClick={ev=>{ev.stopPropagation();hEC(e.id);}}/>;
              return null;})}
            {B?.V.map(v=>{
              if(v.b==='city')return <CityB key={`v${v.id}`} x={v.x} y={v.y} owner={v.o}/>;
              if(v.b==='settlement'){
                if(selectedAction==='city'&&v.o===OW.P&&phase==='build')return <g key={`v${v.id}`} onClick={()=>hVC(v.id)} style={{cursor:'pointer'}}><Settlement x={v.x} y={v.y} owner={v.o}/><circle cx={v.x} cy={v.y} r="12" fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="4,3" style={{animation:'pulse 1.2s infinite'}}/></g>;
                return <g key={`v${v.id}`} onClick={()=>v.o===OW.P&&phase==='build'&&!selectedAction&&hVC(v.id)} style={{cursor:v.o===OW.P&&phase==='build'&&!selectedAction?'pointer':'default'}}><Settlement x={v.x} y={v.y} owner={v.o}/></g>;
              }
              const canPlaceSettle=selectedAction==='settlement'&&phase==='build'&&!v.b&&!v.av.some(a=>B.V[a].b)&&v.ae.some(eid=>B.E[eid].o===OW.P);
              if(canPlaceSettle)return <g key={`v${v.id}`} onClick={()=>hVC(v.id)} style={{cursor:'pointer'}}><circle cx={v.x} cy={v.y} r="8" fill="rgba(249,115,22,.2)" stroke="#f97316" strokeWidth="2" strokeDasharray="4,3" style={{animation:'pulse 1.2s infinite'}}/><text x={v.x} y={v.y+1} textAnchor="middle" dominantBaseline="middle" fontSize="10" style={{pointerEvents:'none'}}>🏠</text></g>;
              if(clickV&&!showRobber&&!selectedAction){const can=phase==='init'||canAff(P?.resources||emR(),COST.settlement);if(!can)return null;
                return <circle key={`v${v.id}`} cx={v.x} cy={v.y} r="6" fill="rgba(249,115,22,.15)" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3,2" style={{cursor:'pointer',animation:'pulse 1.2s infinite'}} onClick={()=>hVC(v.id)}/>;}
              return null;})}
            {flyCards.map(card=>{
              const style={animationName:'flyCard',animationDuration:'1.1s',animationTimingFunction:'cubic-bezier(.2,.8,.3,1)',animationDelay:card.delay+'s',animationFillMode:'both','--sx':card.sx+'px','--sy':card.sy+'px','--rot':String(card.rot)};
              return <g key={card.id} transform={`translate(${card.tx},${card.ty})`}><g style={style}><rect x="-6" y="-9" width="12" height="18" rx="2" fill="rgba(0,0,0,.5)" stroke={card.color} strokeWidth="1.2"/><text x="0" y="2" textAnchor="middle" fontSize="10" style={{pointerEvents:'none'}}>{card.emoji}</text></g></g>;
            })}
            {[{ow:OW.P,vp:pVP,res:P?.resources||emR()},{ow:OW.N1,vp:n1VP,res:npcs.npc1?.resources||emR()},{ow:OW.N2,vp:n2VP,res:npcs.npc2?.resources||emR()}].map(({ow,vp,res})=>{
  const s=isPC?({player:{x:0,y:165},npc1:{x:-155,y:-108},npc2:{x:155,y:-108}}[ow]):SEATS[ow];
  const active=(phase==='build'||phase==='dice')&&!npcActive&&ow===OW.P||npcActive&&(ow===OW.N1||ow===OW.N2);
  return <g key={ow}><Avatar x={s.x} y={s.y} owner={ow} vp={vp} active={active}/>{!isPC&&<ResCards x={s.x} y={s.y+36} res={res} owner={ow}/>}</g>;
})}
          </g>
        </svg>
      </div>

      {/* Right panel (PC only) */}
      {isPC && <div style={{width:300, flexShrink:0, background:'rgba(255,255,255,.85)', backdropFilter:'blur(12px)', borderLeft:'1px solid rgba(0,0,0,.06)', display:'flex', flexDirection:'column', gap:6, padding:'8px 12px', overflowY:'auto'}}>
        {/* Player cards */}
        {[{ow:OW.P,vp:pVP,res:P?.resources||emR()},{ow:OW.N1,vp:n1VP,res:npcs.npc1?.resources||emR()},{ow:OW.N2,vp:n2VP,res:npcs.npc2?.resources||emR()}].map(({ow,vp,res})=>{
          const active=(phase==='build'||phase==='dice')&&!npcActive&&ow===OW.P||npcActive&&(ow===OW.N1||ow===OW.N2);
          return <PlayerCard key={ow} owner={ow} vp={vp} res={res} active={active}/>;
        })}

        {/* Dice */}
        <div style={{display:'flex',gap:5,justifyContent:'center',flexWrap:'wrap',padding:'4px 0'}}>
          {phase==='dice'&&!npcActive&&<button style={S.dB} onClick={rollDice} disabled={rolling}><span style={rolling?{display:'inline-block',animation:'diceShake .3s infinite'}:{}}>{rolling?'🎲🎲':dice?`🎲 ${dice[0]}+${dice[1]}`:'🎲 ダイスロール'}</span></button>}
        </div>
        {dice&&<div style={S.dS}><span style={{fontSize:22,color:'#f59e0b'}}>{'⚀⚁⚂⚃⚄⚅'[dice[0]-1]}</span><span style={{fontSize:22,color:'#f59e0b'}}>{'⚀⚁⚂⚃⚄⚅'[dice[1]-1]}</span><span style={{fontSize:14,fontWeight:900,color:'#f59e0b',marginLeft:4}}>{dice[0]+dice[1]}</span></div>}

        {/* Build panel (PC) */}
        {phase==='build'&&!npcActive&&<div>
          <div style={{display:'flex',gap:4,justifyContent:'center',marginBottom:4,flexWrap:'wrap'}}>
            {[
              {icon:'🛤️',name:'道路',act:'road',cost:COST.road,rem:P?.rL||0,costShow:[['🪵',1],['🧱',1]]},
              {icon:'🏠',name:'開拓地',act:'settlement',cost:COST.settlement,rem:P?.sL||0,costShow:[['🪵',1],['🧱',1],['🐑',1],['🌾',1]]},
              {icon:'🏰',name:'都市',act:'city',cost:COST.city,rem:P?.cL||0,costShow:[['🌾',2],['⛏️',3]]},
              {icon:'🃏',name:'発展',act:null,cost:COST.devcard,rem:devDk.length,costShow:[['🐑',1],['🌾',1],['⛏️',1]],onClick:buyDev},
            ].map(({icon,name,act,cost,rem,costShow,onClick},i)=>{
              const afford=canAff(P?.resources||emR(),cost)&&rem>0;
              const sel=act&&selectedAction===act;
              const handleClick=onClick||(act&&afford?()=>setSelectedAction(prev=>prev===act?null:act):undefined);
              return <button key={i} onClick={handleClick} style={{
                display:'flex',flexDirection:'column',alignItems:'center',gap:1,
                padding:'6px 6px 4px',borderRadius:10,
                border:sel?'2px solid #f97316':afford?'1.5px solid rgba(249,115,22,.3)':'1px solid rgba(0,0,0,.07)',
                background:sel?'rgba(249,115,22,.1)':afford?'rgba(249,115,22,.06)':'#ffffff',
                boxShadow:sel?'0 0 12px rgba(249,115,22,.2)':'none',
                transform:sel?'scale(1.05)':'none',
                cursor:handleClick?'pointer':'default',opacity:afford?1:.4,
                minWidth:60,transition:'all .15s',fontFamily:'inherit',color:'#1c1917',
              }}>
                <span style={{fontSize:16}}>{icon}</span>
                <span style={{fontSize:9,fontWeight:700,color:sel||afford?'#f97316':'#a8a29e'}}>{name}</span>
                <div style={{display:'flex',gap:2,flexWrap:'wrap',justifyContent:'center'}}>
                  {costShow.map(([emoji,n],j)=>{
                    const resKey=RK.find(k=>REMJ[k]===emoji);
                    const have=resKey?(P?.resources[resKey]||0):0;
                    const enough=have>=n;
                    return <span key={j} style={{fontSize:8,opacity:enough?1:.5,background:enough?'rgba(0,0,0,.04)':'rgba(239,68,68,.08)',borderRadius:3,padding:'1px 2px'}}>
                      {emoji}{n}
                    </span>;
                  })}
                </div>
                <span style={{fontSize:7,color:'#a8a29e'}}>残{rem}</span>
              </button>;
            })}
          </div>
          <div style={{display:'flex',gap:5,justifyContent:'center',flexWrap:'wrap'}}>
            {hasK&&<button style={{...S.aB,...S.aBOn,fontSize:12}} onClick={useKnight}>⚔️ 騎士を使う</button>}
            <button style={{...S.aB,...S.aBOn,fontSize:12}} onClick={()=>{setShowTrade(true);setTGive(null);setTGet(null);}}>🔄 港交換</button>
            <button style={{...S.aB,...S.eB,fontSize:13,padding:'8px 20px'}} onClick={endTurn}>⏭️ ターン終了</button>
          </div>
        </div>}

        {/* Log */}
        <div style={{maxHeight:120,overflowY:'auto',padding:'4px 0'}}>{log.slice(0,8).map((m,i)=><div key={i} style={{fontSize:12,color:i===0?'#1c1917':'#78716c',opacity:1-i*.1,padding:'2px 0'}}>{m}</div>)}</div>
      </div>}
    </div>

    {/* Mobile-only controls (hidden on PC) */}
    {!isPC && <>
      {/* DICE */}
      <div style={S.aR}>
        {phase==='dice'&&!npcActive&&<button style={S.dB} onClick={rollDice} disabled={rolling}><span style={rolling?{display:'inline-block',animation:'diceShake .3s infinite'}:{}}>{rolling?'🎲🎲':dice?`🎲 ${dice[0]}+${dice[1]}`:'🎲 ダイスロール'}</span></button>}
      </div>

      {/* NPC dice display */}
      {dice&&npcActive&&<div style={S.dS}><span style={{fontSize:22,color:'#f59e0b'}}>{'⚀⚁⚂⚃⚄⚅'[dice[0]-1]}</span><span style={{fontSize:22,color:'#f59e0b'}}>{'⚀⚁⚂⚃⚄⚅'[dice[1]-1]}</span><span style={{fontSize:14,fontWeight:900,color:'#f59e0b',marginLeft:4}}>{dice[0]+dice[1]}</span></div>}

      {/* Player dice result */}
      {dice&&phase!=='dice'&&!npcActive&&<div style={S.dS}><span style={{fontSize:22,color:'#f59e0b'}}>{'⚀⚁⚂⚃⚄⚅'[dice[0]-1]}</span><span style={{fontSize:22,color:'#f59e0b'}}>{'⚀⚁⚂⚃⚄⚅'[dice[1]-1]}</span><span style={{fontSize:14,fontWeight:900,color:'#f59e0b',marginLeft:4}}>{dice[0]+dice[1]}</span></div>}

      {/* ACTION PANEL - v5 redesign */}
      {phase==='build'&&!npcActive&&<div style={{padding:'4px 8px 2px'}}>
        {/* Build action cards */}
        <div style={{display:'flex',gap:4,justifyContent:'center',marginBottom:4}}>
          {[
            {icon:'🛤️',name:'道路',act:'road',cost:COST.road,rem:P?.rL||0,costShow:[['🪵',1],['🧱',1]]},
            {icon:'🏠',name:'開拓地',act:'settlement',cost:COST.settlement,rem:P?.sL||0,costShow:[['🪵',1],['🧱',1],['🐑',1],['🌾',1]]},
            {icon:'🏰',name:'都市',act:'city',cost:COST.city,rem:P?.cL||0,costShow:[['🌾',2],['⛏️',3]]},
            {icon:'🃏',name:'発展',act:null,cost:COST.devcard,rem:devDk.length,costShow:[['🐑',1],['🌾',1],['⛏️',1]],onClick:buyDev},
          ].map(({icon,name,act,cost,rem,costShow,onClick},i)=>{
            const afford=canAff(P?.resources||emR(),cost)&&rem>0;
            const sel=act&&selectedAction===act;
            const handleClick=onClick||(act&&afford?()=>setSelectedAction(prev=>prev===act?null:act):undefined);
            return <button key={i} onClick={handleClick} style={{
              display:'flex',flexDirection:'column',alignItems:'center',gap:1,
              padding:'6px 6px 4px',borderRadius:10,
              border:sel?'2px solid #f97316':afford?'1.5px solid rgba(249,115,22,.3)':'1px solid rgba(0,0,0,.07)',
              background:sel?'rgba(249,115,22,.1)':afford?'rgba(249,115,22,.06)':'#ffffff',
              boxShadow:sel?'0 0 12px rgba(249,115,22,.2)':'none',
              transform:sel?'scale(1.05)':'none',
              cursor:handleClick?'pointer':'default',opacity:afford?1:.4,
              minWidth:60,transition:'all .15s',fontFamily:'inherit',color:'#1c1917',
            }}>
              <span style={{fontSize:16}}>{icon}</span>
              <span style={{fontSize:9,fontWeight:700,color:sel||afford?'#f97316':'#a8a29e'}}>{name}</span>
              <div style={{display:'flex',gap:2,flexWrap:'wrap',justifyContent:'center'}}>
                {costShow.map(([emoji,n],j)=>{
                  const resKey=RK.find(k=>REMJ[k]===emoji);
                  const have=resKey?(P?.resources[resKey]||0):0;
                  const enough=have>=n;
                  return <span key={j} style={{fontSize:8,opacity:enough?1:.5,background:enough?'rgba(0,0,0,.04)':'rgba(239,68,68,.08)',borderRadius:3,padding:'1px 2px'}}>
                    {emoji}{n}
                  </span>;
                })}
              </div>
              <span style={{fontSize:7,color:'#a8a29e'}}>残{rem}</span>
            </button>;
          })}
        </div>
        {/* Utility buttons row */}
        <div style={{display:'flex',gap:5,justifyContent:'center'}}>
          {hasK&&<button style={{...S.aB,...S.aBOn,fontSize:12}} onClick={useKnight}>⚔️ 騎士を使う</button>}
          <button style={{...S.aB,...S.aBOn,fontSize:12}} onClick={()=>{setShowTrade(true);setTGive(null);setTGet(null);}}>🔄 港交換</button>
          <button style={{...S.aB,...S.eB,fontSize:13,padding:'8px 20px'}} onClick={endTurn}>⏭️ ターン終了</button>
        </div>
      </div>}

      <div style={{padding:'2px 12px 8px',maxHeight:55,overflow:'hidden'}}>{log.slice(0,3).map((m,i)=><div key={i} style={{fontSize:10,color:'#78716c',opacity:1-i*.3,padding:'1px 0'}}>{m}</div>)}</div>
    </>}

    {/* Trade modal and robber hint (shared) */}
    {showTrade&&<div style={S.modal} onClick={()=>setShowTrade(false)}><div style={S.mBox} onClick={e=>e.stopPropagation()}>
      <h3 style={{textAlign:'center',color:'#1c1917',margin:'0 0 12px',fontSize:16}}>🔄 港交換</h3>
      <div style={{marginBottom:10}}><div style={{fontSize:11,color:'#78716c',marginBottom:4}}>渡す</div><div style={{display:'flex',gap:3,justifyContent:'center'}}>{RK.map(r=>{const rate=getRate(r);const ok=(P?.resources[r]||0)>=rate;return <button key={r} style={{...S.trR,...(tGive===r?S.trS:{}),opacity:ok?1:.3}} onClick={()=>ok&&setTGive(r)}><span style={{fontSize:16}}>{REMJ[r]}</span><span style={{fontSize:10}}>×{rate}</span></button>;})}</div></div>
      <div style={{marginBottom:10}}><div style={{fontSize:11,color:'#78716c',marginBottom:4}}>もらう</div><div style={{display:'flex',gap:3,justifyContent:'center'}}>{RK.map(r=><button key={r} style={{...S.trR,...(tGet===r?S.trS:{}),opacity:tGive!==r?1:.2}} onClick={()=>tGive!==r&&setTGet(r)}><span style={{fontSize:16}}>{REMJ[r]}</span><span style={{fontSize:10}}>×1</span></button>)}</div></div>
      <div style={{display:'flex',gap:8}}><button style={{...S.gB,flex:1,opacity:tGive&&tGet&&tGive!==tGet?1:.35}} onClick={doTrade} disabled={!tGive||!tGet||tGive===tGet}>交換</button><button style={S.sB} onClick={()=>setShowTrade(false)}>閉じる</button></div>
    </div></div>}

    {showRobber&&<div style={S.rB}>🦹 盗賊を移動するタイルをタップ</div>}
  </div>;
}

const S={
  ctn:{width:'100%',maxWidth:540,margin:'0 auto',height:'100vh',maxHeight:'100vh',background:'linear-gradient(160deg,#fdf6ec 0%,#fef3c7 40%,#e0f2fe 100%)',fontFamily:"'DM Sans','Noto Sans JP',sans-serif",color:'#1c1917',display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'},
  tW:{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,gap:18},
  h1:{fontSize:36,fontWeight:900,color:'#1c1917',letterSpacing:2,fontFamily:"'Playfair Display','Noto Serif JP',serif",margin:0},
  tBs:{display:'flex',flexDirection:'column',gap:10,width:'100%',maxWidth:320},
  mB:{display:'flex',alignItems:'center',gap:14,padding:'16px 20px',background:'#ffffff',border:'1.5px solid rgba(0,0,0,.08)',borderRadius:16,cursor:'pointer',color:'#1c1917',textAlign:'left',position:'relative',boxShadow:'0 2px 12px rgba(0,0,0,.06)',transition:'all .2s'},
  hsT:{position:'absolute',top:8,right:12,fontSize:11,color:'#f59e0b',background:'rgba(245,158,11,.08)',padding:'2px 8px',borderRadius:8,fontWeight:700},
  hdr:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 16px',height:36,flexShrink:0,background:'rgba(255,255,255,.85)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(0,0,0,.06)'},
  hint:{textAlign:'center',padding:'6px 0',fontSize:12,fontWeight:700,color:'#f97316',background:'rgba(249,115,22,.06)',animation:'pulse 1.5s infinite'},
  npcT:{position:'absolute',top:42,left:'50%',transform:'translateX(-50%)',padding:'6px 14px',borderRadius:10,fontSize:13,fontWeight:600,zIndex:60,border:'1.5px solid',background:'#ffffff',backdropFilter:'blur(6px)',animation:'npcSlide 1.2s ease-out forwards',whiteSpace:'nowrap',boxShadow:'0 4px 20px rgba(0,0,0,.12)'},
  bW:{flex:1,display:'flex',justifyContent:'center',alignItems:'center',minHeight:0,overflow:'hidden'},
  aR:{display:'flex',gap:5,padding:'4px 10px',justifyContent:'center',flexWrap:'wrap'},
  aB:{padding:'7px 12px',borderRadius:10,border:'none',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'inherit'},
  aBOn:{background:'#ffffff',color:'#1c1917',border:'1.5px solid rgba(0,0,0,.1)',boxShadow:'0 2px 6px rgba(0,0,0,.06)'},
  aBOff:{background:'rgba(0,0,0,.03)',color:'#a8a29e',border:'1.5px solid rgba(0,0,0,.05)',cursor:'default'},
  dB:{padding:'12px 28px',borderRadius:14,border:'none',cursor:'pointer',fontSize:15,fontWeight:800,fontFamily:'inherit',background:'linear-gradient(135deg,#f97316,#f59e0b)',color:'#fff',boxShadow:'0 4px 16px rgba(249,115,22,.35)',transition:'all .2s'},
  eB:{background:'#0d9488',color:'#fff',border:'none',boxShadow:'0 2px 8px rgba(13,148,136,.3)'},
  bR:{display:'flex',justifyContent:'center',gap:12,padding:'4px 10px',color:'#78716c'},
  dS:{display:'flex',justifyContent:'center',alignItems:'center',gap:6,padding:'2px 0'},
  modal:{position:'fixed',inset:0,background:'rgba(28,25,23,.5)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100},
  mBox:{background:'#ffffff',border:'1.5px solid rgba(0,0,0,.06)',borderRadius:20,padding:22,maxWidth:340,width:'90%',boxShadow:'0 20px 60px rgba(0,0,0,.15)'},
  trR:{display:'flex',flexDirection:'column',alignItems:'center',gap:2,padding:'6px 5px',background:'rgba(0,0,0,.02)',border:'1.5px solid rgba(0,0,0,.08)',borderRadius:8,cursor:'pointer',color:'#1c1917',minWidth:48},
  trS:{background:'rgba(249,115,22,.08)',border:'2px solid #f97316'},
  gB:{padding:'10px 20px',background:'linear-gradient(135deg,#f97316,#f59e0b)',color:'#fff',border:'none',borderRadius:12,cursor:'pointer',fontSize:14,fontWeight:700,fontFamily:'inherit',boxShadow:'0 2px 8px rgba(249,115,22,.3)'},
  sB:{padding:'10px 14px',background:'rgba(0,0,0,.03)',color:'#78716c',border:'1.5px solid rgba(0,0,0,.08)',borderRadius:12,cursor:'pointer',fontSize:13,fontFamily:'inherit'},
  rB:{position:'absolute',top:68,left:'50%',transform:'translateX(-50%)',background:'#ffffff',color:'#f97316',padding:'7px 14px',borderRadius:10,fontSize:13,fontWeight:700,zIndex:50,border:'1.5px solid rgba(249,115,22,.3)',whiteSpace:'nowrap',boxShadow:'0 4px 16px rgba(0,0,0,.1)'},
  goS:{width:'100%',maxWidth:300,display:'flex',flexDirection:'column',gap:6,background:'#ffffff',borderRadius:16,padding:16,boxShadow:'0 4px 20px rgba(0,0,0,.08)'},
  ctnPC:{width:'100vw',maxWidth:'100vw',height:'100vh',maxHeight:'100vh',background:'linear-gradient(160deg,#fdf6ec 0%,#fef3c7 40%,#e0f2fe 100%)',fontFamily:"'DM Sans','Noto Sans JP',sans-serif",color:'#1c1917',display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'},
};
