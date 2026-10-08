import {Config} from '@remotion/cli/config';
// render.py define REMOTION_BROWSER com o Chromium já instalado na máquina (evita baixar outro).
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
Config.setVideoImageFormat('jpeg');
