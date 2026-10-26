// MODO APRESENTADOR — editar um vídeo de alguém falando (gravação própria ou avatar do HeyGen e afins).
// A pessoa alterna entre 3 composições, no tempo da fala:
//   F = tela cheia (confiança, opinião, gancho, convite) · M = moldura (pessoa + explicação juntas)
//   O = fora de quadro (a demonstração precisa da tela toda; a voz continua)
// O recorte é RECALCULADO a cada quadro a partir do rosto rastreado (src/face.json, scripts/face_track.py): a cabeça
// nunca é cortada quando a moldura muda de tamanho. Legenda com faixa própria em cada composição.
//
//   const KEYS: Keys = [[0,'F'], [4.5,'F'], [5.3,'M'], [21.7,'M'], [22.4,'O'], … , [99,'F']];   // pares instante→estado
//   <Presenter t={t} keys={KEYS} label={<>NOME · EMPRESA</>} />      <Captions t={t} keys={KEYS} mute={[[a, b]]} />
import React from 'react';
import {AbsoluteFill, Easing, OffthreadVideo, Sequence, staticFile, useVideoConfig} from 'remotion';
import {STYLE} from './style';
import {VOICE, k, useT} from './kit';
import FACE from './face.json';

export type St = 'F' | 'M' | 'O';
export type Keys = [number, St][];
export type Box = {x: number; y: number; w: number; h: number; r: number};

/** caixas padrão por formato: vertical = moldura embaixo; quadrado/horizontal = moldura numa coluna à direita */
export const boxes = (W: number, H: number): Record<St, Box> => {
  const u = Math.min(W, H) / 1080, F = {x: 0, y: 0, w: W, h: H, r: 0};
  if (H > W * 1.2) {
    const M = {x: W * 0.12, y: H * 0.615, w: W * 0.76, h: H * 0.365, r: 28 * u};
    return {F, M, O: {...M, y: H + 70 * u}};
  }
  const M = {x: W * 0.56, y: H * 0.1, w: W * 0.38, h: H * 0.8, r: 28 * u};
  return {F, M, O: {...M, x: W + 70 * u}};
};

const IO = Easing.inOut(Easing.cubic);
const alpha = (hex: string, a: number) => hex + Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0');
/** composição no instante t: caixa interpolada, peso de cada estado (para legenda/moldura) e se está em movimento */
export const layout = (t: number, keys: Keys, B: Record<St, Box>) => {
  let i = 0;
  while (i < keys.length - 2 && t >= keys[i + 1][0]) i++;
  const [a, sa] = keys[i], [b, sb] = keys[Math.min(i + 1, keys.length - 1)];
  const p = sa === sb ? 0 : k(t, [a, b], [0, 1], IO);
  const A = B[sa], C = B[sb], m = (x: number, y: number) => x + (y - x) * p;
  const w = {F: 0, M: 0, O: 0}; w[sa] += 1 - p; w[sb] += p;
  return {r: {x: m(A.x, C.x), y: m(A.y, C.y), w: m(A.w, C.w), h: m(A.h, C.h), r: m(A.r, C.r)}, w, moving: sa !== sb && p > 0.04 && p < 0.96};
};

// rosto no arquivo original, suavizado em ±0,6 s (sem tremor de detecção; sem rosto → mantém o último trecho bom)
const FD = FACE as {w: number; h: number; pts: number[][]};
export const face = (t: number) => {
  let sx = 0, sy = 0, n = 0;
  for (const p of FD.pts) if (Math.abs(p[0] - t) <= 0.6) { sx += p[1]; sy += p[2]; n++; }
  if (n) return {x: sx / n, y: sy / n};
  const near = FD.pts.reduce<number[] | null>((b, p) => (!b || Math.abs(p[0] - t) < Math.abs(b[0] - t) ? p : b), null);
  return near ? {x: near[1], y: near[2]} : {x: FD.w / 2, y: FD.h * 0.3};
};

/** a pessoa: caixa animada + recorte recalculado (escala s = max(caixa/origem) × push; rosto a `head` da altura) */
export const Presenter: React.FC<{t: number; keys: Keys; src?: string; B?: Record<St, Box>; push?: (t: number) => number;
  head?: number; end?: number; label?: React.ReactNode}> = ({t, keys, src = 'media/apresentador.mp4', B, push, head = 0.36, end = 1e9, label}) => {
  const {W, H, u} = useT(), bx = B ?? boxes(W, H);
  const {r: R, w} = layout(t, keys, bx);
  const fade = 1 - k(t, [end - 0.1, end + 0.4], [0, 1]);
  if (R.y >= H - 5 || R.x >= W - 5 || fade <= 0) return null;
  const f = face(t), fr = w.M, sw = FD.w, sh = FD.h;
  const s = Math.max(R.w / sw, R.h / sh) * (push ? push(t) : 1);
  const ww = R.w / s, wh = R.h / s;
  const wx = Math.min(Math.max(f.x - ww / 2, 0), sw - ww), wy = Math.min(Math.max(f.y - wh * head, 0), sh - wh);
  const ac = STYLE.colors.accent;   // cor #rrggbb; a moldura acende conforme a pessoa entra no estado M
  return <div style={{position: 'absolute', left: R.x, top: R.y, width: R.w, height: R.h, borderRadius: R.r, overflow: 'hidden', opacity: fade,
    outline: fr > 0.02 ? `${2 * u}px solid ${alpha(ac, 0.9 * fr)}` : 'none',
    boxShadow: `0 ${30 * u}px ${80 * u}px rgba(0,0,0,${0.65 * fr}), 0 0 ${46 * u * fr}px ${alpha(ac, 0.28 * fr)}`}}>
    <OffthreadVideo src={staticFile(src)} muted
      style={{position: 'absolute', left: -wx * s, top: -wy * s, width: sw * s, height: sh * s, maxWidth: 'none'}} />
    {label && <>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 130 * u, opacity: fr,
        background: `linear-gradient(180deg, transparent, ${alpha(STYLE.colors.bg, 0.88)})`}} />
      <div style={{position: 'absolute', left: 26 * u, bottom: 22 * u, opacity: fr, color: STYLE.colors.text, fontFamily: STYLE.fonts.text.family,
        fontWeight: 600, fontSize: 17 * u, letterSpacing: '0.14em', textTransform: 'uppercase'}}>{label}</div>
    </>}
  </div>;
};

// legenda: frase da vez (quebra em . ? ! e em vírgula longa), palavra falada no destaque
type Wd = {w: string; t0: number; t1: number};
const chunk = (max: number): Wd[][] => {
  const out: Wd[][] = []; let cur: Wd[] = [];
  VOICE.words.forEach((w) => {
    cur.push(w as Wd);
    if (/[.?!]$/.test(w.w) || (/[,:;]$/.test(w.w) && cur.length >= Math.min(3, max)) || cur.length >= max) { out.push(cur); cur = []; }
  });
  if (cur.length) out.push(cur);
  return out;
};
/** faixa (fração da altura) por composição: nunca em cima do rosto nem da explicação. mute = trechos em que o
 *  lettering/3D já mostra as mesmas palavras. Some enquanto a composição se move (texto não "viaja" com a moldura). */
export const Captions: React.FC<{t: number; keys: Keys; B?: Record<St, Box>; mute?: [number, number][]; bands?: Record<St, number>; size?: number;
  maxWords?: number}> =
  ({t, keys, B, mute = [], bands, size = 46, maxWords = 6}) => {
    const CHUNKS = React.useMemo(() => chunk(maxWords), [maxWords]);   // maxWords 1–3 = legenda curta (palavra a palavra)
    const {W, H, u, vertical} = useT(), bx = B ?? boxes(W, H);
    const L = layout(t, keys, bx);
    if (L.moving || mute.some(([a, b]) => t >= a && t < b)) return null;
    const i = CHUNKS.findIndex((c, j) => t >= c[0].t0 - 0.05 && (j === CHUNKS.length - 1 || t < CHUNKS[j + 1][0].t0 - 0.05));
    if (i < 0) return null;
    const c = CHUNKS[i];
    if (t > c[c.length - 1].t1 + 0.7) return null;
    const band = bands ?? (vertical ? {F: 0.855, M: 0.565, O: 0.93} : {F: 0.86, M: 0.86, O: 0.88});
    const y = (L.w.F * band.F + L.w.M * band.M + L.w.O * band.O) * H;
    const right = !vertical && L.w.M > 0.5 ? W - bx.M.x + 30 * u : 70 * u;   // horizontal: legenda na coluna livre
    return <div style={{position: 'absolute', left: 70 * u, right, top: y, transform: 'translateY(-50%)', textAlign: 'center',
      fontFamily: STYLE.fonts.text.family, fontWeight: 600, fontSize: size * u, lineHeight: 1.18, letterSpacing: '0.02em', textTransform: 'uppercase',
      textShadow: '0 3px 18px rgba(0,0,0,.85), 0 0 2px rgba(0,0,0,.9)'}}>
      {c.map((w, j) => {
        const now = t >= w.t0 - 0.03 && (j === c.length - 1 || t < c[j + 1].t0 - 0.03);
        return <span key={j} style={{display: 'inline-block', margin: '0 0.14em', color: now ? STYLE.colors.accent : STYLE.colors.text,
          opacity: t >= w.t0 - 0.03 ? 1 : 0.42, transform: `scale(${now ? 1.06 : 1})`}}>{w.w.replace(/[.,;:*]$/, '').replace(/\*/g, '')}</span>;
      })}
    </div>;
  };

/** vídeo de apoio atrás da explicação (filmagem real ou clipe gerado a partir de referência real): começa no
 *  instante a; from = ponto do clipe; rate < 1 estica um trecho curto; dim escurece para o texto respirar */
export const Clip: React.FC<{t: number; src: string; a: number; b: number; from?: number; rate?: number; s?: number; o?: string;
  dim?: number; fadeIn?: number; fadeOut?: number}> = ({t, src, a, b, from = 0, rate = 1, s = 1, o = '50% 50%', dim = 0.5, fadeIn = 0.5, fadeOut = 0.5}) => {
  const {fps} = useVideoConfig();
  if (t < a || t > b) return null;
  const op = (fadeIn ? k(t, [a, a + fadeIn], [0, 1]) : 1) * (fadeOut ? 1 - k(t, [b - fadeOut, b], [0, 1]) : 1);
  return <Sequence from={Math.round(a * fps)} layout="none">
    <AbsoluteFill style={{opacity: op}}>
      <OffthreadVideo src={staticFile(src)} muted playbackRate={rate} startFrom={Math.round(from * fps)}
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s + 0.04 * (t - a) / (b - a)})`,
          transformOrigin: o, filter: `brightness(${dim}) saturate(.9)`}} />
      <AbsoluteFill style={{background: `radial-gradient(90% 60% at 50% 35%, ${alpha(STYLE.colors.bg, 0.15)}, ${alpha(STYLE.colors.bg, 0.85)} 92%)`}} />
    </AbsoluteFill>
  </Sequence>;
};
