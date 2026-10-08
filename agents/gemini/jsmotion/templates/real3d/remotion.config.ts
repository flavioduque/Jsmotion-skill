import {Config} from '@remotion/cli/config';
// O real3d.py define REMOTION_BROWSER com o Chromium encontrado na máquina.
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
Config.setChromiumOpenGlRenderer('swangle'); // WebGL por software: funciona sem GPU
Config.setVideoImageFormat('jpeg');
