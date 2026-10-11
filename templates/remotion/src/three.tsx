// Peças 3D (three.js via @remotion/three) — ênfase pontual: palavra de impacto, número, comparação em volume.
// Tudo é função do tempo da edição (t): nada de useFrame, relógio, damping ou física (o render pula quadros).
// Uso: <ThreeCanvas linear width height camera={{fov: 30, position: [0, 0, 8]}} gl={{antialias: true, alpha: true}}>
//        <Env /><Lights /> … <Text3D txt="IMPACTO" size={1} maxW={7.4} /> </ThreeCanvas>
// A fonte 3D é a display do STYLE: python3 $SK/scripts/assets.py three $WORK/video (gera public/three/display.json).
import React, {useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader.js';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {STYLE} from './style';
import DISPLAY from '../public/three/display.json';

const FONT = new FontLoader().parse(DISPLAY as any);
const GEO = new Map<string, THREE.BufferGeometry>();
/** texto extrudado e centralizado (cache por texto e tamanho) */
export const textGeo = (txt: string, size: number) => {
  const key = `${txt}|${size}`;
  if (!GEO.has(key)) {
    const g = new TextGeometry(txt, {font: FONT, size, depth: size * 0.26, curveSegments: 8, bevelEnabled: true,
      bevelThickness: size * 0.035, bevelSize: size * 0.025, bevelSegments: 3} as any);
    g.computeBoundingBox(); g.center(); GEO.set(key, g);
  }
  return GEO.get(key)!;
};

/** reflexo de ambiente: sem ele o metal fica chapado (preto) */
export const Env: React.FC = () => {
  const {gl, scene} = useThree();
  useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  }, [gl, scene]);
  return null;
};
export const LookAt: React.FC<{y?: number}> = ({y = 0}) => {
  const {camera} = useThree();
  camera.lookAt(0, y, 0);
  return null;
};
export const Lights: React.FC = () => <>
  <ambientLight intensity={0.25} />
  <directionalLight position={[3, 5, 8]} intensity={2.0} color="#fff4e2" />
  <directionalLight position={[-6, -2, 4]} intensity={0.7} color={STYLE.colors.accent} />
</>;

/** metal = cor de destaque do STYLE · fosco = cor do texto */
export type Look = 'metal' | 'matte';
const mat = (look: Look) => look === 'metal'
  ? {color: STYLE.colors.accent, metalness: 1, roughness: 0.24}
  : {color: STYLE.colors.text, metalness: 0.15, roughness: 0.4};

/** maxW: largura máxima (unidades da cena) — o texto encolhe para caber, nunca é comprimido na horizontal */
export const Text3D: React.FC<{txt: string; size: number; look?: Look; opacity?: number; maxW?: number}> = ({txt, size, look = 'metal', opacity = 1, maxW}) => {
  const g = textGeo(txt, size), bb = g.boundingBox!, w = bb.max.x - bb.min.x;
  const f = maxW ? Math.min(1, maxW / w) : 1;
  return <mesh geometry={g} scale={f}>
    <meshStandardMaterial {...mat(look)} envMapIntensity={1.15} transparent={opacity < 1} opacity={opacity} />
  </mesh>;
};

/** comparação em volume: barras na MESMA escala (só dados reais), número em cima e nome na face de cada barra.
 *  g[i] = crescimento 0→1 de cada barra (anime com k(t, …)); a barra só existe com g > 0,02 (sem "placa" achatada). */
const BAR = new THREE.BoxGeometry(1.5, 1, 1.5);
export const Bars3D: React.FC<{items: {value: number; label: string; hi?: boolean}[]; g: number[]; t: number; unit?: number; gap?: number}> =
  ({items, g, t, unit = 0.26, gap = 2.8}) => {
    const x0 = -((items.length - 1) * gap) / 2;
    return <group rotation={[0.12, -0.28 + Math.sin(t * 0.35) * 0.1, 0]} position={[0, -2.4, 0]}>
      {items.map((it, i) => {
        const p = g[i] ?? 0, h = it.value * unit * p, look: Look = it.hi ? 'metal' : 'matte';
        return <group key={i} position={[x0 + i * gap, 0, 0]}>
          {p > 0.02 && <mesh geometry={BAR} position={[0, h / 2, 0]} scale={[1, h, 1]}>
            <meshStandardMaterial {...mat(look)} envMapIntensity={1.1} />
          </mesh>}
          {p > 0.02 && <group position={[0, h + 0.75, 0]} scale={p}><Text3D txt={String(Math.round(it.value * p))} size={0.85} look={look} /></group>}
          {p > 0.6 && <group position={[0, Math.min(0.42, h / 2), 0.78]}><Text3D txt={it.label} size={0.26} look={it.hi ? 'matte' : 'metal'} maxW={1.3} /></group>}
        </group>;
      })}
    </group>;
  };

/** pilha de moedas que cresce com p (0→1): o volume ilustra a quantia; o valor real vem de um <Counter> ao lado */
const COIN = new THREE.CylinderGeometry(0.62, 0.62, 0.15, 56);
const COLS: [number, number][] = [[-1.45, 0.2], [0, -0.35], [1.45, 0.2], [-0.72, 1.05], [0.72, 1.05]];
export const CoinStack: React.FC<{p: number; t: number; per?: number}> = ({p, t, per = 9}) => {
  const N = COLS.length * per, shown = p * N, coins = [];
  for (let i = 0; i < N; i++) {
    const q = Math.min(1, Math.max(0, shown - i));
    if (q <= 0) break;
    const c = i % COLS.length, lvl = Math.floor(i / COLS.length), e = 1 - Math.pow(1 - q, 3);
    coins.push(<mesh key={i} geometry={COIN} position={[COLS[c][0], lvl * 0.17 + (1 - e) * 2.2, COLS[c][1]]} rotation={[0, i * 0.7, (1 - e) * 0.5]}>
      <meshStandardMaterial {...mat('metal')} roughness={0.28} envMapIntensity={1.2} />
    </mesh>);
  }
  return <group rotation={[0.18, 0.5 + t * 0.22, 0]} position={[0, -0.8, 0]}>{coins}</group>;
};
