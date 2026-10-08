"""Render do projeto Remotion (o motor da jsmotion).

  python3 render.py PROJ NOME --stills 0.5 2 4.2 …  [--format 9x16] [--ref $WORK/ref/sheet.jpg] [-o folha.jpg]
        → folha de revisão com os instantes pedidos (veja antes de renderizar o vídeo)
  python3 render.py PROJ NOME --formats 9x16,1x1,16x9 [--draft]
        → $OUT/NOME_9x16.mp4 … (H.264, áudio masterizado em −14 LUFS / pico −1,5 dBTP)
        --draft = prévia rápida em meia resolução ($OUT/NOME_9x16_previa.mp4) para aprovar ritmo e sincronia

Chromium: usa REMOTION_BROWSER/CHROMIUM_PATH ou o do Playwright, se existir; senão o Remotion baixa o dele.
Render longo? Rode em segundo plano (nohup … &) e acompanhe o log até aparecer "total:"."""
import os, sys, glob, json, shutil, subprocess, tempfile, time, re
from _paths import workdir, outdir

a = sys.argv[1:]
def opt(flag, default=None, many=False):
    if flag not in a: return default
    i = a.index(flag)
    if many:
        j = i + 1
        while j < len(a) and not a[j].startswith('--') and a[j] != '-o': j += 1
        v = a[i + 1:j]; del a[i:j]; return v
    v = a[i + 1]; del a[i:i + 2]; return v
stills = opt('--stills', None, many=True); fmt1 = opt('--format', '9x16'); ref = opt('--ref'); sheet = opt('-o')
formats = opt('--formats', '9x16').split(','); draft = '--draft' in a
a = [x for x in a if x != '--draft']
if len(a) < 2: sys.exit(__doc__)
proj, name = os.path.abspath(a[0]), a[1]

def browser():
    for e in ('REMOTION_BROWSER', 'CHROMIUM_PATH'):
        if os.environ.get(e): return os.environ[e]
    roots = [os.environ.get('PLAYWRIGHT_BROWSERS_PATH', ''), '/opt/pw-browsers', os.path.expanduser('~/.cache/ms-playwright')]
    for r in roots:
        for pat in ('chromium_headless_shell-*/chrome-linux/headless_shell', 'chromium_headless_shell-*/chrome-*/headless_shell',
                    'chromium-*/chrome-linux/chrome'):
            hit = sorted(glob.glob(os.path.join(r, pat)))
            if r and hit: return hit[-1]
env = dict(os.environ); b = browser()
if b: env['REMOTION_BROWSER'] = b
npx = ['npx', '--no-install', 'remotion']
def run(cmd):
    p = subprocess.run(cmd, cwd=proj, env=env, capture_output=True, text=True)
    if p.returncode: sys.exit(f'❌ {" ".join(cmd[:4])}…\n{(p.stdout + p.stderr)[-3000:]}')
    return p.stdout

t0 = time.time()
build = os.path.join(proj, '.bundle')
run(npx + ['bundle', 'src/index.ts', '--out-dir', build])       # empacota uma vez; stills e formatos usam o mesmo
conc = str(max(1, min(os.cpu_count() or 2, 4)))

if stills:
    tmp = tempfile.mkdtemp(prefix='jsm_st_'); shots = []
    for s in stills:
        f = os.path.join(tmp, f'{float(s):07.2f}.jpg')
        run(npx + ['still', build, f'v{fmt1}', f, f'--frame={round(float(s) * 30)}', '--jpeg-quality=80'] + (['--browser-executable', b] if b else []))
        shots.append((s, f))
    from PIL import Image, ImageDraw
    ims = [Image.open(f) for _, f in shots]; w0, h0 = ims[0].size; tw = 300; th = round(h0 * tw / w0)
    cols = min(8, len(ims)); rows = -(-len(ims) // cols)
    top = None
    if ref and os.path.exists(ref):
        top = Image.open(ref).convert('RGB'); top = top.resize((tw * cols, round(top.height * tw * cols / top.width)))
    out = Image.new('RGB', (tw * cols, th * rows + 26 * rows + (top.height if top else 0)), (18, 18, 18))
    y0 = 0
    if top: out.paste(top, (0, 0)); y0 = top.height
    d = ImageDraw.Draw(out)
    for i, ((s, _), im) in enumerate(zip(shots, ims)):
        x, y = (i % cols) * tw, y0 + (i // cols) * (th + 26)
        out.paste(im.convert('RGB').resize((tw, th)), (x, y + 26)); d.text((x + 6, y + 6), f'{float(s):.2f}s', fill=(240, 240, 240))
    sheet = sheet or os.path.join(workdir(), f'review_{fmt1}.jpg'); out.save(sheet, quality=85)
    shutil.rmtree(tmp, ignore_errors=True)
    print(f'✅ folha de revisão → {sheet}  ({len(ims)} instantes, {time.time() - t0:.0f}s)')
    sys.exit(0)

os.makedirs(outdir(), exist_ok=True)
for f in formats:
    raw = os.path.join(proj, f'.raw_{f}.mp4')
    cmd = npx + ['render', build, f'v{f}', raw, f'--concurrency={conc}', f'--crf={26 if draft else 16}', '--log=error']
    if draft: cmd += ['--scale=0.5']
    if b: cmd += ['--browser-executable', b]
    t1 = time.time(); run(cmd)
    dst = os.path.join(outdir(), f'{name}_{f}{"_previa" if draft else ""}.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-c:v', 'libx264', '-crf', '24' if draft else '20', '-preset', 'medium',
                    '-pix_fmt', 'yuv420p', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k',
                    '-movflags', '+faststart', dst], check=True)
    os.remove(raw)
    m = subprocess.run(['ffmpeg', '-nostats', '-i', dst, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    lufs = re.findall(r'I:\s+(-?[\d.]+) LUFS', m); pk = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', m)
    print(f'✅ {dst}  {os.path.getsize(dst) / 1e6:.1f} MB · {f"{lufs[-1]} LUFS · pico {pk[-1]} dBFS" if lufs else "sem áudio"} · {time.time() - t1:.0f}s')
print(f'total: {time.time() - t0:.0f}s')
