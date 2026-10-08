import React from 'react';
import {Composition} from 'remotion';
import {Video, DURATION} from './Video';
// Os mesmos quadros em todos os formatos; o render.py escolhe quais renderizar (--formats 9x16,1x1,16x9,4x5).
const FORMATS: [string, number, number][] = [['9x16', 1080, 1920], ['1x1', 1080, 1080], ['4x5', 1080, 1350], ['16x9', 1920, 1080]];
export const Root: React.FC = () => <>{FORMATS.map(([id, w, h]) =>
  <Composition key={id} id={`v${id}`} component={Video} durationInFrames={Math.round(DURATION * 30)} fps={30} width={w} height={h} />)}</>;
