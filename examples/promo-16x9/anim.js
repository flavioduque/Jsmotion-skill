// ===== jsmotion — vídeo de apresentação da própria skill · 12s · 1280x720 · PT/EN =====
const W = 1280, H = 720, DUR = 12, FPS = 30, BEAT = 0.5;
const C = { bg0:'#070510', bg1:'#130c22', violet:'#7C3AED', lilac:'#A855F7', lilac2:'#C084FC',
  blue:'#5B8CFF', teal:'#22E0C8', ink:'#F4F1FF', soft:'#B9B0D6' };
const FONT = 'Saira';

// ---------- textos (window.LANG = 'pt' | 'en') ----------
const TXT = {
  pt: { hook:'Seu vídeo de marca', big:['nível','estúdio'], by:'feito pelo Claude.',
        no:['Sem After Effects.','Sem editor.','Sem template.'], only:'Só uma', conv:'conversa.',
        steps:['Logo + site','Roteiro','Animação','Trilha sonora','MP4 pronto'],
        tag:['Skill para Claude','do briefing ao MP4'] },
  en: { hook:'Your brand video', big:['studio','quality'], by:'made by Claude.',
        no:['No After Effects.','No editor.','No templates.'], only:'Just one', conv:'conversation.',
        steps:['Logo + website','Script','Animation','Soundtrack','MP4 ready'],
        tag:['Claude Skill','from brief to MP4'] },
};
const L = TXT[(typeof window!=='undefined'&&window.LANG)||'pt'] || TXT.pt;

// ---------- utilidades ----------
const clamp = (x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp = (a,b,t)=>a+(b-a)*t;
const inv = (a,b,x)=>clamp((x-a)/(b-a));
const eOut = t=>1-Math.pow(1-t,3);
const eIn = t=>t*t*t;
const eIO = t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const eBack = t=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);};
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const beatPulse = t=>{const p=(t%BEAT)/BEAT;return Math.exp(-p*6);};

// ---------- linha do tempo compartilhada (visual + som) ----------
const T2 = 2.8, T3 = 5.45, T4 = 9.6;              // trocas de cena
const WORDS = [0.3,0.75,1.05,1.6, 3.0,3.3,3.6, 4.5,4.75];
const STEPS = L.steps;
const ST0 = 5.75, STD = 0.62;
STEPS.forEach((s,i)=>WORDS.push(ST0+i*STD));
[10.0,10.35,10.7].forEach(t=>WORDS.push(t));
const WH = [T2,T3,T4];
const IMPACT = [T2,T4+0.2];
const SHOTS = ['f2','f4','f5','f7','f8','f9','f10','f12','f1'];

// ---------- carregamento ----------
const IMG = {seq:{},proj:{}};
function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;});}
async function loadAssets(){
  const A = window.ASSETS;
  const ff = new FontFace(FONT,`url(${A.font})`,{weight:'100 900'});
  await ff.load(); document.fonts.add(ff);
  for (const k in A.projects) IMG.proj[k] = await loadImg(A.projects[k]);
  const n = document.createElement('canvas'); n.width=360; n.height=240;
  const nc = n.getContext('2d'); const id = nc.createImageData(360,240); const r = rng(7);
  for(let i=0;i<id.data.length;i+=4){const v=r()*255;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255;}
  nc.putImageData(id,0,0); IMG.noise = n;
  const r2 = rng(42); IMG.dust = Array.from({length:60},()=>({x:r2()*W,y:r2()*H,s:1+r2()*2.2,sp:6+r2()*24,ph:r2()*6.28}));
}

// ---------- fundo ----------
function hexA(h,a){const n=parseInt(h.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;}
function glow(ctx,x,y,r,col,a){
  const g=ctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,hexA(col,a)); g.addColorStop(1,hexA(col,0));
  ctx.fillStyle=g; ctx.fillRect(x-r,y-r,r*2,r*2);
}
function drawBackground(ctx,t){
  const g=ctx.createLinearGradient(0,0,W,H*0.6);
  g.addColorStop(0,C.bg1); g.addColorStop(0.55,C.bg0); g.addColorStop(1,'#0d0820');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='lighter';
  const bp=beatPulse(t);
  glow(ctx, 640+Math.sin(t*0.5)*380, 260+Math.cos(t*0.4)*90, 560, C.violet, 0.30+bp*0.05);
  glow(ctx, 200+Math.cos(t*0.45)*120, 600, 480, C.blue, 0.16);
  glow(ctx, 1080+Math.sin(t*0.7+1)*100, 520+Math.cos(t*0.5)*120, 420, C.lilac, 0.15);
  glow(ctx, 1000, 140, 380, C.teal, 0.05+0.07*inv(5.4,6,t)*(1-inv(9.2,9.6,t)));
  ctx.globalCompositeOperation='source-over';
  drawGrid(ctx,t);
  for(const d of IMG.dust){
    const y=(d.y - t*d.sp)%H; const yy=y<0?y+H:y;
    ctx.fillStyle=hexA(C.lilac2,0.16+0.16*Math.sin(t*2+d.ph)); ctx.beginPath(); ctx.arc(d.x+Math.sin(t+d.ph)*10,yy,d.s,0,6.28); ctx.fill();
  }
}
function drawGrid(ctx,t){
  const hy=470, vx=640; ctx.save();
  const fade=ctx.createLinearGradient(0,hy,0,H); fade.addColorStop(0,'rgba(124,58,237,0)'); fade.addColorStop(1,'rgba(124,58,237,0.24)');
  ctx.strokeStyle=fade; ctx.lineWidth=1.2; ctx.beginPath();
  for(let i=-16;i<=16;i++){ctx.moveTo(vx,hy);ctx.lineTo(vx+i*150,H+30);}
  const off=(t*0.6)%1;
  for(let j=0;j<10;j++){const z=(j+off)/10;const y=hy+(H-hy)*z*z;ctx.moveTo(0,y);ctx.lineTo(W,y);}
  ctx.stroke(); ctx.restore();
}
function drawNoise(ctx,t){
  if(!window.NOGRAIN){ // granulação (desligada na versão GIF: muda a cada quadro e triplica o tamanho)
    ctx.save(); ctx.globalAlpha=0.05; ctx.globalCompositeOperation='overlay';
    const o=Math.floor(t*30)%4; ctx.drawImage(IMG.noise,-o*20,-o*13,W+80,H+52); ctx.restore(); }
  const v=ctx.createRadialGradient(640,360,330,640,360,820);
  v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(3,2,10,0.65)'); ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
}

// ---------- texto palavra por palavra ----------
function word(ctx,txt,x,y,t,t0,o={}){
  const size=o.size||80, weight=o.weight||700, dur=o.dur||0.42;
  const p=inv(t0,t0+dur,t); if(p<=0) return 0;
  const out = o.out!=null ? 1-inv(o.out,o.out+(o.outDur||0.3),t) : 1; if(out<=0) return 0;
  const e=eOut(p);
  ctx.save(); ctx.font=`${weight} ${size}px ${FONT}`; ctx.textAlign=o.align||'center'; ctx.textBaseline='alphabetic';
  ctx.globalAlpha*=e*out;
  const sc=lerp(o.fromScale||1.25,1,e);
  ctx.translate(x,y+(1-e)*26+(1-out)*-20); ctx.scale(sc,sc);
  if(p<1) ctx.filter=`blur(${(1-e)*10}px)`;
  const w=ctx.measureText(txt).width; const x0=o.align==='left'?0:-w/2;
  if(o.hl){
    const g=ctx.createLinearGradient(x0,0,x0+w,0); g.addColorStop(0,C.lilac2); g.addColorStop(0.5,C.lilac); g.addColorStop(1,C.blue);
    ctx.shadowColor=hexA(C.lilac,0.9); ctx.shadowBlur=30+beatPulse(t)*16; ctx.fillStyle=g;
  } else { ctx.fillStyle=o.color||C.ink; ctx.shadowColor='rgba(124,58,237,0.35)'; ctx.shadowBlur=14; }
  ctx.fillText(txt,0,0);
  if(o.strike!=null){ // risco atravessando a palavra
    const sp=eIO(inv(o.strike,o.strike+0.3,t)); if(sp>0){
      ctx.filter='none'; ctx.shadowColor=C.lilac; ctx.shadowBlur=18; ctx.strokeStyle=C.lilac2; ctx.lineWidth=size*0.07; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(x0-10,-size*0.3); ctx.lineTo(x0-10+(w+20)*sp,-size*0.3); ctx.stroke();}
  }
  ctx.restore(); return e*out;
}
function ring(ctx,x,y,r,a,col=C.lilac,w=2.5){
  if(a<=0) return; ctx.save(); ctx.strokeStyle=hexA(col,a); ctx.lineWidth=w; ctx.shadowColor=col; ctx.shadowBlur=24;
  ctx.beginPath(); ctx.arc(x,y,r,0,6.2832); ctx.stroke(); ctx.restore();
}
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
// centros x de palavras lado a lado, centradas na tela (funciona em qualquer idioma)
function row(ctx,ws,size,weight,gap){
  ctx.save(); ctx.font=`${weight} ${size}px ${FONT}`; const m=ws.map(w=>ctx.measureText(w).width); ctx.restore();
  let x=640-(m.reduce((a,b)=>a+b,0)+gap*(ws.length-1))/2; return m.map(w=>{const c=x+w/2; x+=w+gap; return c;});
}
// maior tamanho de fonte (até max) em que o texto cabe na largura
function fit(ctx,txt,max,width,weight){
  ctx.save(); ctx.font=`${weight} ${max}px ${FONT}`; const w=ctx.measureText(txt).width; ctx.restore();
  return Math.min(max,Math.floor(max*width/w));
}

// ---------- faísca condutora ----------
const SPARK_KEYS = [
 [0,640,700],[0.4,300,420],[0.8,980,300],[1.2,560,470],[1.6,1050,520],[2.1,240,300],[2.8,640,380],
 [3.2,1080,230],[3.6,200,330],[4.0,1060,430],[4.5,300,560],[5.0,980,260],[5.45,640,400],
];
STEPS.forEach((s,i)=>SPARK_KEYS.push([ST0+i*STD+0.05,70,[190,270,350,430,520][i]-22]));
SPARK_KEYS.push([8.9,880,110],[9.3,1180,360],[9.6,560,360],[10.0,300,200],[10.5,1000,560],[11.1,1110,470],[12,1110,470]);
SPARK_KEYS.sort((a,b)=>a[0]-b[0]);
function sparkPos(t){
  const K=SPARK_KEYS; let i=0; while(i<K.length-2 && K[i+1][0]<t) i++;
  const p0=K[Math.max(0,i-1)],p1=K[i],p2=K[i+1],p3=K[Math.min(K.length-1,i+2)];
  const u=eIO(clamp((t-p1[0])/(p2[0]-p1[0]||1)));
  const cr=(a,b,c,d)=>0.5*((2*b)+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u);
  return [cr(p0[1],p1[1],p2[1],p3[1]),cr(p0[2],p1[2],p2[2],p3[2])];
}
function drawSpark(ctx,t){
  const born=inv(0,0.35,t)*(1-inv(11.6,12,t)); if(born<=0) return;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(let k=16;k>=1;k--){
    const tt=t-k*0.018; if(tt<0) continue; const [x,y]=sparkPos(tt);
    ctx.fillStyle=hexA(C.lilac,0.10*(1-k/17)*born); ctx.beginPath(); ctx.arc(x,y,11*(1-k/18),0,6.28); ctx.fill();
  }
  const [x,y]=sparkPos(t); const bp=beatPulse(t);
  glow(ctx,x,y,100+bp*40,C.violet,0.55*born); glow(ctx,x,y,40,C.lilac2,0.9*born);
  ctx.fillStyle=`rgba(255,255,255,${born})`; ctx.beginPath(); ctx.arc(x,y,7+bp*3,0,6.28); ctx.fill();
  ctx.strokeStyle=`rgba(255,240,255,${0.8*born})`; ctx.lineWidth=2; const L=26+bp*15;
  ctx.beginPath(); ctx.moveTo(x-L,y);ctx.lineTo(x+L,y);ctx.moveTo(x,y-L);ctx.lineTo(x,y+L);ctx.stroke();
  const bi=Math.floor(t/BEAT), lt=t-bi*BEAT, r=rng(bi*13+1);
  for(let j=0;j<7;j++){const a=r()*6.28,sp=80+r()*170,d=lt*sp;
    ctx.fillStyle=hexA(C.lilac2,(1-lt/BEAT)*0.8*born); ctx.beginPath(); ctx.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,2.2,0,6.28); ctx.fill();}
  ctx.restore();
}

// ---------- celular de vidro ----------
function phone(ctx,img,x,y,w,h,o={}){
  const r=o.r||26; ctx.save();
  ctx.shadowColor=hexA(C.violet,0.6); ctx.shadowBlur=50;
  rr(ctx,x,y,w,h,r); ctx.fillStyle='rgba(20,12,40,0.9)'; ctx.fill(); ctx.shadowBlur=0;
  ctx.save(); rr(ctx,x+6,y+6,w-12,h-12,r-6); ctx.clip();
  if(img) ctx.drawImage(img,x+6,y+6,w-12,h-12);
  if(o.sheen!=null){const sx=x-w*0.6+o.sheen*w*2.2; const g=ctx.createLinearGradient(sx,y,sx+w*0.4,y+h);
    g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(0.5,'rgba(255,255,255,0.18)');g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g; ctx.fillRect(x,y,w,h);}
  ctx.restore();
  ctx.fillStyle='rgba(0,0,0,0.7)'; rr(ctx,x+w/2-28,y+14,56,12,6); ctx.fill(); // câmera
  const lit=o.lit||0; ctx.lineWidth=2+lit*2.5; const bg=ctx.createLinearGradient(x,y,x+w,y+h);
  bg.addColorStop(0,hexA(C.lilac2,0.6+lit*0.4)); bg.addColorStop(0.5,'rgba(255,255,255,0.12)'); bg.addColorStop(1,hexA(C.blue,0.5+lit*0.5));
  ctx.strokeStyle=bg; if(lit>0){ctx.shadowColor=C.lilac;ctx.shadowBlur=30*lit;} rr(ctx,x,y,w,h,r); ctx.stroke();
  ctx.restore();
}

// ---------- cenas ----------
function scene1(ctx,t){ // 0–2.8 gancho
  if(t>T2+0.3) return;
  const z=1+eIn(inv(2.35,2.85,t))*1.5, fade=1-inv(2.55,2.85,t);
  ctx.save(); ctx.globalAlpha=fade; ctx.translate(640,380); ctx.scale(z,z); ctx.translate(-640,-380);
  for(let i=0;i<3;i++){const s=0.4+i*0.5; const p=inv(s,s+1.4,t); ring(ctx,640,380,90+p*460,(1-p)*0.5,i%2?C.blue:C.lilac,2.5);}
  word(ctx,L.hook,640,250,t,0.3,{size:62,weight:600,color:C.soft});
  const [xa,xb]=row(ctx,L.big,150,700,48);
  word(ctx,L.big[0],xa,420,t,0.75,{size:150,fromScale:1.5});
  word(ctx,L.big[1],xb,420,t,1.05,{size:150,hl:true,fromScale:1.6});
  word(ctx,L.by,640,530,t,1.6,{size:62,weight:600});
  ctx.restore();
}
function scene2(ctx,t){ // 2.8–5.45 sem editor
  if(t<T2-0.1||t>T3+0.3) return;
  const out=4.3;
  L.no.forEach((s,i)=>word(ctx,s,640,230+i*110,t,3.0+i*0.3,{size:76,color:C.soft,out,strike:3.35+i*0.3}));
  const z=1+eIn(inv(5.05,5.5,t))*0.6;
  ctx.save(); ctx.translate(640,380); ctx.scale(z,z); ctx.translate(-640,-380);
  [4.5,4.75].forEach((s,i)=>{const p=inv(s,s+0.9,t); ring(ctx,640,[300,440][i],60+p*420,(1-p)*0.4*(p>0),i?C.teal:C.lilac,2.5);});
  word(ctx,L.only,640,300,t,4.5,{size:100,fromScale:1.8,out:5.1});
  word(ctx,L.conv,640,470,t,4.75,{size:fit(ctx,L.conv,170,1060,800),hl:true,fromScale:2,out:5.1});
  ctx.restore();
}
function scene3(ctx,t){ // 5.45–9.6 passos + vídeos reais
  if(t<T3-0.2||t>T4+0.3) return;
  const outS=9.15;
  STEPS.forEach((s,i)=>{
    const t0=ST0+i*STD, y=[190,270,350,430,520][i], last=i===STEPS.length-1;
    const a=word(ctx,s,110,y,t,t0,{size:last?72:54,weight:last?800:600,hl:last,align:'left',fromScale:1.3,out:outS});
    if(a>0){ctx.save(); ctx.globalAlpha=a; const bp=Math.exp(-Math.max(0,t-t0)*5);
      ctx.fillStyle=last?C.teal:C.lilac; ctx.shadowColor=ctx.fillStyle; ctx.shadowBlur=14+bp*20;
      ctx.beginPath(); ctx.arc(70,y-(last?24:18),7+bp*5,0,6.28); ctx.fill();
      if(i<STEPS.length-1){ctx.shadowBlur=0; ctx.strokeStyle=hexA(C.lilac,0.35); ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(70,y-6); ctx.lineTo(70,y+(i===3?64:52)-18); ctx.stroke();}
      ctx.restore();}
  });
  // três celulares com quadros reais gerados pela skill
  const pin=eBack(inv(5.55,6.25,t)), pout=eIn(inv(9.05,9.55,t));
  const cyc=t-5.6;
  [[-1,0.75],[1,0.75],[0,1]].forEach(([k,s])=>{
    const w=240*s, h=w*16/9, cx=880+k*250, cy=372+(1-pin)*420+Math.sin(t*2+k)*6-pout*40;
    const idx=Math.floor(Math.max(0,cyc)/0.9)+k+1+3; const img=IMG.proj[SHOTS[((idx%SHOTS.length)+SHOTS.length)%SHOTS.length]];
    const since=Math.max(0,cyc)%0.9;
    ctx.save(); ctx.globalAlpha=clamp(pin*1.4)*(1-pout)*(k?0.75:1);
    ctx.translate(cx,cy); const sc=(k?1:1+beatPulse(t)*0.015)*lerp(1,0.85,pout); ctx.scale(sc,sc);
    ctx.transform(1,0,k*-0.06*(1-pin),1,0,0);
    phone(ctx,img,-w/2,-h/2,w,h,{sheen:since/0.9,lit:k?0:Math.exp(-since*5)});
    ctx.restore();
  });
}
function scene4(ctx,t){ // 9.6–12 logo + chamada
  if(t<T4-0.2) return;
  const p=eOut(inv(9.75,10.4,t)), fo=1-inv(11.55,11.95,t);
  ctx.save(); ctx.globalAlpha=p*fo; ctx.translate(640,285); const s=lerp(0.85,1,p); ctx.scale(s,s);
  glow(ctx,-230,0,220,C.violet,0.4+beatPulse(t)*0.1);
  // ícone: botão play em quadrado arredondado
  const g=ctx.createLinearGradient(-330,-62,-206,62); g.addColorStop(0,C.lilac); g.addColorStop(1,C.blue);
  ctx.shadowColor=C.lilac; ctx.shadowBlur=30+beatPulse(t)*20; ctx.fillStyle=g; rr(ctx,-330,-62,124,124,32); ctx.fill();
  ctx.shadowBlur=0; ctx.fillStyle='#fff'; ctx.beginPath(); ctx.moveTo(-285,-30); ctx.lineTo(-285,30); ctx.lineTo(-234,0); ctx.closePath(); ctx.fill();
  ctx.font=`800 150px ${FONT}`; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillStyle=C.ink;
  ctx.shadowColor='rgba(124,58,237,0.5)'; ctx.shadowBlur=20; ctx.fillText('js',-170,6);
  const jw=ctx.measureText('js').width; const g2=ctx.createLinearGradient(-170+jw,0,-170+jw+390,0);
  g2.addColorStop(0,C.lilac2); g2.addColorStop(1,C.blue); ctx.fillStyle=g2; ctx.fillText('motion',-170+jw,6);
  ctx.restore();
  ctx.save(); ctx.globalAlpha=fo;
  const [xt,xd,xs]=row(ctx,[L.tag[0],'·',L.tag[1]],46,700,18);
  word(ctx,L.tag[0],xt,450,t,10.0,{size:46,weight:600,color:C.soft});
  word(ctx,'·',xd,450,t,10.2,{size:46,color:C.lilac});
  word(ctx,L.tag[1],xs,450,t,10.35,{size:46,weight:700,hl:true});
  const bp=inv(10.7,11.05,t); if(bp>0){
    const e=eBack(bp), pulse=1+beatPulse(t)*0.03;
    ctx.save(); ctx.globalAlpha*=clamp(bp*1.5); ctx.translate(640,565); ctx.scale(e*pulse,e*pulse);
    const gb=ctx.createLinearGradient(-330,0,330,0); gb.addColorStop(0,C.violet); gb.addColorStop(1,C.blue);
    ctx.shadowColor=C.lilac; ctx.shadowBlur=40; rr(ctx,-330,-40,660,80,40); ctx.fillStyle=gb; ctx.fill();
    ctx.shadowBlur=0; ctx.fillStyle='#fff'; ctx.font=`700 34px ${FONT}`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('★  flavioduque/Jsmotion-skill',0,3); ctx.restore();
    ring(ctx,640,565,360+beatPulse(t)*24,0.22*beatPulse(t),C.lilac,2);
  }
  ctx.restore();
}

// ---------- transições ----------
function transitions(ctx,t){
  const flash=(tc,dur,col,max)=>{const d=Math.abs(t-tc);if(d>dur)return;const a=Math.pow(1-d/dur,2)*max;
    ctx.save();ctx.globalCompositeOperation='lighter';const [x,y]=sparkPos(tc);
    const g=ctx.createRadialGradient(x,y,0,x,y,1100);g.addColorStop(0,hexA('#ffffff',a));g.addColorStop(0.25,hexA(col,a*0.9));g.addColorStop(1,hexA(col,0));
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.restore();};
  flash(T2,0.42,C.lilac,1.0); flash(T3,0.38,C.blue,0.7);
  const lp=inv(9.25,10.05,t); if(lp>0&&lp<1){ // onda líquida para o final
    const [sx,sy]=sparkPos(9.45); const R=eIO(lp<0.5?lp*2:2-lp*2)*1100;
    ctx.save(); ctx.beginPath();
    for(let a=0;a<=6.3;a+=0.05){const r2=R*(1+0.08*Math.sin(a*5+t*9)+0.05*Math.sin(a*9-t*7));ctx.lineTo(sx+Math.cos(a)*r2,sy+Math.sin(a)*r2);}
    const g=ctx.createRadialGradient(sx,sy,0,sx,sy,R+1);g.addColorStop(0,C.lilac);g.addColorStop(0.7,C.violet);g.addColorStop(1,C.blue);
    ctx.fillStyle=g; ctx.globalAlpha=0.95; ctx.fill(); ctx.restore();}
}

// ---------- render principal ----------
function render(ctx,t){
  t=clamp(t,0,DUR);
  ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha=1; ctx.filter='none';
  drawBackground(ctx,t);
  scene1(ctx,t); scene2(ctx,t); scene3(ctx,t); scene4(ctx,t);
  drawSpark(ctx,t);
  transitions(ctx,t);
  drawNoise(ctx,t);
  const fin=inv(0,0.25,t)*(1-inv(11.75,12,t)); if(fin<1){ctx.fillStyle=`rgba(7,5,16,${1-fin})`;ctx.fillRect(0,0,W,H);}
}

// ================= SOM (Web Audio) =================
function buildAudio(ac,dest){
  const r=rng(99), sr=ac.sampleRate, END=T4-0.35;
  const master=ac.createGain(); master.gain.setValueAtTime(0.0001,0); master.gain.linearRampToValueAtTime(0.9,0.4);
  master.gain.setValueAtTime(0.9,DUR-0.7); master.gain.linearRampToValueAtTime(0.0001,DUR);
  const comp=ac.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4;
  master.connect(comp); comp.connect(dest);
  const ir=ac.createBuffer(2,sr*2.2,sr); for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<d.length;i++)d[i]=(r()*2-1)*Math.pow(1-i/d.length,3);}
  const rev=ac.createConvolver(); rev.buffer=ir; const revG=ac.createGain(); revG.gain.value=0.35; rev.connect(revG); revG.connect(master);
  const noiseBuf=ac.createBuffer(1,sr*2,sr); {const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=r()*2-1;}
  const noise=(t,dur)=>{const s=ac.createBufferSource();s.buffer=noiseBuf;s.start(t,r()*0.5,dur+0.05);return s;};
  const env=(g,t,a,peak,dcy)=>{g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+dcy);};
  const hz=m=>440*Math.pow(2,(m-69)/12);
  const prog=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]], bassN=[45,41,48,43];
  for(let bar=0;bar<Math.ceil(DUR/2);bar++){const t=bar*2, ch=prog[bar%4];
    ch.forEach(m=>[-7,7].forEach(det=>{const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=hz(m);o.detune.value=det;
      const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=t<T2?700:1200;const g=ac.createGain();
      g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.018,t+0.5);g.gain.setValueAtTime(0.018,t+1.7);g.gain.linearRampToValueAtTime(0.0001,t+2.1);
      o.connect(f);f.connect(g);g.connect(master);g.connect(rev);o.start(t);o.stop(t+2.2);}));}
  for(let t=T2;t<DUR-0.6;t+=BEAT){ if(t>END&&t<T4+0.2) continue;
    const o=ac.createOscillator();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(45,t+0.18);
    const g=ac.createGain();env(g,t,0.003,0.55,0.28);o.connect(g);g.connect(master);o.start(t);o.stop(t+0.35);}
  for(let t=0.25;t<T2;t+=BEAT){const o=ac.createOscillator();o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(40,t+0.2);
    const g=ac.createGain();env(g,t,0.005,0.22,0.3);o.connect(g);g.connect(master);o.start(t);o.stop(t+0.4);}
  for(let t=T3;t<DUR-0.6;t+=0.25){ if(t>END&&t<T4+0.2) continue; const off=Math.round(t/0.25)%2===1;
    const s=noise(t,0.06),f=ac.createBiquadFilter();f.type='highpass';f.frequency.value=8000;const g=ac.createGain();
    env(g,t,0.001,off?0.09:0.04,0.05);s.connect(f);f.connect(g);g.connect(master);}
  for(let t=T2+0.5;t<END;t+=1.0){const s=noise(t,0.2),f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=1500;f.Q.value=0.8;
    const g=ac.createGain();env(g,t,0.002,0.14,0.16);s.connect(f);f.connect(g);g.connect(master);g.connect(rev);}
  for(let t=T2;t<END;t+=0.25){const bar=Math.floor(t/2)%4;const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=hz(bassN[bar]-12+(Math.round(t/0.25)%4===3?12:0));
    const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=420;f.Q.value=4;const g=ac.createGain();
    env(g,t,0.005,0.13,0.2);o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(t+0.26);}
  for(let t=T3;t<END;t+=0.25){const bar=Math.floor(t/2)%4, step=Math.round(t/0.25)%8;const ch=prog[bar];
    const m=ch[[0,1,2,1,0,2,1,2][step]]+12;const o=ac.createOscillator();o.type='triangle';o.frequency.value=hz(m);
    const g=ac.createGain();env(g,t,0.003,0.05,0.22);o.connect(g);g.connect(master);g.connect(rev);o.start(t);o.stop(t+0.3);}
  WORDS.forEach((t,i)=>{const base=[88,91,93,95,98,100][i%6];[0,12].forEach((add,k)=>{const o=ac.createOscillator();o.type='sine';
    o.frequency.value=hz(base+add);const g=ac.createGain();env(g,t,0.004,k?0.025:0.05,0.45);o.connect(g);g.connect(master);g.connect(rev);o.start(t);o.stop(t+0.6);});});
  WH.forEach(tc=>{const t=tc-0.35;const s=noise(t,0.75),f=ac.createBiquadFilter();f.type='bandpass';f.Q.value=1.2;
    f.frequency.setValueAtTime(300,t);f.frequency.exponentialRampToValueAtTime(4500,t+0.4);f.frequency.exponentialRampToValueAtTime(600,t+0.75);
    const g=ac.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.35,t+0.38);g.gain.exponentialRampToValueAtTime(0.0001,t+0.75);
    s.connect(f);f.connect(g);g.connect(master);g.connect(rev);});
  {const t=1.7,o=ac.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(180,t);o.frequency.exponentialRampToValueAtTime(1400,T2);
    const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=2500;const g=ac.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.06,T2-0.05);g.gain.linearRampToValueAtTime(0.0001,T2+0.02);
    o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(T2+0.05);}
  IMPACT.forEach(t=>{const o=ac.createOscillator();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(30,t+0.8);
    const g=ac.createGain();env(g,t,0.005,0.8,1.1);o.connect(g);g.connect(master);o.start(t);o.stop(t+1.3);
    const s=noise(t,0.6),f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=3000;const g2=ac.createGain();env(g2,t,0.002,0.25,0.5);
    s.connect(f);f.connect(g2);g2.connect(master);g2.connect(rev);});
  [57,64,69,72,76].forEach(m=>{const t=T4+0.2,o=ac.createOscillator();o.type='triangle';o.frequency.value=hz(m);
    const g=ac.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.035,t+0.08);g.gain.exponentialRampToValueAtTime(0.0001,DUR);
    o.connect(g);g.connect(master);g.connect(rev);o.start(t);o.stop(DUR);});
}
