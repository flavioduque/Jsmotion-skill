// MODO IMÓVEL — peças do "mundo contínuo" (ver references/imovel.md). Tudo pelo tempo da fala (t), cores do STYLE.
//   <MarcaCabecalho t logo="brand/logo.png" sub="PLAZA CDE" at={2.2} />   título que encolhe e vira cabeçalho fixo
//   <Predio3D t t0 grow={[a,b]} fuse={c} floors={14} />                    cidade à noite + torre subindo andar por andar
//   <MapaRota t a pin route={[a,b]} out labelA labelB />                    mapa REAL (scripts/map_osm.py) com a rota se desenhando
//   <EtiquetaPreco t a settle value />                                       etiqueta pendurada que conta e assenta (ex.: quando a pessoa aponta)
// Área de desenho: 0..top (padrão 1000 px, a parte de cima do 9:16; a pessoa fica na moldura embaixo).
import React, {useMemo} from 'react';
import {Easing, Img, staticFile} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {STYLE} from './style';
import {k, on} from './kit';
import MAP from './map.json';

const C = STYLE.colors, SANS = `"${STYLE.fonts.display.family}"`, SERIF = `"${STYLE.fonts.serif.family}"`;
export const lab = (size: number, color = C.accent): React.CSSProperties => ({fontFamily: SANS, fontWeight: 600, fontSize: size,
  letterSpacing: size * 0.3, color, textTransform: 'uppercase', whiteSpace: 'nowrap', lineHeight: 1});
export const big = (size: number): React.CSSProperties => ({fontFamily: SERIF, fontStyle: 'italic', fontWeight: 500, fontSize: size,
  lineHeight: 0.9, color: C.text, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'});
export const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const Pin: React.FC<{size?: number}> = ({size = 26}) =>
  <svg width={size * 0.77} height={size} viewBox="0 0 20 26"><path fill={C.accent}
    d="M10 0C4.5 0 0 4.4 0 9.8 0 17 10 26 10 26s10-9 10-16.2C20 4.4 15.5 0 10 0zm0 13.5a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2z" /></svg>;
/** selo de honestidade no canto ("volume ilustrativo", "localização aproximada") */
export const Selo: React.FC<{t: number; a: number; b: number; children: React.ReactNode}> = ({t, a, b, children}) => {
  const o = on(t, a, 0.4) * (1 - k(t, [b - 0.3, b], [0, 1]));
  return o > 0 ? <div style={{position: 'absolute', right: 60, top: 64, opacity: o * 0.8, fontFamily: SANS, fontWeight: 500, fontSize: 19,
    letterSpacing: 19 * 0.12, color: C.text, display: 'flex', alignItems: 'center', gap: 8}}>
    <span style={{width: 7, height: 7, borderRadius: 4, background: C.accent}} />{children}</div> : null;
};

// ---------- marca que vira cabeçalho ----------
export const MarcaCabecalho: React.FC<{t: number; logo: string; sub?: string; at: number; out?: number; y?: number}> =
  ({t, logo, sub = '', at, out = 1e9, y = 420}) => {
    const p = k(t, [at, at + 0.6], [0, 1], Easing.inOut(Easing.cubic));
    const inA = on(t, 0.1, 0.6), inB = k(t, [0.5, 1.2], [0, 1]), line = k(t, [0.35, 1.2], [0, 1]);
    const x = 540 + (150 - 540) * p, yy = y + (78 - y) * p, s = 1 - 0.62 * p;
    return <div style={{position: 'absolute', left: x, top: yy, transform: `translate(-50%,-50%) scale(${s})`, display: 'flex',
      flexDirection: 'column', alignItems: 'center', opacity: inA * (1 - k(t, [out - 0.2, out + 0.2], [0, 1]))}}>
      <Img src={staticFile(logo)} style={{height: 150, transform: `translateY(${(1 - inA) * 30}px)`}} />
      {sub && <><div style={{width: 360 * line, height: 2, background: C.accent, margin: '26px 0 22px'}} />
        <div style={{...lab(34), letterSpacing: 34 * 0.42, height: 40}}>{sub.slice(0, Math.round(sub.length * inB))}</div></>}
    </div>;
  };

// ---------- prédio 3D (ilustrativo: use o selo e funda no render real) ----------
const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const windowsTex = (seed: number, lit: number) => {      // janelas acesas desenhadas uma vez num canvas
  const c = document.createElement('canvas'); c.width = 64; c.height = 32;
  const g = c.getContext('2d')!, r = rng(seed);
  g.fillStyle = '#000'; g.fillRect(0, 0, 64, 32);
  for (let x = 0; x < 8; x++) for (let y = 0; y < 2; y++)
    if (r() < lit) { g.fillStyle = r() < 0.7 ? '#ffd9a0' : '#ffc070'; g.fillRect(x * 8 + 1.5, y * 16 + 3, 5, 10); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
};
const FH = 0.34, FW = 1.5, FD = 1.0;
const CamRig: React.FC<{t: number; grow: number; H: number; t0: number}> = ({t, grow, H, t0}) => {
  const {camera} = useThree();
  const a = 0.75 + (t - t0) * 0.06, r = 15 - 4.5 * grow;          // começa aberto (cidade) e se aproxima da torre
  camera.position.set(Math.sin(a) * r, 5.5 - 0.8 * grow, Math.cos(a) * r);
  camera.lookAt(0, 0.5 * H * Math.max(0.25, grow), 0);
  return null;
};
const Torre: React.FC<{n: number; floors: number}> = ({n, floors}) => {
  const tex = useMemo(() => windowsTex(7, 0.55), []);
  const slab = useMemo(() => new THREE.BoxGeometry(FW + 0.12, 0.05, FD + 0.12), []);
  const body = useMemo(() => new THREE.BoxGeometry(FW, FH - 0.05, FD), []);
  const full = Math.floor(n), frac = n - full, out = [];
  for (let i = 0; i < Math.min(floors, full + 1); i++) {
    const p = i < full ? 1 : frac;                                 // o andar de cima assenta caindo do alto
    if (p <= 0.01) continue;
    const e = 1 - Math.pow(1 - p, 3);
    out.push(<group key={i} position={[0, i * FH + (1 - e) * 0.9, 0]}>
      <mesh geometry={body} position={[0, FH / 2, 0]}>
        <meshStandardMaterial color="#14110e" roughness={0.35} metalness={0.4} emissive="#ffcf8f" emissiveMap={tex} emissiveIntensity={1.05 * e}
          transparent opacity={e} /></mesh>
      <mesh geometry={slab}><meshStandardMaterial color="#e8dcc6" roughness={0.6} transparent opacity={e} /></mesh>
    </group>);
  }
  return <group>{out}</group>;
};
const Cidade: React.FC = () => {
  const items = useMemo(() => {
    const r = rng(42), out: {x: number; z: number; w: number; d: number; h: number; tex: THREE.Texture}[] = [];
    const texs = [windowsTex(3, 0.35), windowsTex(11, 0.25), windowsTex(19, 0.45)];
    while (out.length < 70) {
      const x = (r() - 0.5) * 26, z = (r() - 0.5) * 26;
      if (Math.hypot(x, z) < 2.6 || Math.hypot(x - Math.sin(0.9) * 13, z - Math.cos(0.9) * 13) < 5) continue;   // nada na frente da câmera
      const h = 0.4 + Math.pow(r(), 2) * 3.2, w = 0.6 + r() * 1.1, d = 0.6 + r() * 1.1;
      const tx = texs[Math.floor(r() * 3)].clone(); tx.repeat.set(Math.max(1, Math.round(w * 1.5)), Math.max(1, Math.round(h / 0.22))); tx.needsUpdate = true;
      out.push({x, z, w, d, h, tex: tx});
    }
    return out;
  }, []);
  return <group>
    {items.map((b, i) => <mesh key={i} position={[b.x, b.h / 2, b.z]}><boxGeometry args={[b.w, b.h, b.d]} />
      <meshStandardMaterial color="#0f0d0b" roughness={0.8} emissive="#ffc98a" emissiveMap={b.tex} emissiveIntensity={0.42} /></mesh>)}
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[80, 80]} /><meshStandardMaterial color="#0a0908" roughness={1} /></mesh>
  </group>;
};
export const Predio3D: React.FC<{t: number; t0: number; grow: number[]; fuse: number; floors: number; w?: number; top?: number}> =
  ({t, t0, grow: growAt, fuse, floors, w = 1080, top = 1000}) => {
    const grow = k(t, growAt, [0, 1], Easing.inOut(Easing.cubic));
    const vis = on(t, t0 - 0.4, 0.6) * (1 - k(t, [fuse, fuse + 0.7], [0, 1]));
    if (vis <= 0) return null;
    return <div style={{position: 'absolute', left: 0, top: 0, width: w, height: top, opacity: vis}}>
      <ThreeCanvas linear width={w} height={top} camera={{fov: 32, position: [6, 3, 8], near: 0.1, far: 120}} gl={{antialias: true}}>
        <color attach="background" args={[C.bg]} /><fog attach="fog" args={[C.bg, 9, 30]} />
        <hemisphereLight args={['#3a3226', '#050404', 0.7]} /><directionalLight position={[5, 9, 6]} intensity={1.1} color="#ffe2b8" />
        <CamRig t={t} grow={grow} H={floors * FH} t0={t0} /><Cidade /><Torre n={grow * floors} floors={floors} />
      </ThreeCanvas>
    </div>;
  };
/** contador de andares preso ao crescimento da torre (o número É a imagem) */
export const ContadorAndares: React.FC<{t: number; grow: number[]; floors: number; a: number; b: number; children?: React.ReactNode}> =
  ({t, grow, floors, a, b, children}) => {
    const g = k(t, grow, [0, 1], Easing.inOut(Easing.cubic)), vis = on(t, a, 0.4) * (1 - k(t, [b - 0.4, b], [0, 1]));
    return vis > 0 ? <div style={{position: 'absolute', left: 64, top: 170, opacity: vis}}>
      <div style={big(170)}>{String(Math.max(1, Math.round(g * floors))).padStart(2, '0')}</div>
      <div style={{...lab(28), marginTop: 14}}>ANDARES</div>{children}</div> : null;
  };

// ---------- mapa real com rota ----------
type M = {W: number; H: number; a: number[]; b: number[]; route: number[][]};
export const MapaRota: React.FC<{t: number; a: number; pin: number; route: number[]; out: number; labelA: string; labelB: string;
  w?: number; top?: number}> = ({t, a, pin, route: rt, out, labelA, labelB, w = 1080, top = 1000}) => {
  const m = MAP as M, [ax, ay] = m.a, [bx0, by0] = m.b;
  const S = (w * 0.76) / Math.max(1, Math.abs(bx0 - ax)), OX = Math.min(ax, bx0) - (w * 0.11) / S, OY = (ay + by0) / 2 - (top * 0.56) / S;
  const sc = (p: number[]) => [(p[0] - OX) * S, (p[1] - OY) * S];
  const RT = m.route.map(sc), [px, py] = sc(m.a), [bx, by] = sc(m.b);
  const len = RT.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - RT[i][0], p[1] - RT[i][1]), 0);
  const vis = on(t, a - 0.2, 0.6) * (1 - k(t, [out - 0.6, out], [0, 1]));
  if (vis <= 0) return null;
  const z = k(t, [a - 0.2, rt[0] + 0.4], [2.4, 1], Easing.inOut(Easing.cubic)), tilt = k(t, [a - 0.2, pin + 0.3], [52, 0], Easing.out(Easing.cubic));
  const drop = k(t, [pin - 0.05, pin + 0.35], [0, 1], Easing.out(Easing.back(2))), r = k(t, rt, [0, 1], Easing.inOut(Easing.cubic)), arr = k(t, [rt[1] - 0.3, rt[1]], [0, 1]);
  return <div style={{position: 'absolute', left: 0, top: 0, width: w, height: top, overflow: 'hidden', opacity: vis, perspective: 1400}}>
    <div style={{position: 'absolute', inset: 0, transformOrigin: `${px}px ${py}px`, transform: `rotateX(${tilt}deg) scale(${z})`}}>
      <Img src={staticFile('media/mapa.png')} style={{position: 'absolute', left: -OX * S, top: -OY * S, width: m.W * S, height: m.H * S, maxWidth: 'none'}} />
      <svg width={w} height={top} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <polyline points={RT.map((p) => p.join(',')).join(' ')} fill="none" stroke="#ffe7b0" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={len} strokeDashoffset={len * (1 - r)} style={{filter: 'drop-shadow(0 0 10px rgba(255,210,140,.9))'}} />
        <circle cx={bx} cy={by} r={14 + 3 * Math.sin(t * 5)} fill="none" stroke={C.accent} strokeWidth={3} opacity={arr} />
        <circle cx={bx} cy={by} r={7} fill={C.accent} opacity={arr} />
      </svg>
      <div style={{position: 'absolute', left: px - 20, top: py - 52 - (1 - drop) * 120, opacity: Math.min(1, drop * 3)}}><Pin size={52} /></div>
      <div style={{position: 'absolute', left: px - 40, top: py + 24, opacity: drop, ...lab(24, C.text)}}>{labelA}</div>
      <div style={{position: 'absolute', left: bx - 420, top: by + 30, width: 420, textAlign: 'right', opacity: arr, ...lab(26, C.text)}}>{labelB}</div>
    </div>
    <div style={{position: 'absolute', right: 30, bottom: 26, fontFamily: SANS, fontSize: 14, color: 'rgba(242,234,223,.45)'}}>© OpenStreetMap</div>
  </div>;
};

// ---------- etiqueta de preço ----------
export const EtiquetaPreco: React.FC<{t: number; a: number; count: number; settle: number; out: number; value: number; prefix?: string;
  label?: string; note?: string}> = ({t, a, count, settle, out, value, prefix = 'US$', label = 'A PARTIR DE', note = ''}) => {
  const vis = on(t, a - 0.1, 0.4) * (1 - k(t, [out - 0.4, out], [0, 1]));
  if (vis <= 0) return null;
  const drop = k(t, [a - 0.1, a + 0.5], [0, 1], Easing.out(Easing.back(1.4)));
  const swing = 9 * Math.exp(-Math.max(0, t - a) * 1.6) * Math.sin((t - a) * 7.5) * (t < settle ? 1 : Math.exp(-(t - settle) * 6));
  const v = k(t, [count - 0.1, settle], [0, value], Easing.out(Easing.cubic)), hit = t >= settle ? Math.exp(-(t - settle) * 4) : 0;
  return <div style={{position: 'absolute', left: 540, top: -40 + (1 - drop) * -500, opacity: vis, transformOrigin: '50% 0',
    transform: `translateX(-50%) rotate(${swing}deg)`}}>
    <div style={{width: 3, height: 230, background: `linear-gradient(${C.accent}, ${C.accent}88)`, margin: '0 auto'}} />
    <div style={{position: 'relative', width: 720, padding: '46px 40px 40px', borderRadius: 26, background: `linear-gradient(160deg, #1a1612, ${C.bg})`,
      border: `2px solid ${C.accent}`, boxShadow: `0 30px 90px rgba(0,0,0,.7), 0 0 ${30 + 60 * hit}px ${C.accent}80`, textAlign: 'center'}}>
      <div style={{position: 'absolute', left: '50%', top: 16, width: 22, height: 22, marginLeft: -11, borderRadius: 11, border: `3px solid ${C.accent}`}} />
      <div style={{...lab(24), marginTop: 10}}>{label}</div>
      <div style={{...big(118), marginTop: 18, transform: `scale(${1 + 0.06 * hit})`, background: STYLE.accentFill, WebkitBackgroundClip: 'text',
        backgroundClip: 'text', color: 'transparent'}}>{prefix} {fmt(v)}</div>
      {note && <div style={{fontFamily: SANS, fontWeight: 500, fontSize: 22, color: C.dim, marginTop: 18, opacity: on(t, settle, 0.4)}}>{note}</div>}
    </div>
  </div>;
};
