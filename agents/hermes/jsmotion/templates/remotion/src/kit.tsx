// KIT jsmotion para Remotion — peças sem estilo próprio: tudo lê o STYLE (src/style.ts).
// Tempo sempre em SEGUNDOS da linha do tempo (t). Posições em fração da tela (0–1) e tamanhos em px de 1080
// (multiplicados por u, então o mesmo código serve 9:16, 1:1, 4:5 e 16:9).
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, continueRender, delayRender, interpolate,
  staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {STYLE} from './style';
import WORDS from './words.json';

export type Word = {w: string; t0: number; t1: number; hl?: number; br?: number};
export const VOICE = WORDS as {dur: number; lead: number; audio: string | null; words: Word[]; marks: Record<string, number>};

// ---------- tempo e layout ----------
const cl = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
/** interpola com easing e trava nas pontas: k(t, [0, 1], [0, 100]) */
export const k = (t: number, i: number[], o: number[], e = EASE) => interpolate(t, i, o, {...cl, easing: e});
/** 0→1 começando em a, durando d */
export const on = (t: number, a: number, d = 0.45) => k(t, [a, a + d], [0, 1]);
/** instante (s) de um marcador [nome] da narração, ou da palavra i */
export const mark = (name: string) => VOICE.words[VOICE.marks[name]]?.t0 ?? 0;
export const wordAt = (i: number) => VOICE.words[i]?.t0 ?? 0;
/** índice da primeira palavra cujo texto contém `s` (a partir de `after`) — p/ sincronizar sem contar à mão */
export const find = (s: string, after = 0) => {
  const n = (x: string) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w%]/g, '');
  const i = VOICE.words.findIndex((w, j) => j >= after && n(w.w).includes(n(s)));
  return i < 0 ? after : i;
};
export const useT = () => {
  const frame = useCurrentFrame(); const {fps, width: W, height: H} = useVideoConfig();
  return {t: frame / fps, fps, W, H, u: Math.min(W, H) / 1080, vertical: H > W * 1.2, wide: W > H * 1.2};
};

// ---------- fontes ----------
export const useFonts = () => {
  const [h] = useState(() => delayRender('fontes'));
  useEffect(() => {
    const all = Object.values(STYLE.fonts).flatMap((f: any) => f.files.map((x: any) => ({...x, family: f.family})));
    Promise.all(all.map((x) => new FontFace(x.family, `url(${staticFile(x.file)})`, {weight: x.weight, style: x.style}).load()
      .then((ff) => (document as any).fonts.add(ff)))).then(() => continueRender(h)).catch((e) => { console.error(e); continueRender(h); });
  }, [h]);
};
type FontKey = keyof typeof STYLE.fonts;
const fontCss = (key: FontKey, size: number): React.CSSProperties => {
  const f: any = STYLE.fonts[key];
  return {fontFamily: `"${f.family}"`, fontWeight: f.weight, fontStyle: f.italic ? 'italic' : 'normal', fontSize: size,
    textTransform: f.upper ? 'uppercase' : 'none', letterSpacing: `${f.tracking ?? 0}em`};
};
export const accentText: React.CSSProperties = {background: STYLE.accentFill, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent'};

// ---------- mídia real ----------
/** recorte de um vídeo/foto: s = zoom, o = ponto fixo do zoom ('50% 0%' = topo). Use para enquadrar o ASSUNTO
 *  (ex.: só o prédio, sem a calçada) — nunca para inventar o que não está na imagem. */
export type Shot = {src: string; from?: number; s?: number; o?: string};
export const Media: React.FC<{shot: Shot; zoom?: number; style?: React.CSSProperties}> = ({shot, zoom = 1, style}) => {
  const {fps} = useVideoConfig();
  const css: React.CSSProperties = {position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
    transform: `scale(${(shot.s ?? 1) * zoom})`, transformOrigin: shot.o ?? '50% 50%', ...style};
  return /\.(mp4|mov|webm)$/i.test(shot.src)
    ? <OffthreadVideo src={staticFile(shot.src)} startFrom={Math.round((shot.from ?? 0) * fps)} muted style={css} />
    : <Img src={staticFile(shot.src)} style={css} />;
};
/** cartão arredondado com sombra; x, y = centro em fração da tela; w, h em px de 1080 */
export const Card: React.FC<{x: number; y: number; w: number; h: number; r?: number; s?: number; o?: number; blur?: number;
  rot?: number; glow?: number; children: React.ReactNode}> = ({x, y, w, h, r = STYLE.radius, s = 1, o = 1, blur = 0, rot = 0, glow = 0, children}) => {
  const {W, H, u} = useT();
  return <div style={{position: 'absolute', left: x * W - (w * u) / 2, top: y * H - (h * u) / 2, width: w * u, height: h * u,
    borderRadius: r * u, overflow: 'hidden', opacity: o, filter: blur > 0.2 ? `blur(${blur * u}px)` : undefined,
    transform: `rotate(${rot}deg) scale(${s})`, border: `${glow > 0 ? 2 : 1}px solid ${glow > 0 ? STYLE.colors.accent : STYLE.cardBorder}`,
    boxShadow: `0 ${40 * u}px ${90 * u}px rgba(0,0,0,.65)${glow > 0 ? `, 0 0 ${60 * glow * u}px ${STYLE.colors.accent}88` : ''}`}}>{children}</div>;
};

// ---------- texto ----------
/** palavras entrando uma a uma, cada uma no seu instante: lines = [[['Milhares', 3.0], ['de', 3.6], ['km', 3.75, true]]] */
export type W = [string, number, boolean?];
export const Words: React.FC<{t: number; y: number; lines: W[][]; size?: number; font?: FontKey; preset?: 'rise' | 'pop' | 'type'}> =
  ({t, y, lines, size = 110, font = 'display', preset = 'rise'}) => {
    const {H, u} = useT(); const S = size * u;
    return <div style={{position: 'absolute', top: y * H, left: 50 * u, right: 50 * u, textAlign: 'center', lineHeight: 1.06, color: STYLE.colors.text, ...fontCss(font, S)}}>
      {lines.map((ln, i) => <div key={i}>{ln.map(([w, a, hl], j) => {
        const p = on(t, a, preset === 'type' ? 0.08 : 0.4);
        const tr = preset === 'pop' ? `scale(${0.6 + 0.4 * k(t, [a, a + 0.35], [0, 1], Easing.out(Easing.back(2)))})` : `translateY(${(1 - p) * S * 0.3}px)`;
        return <span key={j} style={{display: 'inline-block', margin: `0 ${S * 0.12}px`, opacity: p, transform: tr,
          filter: preset === 'rise' ? `blur(${(1 - p) * 12 * u}px)` : undefined, textShadow: hl ? 'none' : `0 ${4 * u}px ${30 * u}px rgba(0,0,0,.55)`,
          ...(hl ? accentText : {})}}>{w}</span>;
      })}</div>)}
    </div>;
  };
/** fala sincronizada direto do words.json: mostra as palavras de i0 a i1 (índices) conforme são faladas;
 *  as marcadas com *destaque* na narração saem no tom de destaque */
export const Say: React.FC<{t: number; i0: number; i1: number; y: number; size?: number; font?: FontKey; perLine?: number; preset?: 'rise' | 'pop' | 'type'}> =
  ({t, i0, i1, y, size = 90, font = 'display', perLine = 3, preset}) => {
    const ws = VOICE.words.slice(i0, i1 + 1); const lines: W[][] = [];
    ws.forEach((w, j) => { if (j % perLine === 0) lines.push([]); lines[lines.length - 1].push([w.w.replace(/[.,;:!?]+$/, ''), w.t0, !!w.hl]); });
    return <Words t={t} y={y} lines={lines} size={size} font={font} preset={preset} />;
  };
export const Caption: React.FC<{t: number; a: number; y: number; size?: number; children: React.ReactNode}> = ({t, a, y, size = 44, children}) => {
  const {H, u} = useT(); const p = on(t, a, 0.5);
  return <div style={{position: 'absolute', top: y * H, left: 80 * u, right: 80 * u, textAlign: 'center', ...fontCss('text', size * u),
    lineHeight: 1.3, color: STYLE.colors.text, opacity: p, transform: `translateY(${(1 - p) * 20 * u}px)`, textShadow: `0 ${4 * u}px ${24 * u}px rgba(0,0,0,.7)`}}>{children}</div>;
};
/** trecho em destaque dentro de Caption */
export const Hl: React.FC<{children: React.ReactNode}> = ({children}) => <span style={{color: STYLE.colors.accent, fontWeight: 600}}>{children}</span>;
/** rótulo em pílula (escura com borda no tom de destaque, ou cheia com fill) */
export const Pill: React.FC<{t: number; a: number; y: number; fill?: boolean; size?: number; children: React.ReactNode}> = ({t, a, y, fill, size = 26, children}) => {
  const {H, u} = useT(); const p = on(t, a, 0.4);
  return <div style={{position: 'absolute', top: y * H, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: p, transform: `translateY(${(1 - p) * 14 * u}px)`}}>
    <span style={{padding: `${12 * u}px ${30 * u}px`, borderRadius: 999, border: fill ? 'none' : `1.5px solid ${STYLE.colors.accent}99`,
      background: fill ? STYLE.accentFill : 'rgba(0,0,0,.6)', color: fill ? STYLE.colors.ink : STYLE.colors.text,
      ...fontCss('text', size * u), fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase'}}>{children}</span>
  </div>;
};
/** número que sobe até o valor (só números REAIS da marca/fonte citada) */
export const Counter: React.FC<{t: number; a: number; to: number; d?: number; decimals?: number; prefix?: string; suffix?: string;
  y: number; size?: number; font?: FontKey; comma?: boolean}> = ({t, a, to, d = 1.3, decimals = 0, prefix = '', suffix = '', y, size = 280, font = 'serif', comma = true}) => {
  const {H, u} = useT();
  const n = k(t, [a, a + d], [0, to], Easing.out(Easing.cubic));
  const s = n.toFixed(decimals); const txt = comma ? s.replace('.', ',') : s;
  const slam = k(t, [a, a + 0.25], [1.5, 1], Easing.out(Easing.back(2)));
  return <div style={{position: 'absolute', top: y * H, left: 0, right: 0, textAlign: 'center', ...fontCss(font, size * u), lineHeight: 1,
    opacity: on(t, a, 0.15), transform: `scale(${slam})`}}><span style={accentText}>{prefix}{txt}{suffix}</span></div>;
};

// ---------- cenas e transições ----------
/** monta a cena só entre a e b, com entrada (escala + fade) e saída (desfoque) rápidas.
 *  Os vídeos (<Media>) dentro dela começam no instante a (Sequence): Shot.from = ponto do clipe no início da cena. */
export const Scene: React.FC<{t: number; a: number; b: number; children: React.ReactNode}> = ({t, a, b, children}) => {
  const {fps} = useVideoConfig();
  if (t < a - 0.01 || t > b + 0.01) return null;
  const i = k(t, [a, a + 0.35], [0, 1]), o = k(t, [b - 0.3, b], [0, 1], Easing.in(Easing.cubic));
  return <Sequence from={Math.round(a * fps)} layout="none">
    <AbsoluteFill style={{opacity: Math.min(i, 1 - o), transform: `scale(${1.04 - 0.04 * i - 0.05 * o})`, filter: o > 0.02 ? `blur(${o * 16}px)` : undefined}}>{children}</AbsoluteFill>
  </Sequence>;
};
/** como Scene, sem transição (corte seco). Dentro de outra Scene/Cut, passe base = o início dela (Sequences somam). */
export const Cut: React.FC<{t: number; a: number; b: number; base?: number; children: React.ReactNode}> = ({t, a, b, base = 0, children}) => {
  const {fps} = useVideoConfig();
  if (t < a || t >= b) return null;
  return <Sequence from={Math.round((a - base) * fps)} layout="none"><AbsoluteFill>{children}</AbsoluteFill></Sequence>;
};
/** cartões voam das bordas e se juntam; o `hero` cresce e fica (os outros somem) */
export const Converge: React.FC<{t: number; a: number; shots: Shot[]; hero: number; y?: number}> = ({t, a, shots, hero, y = 0.4}) => {
  const dirs = [[-0.35, -0.32, -14], [0.39, -0.29, 12], [-0.39, 0.33, 10], [0.37, 0.36, -9], [0, -0.45, 5]];
  const m = k(t, [a + 1.1, a + 2.1], [0, 1], Easing.inOut(Easing.cubic));
  const {H, u} = useT(); const fit = Math.min(1, (H / u) * 0.6 / 1060); // no 16:9 o cartão final cabe na altura
  return <>{shots.map((sh, i) => {
    const [dx, dy, rot] = dirs[i % dirs.length]; const p = k(t, [a + i * 0.15, a + i * 0.15 + 0.9], [0, 1]);
    const isHero = i === hero, gone = isHero ? 0 : m, sp = isHero ? 1 - m : 1;
    return <Card key={i} x={0.5 + dx * (1 - p) * 1.6 + dx * 0.32 * p * sp} y={y + dy * (1 - p) * 1.6 + dy * 0.32 * p * sp}
      w={isHero ? 420 + (800 * fit - 420) * m : 420} h={isHero ? 600 + (1060 * fit - 600) * m : 600} rot={rot * (1 - m)} o={p * (1 - gone)} blur={(1 - p) * 20} s={isHero ? 1 : 1 - 0.3 * gone}>
      <Media shot={sh} /></Card>;
  })}</>;
};
/** cartões girando em elipse em volta de um cartão central; em `lock` o anel acende no tom de destaque */
export const Orbit: React.FC<{t: number; a: number; center: Shot; shots: Shot[]; lock?: number; y?: number}> = ({t, a, center, shots, lock: lk, y = 0.4}) => {
  const {W, H, u} = useT();
  const ring = k(t, [a, a + 1.2], [0, 1]), c = k(t, [a, a + 0.7], [0, 1]), lock = lk ? k(t, [lk, lk + 0.5], [0, 1]) : 0;
  return <>
    {shots.map((sh, i) => {
      const ang = (i / shots.length) * Math.PI * 2 + (t - a) * 0.32, R = (420 - 100 * lock) * u, front = (Math.sin(ang) + 1) / 2;
      return <Card key={i} x={0.5 + (Math.cos(ang) * R * ring) / W} y={y + (Math.sin(ang) * R * 0.86 * ring) / H} w={150} h={190} r={16}
        o={ring * (0.45 + 0.55 * front) * (1 - lock * 0.6)} s={0.85 + 0.3 * front} blur={(1 - front) * 3}><Media shot={sh} /></Card>;
    })}
    <svg width={W} height={H} style={{position: 'absolute', opacity: lock}}>
      <ellipse cx={W / 2} cy={y * H} rx={400 * u} ry={345 * u} fill="none" stroke={STYLE.colors.accent} strokeWidth={2.5 * u}
        strokeDasharray={`${lock * 2400 * u} ${3000 * u}`} style={{filter: `drop-shadow(0 0 ${14 * u}px ${STYLE.colors.accent})`}} />
    </svg>
    <Card x={0.5} y={y} w={460} h={600} s={0.7 + 0.3 * c} o={c} glow={lock}><Media shot={center} /></Card>
  </>;
};
/** parede inclinada de cartões rolando (fundo de impacto); dim escurece */
export const Wall: React.FC<{t: number; t0: number; shots: Shot[]; dim?: number}> = ({t, t0, shots, dim = 0}) => {
  const pan = (t - t0) * 26;
  return <AbsoluteFill style={{transform: 'rotate(-11deg) scale(1.35)', opacity: 1 - dim}}>
    {Array.from({length: 15}).map((_, i) => {
      const c = i % 3, r = Math.floor(i / 3);
      return <Card key={i} x={(180 + c * 360) / 1080} y={(-120 + r * 470 + (c % 2 ? 200 : 0) - pan * (c % 2 ? 1 : -1) * 0.8) / 1920} w={330} h={440} r={20}>
        <Media shot={shots[(i * 3 + c) % shots.length]} /></Card>;
    })}
  </AbsoluteFill>;
};
/** um cartão que abre até a tela cheia (ex.: revelar o produto/prédio depois da logo) */
export const Expand: React.FC<{t: number; a: number; shot: Shot; d?: number; shade?: boolean}> = ({t, a, shot, d = 0.9, shade = true}) => {
  const {W, H, u} = useT(); if (t < a) return null;
  const open = k(t, [a, a + d], [0, 1], Easing.inOut(Easing.cubic));
  return <Card x={0.5} y={0.5} w={(560 + (W / u - 560) * open)} h={(760 + (H / u - 760) * open)} r={STYLE.radius * (1 - open)} o={k(t, [a, a + 0.25], [0, 1])}>
    <Media shot={shot} zoom={1.12 - 0.1 * k(t, [a, a + 7], [0, 1], Easing.linear)} />
    {shade && <AbsoluteFill style={{background: `linear-gradient(180deg, ${STYLE.colors.bg}88 0%, transparent 22%, transparent 45%, ${STYLE.colors.bg}e6 68%)`, opacity: open}} />}
  </Card>;
};

// ---------- acabamento ----------
/** tremida curta nos impactos: style={{transform: shake(t, [10.2, 22.5])}} */
export const shake = (t: number, at: number[], amp = 16) => {
  const s = at.map((a) => (t > a && t < a + 0.6 ? Math.exp(-(t - a) * 7) : 0)).reduce((x, y) => x + y, 0);
  return `translate(${Math.sin(t * 91) * amp * s}px, ${Math.cos(t * 77) * amp * 0.75 * s}px)`;
};
export const Flash: React.FC<{t: number; at: number[]; color?: string; max?: number}> = ({t, at, color = '#fff6e6', max = 0.4}) =>
  <AbsoluteFill style={{background: color, mixBlendMode: 'screen', opacity: Math.max(0, ...at.map((a) => k(t, [a - 0.02, a + 0.02, a + 0.25], [0, max, 0], Easing.linear)))}} />;
export const Finish: React.FC<{t: number}> = ({t}) => <>
  {STYLE.glowTop > 0 && <AbsoluteFill style={{background: `radial-gradient(70% 38% at 50% 0%, ${STYLE.colors.accent}${Math.round((STYLE.glowTop + 0.04 * Math.sin(t * 0.8)) * 255).toString(16).padStart(2, '0')}, transparent 70%)`, pointerEvents: 'none'}} />}
  {STYLE.vignette > 0 && <AbsoluteFill style={{background: `radial-gradient(120% 80% at 50% 50%, transparent 60%, rgba(0,0,0,${STYLE.vignette}) 100%)`}} />}
</>;

// ---------- som ----------
/** voz (do voice.py), trilha (do music.py) abaixando sob a voz, e efeitos [arquivo, instante, volume] */
export const Soundtrack: React.FC<{music?: string; sfx?: [string, number, number][]; end: number}> = ({music, sfx = [], end}) => {
  const {fps} = useVideoConfig();
  const talking = (s: number) => VOICE.words.some((w) => s > w.t0 - 0.15 && s < w.t1 + 0.35);
  const duck = (s: number) => { // média curta para não "bombear"
    let n = 0; for (let d = -0.2; d <= 0.2; d += 0.1) n += talking(s + d) ? 1 : 0; return 1 - (1 - STYLE.music.duck) * (n / 5);
  };
  return <>
    {VOICE.audio && <Sequence from={Math.round(VOICE.lead * fps)}><Audio src={staticFile(VOICE.audio)} /></Sequence>}
    {music && <Audio src={staticFile(music)} volume={(f) => STYLE.music.volume * duck(f / fps) * interpolate(f / fps, [0, 0.3, end - 1.6, end], [0, 1, 1, 0], cl)} />}
    {sfx.map(([s, a, v], i) => <Sequence key={i} from={Math.round(a * fps)} durationInFrames={Math.round(2 * fps)}><Audio src={staticFile(s)} volume={v} /></Sequence>)}
  </>;
};
