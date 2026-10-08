// ===== jsmotion · KIT DE CENAS — motor SEM estilo próprio (qualquer formato) =====
// O visual vem do objeto STYLE, que a skill DEFINE A PARTIR DA ANÁLISE (marca, tema, público, referência) —
// ver references/direcao-de-arte.md. Os valores abaixo são só um exemplo de direção: SEMPRE reescreva STYLE.
// O vídeo é uma lista de cenas (SCRIPT). Tipos prontos: hook · statement · photo · cards · list · price · person · cta.
// VÍDEO NARRADO (references/narrado.md): fala · gigante · caixa · contador — a linha do tempo vem da voz (voice.py),
// cada cena começa no seu marcador (mark:'nome'), o texto entra palavra por palavra no ritmo da fala.
// Cenas próprias (metáforas do tema): SC.nome = (ctx, s, lt) => { ... } usando os helpers (ver references/kit.md).
// window.FORMAT = '9x16' (padrão) | '4x5' | '1x1' | '16x9'
const FMT = {'9x16':[1080,1920], '4x5':[1080,1350], '1x1':[1080,1080], '16x9':[1920,1080]};
const FORMAT = (typeof window!=='undefined' && FMT[window.FORMAT]) ? window.FORMAT : '9x16';
const [W, H] = FMT[FORMAT];
const CX = W/2, CY = H/2, SIDE = W>H, SHORT = H < 1500;   // SHORT: 4:5, 1:1 e 16:9 (menos altura útil)
const FPS = 30;

// ================= DIREÇÃO DE ARTE (reescreva a partir da análise) =================
const STYLE = {
  name: 'Exemplo narrado — terminal verde (só para demonstrar o motor; não é estilo padrão)',
  colors: { bg:'#060B07', bg2:'#0E1A11', ink:'#E9FBEA', soft:'#8FB394', accent:'#4BFF6E', accent2:'#B8FF5C',
            onAccent:'#06130A', card:'rgba(10,24,13,0.7)', line:'rgba(75,255,110,0.18)' },
  bg: 'grid',
  font: { display:{weight:800, case:'none', tracking:-1, scale:1}, text:{weight:500}, numbers:'display' },
  highlight: 'color', eyebrow: 'plain', align: 'center', radius: 22, card: 'glass', reveal: 'fade',
  speed: 1, transition: 'zoom', texture: 'grain', photo: { grade:'none', dim:0 }, vignette: 0.45,
  frame: {},
  sound: { mood:'premium', bpm:100, duck:0.3 },
  locale: 'pt-BR',
  kinetic: { preset:'blurIn', size:128 },
  post: { bloom:0.75, radius:30, ca:0.8, sweep:true },
  hud: { label:'MOTION', rec:true, corners:true, grid:0.04, meta:'JSMOTION · NARRADO' },
  camera: 0.05,
};

// ================= ROTEIRO (cada cena começa no seu [marcador] da narração) =================
const SCRIPT = [
  {type:'fala', mark:'abertura'},
  {type:'caixa', mark:'pedido', label:'novo pedido · jsmotion', text:'cria um vídeo de quinze segundos com tipografia cinética e câmera fluida', from:0.4},
  {type:'fala', mark:'virada', preset:'decode'},
  {type:'contador', mark:'numero', value:15, suffix:'s', label:'de vídeo, quadro a quadro', countAt:0.2},
  {type:'gigante', mark:'gigante'},
  {type:'fala', mark:'final', preset:'pop', dur:3.2},
];

// ================= utilidades =================
const C = STYLE.colors, SP = STYLE.speed||1;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)), lerp=(a,b,t)=>a+(b-a)*t, inv=(a,b,x)=>clamp((x-a)/(b-a));
const eOut=t=>1-Math.pow(1-t,3), eIn=t=>t*t*t, eIO=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const eBack=t=>{const c1=1.4,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);};
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function hexA(h,a){ if(!h||h[0]!=='#') return h; const n=parseInt(h.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;}
const fmtNum=(v,d=0)=>new Intl.NumberFormat(STYLE.locale||'en-US',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v);
const isLight = h=>{ if(!h||h[0]!=='#') return false; const n=parseInt(h.slice(1),16); return (0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))>150; };
const LIGHT = isLight(C.bg);            // fundo claro: sombras e gradientes mudam
// cor do texto da cena atual: sobre FOTO é sempre claro (a foto é escurecida embaixo); sem foto, a do STYLE
let INK = C.ink, SOFT = C.soft, ONPHOTO = false;

// ================= linha do tempo =================
// Trilha de verdade (music.py): window.ASSETS.music = {audio, bpm, beats:[s…], dur} — no lugar da trilha sintetizada
const MUSIC = (typeof window!=='undefined' && window.ASSETS && window.ASSETS.music) || null;
const BEAT = 60/((MUSIC&&MUSIC.bpm) || (STYLE.sound&&STYLE.sound.bpm) || 100);
const TR = STYLE.transition==='cut' ? 0.001 : 0.5*SP;
// Voz (vídeo narrado): window.ASSETS.voice = saída do voice.py {words:[{w,t0,t1,hl,br}], marks:{nome:índice}, dur, lead, audio}
const VOICE = (typeof window!=='undefined' && window.ASSETS && window.ASSETS.voice) || null;
const VW = VOICE ? VOICE.words : [];
const markIdx = m => (VOICE && m!=null && VOICE.marks && VOICE.marks[m]!=null) ? VOICE.marks[m] : null;
const at = (m, k=0) => { const i=markIdx(m); return i==null ? null : VW[Math.min(VW.length-1, i+k)].t0; };   // instante de uma palavra
const LEADIN = 0.15;      // a cena entra um pouco antes da 1ª palavra do seu marcador
const SCN = SCRIPT.map((s,i)=>({...s, i}));
{ let t = 0;
  SCN.forEach(s=>{ const m=at(s.mark); s.start = m!=null ? Math.max(0, m-LEADIN) : t; t = s.start + (s.dur||0); });
  SCN.forEach((s,i)=>{ const n=SCN[i+1];
    if (n && n.mark!=null && markIdx(n.mark)!=null) s.dur = Math.max(0.6, n.start - s.start);
    else if (!n && VOICE) s.dur = Math.max(s.dur||0, VOICE.dur + 1.2 - s.start);   // última cena: a voz termina com folga
    else if (!s.dur) s.dur = n ? 2.5 : 3;
    if (n && !(n.mark!=null && markIdx(n.mark)!=null)) n.start = s.start + s.dur;
    // palavras da cena: do seu marcador até o próximo marcador (tempo local à cena)
    const w0 = markIdx(s.mark), nx = SCN.slice(i+1).find(x=>markIdx(x.mark)!=null), w1 = nx ? markIdx(nx.mark) : VW.length;
    if (w0!=null) s.words = VW.slice(w0, w1).map(w=>({w:w.w, hl:w.hl, br:w.br, t:w.t0-s.start, t1:w.t1-s.start}));
    else if (s.text) s.words = estWords(s.text, s.wordsAt!=null ? s.wordsAt : 0.25);
  });
}
// sem voz: tempos estimados (160 palavras/min) a partir de um texto com *destaques*
function estWords(txt, t0){ let t=t0, hl=false; const out=[];
  for (const tok of String(txt).split(/\s+/).filter(Boolean)){
    if (tok.startsWith('*')) hl=true; const w=tok.replace(/\*/g,''); const d=0.375*(0.55+0.45*Math.min(2.2,w.length/5));
    out.push({w, hl:hl?1:0, br:0, t, t1:t+d}); t+=d + (/[.!?…]$/.test(w)?0.3:/[,;:]$/.test(w)?0.12:0);
    if (tok.replace(/[.,!?;:…"']+$/,'').endsWith('*')) hl=false; }
  return out; }
// com trilha e sem voz: cada troca de cena cai na batida mais próxima (STYLE.sound.snap:false desliga)
if (MUSIC && MUSIC.beats && MUSIC.beats.length && !VOICE && !(STYLE.sound && STYLE.sound.snap===false)){
  const B=MUSIC.beats, near=t=>B.reduce((a,b)=>Math.abs(b-t)<Math.abs(a-t)?b:a, B[0]);
  for (let i=1;i<SCN.length;i++){ const b=near(SCN[i].start); if (Math.abs(b-SCN[i].start)<=BEAT*0.6 && b>SCN[i-1].start+0.6) SCN[i].start=b; }
  for (let i=0;i<SCN.length-1;i++) SCN[i].dur=SCN[i+1].start-SCN[i].start;
}
const _last = SCN[SCN.length-1];
const DUR = Math.round((_last.start + _last.dur + 0.4)*10)/10;
const WH = SCN.slice(1).map(s=>s.start);                    // whoosh nas trocas
const IMPACT = [0.15, SCN[SCN.length-1].start+0.2];         // impacto no gancho e no final
SCN.forEach(s=>{ if(s.type==='gigante') IMPACT.push(s.start + gigT(s)); });
const RISERS = SCN.filter(s=>s.type==='gigante'||s.riser).map(s=>s.start + (s.type==='gigante'?gigT(s):0));   // subida antes das revelações
function gigT(s){ const ws=s.words||[]; const g=ws.filter(w=>w.hl).pop()||ws[ws.length-1]; return g ? Math.max(0,g.t) : 0.2; }
const TICKS = [];                                           // tique nos contadores
SCN.forEach(s=>{ if(s.type==='hook'||s.type==='price') for(let k=0;k<14;k++) TICKS.push(s.start+0.35*SP+k*0.075*SP);
  if(s.type==='cards') (s.cards||[]).forEach((c,j)=>c.value!=null && TICKS.push(s.start+(0.7+j*0.18)*SP)); });

// ================= carregamento =================
const IMG = {ph:{}, logo:{}};
const FAM = { display:'JSDisplay', text:'JSText', mono:'JSMono' };
let VOICE_BUF = null, MUSIC_BUF = null;                     // voz e trilha decodificadas (tocadas no buildAudio)
function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;});}
async function loadAssets(){
  const A = window.ASSETS || {}, F = A.fonts || {};
  const src = { display:F.display||F.serif, display_italic:F.display_italic||F.serif_italic, text:F.text||F.sans, text_italic:F.text_italic, mono:F.mono };
  const faces=[];
  if (src.display) faces.push(new FontFace(FAM.display, `url(${src.display})`, {weight:'100 900'}));
  if (src.display_italic) faces.push(new FontFace(FAM.display, `url(${src.display_italic})`, {weight:'100 900', style:'italic'}));
  if (src.text) faces.push(new FontFace(FAM.text, `url(${src.text})`, {weight:'100 900'}));
  if (src.text_italic) faces.push(new FontFace(FAM.text, `url(${src.text_italic})`, {weight:'100 900', style:'italic'}));
  if (src.mono) faces.push(new FontFace(FAM.mono, `url(${src.mono})`, {weight:'100 900'}));
  for (const f of faces){ await f.load(); document.fonts.add(f); }
  for (const k in (A.photos||{})) IMG.ph[k] = await loadImg(A.photos[k]);
  for (const k in (A.logos||{})) IMG.logo[k] = await loadImg(A.logos[k]);
  const n=document.createElement('canvas'); n.width=320; n.height=320; const nc=n.getContext('2d');
  const id=nc.createImageData(320,320); const r=rng(7);
  for(let i=0;i<id.data.length;i+=4){const v=r()*255;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255;}
  nc.putImageData(id,0,0); IMG.noise=n;
  if (VOICE && VOICE.audio){ const ab=await (await fetch(VOICE.audio)).arrayBuffer();
    VOICE_BUF = await new OfflineAudioContext(1,1,48000).decodeAudioData(ab); }
  if (MUSIC && MUSIC.audio){ const ab=await (await fetch(MUSIC.audio)).arrayBuffer();
    MUSIC_BUF = await new OfflineAudioContext(2,1,48000).decodeAudioData(ab); }
}
const DF = STYLE.font.display||{}, TF = STYLE.font.text||{};
const fDisplay=(size,w=DF.weight||600,it=false)=>`${it?'italic ':''}${w} ${Math.round(size*(DF.scale||1))}px ${FAM.display}, Georgia, serif`;
const fText=(size,w=TF.weight||500,it=false)=>`${it?'italic ':''}${w} ${size}px ${FAM.text}, Helvetica, Arial, sans-serif`;
const fMono=(size,w=500)=>`${w} ${size}px ${FAM.mono}, 'JetBrains Mono', 'DejaVu Sans Mono', ui-monospace, monospace`;
const fNum=(size,w=800)=>STYLE.font.numbers==='display' ? fDisplay(size, DF.weight||w) : fText(size,w);
const up = s => (DF.case==='upper' ? String(s).toUpperCase() : s);

// ================= layout =================
// blocos de texto desenhados num espaço de 1080 de largura; k = escala por formato; no 16:9 texto em coluna à esquerda
const K = SIDE ? 0.78 : Math.min(1, 0.55 + 0.45*(H/1920));
const TX = SIDE ? W*0.3 : CX;
function T(ctx, yf, fn){ ctx.save(); ctx.translate(TX, H*yf); ctx.scale(K,K); ctx.translate(-540,0); fn(); ctx.restore(); }
const MAXW = 920, LEFT = STYLE.align==='left' && !SIDE;
const AX = LEFT ? 90 : 540, AL = LEFT ? 'left' : 'center';   // âncora/alinhamento padrão do texto

// ================= texto =================
// linha de texto com a entrada da direção de arte (STYLE.reveal) e destaque (o.hl → STYLE.highlight)
function line(ctx, txt, y, lt, t0, o={}){
  const dur=(o.dur||0.7)*SP; t0*=SP; const p=inv(t0,t0+dur,lt); if(p<=0||!txt) return 0;
  const e=eOut(p), hl=o.hl && STYLE.highlight;
  let f0 = o.font || fDisplay(o.size||96, o.weight, hl==='italic');
  const size0 = +(f0.match(/(\d+)px/)||[0,96])[1];
  ctx.save(); ctx.font=f0;
  const tr = o.track!=null ? o.track : (o.font ? 0 : (DF.tracking||0));
  if (tr) ctx.letterSpacing=`${tr}px`;
  let w=ctx.measureText(txt).width, size=size0; const maxw=o.maxw||MAXW;
  if (w>maxw){ size=Math.floor(size0*maxw/w); f0=f0.replace(`${size0}px`,`${size}px`); ctx.font=f0; w=ctx.measureText(txt).width; }
  const al=o.align||AL, x=o.x!=null?o.x:AX, x0=al==='left'?x:al==='right'?x-w:x-w/2;
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  let dx=0, dy=0, sc=1, shown=txt;
  const rv=o.reveal||STYLE.reveal;
  if (rv==='mask'){ ctx.beginPath(); ctx.rect(x0-40,y-size*1.15,w+80,size*1.45); ctx.clip(); dy=(1-e)*size*1.05; ctx.globalAlpha*=clamp(p*1.6); }
  else if (rv==='slide'){ dx=(1-e)*-70; ctx.globalAlpha*=e; }
  else if (rv==='scale'){ sc=lerp(0.82,1,eBack(p)); ctx.globalAlpha*=clamp(p*1.4); }
  else if (rv==='type'){ shown=txt.slice(0, Math.ceil(txt.length*clamp(p*1.25))); }
  else { dy=(1-e)*24; ctx.globalAlpha*=e; }   // fade
  ctx.translate(x0+w/2+dx, y+dy); ctx.scale(sc,sc); ctx.translate(-(x0+w/2), -y);
  const ink = o.color || INK;
  // destaque
  if (hl==='marker'||hl==='box'){ const mp=eIO(inv(t0+dur*0.4,t0+dur*1.1,lt)); ctx.save();
    if(hl==='marker'){ ctx.fillStyle=C.accent; ctx.fillRect(x0-14, y-size*0.82, (w+28)*mp, size*1.0); }
    else { ctx.strokeStyle=C.accent; ctx.lineWidth=Math.max(3,size*0.05); ctx.strokeRect(x0-16,y-size*0.85,(w+32),size*1.08*mp); }
    ctx.restore(); }
  if (hl==='italic'||hl==='color'){ const g=ctx.createLinearGradient(x0,y-size,x0+w,y); g.addColorStop(0,C.accent2||C.accent); g.addColorStop(1,C.accent); ctx.fillStyle=g; }
  else if (hl==='marker') ctx.fillStyle=C.onAccent||C.bg;
  else ctx.fillStyle=ink;
  if ((!LIGHT||ONPHOTO) && o.shadow!==false && hl!=='marker'){ ctx.shadowColor='rgba(0,0,0,0.45)'; ctx.shadowBlur=18; ctx.shadowOffsetY=4; }
  if (hl==='outline'){ ctx.shadowBlur=0; ctx.strokeStyle=C.accent; ctx.lineWidth=Math.max(2,size*0.035); ctx.strokeText(shown,x0,y); }
  else ctx.fillText(shown, x0, y);
  if (hl==='underline'){ const up2=eIO(inv(t0+dur*0.5,t0+dur*1.2,lt)); ctx.shadowBlur=0; ctx.fillStyle=C.accent; ctx.fillRect(x0, y+size*0.14, w*up2, Math.max(4,size*0.07)); }
  if (o.strike!=null){ const sp=eIO(inv(t0+o.strike*SP,t0+(o.strike+0.35)*SP,lt)); if(sp>0){ ctx.shadowBlur=0;
    ctx.strokeStyle=C.accent; ctx.lineWidth=Math.max(3,size*0.06); ctx.beginPath(); ctx.moveTo(x0-6,y-size*0.32); ctx.lineTo(x0-6+(w+12)*sp,y-size*0.32); ctx.stroke(); } }
  ctx.restore(); return w;
}
// rótulo pequeno em caixa alta ("eyebrow"), no estilo STYLE.eyebrow
function eyebrow(ctx, txt, y, lt, t0, o={}){
  const st=o.style||STYLE.eyebrow; if(!txt||st==='none') return; t0*=SP;
  const p=inv(t0,t0+0.6*SP,lt); if(p<=0) return; const e=eOut(p);
  ctx.save(); ctx.globalAlpha*=e; ctx.font=fText(o.size||30,650); ctx.letterSpacing='7px';
  const s=txt.toUpperCase(), w=ctx.measureText(s).width, al=o.align||AL, x=o.x!=null?o.x:AX;
  const x0 = al==='left'?x:x-w/2, yy=y+(1-e)*14;
  if (st==='pill'){ ctx.fillStyle=hexA(C.accent,0.16); rr(ctx,x0-22,yy-36,w+44,52,26); ctx.fill(); ctx.strokeStyle=hexA(C.accent,0.6); ctx.lineWidth=1.5; ctx.stroke(); }
  if (st==='dot'){ ctx.fillStyle=C.accent; ctx.beginPath(); ctx.arc(x0-24,yy-11,7,0,Math.PI*2); ctx.fill(); }
  const ec = (ONPHOTO && LIGHT) ? 'rgba(255,255,255,0.92)' : C.accent;   // estilo claro sobre foto: rótulo claro
  ctx.fillStyle=ec; ctx.textAlign='left'; ctx.fillText(s, x0, yy);
  if (st==='rule'){ const rw=70*e; ctx.fillStyle=hexA(C.accent,0.9); ctx.fillRect(al==='left'?x0:540-rw/2, yy+24, rw, 2); }
  ctx.restore();
}
function wrap(ctx, txt, maxw){ const out=[]; let cur='';
  for(const w of String(txt).split(' ')){ const tst=cur?cur+' '+w:w; if(ctx.measureText(tst).width>maxw && cur){out.push(cur);cur=w;} else cur=tst; }
  if(cur) out.push(cur); return out; }
function para(ctx, txt, y, lt, t0, o={}){ // parágrafo curto com quebra automática
  if(!txt) return y; t0*=SP; const p=inv(t0,t0+0.6*SP,lt); if(p<=0) return y;
  ctx.save(); ctx.font=fText(o.size||40,o.weight||400); const ls=wrap(ctx,txt,o.maxw||MAXW-60), lh=o.lh||(o.size||40)*1.3;
  ctx.globalAlpha*=eOut(p); ctx.fillStyle=o.color||SOFT; ctx.textAlign=o.align||AL;
  ls.forEach((l,i)=>ctx.fillText(l, o.x!=null?o.x:AX, y+(1-eOut(p))*12+i*lh)); ctx.restore(); return y+ls.length*lh;
}
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,Math.max(0,r));}
const count=(s,lt,t0,t1)=>lerp(s.from!=null?s.from:0, s.value, eOut(inv(t0*SP,t1*SP,lt)));   // contador animado
// carimbo/etiqueta (útil para metáforas: "APROVADO", "EMBARGO", "NOVO", "-30%")
function stamp(ctx, txt, x, y, rot, lt, t0, o={}){
  const p=inv(t0*SP,(t0+0.35)*SP,lt); if(p<=0) return; const e=eBack(p);
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.scale(lerp(1.8,1,e),lerp(1.8,1,e)); ctx.globalAlpha*=clamp(p*2);
  ctx.font=fText(o.size||36,800); ctx.letterSpacing='5px'; const w=ctx.measureText(txt).width;
  ctx.strokeStyle=o.color||C.accent; ctx.lineWidth=4; rr(ctx,-w/2-22,-(o.size||36)*0.95,w+44,(o.size||36)*1.45,6); ctx.stroke();
  ctx.fillStyle=o.color||C.accent; ctx.textAlign='center'; ctx.fillText(txt,0,(o.size||36)*0.12); ctx.restore();
}

// ================= fundos =================
const GRADE = {warm:'sepia(0.28) saturate(1.15)', cool:'saturate(0.85) hue-rotate(-12deg) brightness(1.02)',
  bw:'grayscale(1) contrast(1.12)', duotone:'grayscale(1) contrast(1.2)'};
function photoBg(ctx, key, lt, dur, o={}){
  const img=IMG.ph[key]; if(!img){ bgFill(ctx); return; }
  const p=clamp(lt/(dur+TR)), kb=o.kb||'in';
  const s = kb==='out' ? lerp(1.16,1.06,p) : lerp(1.06,1.16,p);
  const sc=Math.max(W/img.width,H/img.height)*s, iw=img.width*sc, ih=img.height*sc;
  const px = kb==='left'?lerp(0.35,0.65,p):kb==='right'?lerp(0.65,0.35,p):0.5;
  const gr=(STYLE.photo||{}).grade;
  ctx.save(); const flt=[GRADE[gr]||'', o.blur?`blur(${o.blur}px)`:''].join(' ').trim(); if(flt) ctx.filter=flt;
  ctx.drawImage(img,(W-iw)*px,(H-ih)*0.5,iw,ih); ctx.restore();
  if (gr==='duotone'){ ctx.save(); ctx.globalCompositeOperation='multiply'; ctx.fillStyle=C.accent; ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='screen'; ctx.fillStyle=hexA(C.bg,0.35); ctx.fillRect(0,0,W,H); ctx.restore(); }
  const d=(o.dim!=null?o.dim:0)+((STYLE.photo||{}).dim||0); if(d>0){ ctx.fillStyle=`rgba(8,8,10,${Math.min(0.9,d)})`; ctx.fillRect(0,0,W,H); }
  let g=ctx.createLinearGradient(0,0,0,H*0.2); g.addColorStop(0,'rgba(0,0,0,0.45)'); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H*0.2);
  g=ctx.createLinearGradient(0,H*0.5,0,H); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,0.85)'); ctx.fillStyle=g; ctx.fillRect(0,H*0.5,W,H*0.5);
  if (SIDE){ g=ctx.createLinearGradient(0,0,W*0.62,0); g.addColorStop(0,'rgba(0,0,0,0.78)'); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W*0.62,H); }
}
function bgFill(ctx){
  const k=STYLE.bg;
  if (k==='solid'){ ctx.fillStyle=C.bg; ctx.fillRect(0,0,W,H); return; }
  const g=ctx.createLinearGradient(0,0,W*0.3,H); g.addColorStop(0,C.bg2||C.bg); g.addColorStop(1,C.bg); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  if (k==='grid'||k==='dots'){ ctx.save(); ctx.strokeStyle=ctx.fillStyle=hexA(C.ink,0.06); const st=90;
    for(let x=st/2;x<W;x+=st) for(let y=st/2;y<H;y+=st){ if(k==='dots'){ctx.beginPath();ctx.arc(x,y,2,0,6.28);ctx.fill();} }
    if(k==='grid'){ ctx.lineWidth=1; ctx.beginPath(); for(let x=0;x<W;x+=st){ctx.moveTo(x,0);ctx.lineTo(x,H);} for(let y=0;y<H;y+=st){ctx.moveTo(0,y);ctx.lineTo(W,y);} ctx.stroke(); }
    ctx.restore(); }
  const r=ctx.createRadialGradient(W*0.5,H*0.32,0,W*0.5,H*0.32,Math.max(W,H)*0.6);
  r.addColorStop(0, LIGHT?'rgba(255,255,255,0.5)':hexA(C.accent,0.10)); r.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=r; ctx.fillRect(0,0,W,H);
}

// ================= cenas prontas =================
const SC = {};
SC.hook = (ctx,s,lt)=>{
  if (s.photo) photoBg(ctx, s.photo, lt, s.dur, {dim:0.42, kb:s.kb}); else bgFill(ctx);
  T(ctx, 0.40, ()=>{
    eyebrow(ctx, s.eyebrow, -250, lt, 0.1);
    const txt=(s.prefix||'')+fmtNum(Math.round(count(s,lt,0.3,1.35)))+(s.suffix||'');
    const pop=1+0.06*Math.exp(-Math.max(0,lt-1.35*SP)*6)*(lt>1.35*SP);
    ctx.save(); ctx.translate(AX,0); ctx.scale(pop,pop); ctx.translate(-AX,0);
    line(ctx, txt, 40, lt, 0.2, {font:fNum(270,800), dur:0.55, hl:'italic'===STYLE.highlight||STYLE.highlight==='color'});
    ctx.restore();
    line(ctx, String(s.label||'').toUpperCase(), 140, lt, 0.9, {font:fText(52,700), track:5});
    para(ctx, s.sub, 225, lt, 1.5, {size:40});
  });
};
SC.statement = (ctx,s,lt)=>{
  if (s.photo) photoBg(ctx, s.photo, lt, s.dur, {dim:0.55, kb:s.kb, blur:s.blur}); else bgFill(ctx);
  const L=s.lines||[], lh=132, y0=-((L.length-1)*lh)/2;
  T(ctx, 0.45, ()=>{
    eyebrow(ctx, s.eyebrow, y0-150, lt, 0.05);
    L.forEach((t,i)=>line(ctx, up(t), y0+i*lh+40, lt, 0.15+i*0.2, {size:118, hl:i===s.hl, strike:s.strike===i?0.7:null}));
    para(ctx, s.sub, y0+(L.length-1)*lh+150, lt, 0.4+L.length*0.2, {size:42});
  });
};
SC.photo = (ctx,s,lt)=>{
  photoBg(ctx, s.photo, lt, s.dur, {kb:s.kb});
  const al=SIDE?'center':'left', x=SIDE?540:90;
  T(ctx, SIDE?0.5:0.70, ()=>{
    eyebrow(ctx, s.eyebrow, -90, lt, 0.2, {align:al, x, style:STYLE.eyebrow==='rule'?'plain':STYLE.eyebrow, size:28});
    line(ctx, up(s.title), 0, lt, 0.3, {font:fText(78,700), align:al, x, maxw:900, color:'#FFFFFF'});
    para(ctx, s.sub, 62, lt, 0.55, {size:38, align:al, x, color:'rgba(255,255,255,0.8)'});
  });
};
function card(ctx, x, y, w, h){
  const st=STYLE.card, r=STYLE.radius;
  if (st==='flat'){ ctx.fillStyle=C.accent; ctx.fillRect(x, y+h-4, 60, 4); return; }
  rr(ctx,x,y,w,h,r);
  if (st==='solid'){ ctx.fillStyle=C.bg2||C.card; ctx.fill(); }
  else if (st==='glass'){ ctx.fillStyle=C.card; ctx.fill(); ctx.strokeStyle=C.line; ctx.lineWidth=1.5; ctx.stroke(); }
  else { ctx.strokeStyle=hexA(C.accent,0.7); ctx.lineWidth=2; ctx.stroke(); }
}
SC.cards = (ctx,s,lt)=>{
  if (s.photo) photoBg(ctx, s.photo, lt, s.dur, {dim:0.55, kb:s.kb, blur:4}); else bgFill(ctx);
  const L=[].concat(s.title||[]);
  T(ctx, 0.30, ()=>{
    eyebrow(ctx, s.eyebrow, -120, lt, 0.05);
    L.forEach((t,i)=>line(ctx, up(t), i*96, lt, 0.15+i*0.15, {size:88, hl:i===s.hl}));
    const cw=430, ch=230, gap=28, x0=540-cw-gap/2, y0=L.length*96+40;
    (s.cards||[]).slice(0,4).forEach((c,j)=>{
      const t0=(0.55+j*0.18)*SP, p=inv(t0,t0+0.55*SP,lt); if(p<=0) return; const e=eBack(p);
      const x=x0+(j%2)*(cw+gap), y=y0+Math.floor(j/2)*(ch+gap);
      ctx.save(); ctx.globalAlpha*=clamp(p*1.5); ctx.translate(x+cw/2,y+ch/2); ctx.scale(lerp(0.92,1,e),lerp(0.92,1,e)); ctx.translate(-cw/2,-ch/2);
      card(ctx,0,0,cw,ch);
      const val = c.value!=null ? (c.prefix||'')+fmtNum(Math.round(lerp(0,c.value,eOut(inv(t0+0.1,t0+1.0*SP,lt)))))+(c.suffix||'') : c.text;
      const solid=STYLE.card==='solid';   // cartão sólido tem a cor da marca por trás: texto do STYLE
      ctx.fillStyle=STYLE.card==='flat'?C.accent:(solid?C.ink:INK); ctx.font=fNum(104,800); ctx.textAlign='left'; ctx.fillText(val, 34, 122);
      ctx.fillStyle=solid?C.soft:SOFT; ctx.font=fText(32,500); ctx.fillText(c.label||'', 36, 180);
      ctx.restore();
    });
  });
};
SC.list = (ctx,s,lt)=>{
  if (s.photo) photoBg(ctx, s.photo, lt, s.dur, {dim:0.7, kb:s.kb, blur:6}); else bgFill(ctx);
  const L=[].concat(s.title||[]);
  T(ctx, 0.25, ()=>{
    eyebrow(ctx, s.eyebrow, -120, lt, 0.05, {align:'left', x:90});
    L.forEach((t,i)=>line(ctx, up(t), i*100, lt, 0.15+i*0.15, {size:92, align:'left', x:90, hl:i===s.hl}));
    const y0=L.length*100+70;
    (s.items||[]).slice(0,5).forEach((it,j)=>{
      const t0=(0.6+j*0.28)*SP, p=inv(t0,t0+0.5*SP,lt); if(p<=0) return; const e=eOut(p), y=y0+j*(SHORT?122:150);
      ctx.save(); ctx.globalAlpha*=e; ctx.translate((1-e)*40,0);
      ctx.fillStyle=C.accent; ctx.font=fNum(40,700); ctx.textAlign='left'; ctx.fillText(String(j+1).padStart(2,'0'), 90, y);
      ctx.fillStyle=INK; ctx.font=fText(50,650); ctx.fillText(it.t, 180, y);
      if(it.s){ ctx.fillStyle=SOFT; ctx.font=fText(34,450); ctx.fillText(it.s, 180, y+50); }
      ctx.fillStyle=hexA(C.accent,0.35); ctx.fillRect(90, y+84, 900*e, 1.5);
      ctx.restore();
    });
  });
};
SC.price = (ctx,s,lt)=>{
  if (s.photo) photoBg(ctx, s.photo, lt, s.dur, {dim:0.62, kb:s.kb, blur:5}); else bgFill(ctx);
  T(ctx, 0.34, ()=>{
    eyebrow(ctx, s.eyebrow, -170, lt, 0.05);
    para(ctx, s.label, -85, lt, 0.2, {size:44, color:INK});
    line(ctx, (s.prefix||'')+fmtNum(Math.round(count(s,lt,0.4,1.5)))+(s.suffix||''), 70, lt, 0.3, {font:fNum(150,800), hl:true});
    (s.rows||[]).slice(0,4).forEach((r,j)=>{
      const t0=(1.2+j*0.2)*SP, p=inv(t0,t0+0.45*SP,lt); if(p<=0) return; const y=190+j*92;
      ctx.save(); ctx.globalAlpha*=eOut(p);
      ctx.fillStyle=ONPHOTO?'rgba(255,255,255,0.18)':C.line; ctx.fillRect(110, y-58, 860, 1.5);
      ctx.font=fText(40,450); ctx.fillStyle=SOFT; ctx.textAlign='left'; ctx.fillText(r[0], 110, y);
      ctx.font=fText(42,750); ctx.fillStyle=INK; ctx.textAlign='right'; ctx.fillText(r[1], 970, y);
      ctx.restore();
    });
  });
};
SC.person = (ctx,s,lt)=>{
  bgFill(ctx);
  const img=IMG.ph[s.photo], L=[].concat(s.title||[]);
  T(ctx, 0.2, ()=>{
    eyebrow(ctx, s.eyebrow, -40, lt, 0.05, {align:'center', x:540});
    L.forEach((t,i)=>line(ctx, up(t), 70+i*100, lt, 0.15+i*0.15, {size:96, hl:i===s.hl, align:'center', x:540}));
    const R=SHORT?225:330, cy=L.length*100+(SHORT?300:430), p=eOut(inv(0.2*SP,1.0*SP,lt));
    ctx.save(); ctx.globalAlpha*=p;
    const gl=ctx.createRadialGradient(540,cy,R*0.6,540,cy,R*1.5); gl.addColorStop(0,hexA(C.accent,0.25)); gl.addColorStop(1,hexA(C.accent,0));
    ctx.fillStyle=gl; ctx.fillRect(540-R*1.6,cy-R*1.6,R*3.2,R*3.2);
    if(img){ ctx.save(); ctx.beginPath(); if(STYLE.radius>0) ctx.arc(540,cy,R*lerp(0.9,1,p),0,Math.PI*2); else ctx.rect(540-R,cy-R,2*R,2*R); ctx.clip();
      const sc=Math.max(2*R/img.width,2*R/img.height)*lerp(1.12,1.02,clamp(lt/s.dur)); ctx.drawImage(img,540-img.width*sc/2,cy-img.height*sc/2,img.width*sc,img.height*sc); ctx.restore(); }
    ctx.strokeStyle=C.accent; ctx.lineWidth=3; ctx.beginPath();
    if(STYLE.radius>0) ctx.arc(540,cy,R+14,-Math.PI/2,-Math.PI/2+Math.PI*2*eIO(inv(0.3*SP,1.4*SP,lt)));
    else ctx.rect(540-R-14,cy-R-14,(2*R+28)*eIO(inv(0.3*SP,1.4*SP,lt)),2*R+28);
    ctx.stroke(); ctx.restore();
  });
};
SC.cta = (ctx,s,lt)=>{
  if (s.photo) photoBg(ctx, s.photo, lt, s.dur, {dim:0.7, kb:s.kb, blur:6}); else bgFill(ctx);
  const L=[].concat(s.title||[]);
  T(ctx, 0.42, ()=>{
    const lg=IMG.logo[s.logo];
    if(lg){ const p=eOut(inv(0.1*SP,0.9*SP,lt)), w=Math.min(700,lg.width), h=w*lg.height/lg.width;
      ctx.save(); ctx.globalAlpha*=p; if(LIGHT && !ONPHOTO && (STYLE.frame||{}).tint!=='none') ctx.filter='brightness(0.18)';
      ctx.drawImage(lg,540-w/2,-h-60+(1-p)*20,w,h); ctx.restore(); }
    eyebrow(ctx, s.eyebrow, 10, lt, 0.4, {align:'center', x:540});
    L.forEach((t,i)=>line(ctx, up(t), 130+i*92, lt, 0.55+i*0.15, {size:80, hl:i===s.hl, align:'center', x:540}));
    const by=130+L.length*92+120, bp=inv(1.1*SP,1.6*SP,lt);
    if(bp>0 && s.button){ const e=eBack(bp), pulse=1+0.025*Math.sin(lt*Math.PI*2/BEAT);
      ctx.save(); ctx.globalAlpha*=clamp(bp*1.5); ctx.translate(540,by); ctx.scale(e*pulse,e*pulse);
      ctx.font=fText(50,750); const tw=ctx.measureText(s.button).width, bw=tw+(s.icon?190:120), bh=124;
      const g=ctx.createLinearGradient(-bw/2,0,bw/2,0); g.addColorStop(0,C.accent2||C.accent); g.addColorStop(1,C.accent);
      if(!LIGHT){ ctx.shadowColor=hexA(C.accent,0.55); ctx.shadowBlur=40; }
      rr(ctx,-bw/2,-bh/2,bw,bh,Math.min(STYLE.radius*2.4,bh/2)); ctx.fillStyle=g; ctx.fill(); ctx.shadowBlur=0;
      let tx=-tw/2; if(s.icon){ tx+=36; ctx.fillStyle=C.onAccent; ctx.beginPath(); ctx.arc(-tw/2-28,0,30,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle=C.accent2||C.accent; ctx.lineWidth=5; ctx.lineCap='round'; ctx.beginPath(); ctx.arc(-tw/2-28,0,14,Math.PI*0.65,Math.PI*1.85); ctx.stroke(); }
      ctx.fillStyle=C.onAccent; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(s.button, tx, 3);
      ctx.restore();
      para(ctx, s.small, by+115, lt, 1.4, {size:30, align:'center', x:540});
    }
  });
};

// ================= TIPOGRAFIA CINÉTICA (vídeo narrado) =================
// kwords(): palavras entrando no instante em que são faladas (words=[{w,t,t1,hl,br}], t em tempo local da cena).
// Presets (STYLE.kinetic.preset ou o.preset): blurIn · rise · pop · decode · type · stretch.
// Destaque (hl / *palavra* na narração): cor de destaque + brilho + pulso no instante em que é dita.
const KS = Object.assign({preset:'blurIn', size:110, lh:1.14, maxw:920, upper:false, ghost:0, maxLines:4, breaks:'sentence'}, STYLE.kinetic||{});
const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=<>/';
function kLayout(ctx, words, size, maxw, o){
  const fontOf = w => o.font ? o.font(w, size) : (w.hl && STYLE.highlight==='italic' ? fDisplay(size, DF.weight, true) : fDisplay(size));
  let lines=[[]], lw=[0];
  words.forEach((w,i)=>{ ctx.font=fontOf(w); const txt=(o.upper||KS.upper)?w.w.toUpperCase():w.w;
    const ww=ctx.measureText(txt).width, sp=size*0.26, L=lines.length-1, need=lw[L]+(lines[L].length?sp:0)+ww;
    const brk=o.breaks!=null?o.breaks:KS.breaks, prev=words[i-1];
    if (lines[L].length && (need>maxw || (prev && ((brk==='lines' && prev.br) || (brk==='sentence' && /[.!?…]$/.test(prev.w)))))){ lines.push([]); lw.push(0); }
    const k=lines.length-1; lines[k].push({...w, txt, ww, font:fontOf(w), x:lw[k]+(lines[k].length?sp:0)}); lw[k]=lines[k][lines[k].length-1].x+ww; });
  return {lines, lw};
}
function kwords(ctx, words, lt, o={}){
  if (!words || !words.length) return;
  const preset=o.preset||KS.preset, lh=o.lh||KS.lh, maxw=o.maxw||KS.maxw;
  let size=o.size||KS.size, L;
  for (let k=0;k<8;k++){ L=kLayout(ctx, words, size, maxw, o); if (L.lines.length<=(o.maxLines||KS.maxLines)) break; size*=0.88; }
  const H0=(L.lines.length-1)*size*lh, y0=(o.y||0)-H0/2+size*0.35, al=o.align||AL, xA=o.x!=null?o.x:AX;
  const ghost=o.ghost!=null?o.ghost:KS.ghost, d=(o.dur||0.42)*SP;
  ctx.save(); ctx.textBaseline='alphabetic'; ctx.textAlign='left';
  L.lines.forEach((ln,li)=>{ const lw=L.lw[li], xl=al==='left'?xA:al==='right'?xA-lw:xA-lw/2, y=y0+li*size*lh;
    ln.forEach((w,wi)=>{
      const p=inv(w.t, w.t+d, lt), e=eOut(p), x=xl+w.x;
      if (p<=0 && !ghost) return;
      ctx.save(); ctx.font=w.font; let a=p<=0?ghost:Math.max(ghost,clamp(p*1.6)), txt=w.txt, sx=1, sy=1, dy=0;
      if (p>0 && p<1){
        if (preset==='blurIn'){ ctx.filter=`blur(${((1-e)*14).toFixed(1)}px)`; sx=sy=lerp(1.22,1,e); }
        else if (preset==='rise'){ ctx.beginPath(); ctx.rect(x-20,y-size*1.05,w.ww+40,size*1.35); ctx.clip(); dy=(1-e)*size*1.05; a=1; }
        else if (preset==='pop'){ sx=sy=lerp(0.35,1,eBack(p)); }
        else if (preset==='stretch'){ sx=lerp(2.4,1,e); sy=lerp(0.35,1,e); ctx.filter=`blur(${((1-e)*8).toFixed(1)}px)`; }
        else if (preset==='decode'){ const n=Math.floor(txt.length*clamp(p*1.15)), r=rng((w.i||wi*31+li*977)+Math.floor(lt*24)*7919);
          txt=txt.slice(0,n)+[...txt.slice(n)].map(c=>c===' '?' ':GLYPHS[Math.floor(r()*GLYPHS.length)]).join(''); }
        else if (preset==='type'){ const cd=Math.max(0.03,Math.min(0.08,((w.t1||w.t+0.3)-w.t)/Math.max(1,txt.length)));
          txt=txt.slice(0, Math.max(1,Math.ceil((lt-w.t)/cd))); a=1; }
      }
      // pulso do destaque no instante em que é dito
      const pulse = w.hl ? 1+0.09*Math.exp(-Math.max(0,lt-w.t-d*0.6)*5)*(lt>w.t) : 1;
      ctx.globalAlpha*=a; ctx.translate(x+w.ww/2, y+dy); ctx.scale(sx*pulse, sy*pulse); ctx.translate(-(x+w.ww/2), -y);
      if (w.hl){ const g=ctx.createLinearGradient(x,y-size,x+w.ww,y); g.addColorStop(0,C.accent2||C.accent); g.addColorStop(1,C.accent); ctx.fillStyle=g;
        if (!LIGHT||ONPHOTO){ ctx.shadowColor=hexA(C.accent,0.75); ctx.shadowBlur=size*0.45; } }
      else { ctx.fillStyle=o.color||INK; if((!LIGHT||ONPHOTO)&&o.shadow!==false){ ctx.shadowColor='rgba(0,0,0,0.4)'; ctx.shadowBlur=14; } }
      if (p<=0) ctx.fillStyle=o.color||INK;
      ctx.fillText(txt, x, y);
      // cursor do preset 'type' na última palavra que está sendo digitada
      if (preset==='type' && p>0 && p<1){ ctx.shadowBlur=0; ctx.fillStyle=C.accent; const cw=ctx.measureText(txt).width;
        if (Math.floor(lt*4)%2===0) ctx.fillRect(x+cw+size*0.06, y-size*0.78, size*0.09, size*0.9); }
      ctx.restore();
    });
  });
  ctx.restore();
}

// ---------- cenas do vídeo narrado ----------
// Tc: bloco centralizado em TODOS os formatos (no 16:9 o texto narrado ocupa o centro e ganha largura: KW)
const KC = SIDE ? 0.86 : K, KW = SIDE ? 1650 : KS.maxw;
function Tc(ctx, yf, fn){ ctx.save(); ctx.translate(CX, H*yf); ctx.scale(KC,KC); ctx.translate(-540,0); fn(); ctx.restore(); }
// fala: o texto da narração entrando palavra por palavra (mark:'nome' ou text:'… *destaque* …' sem voz)
SC.fala = (ctx,s,lt)=>{
  if (s.photo) photoBg(ctx, s.photo, lt, s.dur, {dim:0.6, kb:s.kb, blur:s.blur}); else bgFill(ctx);
  Tc(ctx, s.y||0.46, ()=>{
    eyebrow(ctx, s.eyebrow, -((s.size||KS.size)*1.9), lt, 0.05, {align:'center', x:540});
    kwords(ctx, s.words, lt, {preset:s.preset, size:s.size, upper:s.upper, breaks:s.breaks, ghost:s.ghost, maxw:KW, align:'center', x:540});
  });
};
// gigante: a palavra-chave ocupando a tela (a última *destacada* da fala, ou s.word), com impacto
SC.gigante = (ctx,s,lt)=>{
  if (s.photo) photoBg(ctx, s.photo, lt, s.dur, {dim:0.7, kb:s.kb, blur:8}); else bgFill(ctx);
  const ws=s.words||[], g=ws.filter(w=>w.hl).pop()||ws[ws.length-1]||{w:s.word||'', t:0.2}, gi=ws.indexOf(g);
  const pre=gi>0?ws.slice(0,gi):[], gt=g.t!=null?g.t:0.2, txt=(s.upper!==false?String(s.word||g.w).toUpperCase():(s.word||g.w)).replace(/[.,!?;:…]+$/,'');
  Tc(ctx, 0.47, ()=>{
    if (pre.length) kwords(ctx, pre, lt, {size:64, y:-260, preset:'blurIn', align:'center', x:540, maxw:KW});
    const p=inv(gt, gt+0.5*SP, lt); if (p<=0) return; const e=eOut(p);
    ctx.save(); ctx.font=fDisplay(300, 900); ctx.letterSpacing='-4px';
    let w=ctx.measureText(txt).width; const size=Math.min(SIDE?520:420, 300*(SIDE?1500:900)/w); ctx.font=fDisplay(size, 900); w=ctx.measureText(txt).width;
    ctx.letterSpacing=`${lerp(60,-4,e)}px`;
    const sc=lerp(1.6,1,e)*(1+0.015*Math.sin(lt*3)), sh=1+0.25*Math.exp(-(lt-gt)*9);
    ctx.translate(540, size*0.32); ctx.scale(sc*sh, sc/sh*1.0); ctx.globalAlpha*=clamp(p*2.2);
    ctx.filter=`blur(${((1-e)*18).toFixed(1)}px)`; ctx.textAlign='center';
    const gr=ctx.createLinearGradient(-w/2,-size,w/2,0); gr.addColorStop(0,C.accent2||C.accent); gr.addColorStop(1,C.accent);
    ctx.fillStyle=g.hl?gr:INK; if(!LIGHT){ ctx.shadowColor=hexA(C.accent,0.8); ctx.shadowBlur=60; }
    ctx.fillText(txt, 0, 0); ctx.restore();
  });
};
// caixa: campo de pedido/busca sendo digitado (texto em s.text, entre s.from e s.to segundos da cena)
SC.caixa = (ctx,s,lt)=>{
  bgFill(ctx);
  Tc(ctx, s.y||0.45, ()=>{
    if (s.words) kwords(ctx, s.words, lt, {size:s.titleSize||64, y:-250, align:'center', x:540, maxw:KW});
    const p=eOut(inv(0.05,0.5,lt)); if(p<=0) return;
    const bw=940, bh=s.h||300, x=540-bw/2, y=-bh/2+40;
    ctx.save(); ctx.globalAlpha*=p; ctx.translate(0,(1-p)*30);
    rr(ctx,x,y,bw,bh,STYLE.radius); ctx.fillStyle=LIGHT?'rgba(255,255,255,0.92)':hexA(C.bg2||C.bg,0.85); ctx.fill();
    ctx.lineWidth=2.5; ctx.strokeStyle=hexA(C.accent,0.85); if(!LIGHT){ ctx.shadowColor=hexA(C.accent,0.6); ctx.shadowBlur=30; } ctx.stroke(); ctx.shadowBlur=0;
    ctx.font=fMono(22,600); ctx.fillStyle=hexA(C.accent,0.9); ctx.textAlign='left'; ctx.fillText(String(s.label||'NOVO PEDIDO').toUpperCase(), x+64, y+46);
    ctx.fillStyle=C.accent; ctx.beginPath(); ctx.arc(x+36,y+39,7,0,6.28); ctx.fill();
    const full=String(s.text||''), a=s.from!=null?s.from:0.5, b=s.to!=null?s.to:Math.max(a+0.5,s.dur-0.6);
    const n=Math.floor(full.length*clamp((lt-a)/(b-a))); ctx.font=fMono(s.size||40,500); ctx.fillStyle=INK;
    const ls=wrap(ctx, full.slice(0,n), bw-120); ls.forEach((l,i)=>ctx.fillText(l, x+60, y+110+i*(s.size||40)*1.35));
    const last=ls[ls.length-1]||'', cx=x+60+ctx.measureText(last).width+6, cy=y+110+(Math.max(1,ls.length)-1)*(s.size||40)*1.35;
    if (Math.floor(lt*3)%2===0 || n<full.length){ ctx.fillStyle=C.accent; ctx.fillRect(cx, cy-(s.size||40)*0.8, 4, (s.size||40)*0.95); }
    const sp=inv(b,b+0.3,lt); ctx.beginPath(); ctx.arc(x+bw-58, y+bh-56, 30, 0, 6.28); ctx.fillStyle=hexA(C.accent,0.2+0.8*sp); ctx.fill();
    ctx.strokeStyle=sp>0.5?(C.onAccent||C.bg):C.accent; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(x+bw-58,y+bh-42); ctx.lineTo(x+bw-58,y+bh-70); ctx.moveTo(x+bw-70,y+bh-60); ctx.lineTo(x+bw-58,y+bh-72); ctx.lineTo(x+bw-46,y+bh-60); ctx.stroke();
    ctx.restore();
  });
};
// contador: anel que se completa enquanto o número sobe (from→value), com rótulo — dados e provas
SC.contador = (ctx,s,lt)=>{
  bgFill(ctx);
  Tc(ctx, s.y||0.45, ()=>{
    if (s.words) kwords(ctx, s.words, lt, {size:60, y:-380, align:'center', x:540, maxw:KW});
    const t0=s.countAt!=null?s.countAt:0.3, t1=t0+(s.countDur||1.2), rp=eIO(inv(t0,t1,lt)), R=250, cy=40;
    ctx.save(); ctx.lineCap='round'; ctx.lineWidth=26; ctx.strokeStyle=hexA(C.accent,0.15); ctx.beginPath(); ctx.arc(540,cy,R,0,6.28); ctx.stroke();
    ctx.strokeStyle=C.accent; if(!LIGHT){ ctx.shadowColor=C.accent; ctx.shadowBlur=30; }
    ctx.beginPath(); ctx.arc(540,cy,R,-Math.PI/2,-Math.PI/2+Math.PI*2*rp); ctx.stroke(); ctx.restore();
    const v=lerp(s.from||0, s.value, eOut(inv(t0,t1,lt))), pop=1+0.1*Math.exp(-Math.max(0,lt-t1)*7)*(lt>t1);
    ctx.save(); ctx.translate(540,cy+52); ctx.scale(pop,pop); ctx.font=fNum(170,800); ctx.textAlign='center'; ctx.fillStyle=INK;
    ctx.fillText((s.prefix||'')+fmtNum(v, s.decimals||0)+(s.suffix||''),0,0); ctx.restore();
    para(ctx, s.label, cy+R+110, lt, t1, {size:44, color:INK, align:'center', x:540});
  });
};
for (const s of SCN) if (s.type==='contador'){ for(let k=0;k<14;k++) TICKS.push(s.start+((s.countAt||0.3)+k*(s.countDur||1.2)/14)); }

// ================= HUD — interface fixa por cima das cenas (STYLE.hud) =================
function tc(t){ const f=Math.floor((t%1)*FPS), s=Math.floor(t)%60, m=Math.floor(t/60); return `00:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}:${String(f).padStart(2,'0')}`; }
function drawHud(ctx, t, cur){
  const U=STYLE.hud; if(!U || cur.hud===false) return;
  const col=U.color||(LIGHT?C.ink:C.accent), mx=SIDE?64:70, top=FORMAT==='9x16'?250:(SIDE?52:60), bot=FORMAT==='9x16'?H-270:H-(SIDE?52:60);
  ctx.save(); ctx.globalAlpha=(U.alpha||0.75)*inv(0.2,0.8,t); ctx.fillStyle=col; ctx.strokeStyle=col; ctx.font=fMono(SIDE?20:24,500); ctx.letterSpacing='2px';
  if (U.grid){ ctx.save(); ctx.globalAlpha*=U.grid/0.75; ctx.lineWidth=1; const st=SIDE?120:108; ctx.beginPath();
    for(let x=mx;x<W-mx;x+=st){ctx.moveTo(x,top);ctx.lineTo(x,bot);} for(let y=top;y<bot;y+=st){ctx.moveTo(mx,y);ctx.lineTo(W-mx,y);} ctx.stroke(); ctx.restore(); }
  if (U.corners!==false){ ctx.lineWidth=2; const k=14; [[mx,top],[W-mx,top],[mx,bot],[W-mx,bot]].forEach(([x,y])=>{ ctx.beginPath(); ctx.moveTo(x-k,y); ctx.lineTo(x+k,y); ctx.moveTo(x,y-k); ctx.lineTo(x,y+k); ctx.stroke(); }); }
  ctx.textAlign='left'; ctx.fillText(`${String(U.label||'MOTION').toUpperCase()} / ${String(cur.i+1).padStart(3,'0')}`, mx+28, top+44);
  if (U.rec!==false){ ctx.textAlign='right'; ctx.fillText(`REC ${tc(t)}`, W-mx-28, top+44);
    if (Math.floor(t*1.6)%2===0){ ctx.beginPath(); ctx.fillStyle=U.recColor||'#FF3B30'; const tw=ctx.measureText(`REC ${tc(t)}`).width; ctx.arc(W-mx-28-tw-18, top+36, 7, 0, 6.28); ctx.fill(); ctx.fillStyle=col; } }
  ctx.textAlign='left'; if (U.meta) ctx.fillText(String(U.meta).toUpperCase(), mx+28, bot-24);
  ctx.textAlign='right'; ctx.fillText(U.right!=null?String(U.right).toUpperCase():`${W}×${H} · ${FPS} FPS`, W-mx-28, bot-24);
  ctx.restore();
}

// ================= PÓS-PRODUÇÃO (STYLE.post): bloom · aberração cromática · varredura de luz =================
let PB=null, PR=null, PG=null;
function post(ctx, t, cur, lt){
  const P=STYLE.post; if(!P) return; const cv=ctx.canvas;
  ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.filter='none'; ctx.letterSpacing='0px';
  if (P.bloom){   // brilho: só o que já é claro "vaza" luz (contraste alto corta os escuros), desfocado e somado em 'screen'
    if(!PB){ PB=document.createElement('canvas'); PB.width=Math.round(W/4); PB.height=Math.round(H/4); }
    const b=PB.getContext('2d'); b.globalCompositeOperation='copy'; b.filter=`brightness(${P.threshold||0.8}) contrast(${P.contrast||2.6}) blur(${((P.radius||28)/4).toFixed(1)}px)`;
    b.drawImage(cv,0,0,PB.width,PB.height); b.filter='none';
    ctx.globalCompositeOperation='screen'; ctx.globalAlpha=Math.min(1,P.bloom*(LIGHT?0.35:1)); ctx.drawImage(PB,0,0,W,H); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
  }
  let k=P.caBase||0; for(const ti of IMPACT) if(t>=ti) k=Math.max(k,(P.ca||0)*Math.exp(-(t-ti)*7));
  if (k>0.04){   // aberração cromática: vermelho para um lado, ciano para o outro (impactos)
    if(!PR){ PR=document.createElement('canvas'); PR.width=W; PR.height=H; PG=document.createElement('canvas'); PG.width=W; PG.height=H; }
    const r=PR.getContext('2d'), g=PG.getContext('2d'), off=k*Math.min(W,H)*0.012;
    r.globalCompositeOperation='copy'; r.drawImage(cv,0,0); r.globalCompositeOperation='multiply'; r.fillStyle='#FF0000'; r.fillRect(0,0,W,H);
    g.globalCompositeOperation='copy'; g.drawImage(cv,0,0); g.globalCompositeOperation='multiply'; g.fillStyle='#00FFFF'; g.fillRect(0,0,W,H);
    ctx.globalCompositeOperation='copy'; ctx.drawImage(PG,-off/2,0); ctx.globalCompositeOperation='lighter'; ctx.drawImage(PR,off/2,0); ctx.globalCompositeOperation='source-over';
  }
  if (P.sweep && lt < 0.9){   // varredura de luz diagonal no começo de cada cena
    const p=eIO(inv(0.05,0.85,lt)), x=lerp(-W*0.6,W*1.6,p), g2=ctx.createLinearGradient(x-W*0.25,0,x+W*0.25,H*0.4);
    g2.addColorStop(0,'rgba(255,255,255,0)'); g2.addColorStop(0.5,`rgba(255,255,255,${LIGHT?0.10:0.07})`); g2.addColorStop(1,'rgba(255,255,255,0)');
    ctx.globalCompositeOperation='screen'; ctx.fillStyle=g2; ctx.fillRect(0,0,W,H); ctx.globalCompositeOperation='source-over';
  }
  ctx.restore();
}

// ================= moldura fixa da marca =================
function drawFrame(ctx, a){
  const F=STYLE.frame||{}; if(a<=0) return; const m=SIDE?60:70*Math.min(1,W/1080), hh=(SIDE?52:58)*K;
  ctx.save(); ctx.globalAlpha=a*0.95;
  if (LIGHT && !ONPHOTO && F.tint!=='none') ctx.filter='brightness(0.18)';   // logo claro sobre fundo claro: escurece
  const Lg=IMG.logo[F.left], Rg=IMG.logo[F.right], Bg=IMG.logo[F.bottom];
  if (Lg){ const w=hh*Lg.width/Lg.height; ctx.drawImage(Lg, m, m*0.9, w, hh); }
  if (Rg){ const w=hh*Rg.width/Rg.height; ctx.drawImage(Rg, W-m-w, m*0.9, w, hh); }
  if (Bg){ const bh=(SIDE?66:78)*K, bw=bh*Bg.width/Bg.height; ctx.drawImage(Bg, CX-bw/2, H-(SIDE?0.1:0.12)*H-bh/2, bw, bh); }
  ctx.restore();
}

// ================= render =================
function drawScene(ctx, s, lt){
  ONPHOTO = !!(s.photo && IMG.ph[s.photo] && s.type!=='person');
  INK = ONPHOTO ? '#FFFFFF' : C.ink; SOFT = ONPHOTO ? 'rgba(255,255,255,0.82)' : C.soft;
  const cz = s.cam!=null ? s.cam : (STYLE.camera||0);   // câmera: aproximação lenta e contínua durante a cena
  if (cz){ const z=1+cz*eIO(clamp(lt/(s.dur+TR))); ctx.translate(CX,CY); ctx.scale(z,z); ctx.translate(-CX,-CY); }
  (SC[s.type]||SC.statement)(ctx, s, lt);
}
function transition(ctx, prev, cur, lt){
  const p=eIO(clamp(lt/TR)), kind=cur.trans_in||STYLE.transition;
  ctx.save(); drawScene(ctx, prev, cur.start-prev.start+lt); ctx.restore();
  ctx.save();
  if (kind==='slide'){ ctx.translate((1-p)*W,0); }
  else if (kind==='push'){ ctx.translate(0,(1-p)*H); }
  else if (kind==='wipe'){ ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(W*p*1.6,0); ctx.lineTo(W*p*1.6-W*0.6,H); ctx.lineTo(0,H); ctx.clip(); }
  else if (kind==='zoom'){ ctx.globalAlpha=p; ctx.translate(CX,CY); const z=lerp(1.25,1,p); ctx.scale(z,z); ctx.translate(-CX,-CY); }
  else { ctx.globalAlpha=p; ctx.translate(CX,CY); const z=lerp(1.05,1,p); ctx.scale(z,z); ctx.translate(-CX,-CY); }   // fade (e flash)
  drawScene(ctx, cur, lt); ctx.restore();
  if (prev.trans==='flash'||kind==='flash'){ ctx.fillStyle=`rgba(255,250,240,${0.75*Math.sin(Math.PI*p)})`; ctx.fillRect(0,0,W,H); }
}
function texture(ctx, t){
  const tx=STYLE.texture;
  if (tx==='grain'&&!window.NOGRAIN){ ctx.save(); ctx.globalAlpha=0.045; ctx.globalCompositeOperation='overlay';
    const o=Math.floor(t*30)%4; ctx.drawImage(IMG.noise,-o*17,-o*11,W+60,H+44); ctx.restore(); }
  if (tx==='paper'){ ctx.save(); ctx.globalAlpha=0.05; ctx.globalCompositeOperation='multiply'; ctx.drawImage(IMG.noise,0,0,W,H); ctx.restore(); }
  if (tx==='scanlines'){ ctx.save(); ctx.fillStyle='rgba(0,0,0,0.12)'; for(let y=0;y<H;y+=4) ctx.fillRect(0,y,W,1.5); ctx.restore(); }
}
function render(ctx, t){
  t=clamp(t,0,DUR);
  ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.filter='none'; ctx.letterSpacing='0px';
  ctx.fillStyle=C.bg; ctx.fillRect(0,0,W,H);
  let cur=SCN[0]; for(const s of SCN) if(t>=s.start) cur=s;
  const prev=SCN[cur.i-1], lt=t-cur.start;
  if (prev && lt<TR) transition(ctx, prev, cur, lt); else { ctx.save(); drawScene(ctx, cur, lt); ctx.restore(); }
  const fa = cur.frame===false ? 1-inv(0,TR,lt) : (prev && prev.frame===false ? inv(0,TR,lt) : 1);
  drawFrame(ctx, fa*inv(0.3,0.9,t));
  post(ctx, t, cur, lt);
  drawHud(ctx, t, cur);
  texture(ctx, t);
  if (STYLE.vignette){ const v=ctx.createRadialGradient(CX,CY,Math.min(W,H)*0.45,CX,CY,Math.max(W,H)*0.75);
    v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,`rgba(0,0,0,${STYLE.vignette})`); ctx.fillStyle=v; ctx.fillRect(0,0,W,H); }
  const fin=inv(0,0.3,t)*(1-inv(DUR-0.45,DUR,t)); if(fin<1){ ctx.fillStyle=`rgba(0,0,0,${1-fin})`; ctx.fillRect(0,0,W,H); }
}

// ================= SOM — clima definido por STYLE.sound.mood =================
function buildAudio(ac, dest){
  // mood 'none' = sem trilha nem efeitos (só voz/trilha externa, se houver) · com trilha externa (MUSIC) o sintetizador
  // não toca a base musical: fica só com os efeitos (whooshes, impactos, subidas, tiques), que é onde ele é bom
  const mood=(STYLE.sound&&STYLE.sound.mood)||'premium', NOS=mood==='none';
  const r=rng(11), sr=ac.sampleRate, hz=m=>440*Math.pow(2,(m-69)/12);
  const M={ premium:{pad:0.014,kick:0.42,hat:0.05,bass:0.09,pluck:0.035,padType:'triangle',cut:1100},
            energetic:{pad:0.010,kick:0.6,hat:0.09,bass:0.13,pluck:0.03,clap:0.12,padType:'sawtooth',cut:1600},
            calm:{pad:0.016,kick:0,hat:0,bass:0.05,pluck:0.04,padType:'sine',cut:900},
            epic:{pad:0.02,kick:0.5,hat:0,bass:0.12,pluck:0,padType:'sawtooth',cut:650,boom:1},
            minimal:{pad:0,kick:0.18,hat:0.04,bass:0,pluck:0.02,padType:'sine',cut:900} }[mood] || {};
  const NOBED = MUSIC_BUF || NOS || (STYLE.sound && STYLE.sound.bed===false);   // bed:false = só efeitos (música entra no app)
  if (NOBED) Object.assign(M, {pad:0,kick:0,hat:0,bass:0,pluck:0,clap:0});
  const master=ac.createGain(); master.gain.setValueAtTime(0.0001,0); master.gain.linearRampToValueAtTime(0.85,0.3);
  master.gain.setValueAtTime(0.85,DUR-1.0); master.gain.linearRampToValueAtTime(0.0001,DUR);
  const comp=ac.createDynamicsCompressor(); comp.threshold.value=-16; comp.ratio.value=3;
  const duck=ac.createGain(); master.connect(duck); duck.connect(comp); comp.connect(dest);
  if (NOS) master.gain.value=0;
  if (MUSIC_BUF){   // trilha externa: entra suave, repete se for curta, sai junto com o vídeo; passa pelo ducking
    const ms=ac.createBufferSource(); ms.buffer=MUSIC_BUF; if (MUSIC_BUF.duration < DUR) ms.loop=true;
    const mg=ac.createGain(), G=(STYLE.sound&&STYLE.sound.music!=null)?STYLE.sound.music:0.9;
    mg.gain.setValueAtTime(0.0001,0); mg.gain.linearRampToValueAtTime(G,0.25); mg.gain.setValueAtTime(G,Math.max(0.3,DUR-1.4)); mg.gain.linearRampToValueAtTime(0.0001,DUR);
    ms.connect(mg); mg.connect(duck); ms.start(0);
  }
  if (VOICE_BUF){   // voz por cima; a trilha abaixa (ducking) enquanto alguém fala
    const vs=ac.createBufferSource(); vs.buffer=VOICE_BUF; const vg=ac.createGain(); vg.gain.value=(STYLE.sound&&STYLE.sound.voice)||1.0;
    vs.connect(vg); vg.connect(dest); vs.start(VOICE.lead||0);
    const D=(STYLE.sound&&STYLE.sound.duck!=null)?STYLE.sound.duck:0.32, spans=[];
    VW.forEach(w=>{ const l=spans[spans.length-1]; if(l && w.t0-l[1]<0.6) l[1]=w.t1; else spans.push([w.t0,w.t1]); });
    duck.gain.setValueAtTime(1,0);
    spans.forEach(([a,b])=>{ duck.gain.setTargetAtTime(D, Math.max(0,a-0.15), 0.06); duck.gain.setTargetAtTime(1, b+0.15, 0.25); });
  }
  const ir=ac.createBuffer(2,sr*2.8,sr); for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<d.length;i++)d[i]=(r()*2-1)*Math.pow(1-i/d.length,2.6);}
  const rev=ac.createConvolver(); rev.buffer=ir; const rg=ac.createGain(); rg.gain.value=0.4; rev.connect(rg); rg.connect(master);
  const nb=ac.createBuffer(1,sr*2,sr); {const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=r()*2-1;}
  const noise=(t,d)=>{const s=ac.createBufferSource();s.buffer=nb;s.start(t,r()*0.5,d+0.05);return s;};
  const env=(g,t,a,pk,dc)=>{g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(pk,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+dc);};
  const BAR=BEAT*4, prog=[[48,52,55,59],[45,48,52,55],[41,45,48,52],[43,47,50,52]], bass=[36,33,29,31];
  for(let b=0;b*BAR<DUR;b++){ const t=b*BAR, ch=prog[b%4];
    if (M.pad) ch.forEach(m=>[-6,6].forEach(dt=>{const o=ac.createOscillator();o.type=M.padType;o.frequency.value=hz(m+12);o.detune.value=dt;
      const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=M.cut;const g=ac.createGain();
      g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(M.pad,t+0.6);g.gain.setValueAtTime(M.pad,t+BAR-0.3);g.gain.linearRampToValueAtTime(0.0001,t+BAR+0.2);
      o.connect(f);f.connect(g);g.connect(master);g.connect(rev);o.start(t);o.stop(t+BAR+0.3);}));
    if (M.bass) for(let k=0;k<8;k++){ const tt=t+k*BEAT/2; if(tt>DUR-0.8) break; const o=ac.createOscillator(); o.type='sine';
      o.frequency.value=hz(bass[b%4]+(k%4===3?12:0)); const g=ac.createGain(); env(g,tt,0.01,M.bass,BEAT*0.45); o.connect(g); g.connect(master); o.start(tt); o.stop(tt+BEAT); }
  }
  for(let t=BEAT*2;t<DUR-0.9;t+=BEAT){
    if (M.kick){ const o=ac.createOscillator(); o.frequency.setValueAtTime(110,t); o.frequency.exponentialRampToValueAtTime(42,t+0.16);
      const g=ac.createGain(); env(g,t,0.003,M.kick,0.24); o.connect(g); g.connect(master); o.start(t); o.stop(t+0.3); }
    if (M.hat){ const s=noise(t+BEAT/2,0.05), f=ac.createBiquadFilter(); f.type='highpass'; f.frequency.value=9000; const g2=ac.createGain();
      env(g2,t+BEAT/2,0.001,M.hat,0.04); s.connect(f); f.connect(g2); g2.connect(master); }
    if (M.clap && Math.round(t/BEAT)%2===1){ const s=noise(t,0.2), f=ac.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1500; const g=ac.createGain();
      env(g,t,0.002,M.clap,0.15); s.connect(f); f.connect(g); g.connect(master); g.connect(rev); }
  }
  if (M.pluck) for(let t=BEAT;t<DUR-1;t+=BEAT/2){ const b=Math.floor(t/BAR)%4, st=Math.round(t/(BEAT/2))%8, ch=prog[b];
    const m=ch[[0,2,1,3,2,1,3,2][st]]+24, o=ac.createOscillator(); o.type='sine'; o.frequency.value=hz(m);
    const g=ac.createGain(); env(g,t,0.004,M.pluck,0.35); o.connect(g); g.connect(master); g.connect(rev); o.start(t); o.stop(t+0.45); }
  WH.forEach(tc=>{const t=Math.max(0,tc-0.3), s=noise(t,0.6), f=ac.createBiquadFilter(); f.type='bandpass'; f.Q.value=0.9;
    f.frequency.setValueAtTime(400,t); f.frequency.exponentialRampToValueAtTime(3800,t+0.3); f.frequency.exponentialRampToValueAtTime(700,t+0.6);
    const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(mood==='calm'?0.08:0.16,t+0.3); g.gain.exponentialRampToValueAtTime(0.0001,t+0.6);
    s.connect(f); f.connect(g); g.connect(master); g.connect(rev);});
  IMPACT.forEach(t=>{const o=ac.createOscillator(); o.frequency.setValueAtTime(90,t); o.frequency.exponentialRampToValueAtTime(32,t+0.9);
    const g=ac.createGain(); env(g,t,0.005,M.boom?0.9:0.65,M.boom?1.6:1.1); o.connect(g); g.connect(master); o.start(t); o.stop(t+1.8);});
  RISERS.forEach(tc=>{ const t=Math.max(0,tc-1.3), s=noise(t,1.3), f=ac.createBiquadFilter(); f.type='bandpass'; f.Q.value=1.4;
    f.frequency.setValueAtTime(300,t); f.frequency.exponentialRampToValueAtTime(6000,tc); const g=ac.createGain();
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.22,tc-0.02); g.gain.linearRampToValueAtTime(0.0001,tc+0.04);
    s.connect(f); f.connect(g); g.connect(master); g.connect(rev); });
  if (STYLE.sound && STYLE.sound.wordTicks) VW.forEach(w=>{ const o=ac.createOscillator(); o.type='triangle'; o.frequency.value=1900;
    const g=ac.createGain(); env(g,w.t0,0.001,0.012,0.04); o.connect(g); g.connect(master); o.start(w.t0); o.stop(w.t0+0.06); });
  TICKS.forEach(t=>{const o=ac.createOscillator(); o.type='square'; o.frequency.value=2400; const f=ac.createBiquadFilter(); f.type='highpass'; f.frequency.value=1800;
    const g=ac.createGain(); env(g,t,0.001,0.018,0.03); o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t+0.05);});
  const tl=SCN[SCN.length-1].start+0.2; if (!NOBED) [48,55,59,64,67].forEach(m=>{const o=ac.createOscillator(); o.type='triangle'; o.frequency.value=hz(m+12);
    const g=ac.createGain(); g.gain.setValueAtTime(0.0001,tl); g.gain.linearRampToValueAtTime(0.03,tl+0.1); g.gain.exponentialRampToValueAtTime(0.0001,DUR);
    o.connect(g); g.connect(master); g.connect(rev); o.start(tl); o.stop(DUR);});
}
