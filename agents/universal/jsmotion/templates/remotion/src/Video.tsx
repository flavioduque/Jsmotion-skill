// O VÍDEO — reescreva este arquivo em cada projeto (é um esqueleto de exemplo, não um estilo a copiar).
// Regras: só mídia real do cliente (public/), tempos vindos da fala (find/mark/wordAt), cores e fontes do STYLE.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {STYLE} from './style';
import {Caption, Card, Converge, Counter, Expand, Finish, Flash, Media, Pill, Say, Scene, Shot, Soundtrack, VOICE, Words,
  find, mark, shake, useFonts, useT, wordAt} from './kit';

// duração: a narração + respiro final (sem voz, escreva o número em segundos)
export const DURATION = Math.max(12, Math.ceil((VOICE.dur || 10) + 1.6));

// recortes das mídias reais (public/media). s/o enquadram o ASSUNTO principal (produto, prédio, pessoa).
const SH: Record<string, Shot> = {
  a: {src: 'media/1.mp4', from: 0},
  b: {src: 'media/2.mp4', from: 0.5, s: 1.4, o: '50% 0%'},
  c: {src: 'media/3.jpg'},
};

export const Video: React.FC = () => {
  useFonts();
  const {t} = useT();
  const T1 = 3, T2 = 8, T3 = DURATION - 4; // troque pelos instantes da fala: mark('virada'), wordAt(find('6,6%'))…
  return (
    <AbsoluteFill style={{background: STYLE.colors.bg, color: STYLE.colors.text}}>
      <AbsoluteFill style={{transform: shake(t, [T1])}}>
        <Scene t={t} a={0} b={T1}>
          <Words t={t} y={0.42} size={120} lines={[[['Gancho', 0.3]], [['forte', 0.8, true]]]} />
        </Scene>
        <Scene t={t} a={T1 - 0.1} b={T2}>
          <Converge t={t} a={T1} shots={[SH.b, SH.c, SH.a]} hero={2} />
          <Pill t={t} a={T1 + 0.6} y={0.69}>RÓTULO</Pill>
          <Caption t={t} a={T1 + 1.5} y={0.73}>Uma frase curta com o <span style={{color: STYLE.colors.accent}}>destaque</span>.</Caption>
        </Scene>
        <Scene t={t} a={T2 - 0.1} b={T3}>
          <Expand t={t} a={T2} shot={SH.a} />
          <Counter t={t} a={T2 + 1} to={99} suffix="%" y={0.55} />
        </Scene>
        <Scene t={t} a={T3 - 0.1} b={DURATION + 1}>
          <Words t={t} y={0.4} size={96} lines={[[['Chamada', T3 + 0.2]], [['final', T3 + 0.6, true]]]} />
        </Scene>
      </AbsoluteFill>
      <Flash t={t} at={[T1]} />
      <Finish t={t} />
      <Soundtrack music={undefined} end={DURATION} sfx={[]} />
    </AbsoluteFill>
  );
};
