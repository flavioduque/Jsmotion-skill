"""Uso: python3 music.py (--file trilha.mp3 | --elevenlabs "descrição da trilha" --dur 25) [opções]
Prepara uma TRILHA DE VERDADE para o vídeo (no lugar da trilha sintetizada, que fica só com os efeitos):
normaliza o volume, acha o andamento (BPM) e as batidas — o kit encaixa as trocas de cena e os pulsos na batida
e abaixa a trilha sozinho quando alguém fala.

Origens:
  --file arquivo        qualquer faixa: do usuário, de biblioteca grátis com uso comercial (Pixabay Music,
                        YouTube Audio Library) ou gerada em outra ferramenta (ex.: conector com geração de música)
  --elevenlabs "texto"  gera com o ElevenLabs Music (precisa de ELEVENLABS_API_KEY; gasta créditos do usuário):
                        instrumental, com a duração exata do vídeo (--dur, em segundos)
Opções: --dur 25 (duração desejada; com --file, só informa) · --start 12.5 (começa a faixa nesse ponto; padrão:
        pula o silêncio inicial) · --model music_v1 · --out PASTA (padrão $WORK/music)
Saída: PASTA/music.json {audio, dur, bpm, beats:[s…], start, method} + PASTA/trilha.mp3 (−16 LUFS)."""
import sys, os, re, json, subprocess, urllib.request
import numpy as np
from _paths import workdir

args = sys.argv[1:]
def opt(flag, default=None, cast=str):
    if flag in args: i = args.index(flag); v = args[i+1]; del args[i:i+2]; return cast(v)
    return default
src = opt('--file'); prompt = opt('--elevenlabs'); dur = opt('--dur', None, float)
start = opt('--start', None, float); model = opt('--model', 'music_v1')
out = opt('--out') or os.path.join(workdir(), 'music')
if bool(src) == bool(prompt): sys.exit(__doc__)
os.makedirs(out, exist_ok=True)
raw = os.path.join(out, 'trilha_raw')

if prompt:
    key = os.environ.get('ELEVENLABS_API_KEY')
    if not key: sys.exit('❌ defina ELEVENLABS_API_KEY (ou gere a faixa em outra ferramenta e use --file)')
    if not dur: sys.exit('❌ informe --dur (segundos) para a trilha ter a duração do vídeo')
    body = {'prompt': prompt, 'music_length_ms': int(min(600000, max(3000, (dur + 1.5) * 1000))),
            'model_id': model, 'force_instrumental': True}
    req = urllib.request.Request('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192',
                                 data=json.dumps(body).encode(), headers={'xi-api-key': key, 'Content-Type': 'application/json'})
    try: open(raw, 'wb').write(urllib.request.urlopen(req, timeout=600).read())
    except Exception as e: sys.exit(f'❌ ElevenLabs Music falhou: {e}')
    src, method = raw, f'elevenlabs ({model})'
else:
    if not os.path.exists(src): sys.exit(f'❌ arquivo não encontrado: {src}')
    method = 'arquivo'

# começo: pula o silêncio inicial (ou usa --start)
if start is None:
    r = subprocess.run(['ffmpeg', '-hide_banner', '-t', '20', '-i', src, '-af', 'silencedetect=n=-45dB:d=0.3', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    m = re.search(r'silence_start: (-?[\d.]+).*?silence_end: ([\d.]+)', r, re.S)
    start = float(m.group(2)) if m and float(m.group(1)) <= 0.05 else 0.0

dst = os.path.join(out, 'trilha.mp3')
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', f'{start:.3f}', '-i', src, '-af', 'loudnorm=I=-16:TP=-2:LRA=11',
                '-ar', '44100', '-b:a', '192k', dst], check=True)
if os.path.exists(raw): os.remove(raw)

# andamento e batidas: fluxo espectral → autocorrelação (70–180 BPM) → fase da grade que mais "acerta" os ataques
SR, HOP = 22050, 512
pcm = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', dst, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                     capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.float32); total = len(x) / SR
def beats_of(x):
    if len(x) < SR * 4: return None, []
    n = 2048; win = np.hanning(n); frames = np.lib.stride_tricks.sliding_window_view(x, n)[::HOP] * win
    mag = np.log1p(np.abs(np.fft.rfft(frames, axis=1)))
    env = np.maximum(0, np.diff(mag, axis=0)).sum(axis=1); env = env - np.convolve(env, np.ones(16) / 16, 'same')
    env = np.maximum(env, 0); fps = SR / HOP
    ac = np.correlate(env, env, 'full')[len(env) - 1:]
    lags = np.arange(len(ac)); bpm_of = 60 * fps / np.maximum(lags, 1)
    ok = (bpm_of >= 70) & (bpm_of <= 180)
    w = ac * ok * np.exp(-0.5 * (np.log2(np.maximum(bpm_of, 1) / 115)) ** 2)   # leve preferência por ~115 BPM
    lag = int(np.argmax(w)); coarse = 60 * fps / lag
    # refino (o quadro de análise tem ~23 ms): testa BPM vizinhos e fases fracionárias na grade de batidas
    best = (-1, coarse, 0.0)
    for bpm in np.arange(coarse - 4, coarse + 4, 0.05):
        per = 60 * fps / bpm
        for ph in np.arange(0, per, 0.5):
            idx = np.round(np.arange(ph, len(env) - 1, per)).astype(int); sc = env[idx].sum() / max(1, len(idx))
            if sc > best[0]: best = (sc, bpm, ph)
    _, bpm, ph = best; per = 60 * fps / bpm
    lat = n / SR                                        # a janela de análise antecipa o ataque em ~1 janela
    return round(float(bpm), 2), [round(float(t / fps + lat), 3) for t in np.arange(ph, len(env), per) if t / fps + lat < total]
bpm, beats = beats_of(x)
res = {'method': method, 'audio': 'trilha.mp3', 'dur': round(total, 3), 'start': round(start, 3), 'bpm': bpm, 'beats': beats}
if dur: res['target'] = dur
json.dump(res, open(os.path.join(out, 'music.json'), 'w'), indent=0)
aviso = f' · ⚠️ a faixa ({total:.1f}s) é mais curta que o vídeo ({dur:g}s): o kit repete o final' if dur and total < dur else ''
print(f'✅ trilha {total:.1f}s · {bpm or "?"} BPM · {len(beats)} batidas · início {start:.2f}s na faixa · {method}{aviso}')
print(f'   → {os.path.join(out, "music.json")}')
