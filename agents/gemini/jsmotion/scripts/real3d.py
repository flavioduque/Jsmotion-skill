"""Modo MÍDIA REAL + 3D (Remotion + three.js): vídeo feito de clipes REAIS em tela cheia, com narração, legendas da
fala, palavras-chave e números em 3D de verdade (texto dourado extrudado, chanfrado e iluminado), logo de abertura,
faixa de assinatura fixa e chamada final. Leia references/real3d.md antes de usar.

Uso:
  python3 real3d.py spec.json --setup            # instala o motor uma vez (npm) e confere o Chromium
  python3 real3d.py spec.json --still 2,9.5,16   # fotos de revisão → $WORK/real3d/review.jpg (rápido)
  python3 real3d.py spec.json --name nome        # MP4 final → $OUT/nome_9x16.mp4 (áudio em −14 LUFS)

spec.json (caminhos relativos à pasta do spec; tempos em segundos):
{
  "format": "9x16",                                   # 9x16 · 1x1 · 4x5 · 16x9
  "voice": {"words": "voice/words.json", "audio": "voice/narracao.mp3", "volume": 1.1},
  "music": {"file": "trilha.mp3", "volume": 0.2, "from": 0},
  "clips": [{"src": "rua.mp4", "at": 0, "dur": 4.2, "from": 0.5}, ...],   # "at" também aceita {"mark": "nome"}
  "keywords": [{"word": "oportunidade", "lines": ["OPORTUNIDADE", "IMOBILIÁRIA"]},
               {"mark": "pib", "lines": ["+6,6%", "PIB 2025"], "counter": {"from": 0, "to": 6.6, "dec": 1, "pre": "+", "suf": "%"}},
               {"at": 33.6, "until": 34.7, "lines": ["MAIS PERTO"]}],
  "intro": {"logo": "logo.png", "sub": "TEXTO PEQUENO", "dur": 3.8},
  "header": {"logo": "logo.png"},
  "band": {"images": ["c21.png", "assinatura.png"], "label": "WHATSAPP", "value": "+595 993 286 866"},
  "cta": {"word": "comente#-1", "text": "Comente “INVESTIR”", "label": "WHATSAPP", "value": "+595 993 286 866"},
  "colors": {"bg": "#0b0a09", "text": "#f2eadf", "accent": "#c9a45c", "accentLight": "#e3c78e",
             "gold3d": "#e6c27a", "light3d": "#f4e6c8", "emissive3d": "#4a3410"},
  "fonts": {"display": "Montserrat:800", "number": "Bodoni Moda:700", "ui": "Montserrat:600"},
  "kwY": 0.084,                                       # altura das palavras 3D (fração da tela acima do centro)
  "duration": 42                                      # opcional (padrão: fim da voz + 2,4 s)
}
Âncoras: "word": "palavra" (1ª ocorrência; "palavra#2" = 2ª; "#-1" = última; várias palavras: "outro lado"),
"mark": "nome" (marcador [nome] do narracao.txt) ou "at": segundos."""
import sys, os, json, re, shutil, subprocess, glob, unicodedata
from _paths import workdir, outdir

SK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TPL = os.path.join(SK, 'templates', 'real3d')
SIZES = {'9x16': (1080, 1920), '1x1': (1080, 1080), '4x5': (1080, 1350), '16x9': (1920, 1080)}
DEF_COLORS = {'bg': '#0b0a09', 'text': '#f2eadf', 'accent': '#c9a45c', 'accentLight': '#e3c78e',
              'gold3d': '#e6c27a', 'light3d': '#f4e6c8', 'emissive3d': '#4a3410'}
DEF_FONTS = {'display': 'Montserrat:800', 'number': 'Bodoni Moda:700', 'ui': 'Montserrat:600'}

args = sys.argv[1:]
if not args or args[0].startswith('-'): sys.exit(__doc__)
def opt(f, d=None):
    if f in args: i = args.index(f); v = args[i + 1]; del args[i:i + 2]; return v
    return d
setup_only = '--setup' in args
still = opt('--still'); name = opt('--name', 'video')
SPEC = os.path.abspath(args[0]); BASE = os.path.dirname(SPEC)
S = json.load(open(SPEC, encoding='utf-8'))
P = os.path.join(workdir(), 'real3d'); PUB = os.path.join(P, 'public')
def sh(cmd, **kw): return subprocess.run(cmd, check=True, **kw)
def path(p): return p if os.path.isabs(p) else os.path.join(BASE, p)

# ---------- 1. motor (Remotion) ----------
def chromium():
    for c in [os.environ.get('CHROMIUM_PATH')] + sorted(glob.glob('/opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell'))[::-1] \
             + sorted(glob.glob(os.path.expanduser('~/.cache/ms-playwright/chromium_headless_shell-*/chrome-linux/headless_shell')))[::-1]:
        if c and os.path.exists(c): return c
    return None   # o Remotion baixa o próprio navegador se a rede deixar
os.makedirs(P, exist_ok=True)
for f in ('package.json', 'tsconfig.json', 'remotion.config.ts'):   # package.json só na 1ª vez (guarda as fontes instaladas)
    if f != 'package.json' or not os.path.exists(os.path.join(P, f)): shutil.copy(os.path.join(TPL, f), P)
shutil.copytree(os.path.join(TPL, 'src'), os.path.join(P, 'src'), dirs_exist_ok=True)
if not os.path.exists(os.path.join(P, 'node_modules', 'remotion')):
    print('⏳ instalando o motor 3D (uma vez, ~1 min)…')
    sh(['npm', 'install', '--no-audit', '--no-fund', '--loglevel=error'], cwd=P)
env = dict(os.environ)
if chromium(): env['REMOTION_BROWSER'] = chromium()
if setup_only: print('✅ motor pronto em', P, '· navegador:', env.get('REMOTION_BROWSER', 'baixado pelo Remotion')); sys.exit(0)

# ---------- 2. fontes: Google Fonts (via @fontsource) → glifos 3D (typeface JSON) + fonte da interface ----------
fonts = {**DEF_FONTS, **S.get('fonts', {})}
os.makedirs(os.path.join(P, 'src', 'fonts'), exist_ok=True); os.makedirs(PUB, exist_ok=True)
def font_file(spec, ext):
    fam, _, w = spec.partition(':'); w = w or '400'; slug = re.sub(r'[^a-z0-9]+', '-', fam.lower()).strip('-')
    pkg = os.path.join(P, 'node_modules', '@fontsource', slug)
    if not os.path.isdir(pkg): sh(['npm', 'install', '--no-audit', '--no-fund', '--loglevel=error', f'@fontsource/{slug}'], cwd=P)
    f = os.path.join(pkg, 'files', f'{slug}-latin-{w}-normal.{ext}')
    if not os.path.exists(f): sys.exit(f'❌ a fonte {fam} não tem o peso {w} (veja {pkg}/files)')
    return f
for role in ('display', 'number'):
    sh(['node', os.path.join(SK, 'scripts', 'tofont.cjs'), font_file(fonts[role], 'woff'), os.path.join(P, 'src', 'fonts', f'{role}.json')],
       cwd=P, stdout=subprocess.DEVNULL)
shutil.copy(font_file(fonts['ui'], 'woff2'), os.path.join(PUB, 'ui.woff2'))

# ---------- 3. mídia → public/ ----------
def media(p):
    src = path(p); dst = re.sub(r'[^A-Za-z0-9._-]', '_', os.path.basename(src))
    if not os.path.exists(os.path.join(PUB, dst)) or os.path.getmtime(src) > os.path.getmtime(os.path.join(PUB, dst)):
        shutil.copy(src, os.path.join(PUB, dst))
    return dst
def dur_of(f):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f],
                                capture_output=True, text=True).stdout.strip() or 0)

# ---------- 4. linha do tempo da voz ----------
def norm(s):
    s = unicodedata.normalize('NFKD', s.lower()); s = ''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9%]', '', s)
W, marks, voice = [], {}, None
if S.get('voice'):
    V = S['voice']; wj = json.load(open(path(V['words']), encoding='utf-8'))
    W = wj['words']; marks = wj.get('marks', {})
    audio = V.get('audio') or (os.path.join(os.path.dirname(path(V['words'])), wj['audio']) if wj.get('audio') else None)
    if audio: voice = {'src': media(audio), 'at': wj.get('lead', 0), 'volume': V.get('volume', 1.1)}
NT = [norm(w['w']) for w in W]
def when(a):
    if 'at' in a and not isinstance(a['at'], dict): return float(a['at'])
    a = a['at'] if isinstance(a.get('at'), dict) else a
    if 'mark' in a:
        if a['mark'] not in marks: sys.exit(f'❌ marcador [{a["mark"]}] não existe no words.json')
        return W[marks[a['mark']]]['t0']
    q, _, n = a['word'].partition('#'); n = int(n or 1); qs = [norm(x) for x in q.split()]
    hits = [i for i in range(len(NT)) if all(i + j < len(NT) and NT[i + j].startswith(qs[j]) for j in range(len(qs)))]
    if not hits or abs(n) > len(hits): sys.exit(f'❌ a palavra "{a["word"]}" não aparece na narração')
    return W[hits[n - 1 if n > 0 else n]]['t0']

end_voice = W[-1]['t1'] if W else 0
D = float(S.get('duration') or round(end_voice + 2.4, 2))
cta = None
if S.get('cta'):
    c = S['cta']; cta = {'t0': round(when(c) - 0.2, 2) if any(k in c for k in ('word', 'mark', 'at')) else D - 3.5,
                         'text': c.get('text', ''), 'label': c.get('label', ''), 'value': c.get('value', '')}
limit = cta['t0'] - 0.1 if cta else D - 0.3

kws = []
def sentence_end(t):   # fim da frase em que a palavra-âncora está (a palavra 3D sai junto com a frase)
    for w in W:
        if w['t0'] >= t - 0.01 and re.search(r'[.?!…]["”]?$', w['w']): return w['t1'] + 0.35
    return D
raw = [dict(k, t0=round(when(k) - 0.12, 2)) for k in S.get('keywords', [])]
raw.sort(key=lambda k: k['t0'])
for i, k in enumerate(raw):
    nxt = raw[i + 1]['t0'] - 0.05 if i + 1 < len(raw) else limit
    t1 = float(k['until']) if 'until' in k else min(nxt, max(k['t0'] + 1.8, sentence_end(k['t0'] + 0.12)), k['t0'] + 4.5, limit)
    item = {'t0': k['t0'], 't1': round(t1, 2), 'lines': k['lines']}
    if 'counter' in k: item['counter'] = {'from': 0, 'dec': 0, **k['counter']}
    if t1 - k['t0'] < 0.8: print(f'⚠️  "{k["lines"][0]}" fica só {t1 - k["t0"]:.1f}s na tela')
    kws.append(item)

caps, cur = [], []
for w in W:
    if cta and w['t0'] >= cta['t0']: break
    cur.append(w)
    if len(cur) >= 6 or re.search(r'[.,?!:;]["”]?$', w['w']): caps.append(cur); cur = []
if cur: caps.append(cur)
captions = [{'t0': round(ch[0]['t0'] - 0.03, 2), 't1': round((caps[i + 1][0]['t0'] if i + 1 < len(caps) else (cta['t0'] if cta else ch[-1]['t1'] + 0.5)) - 0.05, 2),
             'text': ' '.join(x['w'] for x in ch)} for i, ch in enumerate(caps)]

clips = []
for c in S.get('clips', []):
    at = when({'at': c['at']}) if isinstance(c['at'], dict) else float(c['at'])
    f = path(c['src']); L = dur_of(f); fr = float(c.get('from', 0)); d = float(c['dur'])
    if fr + d > L + 0.02: print(f'⚠️  {c["src"]}: pede {fr + d:.2f}s mas o clipe tem {L:.2f}s — o fim vai congelar')
    clips.append({'src': media(c['src']), 'at': round(at, 3), 'dur': round(d, 3), 'from': fr})
clips.sort(key=lambda c: c['at'])
for a, b in zip(clips, clips[1:]):
    if a['at'] + a['dur'] < b['at'] - 0.02: print(f'⚠️  buraco preto entre {a["at"] + a["dur"]:.2f}s e {b["at"]:.2f}s')

w_, h_ = SIZES[S.get('format', '9x16')]
I = S.get('intro')
proj = {'fps': 30, 'width': w_, 'height': h_, 'duration': D, 'kwY': S.get('kwY', 0.084),
        'colors': {**DEF_COLORS, **S.get('colors', {})}, 'clips': clips, 'keywords': kws, 'captions': captions,
        'intro': {'logo': media(I['logo']), 'sub': I.get('sub', ''), 't0': 0.15, 't1': I.get('dur', 3.8)} if I else None,
        'header': {'logo': media(S['header']['logo'])} if S.get('header') else None,
        'band': {'images': [media(x) for x in S['band'].get('images', [])], 'label': S['band'].get('label', ''),
                 'value': S['band'].get('value', '')} if S.get('band') else None,
        'cta': cta, 'voice': voice,
        'music': {'src': media(S['music']['file']), 'volume': S['music'].get('volume', 0.2), 'from': S['music'].get('from', 0)} if S.get('music') else None}
json.dump(proj, open(os.path.join(P, 'src', 'project.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'🎬 {D:.1f}s · {len(clips)} clipes · {len(kws)} palavras 3D · {len(captions)} legendas · CTA {cta["t0"] if cta else "-"}s')
for k in kws: print(f'   3D {k["t0"]:6.2f}–{k["t1"]:6.2f}s  {" / ".join(k["lines"])}')

# ---------- 5. revisão ou render ----------
if still:
    rv = os.path.join(P, 'stills'); shutil.rmtree(rv, ignore_errors=True); os.makedirs(rv)
    ts = [float(x) for x in still.split(',')]
    for i, t in enumerate(ts):
        sh(['npx', 'remotion', 'still', 'src/index.ts', 'Reel', f'{rv}/s{i:02d}.png', f'--frame={min(int(t * 30), int(D * 30) - 1)}'],
           cwd=P, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    cols = min(6, len(ts)); tw = 300; th = int(tw * h_ / w_)
    sh(['ffmpeg', '-v', 'error', '-y', '-pattern_type', 'glob', '-i', f'{rv}/s*.png', '-vf',
        f'scale={tw}:{th},tile={cols}x{-(-len(ts) // cols)}:padding=6:color=black', '-frames:v', '1', os.path.join(P, 'review.jpg')])
    print('🖼  revisão →', os.path.join(P, 'review.jpg'))
    sys.exit(0)

raw_mp4 = os.path.join(P, 'render.mp4')
sh(['npx', 'remotion', 'render', 'src/index.ts', 'Reel', raw_mp4, '--crf=20', f'--concurrency={max(1, (os.cpu_count() or 2))}'], cwd=P, env=env)
final = os.path.join(outdir(), f'{name}_{S.get("format", "9x16")}.mp4')
sh(['ffmpeg', '-v', 'error', '-y', '-i', raw_mp4, '-c:v', 'copy', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final])
print(f'✅ {final} ({os.path.getsize(final) / 1e6:.1f} MB)')
