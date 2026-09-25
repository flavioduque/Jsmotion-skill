// ===== Constructiva.dev — vídeo 25s 1080x1920 =====
const W = 1080, H = 1920, DUR = 25, FPS = 30, BEAT = 0.5;
const C = { bg0:'#070510', bg1:'#130c22', bg2:'#1b1130', violet:'#7C3AED', lilac:'#A855F7', lilac2:'#C084FC',
  blue:'#5B8CFF', teal:'#22E0C8', ink:'#F4F1FF', soft:'#B9B0D6' };
const FONT = 'Saira';

// ---------- utilidades ----------
const clamp = (x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp = (a,b,t)=>a+(b-a)*t;
const inv = (a,b,x)=>clamp((x-a)/(b-a));
const eOut = t=>1-Math.pow(1-t,3);
const eIn = t=>t*t*t;
const eIO = t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const eBack = t=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);};
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const beatPulse = t=>{const p=(t%BEAT)/BEAT;return Math.exp(-p*6);}; // 1 no início de cada batida

// ---------- linha do tempo compartilhada (visual + som) ----------
const WORDS = []; // {t} para o "brilho" sonoro
const WH = [2.7,5.7,10.75,19.2,22.2];          // whooshes
const IMPACT = [3.0,22.6];                       // impactos
const SERV = [
  {k:'web', n:['Sitios','web']},
  {k:'sis', n:['Sistemas','a medida']},
  {k:'saas',n:['Plataformas','SaaS']},
  {k:'auto',n:['Automatización']},
  {k:'ia',  n:['Inteligencia','artificial']},
];
const PROJ = [
  {k:'lavapp',     n:'LavApp',        d:'Lavaderos 100% digitales'},
  {k:'notasdeamor',n:'Notas de Amor', d:'Canciones únicas con IA'},
  {k:'residia',    n:'ResidIA',       d:'Condominios inteligentes'},
  {k:'rutapro',    n:'RutaPro',       d:'Transporte bajo control'},
  {k:'sorteia',    n:'Sorteia.net',   d:'Sorteos transparentes'},
  {k:'tirzia',     n:'TirzIA',        d:'Salud acompañada por IA'},
];
const S3 = 6.2, S3D = 0.92;         // serviços
const S4 = 11.7, S4D = 1.3;         // projetos
[0.35,0.75,1.15,1.45,1.85].forEach(t=>WORDS.push(t));
[3.55,3.8,4.1].forEach(t=>WORDS.push(t));
SERV.forEach((s,i)=>WORDS.push(S3+i*S3D+0.12));
[11.2,11.5].forEach(t=>WORDS.push(t));
PROJ.forEach((p,i)=>WORDS.push(S4+i*S4D+0.15));
[19.85,20.35,20.85,21.5].forEach(t=>WORDS.push(t));
[23.05,23.3,23.55,23.8].forEach(t=>WORDS.push(t));

// ---------- carregamento ----------
const IMG = {seq:{},proj:{}};
function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;});}
async function loadAssets(){
  const A = window.ASSETS;
  const ff = new FontFace(FONT,`url(${A.font})`,{weight:'100 900'});
  await ff.load(); document.fonts.add(ff);
  IMG.logo = await loadImg(A.logo);
  for (const k in A.projects) IMG.proj[k] = await loadImg(A.projects[k]);
  for (const k in A.seq) IMG.seq[k] = await Promise.all(A.seq[k].map(loadImg));
  // textura de ruído (fixa)
  const n = document.createElement('canvas'); n.width=360; n.height=640;
  const nc = n.getContext('2d'); const id = nc.createImageData(360,640); const r = rng(7);
  for(let i=0;i<id.data.length;i+=4){const v=r()*255;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255;}
  nc.putImageData(id,0,0); IMG.noise = n;
  // partículas de fundo (fixas)
  const r2 = rng(42); IMG.dust = Array.from({length:70},()=>({x:r2()*W,y:r2()*H,s:1+r2()*3,sp:10+r2()*40,ph:r2()*6.28}));
}
const seqFrame = (k,lt)=>{const a=IMG.seq[k];return a[Math.floor(Math.max(0,lt)*15)%a.length];};

// ---------- desenho: fundo ----------
function glow(ctx,x,y,r,col,a){
  const g=ctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,hexA(col,a)); g.addColorStop(1,hexA(col,0));
  ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2);
}
function hexA(h,a){const n=parseInt(h.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;}

function drawBackground(ctx,t){
  const g=ctx.createLinearGradient(0,0,W*0.4,H);
  g.addColorStop(0,C.bg1); g.addColorStop(0.55,C.bg0); g.addColorStop(1,'#0d0820');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='lighter';
  const bp = beatPulse(t);
  glow(ctx, 540+Math.sin(t*0.4)*320, 520+Math.cos(t*0.3)*180, 760, C.violet, 0.30+bp*0.05);
  glow(ctx, 220+Math.cos(t*0.35)*160, 1450+Math.sin(t*0.5)*200, 700, C.blue, 0.17);
  glow(ctx, 900+Math.sin(t*0.6+1)*140, 1100+Math.cos(t*0.45)*260, 560, C.lilac, 0.16);
  const tealA = 0.07 + 0.08*inv(11,12,t)*(1-inv(19,20,t));
  glow(ctx, 850, 300+Math.sin(t*0.7)*120, 520, C.teal, tealA);
  ctx.globalCompositeOperation='source-over';
  drawGrid(ctx,t);
  // poeira de luz
  for(const d of IMG.dust){
    const y=(d.y - t*d.sp)%H; const yy=y<0?y+H:y;
    const a=0.18+0.18*Math.sin(t*2+d.ph);
    ctx.fillStyle=hexA(C.lilac2,a); ctx.beginPath(); ctx.arc(d.x+Math.sin(t+d.ph)*12,yy,d.s,0,6.28); ctx.fill();
  }
}
function drawGrid(ctx,t){
  // chão em perspectiva (como nos vídeos do site)
  const hy=1250, vx=540; ctx.save();
  const fade=ctx.createLinearGradient(0,hy,0,H); fade.addColorStop(0,'rgba(124,58,237,0)'); fade.addColorStop(1,'rgba(124,58,237,0.22)');
  ctx.strokeStyle=fade; ctx.lineWidth=1.5; ctx.beginPath();
  for(let i=-12;i<=12;i++){ctx.moveTo(vx,hy);ctx.lineTo(vx+i*160,H+40);}
  const off=(t*0.6)%1;
  for(let j=0;j<14;j++){const z=(j+off)/14;const y=hy+(H-hy)*z*z;ctx.moveTo(0,y);ctx.lineTo(W,y);}
  ctx.stroke(); ctx.restore();
}
function drawNoise(ctx,t){
  ctx.save(); ctx.globalAlpha=0.055; ctx.globalCompositeOperation='overlay';
  const o=Math.floor(t*30)%4; ctx.drawImage(IMG.noise,-o*20,-o*13,W+80,H+52); ctx.restore();
  // vinheta
  const v=ctx.createRadialGradient(540,960,500,540,960,1250);
  v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(3,2,10,0.65)'); ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
}

// ---------- texto palavra por palavra ----------
function word(ctx,txt,x,y,t,t0,o={}){
  const size=o.size||110, weight=o.weight||700, dur=o.dur||0.42;
  const p=inv(t0,t0+dur,t); if(p<=0) return 0;
  const out = o.out!=null ? 1-inv(o.out,o.out+(o.outDur||0.35),t) : 1; if(out<=0) return 0;
  const e=eOut(p);
  ctx.save(); ctx.font=`${weight} ${size}px ${FONT}`; ctx.textAlign=o.align||'center'; ctx.textBaseline='alphabetic';
  ctx.globalAlpha*=e*out;
  const sc=lerp(o.fromScale||1.25,1,e)*(o.scale||1);
  ctx.translate(x,y+(1-e)*40+(1-out)*-30); ctx.scale(sc,sc);
  if(p<1 && o.blur!==false) ctx.filter=`blur(${(1-e)*14}px)`;
  if(o.hl){
    const w=ctx.measureText(txt).width; const x0=o.align==='left'?0:-w/2;
    const g=ctx.createLinearGradient(x0,0,x0+w,0); g.addColorStop(0,C.lilac2); g.addColorStop(0.5,C.lilac); g.addColorStop(1,C.blue);
    ctx.shadowColor=hexA(C.lilac,0.9); ctx.shadowBlur=40+beatPulse(t)*20; ctx.fillStyle=g;
  } else { ctx.fillStyle=o.color||C.ink; ctx.shadowColor='rgba(124,58,237,0.35)'; ctx.shadowBlur=18; }
  ctx.fillText(txt,0,0); ctx.restore(); return e*out;
}
function ring(ctx,x,y,r,a,col=C.lilac,w=3){
  if(a<=0) return; ctx.save(); ctx.strokeStyle=hexA(col,a); ctx.lineWidth=w; ctx.shadowColor=col; ctx.shadowBlur=30;
  ctx.beginPath(); ctx.arc(x,y,r,0,6.2832); ctx.stroke(); ctx.restore();
}
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}

// ---------- faísca (acompanha o vídeo todo) ----------
const SPARK_KEYS = [ // [t,x,y]
 [0,540,1700],[0.4,300,1250],[0.8,760,880],[1.2,350,760],[1.6,760,1050],[2.0,300,1180],[2.5,780,1250],[2.95,540,900],
 [3.3,540,900],[3.8,880,470],[4.4,860,1300],[5.0,220,1250],[5.6,240,420],[6.1,540,640],
];
SERV.forEach((s,i)=>{const t0=S3+i*S3D;SPARK_KEYS.push([t0+0.05,i%2?220:860,i%2?1150:640],[t0+0.5,i%2?860:220,i%2?640:1150]);});
SPARK_KEYS.push([11.0,540,900],[11.45,850,420]);
PROJ.forEach((p,i)=>{const t0=S4+i*S4D;SPARK_KEYS.push([t0+0.1,i%2?160:920,700],[t0+0.75,i%2?920:160,1260]);});
SPARK_KEYS.push([19.6,540,960],[20.0,860,760],[20.5,220,960],[21.0,860,1180],[21.6,540,1420],[22.3,540,960],
  [23.2,860,560],[24.0,1005,815],[25,1005,815]);
SPARK_KEYS.sort((a,b)=>a[0]-b[0]);
function sparkPos(t){
  const K=SPARK_KEYS; let i=0; while(i<K.length-2 && K[i+1][0]<t) i++;
  const p0=K[Math.max(0,i-1)],p1=K[i],p2=K[i+1],p3=K[Math.min(K.length-1,i+2)];
  const u=eIO(clamp((t-p1[0])/(p2[0]-p1[0]||1)));
  const cr=(a,b,c,d)=>0.5*((2*b)+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u);
  return [cr(p0[1],p1[1],p2[1],p3[1]),cr(p0[2],p1[2],p2[2],p3[2])];
}
function drawSpark(ctx,t){
  const born=inv(0,0.35,t); if(born<=0) return;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(let k=16;k>=1;k--){ // rastro
    const tt=t-k*0.018; if(tt<0) continue; const [x,y]=sparkPos(tt);
    ctx.fillStyle=hexA(C.lilac,0.10*(1-k/17)*born); ctx.beginPath(); ctx.arc(x,y,16*(1-k/18),0,6.28); ctx.fill();
  }
  const [x,y]=sparkPos(t); const bp=beatPulse(t);
  glow(ctx,x,y,150+bp*60,C.violet,0.55*born); glow(ctx,x,y,60,C.lilac2,0.9*born);
  ctx.fillStyle=`rgba(255,255,255,${born})`; ctx.beginPath(); ctx.arc(x,y,10+bp*4,0,6.28); ctx.fill();
  // estrela de 4 pontas
  ctx.strokeStyle=`rgba(255,240,255,${0.8*born})`; ctx.lineWidth=2.5; const L=38+bp*22;
  ctx.beginPath(); ctx.moveTo(x-L,y);ctx.lineTo(x+L,y);ctx.moveTo(x,y-L);ctx.lineTo(x,y+L);ctx.stroke();
  // faíscas soltas a cada batida
  const bi=Math.floor(t/BEAT), lt=t-bi*BEAT, r=rng(bi*13+1);
  for(let j=0;j<7;j++){const a=r()*6.28,sp=120+r()*260,d=lt*sp;const al=(1-lt/BEAT)*0.8*born;
    ctx.fillStyle=hexA(C.lilac2,al); ctx.beginPath(); ctx.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,3,0,6.28); ctx.fill();}
  ctx.restore();
}

// ---------- janela de vidro ----------
function glassFrame(ctx,img,x,y,w,h,o={}){
  const r=o.r||36; ctx.save();
  ctx.shadowColor=hexA(C.violet,0.55*(o.glow||1)); ctx.shadowBlur=70;
  rr(ctx,x,y,w,h,r); ctx.fillStyle='rgba(20,12,40,0.85)'; ctx.fill(); ctx.shadowBlur=0;
  ctx.save(); rr(ctx,x+8,y+8+(o.bar?40:0),w-16,h-16-(o.bar?40:0),r-10); ctx.clip();
  if(img){const iw=img.width,ih=img.height,bw=w-16,bh=h-16-(o.bar?40:0);const s=Math.max(bw/iw,bh/ih);
    ctx.drawImage(img,x+8+(bw-iw*s)/2,y+8+(o.bar?40:0)+(bh-ih*s)/2,iw*s,ih*s);}
  if(o.sheen!=null){ // reflexo passando
    const sx=x-w*0.6+o.sheen*w*2.2; const g=ctx.createLinearGradient(sx,y,sx+w*0.35,y+h);
    g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(0.5,'rgba(255,255,255,0.16)');g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g; ctx.fillRect(x,y,w,h);}
  ctx.restore();
  if(o.bar){['#ff5f57','#febc2e','#28c840'].forEach((c,i)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x+36+i*28,y+30,8,0,6.28);ctx.fill();});
    ctx.fillStyle='rgba(255,255,255,0.08)'; rr(ctx,x+130,y+17,w-170,26,13); ctx.fill();}
  const lit=o.lit||0; // borda acende quando a faísca chega
  ctx.lineWidth=2+lit*3; const bg=ctx.createLinearGradient(x,y,x+w,y+h);
  bg.addColorStop(0,hexA(C.lilac2,0.6+lit*0.4)); bg.addColorStop(0.5,'rgba(255,255,255,0.12)'); bg.addColorStop(1,hexA(C.blue,0.5+lit*0.5));
  ctx.strokeStyle=bg; if(lit>0){ctx.shadowColor=C.lilac;ctx.shadowBlur=40*lit;} rr(ctx,x,y,w,h,r); ctx.stroke();
  ctx.restore();
}

// ---------- cenas ----------
function scene1(ctx,t){ // 0–3 gancho
  if(t>3.3) return;
  const z = 1+eIn(inv(2.55,3.05,t))*1.6, fade=1-inv(2.75,3.05,t);
  ctx.save(); ctx.globalAlpha=fade; ctx.translate(540,900); ctx.scale(z,z); ctx.translate(-540,-900);
  for(let i=0;i<3;i++){const s=0.5+i*0.5; const p=inv(s,s+1.4,t);
    ring(ctx,540,900,120+p*520,(1-p)*0.55,i%2?C.blue:C.lilac,3);}
  ring(ctx,540,900,300+beatPulse(t)*14,0.25*inv(0.4,1,t),C.violet,2);
  word(ctx,'¿Tu',540,720,t,0.35,{size:120});
  word(ctx,'idea',540,900,t,0.75,{size:250,hl:true,fromScale:1.6});
  word(ctx,'todavía',540,1060,t,1.15,{size:120});
  word(ctx,'no existe?',540,1200,t,1.45,{size:120,weight:800});
  ctx.restore();
}
function scene2(ctx,t){ // 3–6.2 cubo
  if(t<2.9||t>6.5) return;
  const inP=eBack(inv(3.0,3.6,t)), outP=eIn(inv(5.7,6.25,t));
  const s=lerp(0.6,1,inP)*(1+outP*0.9), a=inv(3.0,3.3,t)*(1-outP);
  ctx.save(); ctx.globalAlpha=a; ctx.translate(540,800+Math.sin(t*2)*10-outP*300); ctx.scale(s,s); ctx.rotate(Math.sin(t*1.3)*0.03);
  ring(ctx,0,0,430+beatPulse(t)*20,0.35,C.lilac,2.5); ring(ctx,0,0,500,0.15,C.blue,2);
  glassFrame(ctx,seqFrame('cube',t-3.0),-340,-340,680,680,{r:60,sheen:inv(3.4,4.6,t),lit:beatPulse(t)*0.6});
  ctx.restore();
  const out=5.65;
  word(ctx,'Nosotros',540,1390,t,3.55,{size:110,out});
  word(ctx,'la',540,1510,t,3.8,{size:110,out,color:C.soft});
  word(ctx,'construimos.',540,1650,t,4.1,{size:150,hl:true,out,fromScale:1.5});
}
function scene3(ctx,t){ // 6.2–11 serviços
  if(t<5.9||t>11.4) return;
  word(ctx,'Lo que hacemos',540,400,t,6.0,{size:62,weight:500,color:C.soft,out:10.7});
  SERV.forEach((s,i)=>{
    const t0=S3+i*S3D, t1=t0+S3D; if(t<t0-0.3||t>t1+0.45) return;
    const pin=eOut(inv(t0-0.3,t0+0.25,t)), pout=eIn(inv(t1-0.05,t1+0.45,t));
    const last=i===SERV.length-1;
    const x = 540 + (1-pin)*700 - (last?0:pout*760);
    const sc = lerp(0.8,1,pin)*(last?1+pout*1.8:lerp(1,0.75,pout));
    const a = pin*(1-pout);
    if(a<=0.01) return;
    ctx.save(); ctx.globalAlpha=a; ctx.translate(x,880+Math.sin(t*2+i)*8); ctx.scale(sc,sc);
    ctx.transform(1,(1-pin)*-0.12+pout*0.1,0,1,0,0);
    glassFrame(ctx,seqFrame(s.k,t-t0+0.2),-440,-250,880,500,{sheen:inv(t0,t1,t),lit:Math.exp(-Math.max(0,t-t0-0.05)*4)});
    ctx.restore();
    const out=t1-0.3;
    s.n.forEach((w,j)=>word(ctx,w,540,1300+j*120,t,t0+0.12+j*0.12,{size:s.n.length>1&&j===0?110:(s.n.length===1?110:96),hl:j===0,out,outDur:0.22}));
  });
  // indicador de passos (5 pontos)
  const a=inv(6.0,6.4,t)*(1-inv(10.7,11.0,t));
  SERV.forEach((s,i)=>{const on=t>=S3+i*S3D; ctx.fillStyle=on?hexA(C.lilac,a):hexA('#ffffff',0.15*a);
    ctx.beginPath(); ctx.arc(540+(i-2)*44,1620,on?10:7,0,6.28); ctx.fill();});
}
function scene4(ctx,t){ // 11.2–19.6 projetos
  if(t<11.0||t>19.9) return;
  const tOut=19.2;
  word(ctx,'Proyectos',540,400,t,11.2,{size:96,out:tOut});
  word(ctx,'reales',540,500,t,11.5,{size:96,hl:true,out:tOut});
  PROJ.forEach((p,i)=>{
    const t0=S4+i*S4D, t1=t0+S4D; if(t<t0-0.35||t>t1+0.5) return;
    const pin=eOut(inv(t0-0.35,t0+0.3,t)), pout=eIn(inv(t1-0.1,t1+0.4,t));
    const last=i===PROJ.length-1;
    const dir=i%2?-1:1;
    const y = 900 + (1-pin)*260 - (last?0:pout*120);
    const sc = lerp(0.72,1,pin)*(last?1+pout*0.35:lerp(1,0.82,pout));
    const a = pin*(1-pout)*(last?1-inv(19.3,19.7,t):1);
    if(a<=0.01) return;
    ctx.save(); ctx.globalAlpha=a; ctx.translate(540+(1-pin)*dir*260+pout*-dir*300,y+Math.sin(t*2.2+i)*10); ctx.scale(sc,sc);
    const sk=(1-pin)*0.10*dir + Math.sin(t*1.5+i)*0.015;
    ctx.transform(1,sk,0,1,0,0);
    glassFrame(ctx,IMG.proj[p.k],-450,-300,900,600,{bar:true,sheen:inv(t0+0.2,t1,t),lit:Math.exp(-Math.max(0,t-t0-0.1)*4)});
    ctx.restore();
    const out=last?19.2:t1-0.3;
    word(ctx,p.n,540,1420,t,t0+0.15,{size:112,hl:true,out,outDur:0.22});
    word(ctx,p.d,540,1510,t,t0+0.32,{size:52,weight:500,color:C.soft,out,outDur:0.22});
  });
  const a=inv(11.6,12.0,t)*(1-inv(19.2,19.5,t));
  PROJ.forEach((p,i)=>{const on=t>=S4+i*S4D; ctx.fillStyle=on?hexA(C.lilac,a):hexA('#ffffff',0.15*a);
    rr(ctx,540+(i-2.5)*60-20,1640,40,8,4); ctx.fill();});
}
function scene5(ctx,t){ // 19.6–22.5 promessa
  if(t<19.5||t>22.8) return;
  const out=22.15;
  const z=1+eIn(inv(22.1,22.6,t))*0.5;
  ctx.save(); ctx.translate(540,960); ctx.scale(z,z); ctx.translate(-540,-960);
  [19.85,20.35,20.85].forEach((s,i)=>{const p=inv(s,s+0.9,t); ring(ctx,540,[700,900,1130][i],80+p*520,(1-p)*0.4*(p>0),i===2?C.teal:C.lilac,3);});
  word(ctx,'Software',540,740,t,19.85,{size:150,fromScale:2,out});
  word(ctx,'IA',540,940,t,20.35,{size:190,fromScale:2,out,color:C.ink});
  word(ctx,'Resultados',540,1160,t,20.85,{size:176,hl:true,fromScale:2.2,out});
  word(ctx,'Hecho en Paraguay',540,1330,t,21.5,{size:58,weight:500,color:C.soft,out});
  ctx.restore();
}
function scene6(ctx,t){ // 22.5–25 logo + chamada
  if(t<22.3) return;
  const p=eOut(inv(22.55,23.3,t));
  const lw=900, lh=lw*IMG.logo.height/IMG.logo.width;
  ctx.save(); ctx.globalAlpha=p; ctx.translate(540,760); ctx.scale(lerp(0.9,1,p),lerp(0.9,1,p));
  glow(ctx,-lw*0.36,0,300,C.violet,0.35+beatPulse(t)*0.1);
  ctx.drawImage(IMG.logo,-lw/2,-lh/2,lw,lh); // logo original, só escala/opacidade
  ctx.restore();
  word(ctx,'Hagamos',540,1060,t,23.05,{size:100});
  word(ctx,'realidad',540,1170,t,23.3,{size:100});
  word(ctx,'tu',400,1300,t,23.55,{size:120,color:C.soft});
  word(ctx,'idea',610,1300,t,23.8,{size:130,hl:true});
  // botão
  const bp=inv(23.7,24.1,t); if(bp>0){
    const e=eBack(bp), pulse=1+beatPulse(t)*0.035;
    ctx.save(); ctx.globalAlpha=clamp(bp*1.5); ctx.translate(540,1500); ctx.scale(e*pulse,e*pulse);
    const g=ctx.createLinearGradient(-380,0,380,0); g.addColorStop(0,C.violet); g.addColorStop(1,C.blue);
    ctx.shadowColor=C.lilac; ctx.shadowBlur=50; rr(ctx,-380,-62,760,124,62); ctx.fillStyle=g; ctx.fill();
    ctx.shadowBlur=0; ctx.fillStyle='#fff'; ctx.font=`700 60px ${FONT}`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('www.constructiva.dev',0,4); ctx.restore();
    ring(ctx,540,1500,420+beatPulse(t)*30,0.25*beatPulse(t),C.lilac,2);
  }
}

// ---------- transições de luz ----------
function transitions(ctx,t){
  const flash=(tc,dur,col,max)=>{const d=Math.abs(t-tc);if(d>dur)return;const a=Math.pow(1-d/dur,2)*max;
    ctx.save();ctx.globalCompositeOperation='lighter';const [x,y]=sparkPos(tc);
    const g=ctx.createRadialGradient(x,y,0,x,y,1500);g.addColorStop(0,hexA('#ffffff',a));g.addColorStop(0.25,hexA(col,a*0.9));g.addColorStop(1,hexA(col,0));
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.restore();};
  flash(3.0,0.45,C.lilac,1.0); flash(6.15,0.35,C.blue,0.6); flash(11.05,0.4,C.lilac,0.8); flash(19.55,0.4,C.teal,0.6);
  // transição líquida para o final
  const lp=inv(22.15,22.95,t); if(lp>0&&lp<1){
    const [sx,sy]=sparkPos(22.3); const R=eIO(lp<0.5?lp*2:2-lp*2)*1500;
    ctx.save(); ctx.beginPath();
    for(let a=0;a<=6.3;a+=0.05){const rr2=R*(1+0.08*Math.sin(a*5+t*9)+0.05*Math.sin(a*9-t*7));ctx.lineTo(sx+Math.cos(a)*rr2,sy+Math.sin(a)*rr2);}
    const g=ctx.createRadialGradient(sx,sy,0,sx,sy,R+1);g.addColorStop(0,C.lilac);g.addColorStop(0.7,C.violet);g.addColorStop(1,C.blue);
    ctx.fillStyle=g; ctx.globalAlpha=0.95; ctx.fill(); ctx.restore();}
}

// ---------- render principal ----------
function render(ctx,t){
  t=clamp(t,0,DUR);
  ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.filter='none';
  drawBackground(ctx,t);
  scene1(ctx,t); scene2(ctx,t); scene3(ctx,t); scene4(ctx,t); scene5(ctx,t); scene6(ctx,t);
  drawSpark(ctx,t);
  transitions(ctx,t);
  drawNoise(ctx,t);
  const fin=inv(0,0.25,t); if(fin<1){ctx.fillStyle=`rgba(0,0,0,${1-fin})`;ctx.fillRect(0,0,W,H);}
}

// ================= SOM (Web Audio) =================
function buildAudio(ac,dest){
  const r=rng(99), sr=ac.sampleRate;
  const master=ac.createGain(); master.gain.setValueAtTime(0.0001,0); master.gain.linearRampToValueAtTime(0.9,0.4);
  master.gain.setValueAtTime(0.9,DUR-0.7); master.gain.linearRampToValueAtTime(0.0001,DUR);
  const comp=ac.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4;
  master.connect(comp); comp.connect(dest);
  // reverb
  const ir=ac.createBuffer(2,sr*2.2,sr); for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<d.length;i++)d[i]=(r()*2-1)*Math.pow(1-i/d.length,3);}
  const rev=ac.createConvolver(); rev.buffer=ir; const revG=ac.createGain(); revG.gain.value=0.35; rev.connect(revG); revG.connect(master);
  const noiseBuf=ac.createBuffer(1,sr*2,sr); {const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=r()*2-1;}
  const noise=(t,dur)=>{const s=ac.createBufferSource();s.buffer=noiseBuf;s.start(t,r()*0.5,dur+0.05);return s;};
  const env=(g,t,a,peak,dcy)=>{g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+dcy);};
  const hz=m=>440*Math.pow(2,(m-69)/12);
  // progressão (compasso = 2s): Am  F  C  G
  const prog=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]], bassN=[45,41,48,43];
  // PAD
  for(let bar=0;bar<13;bar++){const t=bar*2, ch=prog[bar%4];
    ch.forEach(m=>[-7,7].forEach(det=>{const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=hz(m);o.detune.value=det;
      const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=t<3?700:1200;const g=ac.createGain();
      g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.018,t+0.5);g.gain.setValueAtTime(0.018,t+1.7);g.gain.linearRampToValueAtTime(0.0001,t+2.1);
      o.connect(f);f.connect(g);g.connect(master);g.connect(rev);o.start(t);o.stop(t+2.2);}));}
  // KICK (a cada batida a partir de 3s, pausa curta antes do final)
  for(let t=3.0;t<DUR-0.6;t+=BEAT){ if(t>22.0&&t<22.6) continue;
    const o=ac.createOscillator();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(45,t+0.18);
    const g=ac.createGain();env(g,t,0.003,0.55,0.28);o.connect(g);g.connect(master);o.start(t);o.stop(t+0.35);}
  // pulso suave no começo (batida abafada)
  for(let t=0.25;t<3;t+=BEAT){const o=ac.createOscillator();o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(40,t+0.2);
    const g=ac.createGain();env(g,t,0.005,0.22,0.3);o.connect(g);g.connect(master);o.start(t);o.stop(t+0.4);}
  // HI-HAT e CLAP
  for(let t=6.0;t<DUR-0.6;t+=0.25){ if(t>22.0&&t<22.6) continue; const off=Math.round(t/0.25)%2===1;
    const s=noise(t,0.06),f=ac.createBiquadFilter();f.type='highpass';f.frequency.value=8000;const g=ac.createGain();
    env(g,t,0.001,off?0.09:0.04,0.05);s.connect(f);f.connect(g);g.connect(master);}
  for(let t=3.5;t<22;t+=1.0){const s=noise(t,0.2),f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=1500;f.Q.value=0.8;
    const g=ac.createGain();env(g,t,0.002,0.14,0.16);s.connect(f);f.connect(g);g.connect(master);g.connect(rev);}
  // BAIXO (colcheias)
  for(let t=3.0;t<22;t+=0.25){const bar=Math.floor(t/2)%4;const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=hz(bassN[bar]-12+(Math.round(t/0.25)%4===3?12:0));
    const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=420;f.Q.value=4;const g=ac.createGain();
    env(g,t,0.005,0.13,0.2);o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(t+0.26);}
  // ARPEJO (plucks) nas cenas 3–5
  for(let t=6.0;t<22;t+=0.25){const bar=Math.floor(t/2)%4, step=Math.round(t/0.25)%8;const ch=prog[bar];
    const m=ch[[0,1,2,1,0,2,1,2][step]]+12;const o=ac.createOscillator();o.type='triangle';o.frequency.value=hz(m);
    const g=ac.createGain();env(g,t,0.003,0.05,0.22);o.connect(g);g.connect(master);g.connect(rev);o.start(t);o.stop(t+0.3);}
  // BRILHO em cada palavra
  WORDS.forEach((t,i)=>{const base=[88,91,93,95,98,100][i%6];[0,12].forEach((add,k)=>{const o=ac.createOscillator();o.type='sine';
    o.frequency.value=hz(base+add);const g=ac.createGain();env(g,t,0.004,k?0.025:0.05,0.45);o.connect(g);g.connect(master);g.connect(rev);o.start(t);o.stop(t+0.6);});});
  // WHOOSH nas transições + subida antes do 1º impacto
  WH.forEach(tc=>{const t=tc-0.35;const s=noise(t,0.75),f=ac.createBiquadFilter();f.type='bandpass';f.Q.value=1.2;
    f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(4500,t+0.4);f.frequency.exponentialRampToValueAtTime(600,t+0.75);
    const g=ac.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.35,t+0.38);g.gain.exponentialRampToValueAtTime(0.0001,t+0.75);
    s.connect(f);f.connect(g);g.connect(master);g.connect(rev);});
  {const t=1.9,o=ac.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(180,t);o.frequency.exponentialRampToValueAtTime(1400,3.0);
    const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=2500;const g=ac.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.06,2.95);g.gain.linearRampToValueAtTime(0.0001,3.02);
    o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(3.05);}
  // IMPACTOS
  IMPACT.forEach(t=>{const o=ac.createOscillator();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(30,t+0.8);
    const g=ac.createGain();env(g,t,0.005,0.8,1.1);o.connect(g);g.connect(master);o.start(t);o.stop(t+1.3);
    const s=noise(t,0.6),f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=3000;const g2=ac.createGain();env(g2,t,0.002,0.25,0.5);
    s.connect(f);f.connect(g2);g2.connect(master);g2.connect(rev);});
  // acorde final
  [57,64,69,72,76].forEach(m=>{const t=22.6,o=ac.createOscillator();o.type='triangle';o.frequency.value=hz(m);
    const g=ac.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.035,t+0.08);g.gain.exponentialRampToValueAtTime(0.0001,DUR);
    o.connect(g);g.connect(master);g.connect(rev);o.start(t);o.stop(DUR);});
}
