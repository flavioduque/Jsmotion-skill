// jsmotion — modo MÍDIA REAL + 3D. Tudo vem de src/project.json (gerado pelo scripts/real3d.py):
// clipes reais em tela cheia, voz + trilha, legendas da fala, palavras-chave em 3D de verdade (three.js),
// logo de abertura, cabeçalho, faixa de assinatura fixa e chamada final. Não edite à mão: edite o real3d.json.
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig,
  interpolate, Easing, delayRender, continueRender} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {FontLoader, TextGeometry} from 'three-stdlib';
import P from './project.json';
import displayFont from './fonts/display.json';
import numberFont from './fonts/number.json';

const Pj: any = P;
const C = Pj.colors;
const FONTS: any = {display: displayFont, number: numberFont};
const PARSED: any = {display: new FontLoader().parse(displayFont as any), number: new FontLoader().parse(numberFont as any)};
const GEO = new Map<string, any>();
const geo = (f: string, txt: string, s: number) => {
  const k = `${f}|${txt}|${s.toFixed(3)}`;
  if (!GEO.has(k)) GEO.set(k, new TextGeometry(txt, {font: PARSED[f], size: s, height: s * 0.32, curveSegments: 10,
    bevelEnabled: true, bevelThickness: s * 0.05, bevelSize: s * 0.035, bevelSegments: 4} as any));
  return GEO.get(k);
};
// largura do texto pelas larguras dos glifos (centralizar sem esperar a geometria)
const measure = (f: string, txt: string, s: number) =>
  [...txt].reduce((a, c) => a + ((FONTS[f].glyphs[c]?.ha ?? 500) * s) / FONTS[f].resolution, 0);
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fmtCounter = (c: any, v: number) => {
  const n = c.dec ? v.toFixed(c.dec).replace('.', ',') : Math.round(v).toLocaleString('pt-BR');
  return `${c.pre ?? ''}${n}${c.suf ?? ''}`;
};

// ---------- palavra-chave 3D ----------
const Word3D: React.FC<{k: any; t: number; viewW: number; viewH: number}> = ({k, t, viewW, viewH}) => {
  const d = t - k.t0, rem = k.t1 - t;
  const inP = interpolate(d, [0, 0.75], [0, 1], {...clamp, easing: ease});
  const outP = interpolate(rem, [0, 0.35], [1, 0], {...clamp, easing: Easing.in(Easing.cubic)});
  const z = -14 * (1 - inP) + 2.2 * outP;
  const ry = -0.9 * (1 - inP) + Math.sin(d * 0.9) * 0.18;
  const rx = 0.5 * (1 - inP) + Math.sin(d * 0.7 + 1) * 0.06;
  const vis = Math.min(inP * 1.4, 1) * (1 - outP);
  const f0 = k.counter ? 'number' : 'display';
  let lines: string[] = k.lines;
  if (k.counter) {
    const c = k.counter;
    const v = c.from + (c.to - c.from) * interpolate(d, [0.1, 1.5], [0, 1], {...clamp, easing: ease});
    lines = [fmtCounter(c, v), ...k.lines.slice(1)];
  }
  const subScale = k.counter ? 0.3 : 1;  // linha de apoio do contador é menor
  const finalTxt = k.counter ? fmtCounter(k.counter, k.counter.to) : lines[0];
  const maxW = Math.max(measure(f0, finalTxt, 1), ...k.lines.slice(1).map((l: string) => measure('display', l, 1) * subScale));
  const size = Math.min(k.counter ? 1.4 : 0.8, (viewW * 0.72) / maxW);
  return (
    <group position={[0, viewH * Pj.kwY, z]} rotation={[rx, ry, 0]} scale={vis > 0.001 ? 1 : 0.0001}>
      {lines.map((l, i) => {
        const big = i === 0, f = big ? f0 : 'display';
        const s = big ? size : size * subScale;
        const y = big ? 0 : -(size * 1.25) - (i - 1) * s * 1.3 - (k.counter ? 0.2 : 0);
        return (
          <group key={i} position={[-measure(f, l, s) / 2, y - s * 0.36, -s * 0.16]}>
            <mesh geometry={geo(f, l, s)}>
              <meshStandardMaterial color={big ? C.gold3d : C.light3d} metalness={0.45} roughness={0.3}
                emissive={C.emissive3d} emissiveIntensity={0.5} transparent opacity={vis} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

// ---------- clipe real em tela cheia (corte com leve "punch" + Ken Burns) ----------
const Clip: React.FC<{c: any; i: number}> = ({c, i}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const t = f / fps;
  const z0 = i % 2 ? 1.1 : 1.0, z1 = i % 2 ? 1.02 : 1.08;
  const kb = interpolate(t, [0, c.dur], [z0, z1], clamp);
  const punch = interpolate(t, [0, 0.3], [i === 0 ? 1 : 1.06, 1], {...clamp, easing: ease});
  return (
    <AbsoluteFill style={{transform: `scale(${kb * punch})`}}>
      <OffthreadVideo src={staticFile(c.src)} startFrom={Math.round(c.from * fps)} muted
        style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    </AbsoluteFill>
  );
};

export const Reel: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const [handle] = useState(() => delayRender('fonte da interface'));
  useEffect(() => {
    const ff = new FontFace('UI', `url(${staticFile('ui.woff2')})`);
    ff.load().then((x) => { (document as any).fonts.add(x); continueRender(handle); }).catch(() => continueRender(handle));
  }, [handle]);
  const viewH = 2 * 20 * Math.tan((30 / 2) * Math.PI / 180), viewW = viewH * width / height;
  const act = (Pj.keywords as any[]).filter((k) => t >= k.t0 && t <= k.t1);
  const dim = act.length ? Math.min(1, Math.min(...act.map((k) => Math.min(t - k.t0, k.t1 - t))) / 0.3) : 0;
  const cap = (Pj.captions as any[]).find((c) => t >= c.t0 && t < c.t1);
  const capIn = cap ? interpolate(t - cap.t0, [0, 0.15], [0, 1], clamp) : 0;
  const I = Pj.intro, cta = Pj.cta;
  const introOp = I ? interpolate(t, [I.t0, I.t0 + 0.8, I.t1 - 0.4, I.t1], [0, 1, 1, 0], clamp) : 0;
  const hdrOp = Pj.header ? interpolate(t, [I ? I.t1 - 0.2 : 0, I ? I.t1 + 0.3 : 0.01], [0, 1], clamp) : 0;
  const ctaOp = cta ? interpolate(t, [cta.t0, cta.t0 + 0.6], [0, 1], {...clamp, easing: ease}) : 0;
  const pulse = cta && t > cta.t0 + 1.2 ? 1 + 0.04 * Math.sin((t - cta.t0) * Math.PI * 2) : 1;
  const u = width / 1080;  // escala da interface (layout pensado em 1080 de largura)
  const lx = Math.sin(t * 1.3) * 6;
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, fontFamily: 'UI, sans-serif'}}>
      {(Pj.clips as any[]).map((c, i) => (
        <Sequence key={i} from={Math.round(c.at * fps)} durationInFrames={Math.round(c.dur * fps)}>
          <Clip c={c} i={i} />
        </Sequence>
      ))}
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${C.bg}99 0%, ${C.bg}00 12%, ${C.bg}00 64%, ${C.bg}c8 84%, ${C.bg}ee 100%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(70% 28% at 50% ${50 - Pj.kwY * 100}%, ${C.bg}a0, ${C.bg}00 75%)`, opacity: dim}} />
      <ThreeCanvas linear width={width} height={height} camera={{fov: 30, position: [0, 0, 20]}} gl={{antialias: true, alpha: true}}
        style={{position: 'absolute', inset: 0}}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[4, 6, 10]} intensity={2.4} color={'#fff1d6'} />
        <directionalLight position={[-6, -2, 6]} intensity={0.9} color={C.accent} />
        <pointLight position={[lx, 3, 6]} intensity={60} distance={30} color={'#ffffff'} />
        {act.map((k) => <Word3D key={k.t0} k={k} t={t} viewW={viewW} viewH={viewH} />)}
      </ThreeCanvas>
      {I && introOp > 0 && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: introOp}}>
          <Img src={staticFile(I.logo)} style={{width: 520 * u, transform: `scale(${interpolate(t, [I.t0, I.t0 + 1.2], [1.2, 1], {...clamp, easing: ease})})`,
            filter: `blur(${interpolate(t, [I.t0, I.t0 + 1], [12, 0], clamp)}px)`}} />
          <div style={{width: 420 * u, height: 2 * u, margin: `${34 * u}px 0 ${22 * u}px`, background: C.accent,
            transform: `scaleX(${interpolate(t, [I.t0 + 0.6, I.t0 + 1.5], [0, 1], {...clamp, easing: ease})})`}} />
          {I.sub && <div style={{fontWeight: 600, fontSize: 26 * u, letterSpacing: 4 * u, color: C.accentLight, whiteSpace: 'nowrap', textAlign: 'center'}}>{I.sub}</div>}
        </AbsoluteFill>
      )}
      {Pj.header && (
        <div style={{position: 'absolute', top: 56 * u, left: 0, right: 0, textAlign: 'center', opacity: hdrOp}}>
          <Img src={staticFile(Pj.header.logo)} style={{height: 66 * u}} />
          <div style={{width: 280 * u, height: 1, margin: `${18 * u}px auto 0`, background: C.accent, opacity: 0.6}} />
        </div>
      )}
      {cap && (
        <div style={{position: 'absolute', left: 60 * u, right: 60 * u, top: height - 525 * u, height: 150 * u, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', opacity: capIn * (1 - ctaOp)}}>
          <span style={{padding: `${14 * u}px ${26 * u}px`, borderRadius: 18 * u, background: `${C.bg}a8`, fontWeight: 600, fontSize: 38 * u, lineHeight: 1.3, color: C.text, textAlign: 'center',
            transform: `translateY(${(1 - capIn) * 14 * u}px)`}}>{cap.text}</span>
        </div>
      )}
      {cta && ctaOp > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: height - 580 * u, textAlign: 'center', opacity: ctaOp, transform: `translateY(${(1 - ctaOp) * 60 * u}px)`}}>
          <div style={{fontWeight: 600, fontSize: 40 * u, letterSpacing: 4 * u, color: C.accentLight, textShadow: '0 6px 24px rgba(0,0,0,.9)', marginBottom: 18 * u}}>{cta.text}</div>
          {cta.value && (
            <div style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 640 * u, height: 112 * u, borderRadius: 56 * u,
              background: C.accent, color: C.bg, transform: `scale(${pulse})`}}>
              <small style={{fontWeight: 600, fontSize: 20 * u, letterSpacing: 5 * u}}>{cta.label}</small>
              <b style={{fontWeight: 600, fontSize: 44 * u}}>{cta.value}</b>
            </div>
          )}
        </div>
      )}
      {Pj.band && (
        <div style={{position: 'absolute', left: 50 * u, right: 50 * u, top: height - 348 * u, height: 118 * u, display: 'flex', alignItems: 'center', gap: 26 * u,
          padding: `0 ${26 * u}px`, borderTop: `1px solid ${C.accent}8c`, background: `linear-gradient(180deg, ${C.bg}dc, ${C.bg}f0)`}}>
          {(Pj.band.images as string[]).map((src, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div style={{width: 1, height: 70 * u, background: `${C.accent}99`}} />}
              <Img src={staticFile(src)} style={{height: (i === 0 ? 84 : 96) * u}} />
            </React.Fragment>
          ))}
          {Pj.band.value && (<>
            <div style={{width: 1, height: 70 * u, background: `${C.accent}99`}} />
            <div style={{display: 'flex', flexDirection: 'column', gap: 4 * u}}>
              <small style={{fontWeight: 600, fontSize: 17 * u, letterSpacing: 4 * u, color: C.accent}}>{Pj.band.label}</small>
              <b style={{fontWeight: 600, fontSize: 30 * u, color: C.text}}>{Pj.band.value}</b>
            </div>
          </>)}
        </div>
      )}
      {Pj.voice && (
        <Sequence from={Math.round(Pj.voice.at * fps)}><Audio src={staticFile(Pj.voice.src)} volume={Pj.voice.volume} /></Sequence>
      )}
      {Pj.music && (
        <Audio src={staticFile(Pj.music.src)} startFrom={Math.round((Pj.music.from || 0) * fps)}
          volume={(f) => Pj.music.volume * interpolate(f / fps, [0, 0.5, Pj.duration - 1.8, Pj.duration], [0, 1, 1, 0], clamp)} />
      )}
    </AbsoluteFill>
  );
};
