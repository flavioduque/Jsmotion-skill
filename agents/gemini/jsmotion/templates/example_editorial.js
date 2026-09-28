// ===== jsmotion · template EDITORIAL — fotos reais, serifa + sans, dourado (qualquer formato) =====
// Para marcas "premium": imóveis, cursos, marcas pessoais, luxo, gastronomia, turismo, eventos.
// O vídeo é uma LISTA DE CENAS (SCRIPT). Normalmente você só edita C (paleta), FRAME e SCRIPT.
// Tipos de cena: hook · statement · photo · cards · list · price · person · cta  (ver references/editorial.md)
// window.FORMAT = '9x16' (padrão) | '4x5' | '1x1' | '16x9'
const FMT = {'9x16':[1080,1920], '4x5':[1080,1350], '1x1':[1080,1080], '16x9':[1920,1080]};
const FORMAT = (typeof window!=='undefined' && FMT[window.FORMAT]) ? window.FORMAT : '9x16';
const [W, H] = FMT[FORMAT];
const CX = W/2, CY = H/2, SIDE = W>H, SHORT = H < 1500;   // SHORT: 4:5, 1:1 e 16:9 (menos altura útil)
const FPS = 30, BPM = 100, BEAT = 60/BPM, LOCALE = 'es-PY';   // LOCALE: separador de milhar dos números

// ---------- MARCA ----------
const C = { bg:'#0E0F12', bg2:'#1A1C21', ink:'#F5F1EA', soft:'#C9C2B6', accent:'#C9A55C', accent2:'#EBD49A',
  cream:'#F4EFE6', inkDark:'#1B1B1B', card:'rgba(18,18,20,0.58)', line:'rgba(255,255,255,0.14)' };
const FONT = { serif:'JSSerif', sans:'JSSans' };   // carregadas de ASSETS.fonts (Playfair Display + Inter por padrão)
// moldura fixa (chaves de ASSETS.logos; deixe '' para não usar): logo à esquerda, logo à direita, assinatura embaixo
const FRAME = { left:'logoL', right:'logoR', bottom:'sign' };

// ---------- ROTEIRO (cada cena: type, dur em segundos, e os campos do tipo) ----------
const SCRIPT = [
  {type:'hook', dur:3.2, photo:'p5', eyebrow:'Inversión inmobiliaria · CDE', from:8, value:12, suffix:'%',
   label:'de renta anual', sub:'+12% de plusvalía proyectada', trans:'flash'},
  {type:'statement', dur:2.4, photo:'p2', lines:['Tu próxima', 'inversión', 'tiene nombre.'], hl:1},
  {type:'photo', dur:2.2, photo:'p3', eyebrow:'Unidades equipadas', title:'Diseño contemporáneo', sub:'Funcionalidad como principio'},
  {type:'photo', dur:2.2, photo:'p4', eyebrow:'Unidades equipadas', title:'Cocina equipada', sub:'Anafe, horno y extractor', kb:'left'},
  {type:'photo', dur:2.2, photo:'p6', eyebrow:'Amenities · nivel 13', title:'Piscina infinita', sub:'Con vista panorámica', kb:'right'},
  {type:'cards', dur:3.4, photo:'p7', eyebrow:'El proyecto', title:['Pensado para', 'generar valor'],
   cards:[{value:64, label:'departamentos'}, {text:'1 y 2', label:'dormitorios'},
          {text:'41–82', label:'m² por unidad'}, {value:13, suffix:'°', label:'nivel de amenities'}]},
  {type:'list', dur:3.6, eyebrow:'Qué incluye', title:['Todo listo', 'para vivir'], bg:'dark',
   items:[{t:'Unidades equipadas', s:'Cocina, placares y AA'}, {t:'Amenities en el nivel 13', s:'Piscina, gimnasio y quinchos'},
          {t:'Entrega en mayo 2029', s:'Inicio de obra: noviembre 2026'}, {t:'Financiación propia', s:'Hasta 30 meses'}]},
  {type:'price', dur:3.4, photo:'p8', eyebrow:'Precio de pre pozo', label:'Departamentos desde', prefix:'USD ',
   from:52000, value:69539, rows:[['Reserva','USD 1.000'], ['Cuotas desde','USD 785'], ['Financiación','hasta 30 meses']]},
  {type:'person', dur:2.6, photo:'person', eyebrow:'Agendá tu visita', title:['Hablá con', 'Yannina'], hl:1},
  {type:'cta', dur:3.6, eyebrow:'Asesora inmobiliaria', logo:'sign', title:['Tu próxima inversión', 'empieza hoy.'], hl:1,
   button:'+595 993 286 866', icon:'phone', small:'WhatsApp · Llamadas', frame:false},
];

// ---------- utilidades ----------
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)), lerp=(a,b,t)=>a+(b-a)*t, inv=(a,b,x)=>clamp((x-a)/(b-a));
const eOut=t=>1-Math.pow(1-t,3), eIn=t=>t*t*t, eIO=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const eBack=t=>{const c1=1.4,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);};
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function hexA(h,a){const n=parseInt(h.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;}
const fmtNum=(v,d=0)=>new Intl.NumberFormat(LOCALE,{minimumFractionDigits:d,maximumFractionDigits:d}).format(v);

// ---------- linha do tempo (cenas encadeadas com transição de TR segundos) ----------
const TR = 0.5;
let _t = 0;
const SCN = SCRIPT.map((s,i)=>{ const o={...s, i, start:_t}; _t += s.dur; return o; });
const DUR = Math.round((_t + 0.4)*10)/10;
// som: whoosh nas trocas, impacto no gancho e no final, tique nos contadores (lidos pelo buildAudio)
const WH = SCN.slice(1).map(s=>s.start);
const IMPACT = [0.15, SCN[SCN.length-1].start+0.2];
const TICKS = [];
SCN.forEach(s=>{ if(s.type==='hook'||s.type==='price') for(let k=0;k<14;k++) TICKS.push(s.start+0.35+k*0.075);
  if(s.type==='cards') (s.cards||[]).forEach((c,j)=>c.value!=null && TICKS.push(s.start+0.7+j*0.18)); });

// ---------- carregamento ----------
const IMG = {ph:{}, logo:{}};
function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;});}
async function loadAssets(){
  const A = window.ASSETS || {};
  const F = A.fonts || {};
  const faces = [];
  if (F.serif) faces.push(new FontFace(FONT.serif, `url(${F.serif})`, {weight:'100 900'}));
  if (F.serif_italic) faces.push(new FontFace(FONT.serif, `url(${F.serif_italic})`, {weight:'100 900', style:'italic'}));
  if (F.sans) faces.push(new FontFace(FONT.sans, `url(${F.sans})`, {weight:'100 900'}));
  for (const f of faces){ await f.load(); document.fonts.add(f); }
  for (const k in (A.photos||{})) IMG.ph[k] = await loadImg(A.photos[k]);
  for (const k in (A.logos||{})) IMG.logo[k] = await loadImg(A.logos[k]);
  const n=document.createElement('canvas'); n.width=320; n.height=320; const nc=n.getContext('2d');
  const id=nc.createImageData(320,320); const r=rng(7);
  for(let i=0;i<id.data.length;i+=4){const v=r()*255;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255;}
  nc.putImageData(id,0,0); IMG.noise=n;
}
const serif = (size,w=500,it=false)=>`${it?'italic ':''}${w} ${size}px ${FONT.serif}, Georgia, serif`;
const sans  = (size,w=500)=>`${w} ${size}px ${FONT.sans}, Helvetica, Arial, sans-serif`;

// ---------- layout: blocos de texto no espaço de desenho 1080 de largura ----------
// k = escala do texto por formato; no 16:9 o texto fica numa coluna à esquerda (a foto aparece à direita)
const K = SIDE ? 0.78 : Math.min(1, 0.55 + 0.45*(H/1920));
const TX = SIDE ? W*0.3 : CX;                  // centro horizontal da coluna de texto
function T(ctx, yf, fn){ ctx.save(); ctx.translate(TX, H*yf); ctx.scale(K,K); ctx.translate(-540,0); fn(); ctx.restore(); }
const MAXW = 920;                               // largura útil do texto (no desenho)

// ---------- primitivas de texto ----------
// linha com revelação por máscara (sobe de trás de uma linha invisível) — o jeito "editorial" de texto entrar
function line(ctx, txt, y, lt, t0, o={}){
  const p = inv(t0, t0+(o.dur||0.7), lt); if(p<=0) return 0;
  const e = eOut(p), f0 = o.font || serif(o.size||96, o.weight||500, o.italic);
  const size0 = o.size || +(f0.match(/(\d+)px/)||[0,96])[1];   // tamanho real (a máscara depende dele)
  ctx.save();
  ctx.font = f0;
  if (o.track) ctx.letterSpacing = `${o.track}px`;
  let w = ctx.measureText(txt).width, size = size0;
  const maxw = o.maxw||MAXW;
  if (w > maxw){ size = Math.floor(size0*maxw/w); ctx.font = f0.replace(`${size0}px`,`${size}px`); w = ctx.measureText(txt).width; }
  const al = o.align||'center', x = o.x!=null ? o.x : 540;
  const x0 = al==='left' ? x : al==='right' ? x-w : x-w/2;
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  ctx.beginPath(); ctx.rect(x0-40, y-size*1.15, w+80, size*1.45); ctx.clip();   // máscara
  ctx.globalAlpha *= clamp(p*1.6);
  const dy = (1-e)*size*1.05;
  if (o.gold){ const g=ctx.createLinearGradient(x0,y-size,x0+w,y); g.addColorStop(0,C.accent2); g.addColorStop(1,C.accent); ctx.fillStyle=g; }
  else ctx.fillStyle = o.color||C.ink;
  if (o.shadow!==false){ ctx.shadowColor='rgba(0,0,0,0.45)'; ctx.shadowBlur=18; ctx.shadowOffsetY=4; }
  ctx.fillText(txt, x0, y+dy);
  if (o.strike!=null){ const sp=eIO(inv(t0+o.strike, t0+o.strike+0.35, lt)); if(sp>0){ ctx.shadowBlur=0;
    ctx.strokeStyle=o.strikeColor||C.accent; ctx.lineWidth=Math.max(3,size*0.06); ctx.beginPath();
    ctx.moveTo(x0-6, y+dy-size*0.32); ctx.lineTo(x0-6+(w+12)*sp, y+dy-size*0.32); ctx.stroke(); } }
  ctx.restore(); return w;
}
// rótulo pequeno em caixa alta e espaçado ("eyebrow") com fio dourado
function eyebrow(ctx, txt, y, lt, t0, o={}){
  const p=inv(t0,t0+0.6,lt); if(p<=0||!txt) return; const e=eOut(p);
  ctx.save(); ctx.globalAlpha*=e; ctx.font=sans(o.size||30,600); ctx.letterSpacing='7px';
  ctx.fillStyle=o.color||C.accent; ctx.textAlign=o.align||'center'; ctx.textBaseline='alphabetic';
  const s=txt.toUpperCase(), w=ctx.measureText(s).width, x=o.x!=null?o.x:540;
  ctx.fillText(s, x+(o.align==='left'?0:3.5), y+(1-e)*14);
  if (o.rule!==false){ const rw=70*e; ctx.fillStyle=hexA(C.accent,0.9);
    if ((o.align||'center')==='center') ctx.fillRect(540-rw/2, y+24, rw, 2); else ctx.fillRect(x, y+24, rw, 2); }
  ctx.restore();
}
function wrap(ctx, txt, maxw){ const out=[]; let cur='';
  for(const w of txt.split(' ')){ const tst=cur?cur+' '+w:w; if(ctx.measureText(tst).width>maxw && cur){out.push(cur);cur=w;} else cur=tst; }
  if(cur) out.push(cur); return out; }
function para(ctx, txt, y, lt, t0, o={}){ // parágrafo curto com quebra automática
  if(!txt) return y; const p=inv(t0,t0+0.6,lt); if(p<=0) return y;
  ctx.save(); ctx.font=sans(o.size||40,o.weight||400); const ls=wrap(ctx,txt,o.maxw||MAXW-60);
  ctx.globalAlpha*=eOut(p); ctx.fillStyle=o.color||C.soft; ctx.textAlign=o.align||'center';
  ls.forEach((l,i)=>ctx.fillText(l, o.x!=null?o.x:540, y+(1-eOut(p))*12+i*(o.lh||(o.size||40)*1.3)));
  ctx.restore(); return y+ls.length*(o.lh||(o.size||40)*1.3);
}
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}

// ---------- fundos ----------
// foto em tela cheia com movimento lento (Ken Burns) + gradientes para leitura
function photoBg(ctx, key, lt, dur, o={}){
  const img = IMG.ph[key];
  if (!img){ solidBg(ctx, o.bg||'dark'); return; }
  const p = clamp(lt/(dur+TR)), kb=o.kb||'in';
  let s = kb==='out' ? lerp(1.16,1.06,p) : lerp(1.06,1.16,p);
  const sc = Math.max(W/img.width, H/img.height)*s, iw=img.width*sc, ih=img.height*sc;
  const px = kb==='left' ? lerp(0.35,0.65,p) : kb==='right' ? lerp(0.65,0.35,p) : 0.5;
  ctx.save(); if(o.blur) ctx.filter=`blur(${o.blur}px)`;
  ctx.drawImage(img, (W-iw)*px, (H-ih)*0.5, iw, ih); ctx.restore();
  const d=o.dim!=null?o.dim:0.2; if(d>0){ ctx.fillStyle=`rgba(8,8,10,${d})`; ctx.fillRect(0,0,W,H); }
  // só o necessário para ler: topo (logos) e base (legenda/assinatura); o meio da foto fica limpo e claro
  let g=ctx.createLinearGradient(0,0,0,H*0.2); g.addColorStop(0,'rgba(0,0,0,0.45)'); g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H*0.2);
  g=ctx.createLinearGradient(0,H*0.5,0,H); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,0.85)');
  ctx.fillStyle=g; ctx.fillRect(0,H*0.5,W,H*0.5);
  if (SIDE){ g=ctx.createLinearGradient(0,0,W*0.62,0); g.addColorStop(0,'rgba(0,0,0,0.78)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,W*0.62,H); }
}
function solidBg(ctx, kind){
  const cream = kind==='cream';
  const g=ctx.createLinearGradient(0,0,W*0.3,H); g.addColorStop(0, cream?C.cream:C.bg2); g.addColorStop(1, cream?'#E7DFD2':C.bg);
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  const r=ctx.createRadialGradient(W*0.5,H*0.32,0,W*0.5,H*0.32,Math.max(W,H)*0.6);
  r.addColorStop(0, cream?'rgba(255,255,255,0.55)':hexA(C.accent,0.10)); r.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=r; ctx.fillRect(0,0,W,H);
}

// ---------- cenas ----------
const SC = {};
SC.hook = (ctx,s,lt)=>{
  photoBg(ctx, s.photo, lt, s.dur, {dim:0.42, kb:s.kb});
  T(ctx, 0.40, ()=>{
    eyebrow(ctx, s.eyebrow, -250, lt, 0.1);
    const cp = eOut(inv(0.3, 1.35, lt)), v = lerp(s.from!=null?s.from:0, s.value, cp);
    const txt = (s.prefix||'') + fmtNum(Math.round(v)) + (s.suffix||'');
    const pop = 1 + 0.06*Math.exp(-Math.max(0,lt-1.35)*6)*(lt>1.35);
    ctx.save(); ctx.translate(540, 0); ctx.scale(pop,pop); ctx.translate(-540,0);
    line(ctx, txt, 40, lt, 0.2, {font:sans(270,800), gold:true, dur:0.55});
    ctx.restore();
    line(ctx, (s.label||'').toUpperCase(), 140, lt, 0.9, {font:sans(52,700), track:5, size:52});
    para(ctx, s.sub, 225, lt, 1.5, {size:40});
  });
};
SC.statement = (ctx,s,lt)=>{
  if (s.photo) photoBg(ctx, s.photo, lt, s.dur, {dim:0.55, kb:s.kb, blur:s.blur}); else solidBg(ctx, s.bg||'dark');
  const cream = !s.photo && s.bg==='cream', ink = cream?C.inkDark:C.ink;
  const L = s.lines||[], lh = 132, y0 = -((L.length-1)*lh)/2;
  T(ctx, 0.45, ()=>{
    eyebrow(ctx, s.eyebrow, y0-150, lt, 0.05);
    L.forEach((t,i)=>line(ctx, t, y0+i*lh+40, lt, 0.15+i*0.2,
      {font:serif(118, i===s.hl?500:600, i===s.hl), gold:i===s.hl, color:ink, size:118, shadow:!cream,
       strike:s.strike===i?0.7:null}));
    para(ctx, s.sub, y0+(L.length-1)*lh+150, lt, 0.4+L.length*0.2, {size:42, color:cream?'#5B564E':C.soft});
  });
};
SC.photo = (ctx,s,lt)=>{
  photoBg(ctx, s.photo, lt, s.dur, {dim:0, kb:s.kb});
  const al = SIDE?'center':'left', x = SIDE?540:90;
  T(ctx, SIDE?0.5:0.70, ()=>{
    eyebrow(ctx, s.eyebrow, -90, lt, 0.2, {align:al, x, rule:false, size:28});
    line(ctx, s.title, 0, lt, 0.3, {font:sans(78,700), size:78, align:al, x, maxw:900});
    para(ctx, s.sub, 62, lt, 0.55, {size:38, align:al, x});
  });
};
SC.cards = (ctx,s,lt)=>{
  photoBg(ctx, s.photo, lt, s.dur, {dim:0.55, kb:s.kb, blur:4});
  const L = [].concat(s.title||[]);
  T(ctx, 0.30, ()=>{
    eyebrow(ctx, s.eyebrow, -120, lt, 0.05);
    L.forEach((t,i)=>line(ctx, t, i*96, lt, 0.15+i*0.15, {font:serif(88,600), size:88}));
    const cw=430, ch=230, gap=28, x0=540-cw-gap/2, y0=L.length*96+40;
    (s.cards||[]).slice(0,4).forEach((c,j)=>{
      const t0=0.55+j*0.18, p=inv(t0,t0+0.55,lt); if(p<=0) return; const e=eBack(p);
      const x=x0+(j%2)*(cw+gap), y=y0+Math.floor(j/2)*(ch+gap);
      ctx.save(); ctx.globalAlpha*=clamp(p*1.5); ctx.translate(x+cw/2,y+ch/2); ctx.scale(lerp(0.92,1,e),lerp(0.92,1,e)); ctx.translate(-cw/2,-ch/2);
      rr(ctx,0,0,cw,ch,26); ctx.fillStyle=C.card; ctx.fill(); ctx.strokeStyle=C.line; ctx.lineWidth=1.5; ctx.stroke();
      const cp=eOut(inv(t0+0.1,t0+1.0,lt));
      const val = c.value!=null ? (c.prefix||'')+fmtNum(Math.round(lerp(0,c.value,cp)))+(c.suffix||'') : c.text;
      ctx.fillStyle=C.ink; ctx.font=sans(104,800); ctx.textAlign='left'; ctx.fillText(val, 34, 122);
      ctx.fillStyle=C.soft; ctx.font=sans(32,500); ctx.fillText(c.label||'', 36, 180);
      ctx.restore();
    });
  });
};
SC.list = (ctx,s,lt)=>{
  if (s.photo) photoBg(ctx, s.photo, lt, s.dur, {dim:0.7, kb:s.kb, blur:6}); else solidBg(ctx, s.bg||'dark');
  const L=[].concat(s.title||[]);
  T(ctx, 0.25, ()=>{
    eyebrow(ctx, s.eyebrow, -120, lt, 0.05, {align:'left', x:90});
    L.forEach((t,i)=>line(ctx, t, i*100, lt, 0.15+i*0.15, {font:serif(92,600,i===1), gold:i===1, size:92, align:'left', x:90}));
    const y0=L.length*100+70;
    (s.items||[]).slice(0,5).forEach((it,j)=>{
      const t0=0.6+j*0.28, p=inv(t0,t0+0.5,lt); if(p<=0) return; const e=eOut(p), y=y0+j*(SHORT?122:150);
      ctx.save(); ctx.globalAlpha*=e; ctx.translate((1-e)*40,0);
      ctx.fillStyle=C.accent; ctx.font=sans(40,700); ctx.textAlign='left'; ctx.fillText(String(j+1).padStart(2,'0'), 90, y);
      ctx.fillStyle=C.ink; ctx.font=sans(50,650); ctx.fillText(it.t, 180, y);
      if(it.s){ ctx.fillStyle=C.soft; ctx.font=sans(34,450); ctx.fillText(it.s, 180, y+50); }
      ctx.fillStyle=hexA(C.accent,0.35); ctx.fillRect(90, y+84, 900*e, 1.5);
      ctx.restore();
    });
  });
};
SC.price = (ctx,s,lt)=>{
  photoBg(ctx, s.photo, lt, s.dur, {dim:0.62, kb:s.kb, blur:5});
  T(ctx, 0.34, ()=>{
    eyebrow(ctx, s.eyebrow, -170, lt, 0.05);
    para(ctx, s.label, -85, lt, 0.2, {size:44, color:C.ink});
    const cp=eOut(inv(0.4,1.5,lt)), v=lerp(s.from!=null?s.from:0, s.value, cp);
    line(ctx, (s.prefix||'')+fmtNum(Math.round(v))+(s.suffix||''), 70, lt, 0.3, {font:sans(150,800), gold:true, size:150});
    (s.rows||[]).slice(0,4).forEach((r,j)=>{
      const t0=1.2+j*0.2, p=inv(t0,t0+0.45,lt); if(p<=0) return; const y=190+j*92;
      ctx.save(); ctx.globalAlpha*=eOut(p);
      ctx.fillStyle=C.line; ctx.fillRect(110, y-58, 860, 1.5);
      ctx.font=sans(40,450); ctx.fillStyle=C.soft; ctx.textAlign='left'; ctx.fillText(r[0], 110, y);
      ctx.font=sans(42,750); ctx.fillStyle=C.ink; ctx.textAlign='right'; ctx.fillText(r[1], 970, y);
      ctx.restore();
    });
  });
};
SC.person = (ctx,s,lt)=>{
  solidBg(ctx, s.bg||'dark');
  const img=IMG.ph[s.photo], L=[].concat(s.title||[]);
  T(ctx, 0.2, ()=>{
    eyebrow(ctx, s.eyebrow, -40, lt, 0.05);
    L.forEach((t,i)=>line(ctx, t, 70+i*100, lt, 0.15+i*0.15, {font:serif(96, i===s.hl?500:600, i===s.hl), gold:i===s.hl, size:96}));
    const R=SHORT?225:330, cy=L.length*100+(SHORT?300:430), p=eOut(inv(0.2,1.0,lt));
    ctx.save(); ctx.globalAlpha*=p;
    const gl=ctx.createRadialGradient(540,cy,R*0.6,540,cy,R*1.5); gl.addColorStop(0,hexA(C.accent,0.25)); gl.addColorStop(1,hexA(C.accent,0));
    ctx.fillStyle=gl; ctx.fillRect(540-R*1.6,cy-R*1.6,R*3.2,R*3.2);
    if(img){ ctx.save(); ctx.beginPath(); ctx.arc(540,cy,R*lerp(0.9,1,p),0,Math.PI*2); ctx.clip();
      const sc=Math.max(2*R/img.width,2*R/img.height)*lerp(1.12,1.02,clamp(lt/s.dur)); ctx.drawImage(img,540-img.width*sc/2,cy-img.height*sc/2,img.width*sc,img.height*sc); ctx.restore(); }
    ctx.strokeStyle=C.accent; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(540,cy,R+14,-Math.PI/2,-Math.PI/2+Math.PI*2*eIO(inv(0.3,1.4,lt))); ctx.stroke();
    ctx.restore();
  });
};
SC.cta = (ctx,s,lt)=>{
  if (s.photo) photoBg(ctx, s.photo, lt, s.dur, {dim:0.7, kb:s.kb, blur:6}); else solidBg(ctx, s.bg||'dark');
  const L=[].concat(s.title||[]);
  T(ctx, 0.42, ()=>{
    const lg=IMG.logo[s.logo];
    if(lg){ const p=eOut(inv(0.1,0.9,lt)), w=Math.min(700, lg.width), h=w*lg.height/lg.width;
      ctx.save(); ctx.globalAlpha*=p; ctx.drawImage(lg, 540-w/2, -h-60+(1-p)*20, w, h); ctx.restore(); }
    eyebrow(ctx, s.eyebrow, 10, lt, 0.4);
    L.forEach((t,i)=>line(ctx, t, 130+i*92, lt, 0.55+i*0.15, {font:serif(80, i===s.hl?500:600, i===s.hl), gold:i===s.hl, size:80}));
    const by=130+L.length*92+120, bp=inv(1.1,1.6,lt);
    if(bp>0 && s.button){ const e=eBack(bp), pulse=1+0.025*Math.sin(lt*Math.PI*2/BEAT);
      ctx.save(); ctx.globalAlpha*=clamp(bp*1.5); ctx.translate(540,by); ctx.scale(e*pulse,e*pulse);
      ctx.font=sans(50,750); const tw=ctx.measureText(s.button).width, bw=tw+(s.icon?190:120), bh=124;
      const g=ctx.createLinearGradient(-bw/2,0,bw/2,0); g.addColorStop(0,C.accent2); g.addColorStop(1,C.accent);
      ctx.shadowColor=hexA(C.accent,0.55); ctx.shadowBlur=40; rr(ctx,-bw/2,-bh/2,bw,bh,bh/2); ctx.fillStyle=g; ctx.fill(); ctx.shadowBlur=0;
      let tx=-tw/2; if(s.icon){ tx+=36; ctx.fillStyle=C.inkDark; ctx.beginPath(); ctx.arc(-tw/2-28,0,30,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle=C.accent2; ctx.lineWidth=5; ctx.lineCap='round'; ctx.beginPath(); ctx.arc(-tw/2-28,0,14,Math.PI*0.65,Math.PI*1.35+Math.PI*0.5); ctx.stroke(); }
      ctx.fillStyle=C.inkDark; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(s.button, tx, 3);
      ctx.restore();
      para(ctx, s.small, by+115, lt, 1.4, {size:30, color:C.soft});
    }
  });
};

// ---------- moldura fixa da marca ----------
function drawFrame(ctx, t, a){
  if (a<=0) return; const m = SIDE ? 60 : 70*Math.min(1,W/1080), hh = (SIDE?52:58)*K;
  ctx.save(); ctx.globalAlpha = a*0.95;
  const L=IMG.logo[FRAME.left], R=IMG.logo[FRAME.right], B=IMG.logo[FRAME.bottom];
  if (L){ const w=hh*L.width/L.height; ctx.drawImage(L, m, m*0.9, w, hh); }
  if (R){ const w=hh*R.width/R.height; ctx.drawImage(R, W-m-w, m*0.9, w, hh); }
  if (B){ const bh=(SIDE?66:78)*K, bw=bh*B.width/B.height; ctx.drawImage(B, CX-bw/2, H-(SIDE?0.1:0.12)*H-bh/2, bw, bh); }
  ctx.restore();
}

// ---------- render ----------
function drawScene(ctx, s, lt){ (SC[s.type]||SC.statement)(ctx, s, lt); }
function render(ctx, t){
  t = clamp(t, 0, DUR);
  ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.filter='none'; ctx.letterSpacing='0px';
  ctx.fillStyle=C.bg; ctx.fillRect(0,0,W,H);
  let cur = SCN[0]; for (const s of SCN) if (t >= s.start) cur = s;
  const prev = SCN[cur.i-1], lt = t-cur.start;
  if (prev && lt < TR){                       // transição: a cena anterior continua por baixo
    ctx.save(); drawScene(ctx, prev, t-prev.start); ctx.restore();
    const p = eIO(lt/TR);
    ctx.save(); ctx.globalAlpha = p;
    if (cur.trans!=='cut'){ ctx.translate(CX,CY); const z=lerp(1.05,1,p); ctx.scale(z,z); ctx.translate(-CX,-CY); }
    drawScene(ctx, cur, lt); ctx.restore();
    if (prev.trans==='flash'){ ctx.fillStyle=`rgba(255,250,240,${0.75*Math.sin(Math.PI*p)})`; ctx.fillRect(0,0,W,H); }
  } else { ctx.save(); drawScene(ctx, cur, lt); ctx.restore(); }
  const fa = cur.frame===false ? 1-inv(0,TR,lt) : (prev && prev.frame===false ? inv(0,TR,lt) : 1);
  drawFrame(ctx, t, fa*inv(0.3,0.9,t));
  if (!window.NOGRAIN){ ctx.save(); ctx.globalAlpha=0.045; ctx.globalCompositeOperation='overlay';
    const o=Math.floor(t*30)%4; ctx.drawImage(IMG.noise,-o*17,-o*11,W+60,H+44); ctx.restore(); }
  const v=ctx.createRadialGradient(CX,CY,Math.min(W,H)*0.45,CX,CY,Math.max(W,H)*0.75);
  v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,0.25)'); ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
  const fin=inv(0,0.3,t)*(1-inv(DUR-0.45,DUR,t)); if(fin<1){ ctx.fillStyle=`rgba(0,0,0,${1-fin})`; ctx.fillRect(0,0,W,H); }
}

// ================= SOM — cama "premium": pad quente, pluck, batida suave, whooshes, tiques =================
function buildAudio(ac, dest){
  const r=rng(11), sr=ac.sampleRate, hz=m=>440*Math.pow(2,(m-69)/12);
  const master=ac.createGain(); master.gain.setValueAtTime(0.0001,0); master.gain.linearRampToValueAtTime(0.85,0.3);
  master.gain.setValueAtTime(0.85,DUR-1.0); master.gain.linearRampToValueAtTime(0.0001,DUR);
  const comp=ac.createDynamicsCompressor(); comp.threshold.value=-16; comp.ratio.value=3; master.connect(comp); comp.connect(dest);
  const ir=ac.createBuffer(2,sr*2.8,sr); for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<d.length;i++)d[i]=(r()*2-1)*Math.pow(1-i/d.length,2.6);}
  const rev=ac.createConvolver(); rev.buffer=ir; const rg=ac.createGain(); rg.gain.value=0.4; rev.connect(rg); rg.connect(master);
  const nb=ac.createBuffer(1,sr*2,sr); {const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=r()*2-1;}
  const noise=(t,d)=>{const s=ac.createBufferSource();s.buffer=nb;s.start(t,r()*0.5,d+0.05);return s;};
  const env=(g,t,a,pk,dc)=>{g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(pk,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+dc);};
  const BAR=BEAT*4, prog=[[48,52,55,59],[45,48,52,55],[41,45,48,52],[43,47,50,52]], bass=[36,33,29,31]; // Cmaj7 Am7 Fmaj7 G6
  for(let b=0;b*BAR<DUR;b++){ const t=b*BAR, ch=prog[b%4];
    ch.forEach(m=>[-6,6].forEach(dt=>{const o=ac.createOscillator();o.type='triangle';o.frequency.value=hz(m+12);o.detune.value=dt;
      const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=1100;const g=ac.createGain();
      g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.014,t+0.6);g.gain.setValueAtTime(0.014,t+BAR-0.3);g.gain.linearRampToValueAtTime(0.0001,t+BAR+0.2);
      o.connect(f);f.connect(g);g.connect(master);g.connect(rev);o.start(t);o.stop(t+BAR+0.3);}));
    for(let k=0;k<8;k++){ const tt=t+k*BEAT/2; if(tt>DUR-0.8) break; const o=ac.createOscillator(); o.type='sine';
      o.frequency.value=hz(bass[b%4]+(k%4===3?12:0)); const g=ac.createGain(); env(g,tt,0.01,0.09,BEAT*0.45); o.connect(g); g.connect(master); o.start(tt); o.stop(tt+BEAT); }
  }
  for(let t=BEAT*2;t<DUR-0.9;t+=BEAT){ // batida suave
    const o=ac.createOscillator(); o.frequency.setValueAtTime(110,t); o.frequency.exponentialRampToValueAtTime(42,t+0.16);
    const g=ac.createGain(); env(g,t,0.003,0.42,0.24); o.connect(g); g.connect(master); o.start(t); o.stop(t+0.3);
    const s=noise(t+BEAT/2,0.05), f=ac.createBiquadFilter(); f.type='highpass'; f.frequency.value=9000; const g2=ac.createGain();
    env(g2,t+BEAT/2,0.001,0.05,0.04); s.connect(f); f.connect(g2); g2.connect(master);
  }
  for(let t=BEAT;t<DUR-1;t+=BEAT/2){ const b=Math.floor(t/BAR)%4, st=Math.round(t/(BEAT/2))%8, ch=prog[b];
    const m=ch[[0,2,1,3,2,1,3,2][st]]+24, o=ac.createOscillator(); o.type='sine'; o.frequency.value=hz(m);
    const g=ac.createGain(); env(g,t,0.004,0.035,0.35); o.connect(g); g.connect(master); g.connect(rev); o.start(t); o.stop(t+0.45); }
  WH.forEach(tc=>{const t=Math.max(0,tc-0.3), s=noise(t,0.6), f=ac.createBiquadFilter(); f.type='bandpass'; f.Q.value=0.9;
    f.frequency.setValueAtTime(400,t); f.frequency.exponentialRampToValueAtTime(3800,t+0.3); f.frequency.exponentialRampToValueAtTime(700,t+0.6);
    const g=ac.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.16,t+0.3); g.gain.exponentialRampToValueAtTime(0.0001,t+0.6);
    s.connect(f); f.connect(g); g.connect(master); g.connect(rev);});
  IMPACT.forEach(t=>{const o=ac.createOscillator(); o.frequency.setValueAtTime(90,t); o.frequency.exponentialRampToValueAtTime(32,t+0.9);
    const g=ac.createGain(); env(g,t,0.005,0.65,1.1); o.connect(g); g.connect(master); o.start(t); o.stop(t+1.3);});
  TICKS.forEach(t=>{const o=ac.createOscillator(); o.type='square'; o.frequency.value=2400; const f=ac.createBiquadFilter(); f.type='highpass'; f.frequency.value=1800;
    const g=ac.createGain(); env(g,t,0.001,0.018,0.03); o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t+0.05);});
  const tl=SCN[SCN.length-1].start+0.2; [48,55,59,64,67].forEach(m=>{const o=ac.createOscillator(); o.type='triangle'; o.frequency.value=hz(m+12);
    const g=ac.createGain(); g.gain.setValueAtTime(0.0001,tl); g.gain.linearRampToValueAtTime(0.03,tl+0.1); g.gain.exponentialRampToValueAtTime(0.0001,DUR);
    o.connect(g); g.connect(master); g.connect(rev); o.start(tl); o.stop(DUR);});
}
