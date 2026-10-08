"""Referências de motion feitas com Claude, do prompt-motion.com (galeria curada de vídeos + os prompts que os geraram).
Use quando o usuário NÃO mandou um vídeo de referência: a skill escolhe uma boa referência sozinha.

Uso:
  Só entram vídeos COM PROMPT e da categoria kinetic-type (tipografia cinética) — o mesmo filtro de
  https://www.prompt-motion.com/?type=prompt&tag=kinetic-type. Outra categoria: --tag shapes (etc.).
  python3 find_reference.py list   [--format 9x16|1x1|16x9|all] [--search texto] [--limit 40] [--tag kinetic-type]
  python3 find_reference.py sheet  [--format 9x16] [--search texto] [--limit 36]   → folha numerada de capas (veja e pré-selecione)
  python3 find_reference.py peek   slug1 slug2 slug3                                → baixa os vídeos, folha de quadros + prompt de cada um
  python3 find_reference.py get    slug                                             → caminho do vídeo baixado (passe ao watch_reference.sh)

Fluxo: sheet (capas) → escolha 3–5 candidatos que combinam com a marca, o tema e o tipo de vídeo → peek (quadros de
cada um) → escolha 1 (ou ofereça 3 como direções de arte) → get + watch_reference.sh. Os vídeos e prompts pertencem aos
criadores (crédito: @handle e o link do post); servem só como REFERÊNCIA de estilo — nunca reutilize nem republique.
Saída em $WORK/refs/prompt-motion/ (catálogo em cache por 12 h, capas e vídeos baixados uma vez só)."""
import sys, os, re, json, time, html, subprocess, urllib.request
from _paths import workdir

SITE = 'https://www.prompt-motion.com'
UA = 'Mozilla/5.0 (jsmotion-skill; reference lookup on user request)'
BASE = os.path.join(workdir(), 'refs', 'prompt-motion'); os.makedirs(BASE, exist_ok=True)
args = sys.argv[1:]
def opt(flag, default=None, cast=str):
    if flag in args: i = args.index(flag); v = args[i+1]; del args[i:i+2]; return cast(v)
    return default
fmt = opt('--format', 'all'); tag = opt('--tag', 'kinetic-type'); search = (opt('--search') or '').lower(); limit = opt('--limit', 40, int)
if not args or args[0] not in ('list', 'sheet', 'peek', 'get'): sys.exit(__doc__)
cmd, rest = args[0], args[1:]

def fetch(url, binary=False, timeout=60):
    data = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=timeout).read()
    return data if binary else data.decode('utf-8', 'replace')

def rsc(page):
    """texto do payload do Next.js (os dados da página vêm dentro de self.__next_f.push)."""
    chunks = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)', page, re.S)
    return ''.join(json.loads('"' + c + '"') for c in chunks)

def catalog():
    cp = os.path.join(BASE, 'catalog.json')
    if os.path.exists(cp) and time.time() - os.path.getmtime(cp) < 12 * 3600: return json.load(open(cp))
    try: t = rsc(fetch(SITE + '/'))
    except Exception as e: sys.exit(f'❌ não consegui abrir {SITE} ({e}). Sem acesso daqui: abra o site no navegador, '
                                      'escolha um vídeo e use o link do .mp4 (botão direito → copiar endereço) com watch_reference.sh.')
    i = t.find('"cards":['); j = i + len('"cards":'); depth = 0
    for k in range(j, len(t)):
        depth += (t[k] == '[') - (t[k] == ']')
        if depth == 0: break
    cards = json.loads(t[j:k+1])
    for c in cards:
        r = c['width'] / c['height']; c['format'] = '9x16' if r < 0.8 else ('16x9' if r > 1.25 else '1x1')
    json.dump(cards, open(cp, 'w')); return cards

def pick(cards):
    out = [c for c in cards if (fmt == 'all' or c['format'] == fmt) and 'prompt' in c.get('tags', [])
           and tag in c.get('contentTags', [])]
    if search: out = [c for c in out if search in (c['title'] + ' ' + c['handle']).lower()]
    return out[:limit]

def entry(slug):
    """prompt, modelo, esforço e link do post original (página da entrada)."""
    ep = os.path.join(BASE, slug, 'entry.json')
    if os.path.exists(ep): return json.load(open(ep))
    page = fetch(f'{SITE}/{slug}')
    txt = html.unescape(re.sub(r'<[^>]+>', '\n', re.sub(r'<script.*?</script>', '', page, flags=re.S)))
    ls = [l.strip() for l in txt.split('\n') if l.strip()]
    def after(label, stop):
        if label not in ls: return ''
        i = ls.index(label) + 1; out = []
        while i < len(ls) and ls[i] not in stop: out.append(ls[i]); i += 1
        return ' '.join(out)
    LBL = ['Model', 'Effort', 'Iterations', 'Stack', 'Posted']
    prompt = after('Copy', {'This prompt was taken directly from', 'View repo', *LBL})
    meta = {k: ls[ls.index(k) + 1] for k in LBL if k in ls and ls.index(k) + 1 < len(ls)}
    m = re.search(r'href="(https://(?:x|twitter)\.com/[^"]+/status/[^"]+)"', page) or \
        re.search(r'href="(https://[^"]+)"[^>]*>\s*(?:<[^>]+>\s*)*View post', page)
    e = {'slug': slug, 'prompt': prompt, 'model': meta.get('Model', ''), 'effort': meta.get('Effort', ''),
         'iterations': meta.get('Iterations', ''), 'stack': meta.get('Stack', ''),
         'post': m.group(1) if m else f'{SITE}/{slug}', 'page': f'{SITE}/{slug}'}
    os.makedirs(os.path.dirname(ep), exist_ok=True); json.dump(e, open(ep, 'w'), ensure_ascii=False); return e

def video(c):
    d = os.path.join(BASE, c['slug']); os.makedirs(d, exist_ok=True); v = os.path.join(d, 'video.mp4')
    if not os.path.exists(v): open(v, 'wb').write(fetch(c['video'], binary=True, timeout=300))
    return v

cards = catalog(); by = {c['slug']: c for c in cards}
def need(slugs):
    bad = [s for s in slugs if s not in by]
    if bad: sys.exit(f'❌ slug desconhecido: {bad} (use list ou sheet para ver os slugs)')
    return [by[s] for s in slugs]

if cmd == 'list':
    sel = pick(cards); print(f'{len(sel)} de {len(cards)} vídeos (formato {fmt}{", busca: " + search if search else ""}):')
    for n, c in enumerate(sel, 1): print(f'{n:3}. {c["slug"]:34} {c["format"]:5} {c["date"]}  @{c["handle"]:18} {c["title"]}')

elif cmd == 'sheet':
    from PIL import Image, ImageDraw, ImageFont
    sel = pick(cards)
    if not sel: sys.exit('nenhum vídeo com esse filtro')
    tw = 240 if fmt == '9x16' else 320; th = round(tw * (16/9 if fmt == '9x16' else (1 if fmt == '1x1' else 9/16)))
    cols = 6 if fmt == '9x16' else 4; rows = -(-len(sel) // cols)
    sheet = Image.new('RGB', (cols * tw, rows * (th + 26)), (18, 18, 22)); dr = ImageDraw.Draw(sheet)
    try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15)
    except Exception: font = ImageFont.load_default()
    idx = []
    for n, c in enumerate(sel):
        pp = os.path.join(BASE, c['slug'], 'poster.webp'); os.makedirs(os.path.dirname(pp), exist_ok=True)
        if not os.path.exists(pp):
            try: open(pp, 'wb').write(fetch(c['poster'], binary=True))
            except Exception: continue
        im = Image.open(pp).convert('RGB'); s = max(tw / im.width, th / im.height)
        im = im.resize((round(im.width * s), round(im.height * s))); l, t = (im.width - tw) // 2, (im.height - th) // 2
        x, y = (n % cols) * tw, (n // cols) * (th + 26)
        sheet.paste(im.crop((l, t, l + tw, t + th)), (x, y))
        dr.text((x + 6, y + th + 4), f'{n+1}. {c["title"][:(22 if fmt=="9x16" else 32)]}', fill=(235, 235, 240), font=font)
        idx.append(f'{n+1}. {c["slug"]}  ·  {c["title"]}  ·  @{c["handle"]}')
    out = os.path.join(BASE, f'capas_{fmt}{"_" + re.sub(r"[^a-z0-9]+", "-", search) if search else ""}.jpg'); sheet.save(out, quality=85)
    print(f'✅ {out}  ({len(idx)} capas)'); print('\n'.join(idx))

elif cmd == 'peek':
    from PIL import Image, ImageDraw, ImageFont
    sel = need(rest); strips = []; lines = []
    for c in sel:
        v = video(c); e = entry(c['slug'])
        dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', v],
                                   capture_output=True, text=True).stdout.strip() or 10)
        sp = os.path.join(BASE, c['slug'], 'strip.jpg'); n = 10; h = 220
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', v, '-vf', f'fps={n/dur:.4f},scale=-2:{h},tile={n}x1', '-frames:v', '1', sp], check=True)
        strips.append((c, sp))
        lines.append(f'## {c["title"]} — @{c["handle"]} ({c["format"]}, {dur:.0f}s)\nslug: {c["slug"]} · post: {e["post"]} · '
                     f'modelo: {e["model"]} {e["effort"]} · ferramentas: {e.get("stack") or "?"} · rodadas: {e.get("iterations") or "?"}\nprompt: {e["prompt"]}\n')
    ims = [Image.open(p) for _, p in strips]; W = max(i.width for i in ims)
    out = Image.new('RGB', (W, sum(i.height + 30 for i in ims)), (18, 18, 22)); dr = ImageDraw.Draw(out); y = 0
    try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
    except Exception: font = ImageFont.load_default()
    for (c, _), im in zip(strips, ims):
        dr.text((8, y + 6), f'{c["slug"]} · {c["title"]} · @{c["handle"]}', fill=(235, 235, 240), font=font); out.paste(im, (0, y + 30)); y += im.height + 30
    op = os.path.join(BASE, 'peek.jpg'); out.save(op, quality=85)
    md = os.path.join(BASE, 'peek.md'); open(md, 'w').write('\n'.join(lines))
    print(f'✅ {op}  (10 quadros por vídeo, do início ao fim)\n✅ {md}\n'); print('\n'.join(lines))

elif cmd == 'get':
    c = need(rest[:1])[0]; v = video(c); e = entry(c['slug'])
    print(v); print(f'crédito: "{c["title"]}" por @{c["handle"]} · {e["post"]}', file=sys.stderr)
