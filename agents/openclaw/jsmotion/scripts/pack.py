"""Uso: python3 pack.py anim.js assets.js nome "Título" [--formats 9x16,1x1,16x9] [--jobs N] [--out PASTA] [--html-only]
Pacote multiformato: monta um .html por formato (nome_9x16.html, nome_1x1.html, ...) e renderiza os MP4
em paralelo (nome_9x16.mp4, ...). Formatos: 9x16 · 4x5 · 1x1 · 16x9. Pasta padrão: $OUT.
--html-only só monta os .html (para revisar com snap.py antes de renderizar)."""
import sys, os, subprocess, time
from concurrent.futures import ThreadPoolExecutor
from _paths import outdir
here = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[1:]
def opt(flag, default):
    if flag in args: i = args.index(flag); v = args[i+1]; del args[i:i+2]; return v
    return default
formats = opt('--formats', '9x16,1x1,16x9').split(',')
out = opt('--out', None) or outdir()
html_only = '--html-only' in args
if html_only: args.remove('--html-only')
anim, assets, name, title = args[:4]
ok = {'9x16', '4x5', '1x1', '16x9'}
bad = [f for f in formats if f not in ok]
if bad: sys.exit(f'formato inválido: {bad} (use {sorted(ok)})')
# cada render usa ~2 núcleos (Chromium + ffmpeg); nunca mais processos que formatos
jobs = int(opt('--jobs', 0) or max(1, min(len(formats), (os.cpu_count() or 2) // 2)))
os.makedirs(out, exist_ok=True)

pages = {}
for f in formats:
    h = os.path.join(out, f'{name}_{f}.html')
    subprocess.run([sys.executable, os.path.join(here, 'build_html.py'), anim, assets, h, title, f'{name}_{f}', '--format', f], check=True)
    pages[f] = h
if html_only: sys.exit(0)

def render(f):
    t = time.time(); mp4 = os.path.join(out, f'{name}_{f}.mp4')
    r = subprocess.run([sys.executable, os.path.join(here, 'render.py'), pages[f], mp4], capture_output=True, text=True)
    vol = next((l for l in r.stdout.splitlines() if l.startswith('volume:')), '')
    return f, mp4, r.returncode, round(time.time() - t), vol, r.stderr[-400:]

T0 = time.time()
print(f'renderizando {len(formats)} formatos com {jobs} em paralelo…', flush=True)
with ThreadPoolExecutor(jobs) as ex:
    res = list(ex.map(render, formats))
for f, mp4, rc, s, vol, err in res:
    print(f"{'✅' if rc == 0 else '❌'} {f:5} {mp4} ({s}s) {vol}" + ('' if rc == 0 else f'\n{err}'))
print(f'total: {round(time.time() - T0)}s')
sys.exit(1 if any(r[2] for r in res) else 0)
