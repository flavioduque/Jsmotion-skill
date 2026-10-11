import {Config} from '@remotion/cli/config';
// render.py define REMOTION_BROWSER com o Chromium já instalado na máquina (evita baixar outro).
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
Config.setVideoImageFormat('jpeg');
Config.setChromiumOpenGlRenderer('swangle'); // WebGL (cenas 3D) sem placa de vídeo; com GPU dá para usar 'angle' (mais rápido)
