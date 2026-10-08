import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel';
import P from './project.json';
export const Root: React.FC = () => (
  <Composition id="Reel" component={Reel} durationInFrames={Math.round(P.duration * P.fps)} fps={P.fps} width={P.width} height={P.height} />
);
