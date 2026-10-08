"""Projeto Remotion do vídeo: cria a pasta a partir do template e coloca as mídias REAIS dentro dela.

  python3 assets.py new  <PROJ>                       → copia templates/remotion e instala as dependências (npm)
  python3 assets.py add  <PROJ> arquivo [arquivo…]    → mídias (vídeo/foto) em public/media/ (vídeo é recodificado
                                                        para H.264 com quadro-chave curto: busca rápida no render)
  python3 assets.py logo <PROJ> logo.png [--keep-bg] [--holes] [--name x]
                                                      → logo/assinatura em public/brand/ (fundo liso removido,
                                                        margem transparente recortada)
  python3 assets.py voice <PROJ> $WORK/voice/words.json   → narração (palavras + marcadores + MP3) para o kit (src/words.json)
  python3 assets.py music <PROJ> $WORK/music/music.json   → trilha (MP3 em public/trilha.mp3 + batidas)
  python3 assets.py font  <PROJ> fonte.woff2 [...]        → fontes em public/fonts/

PROJ costuma ser $WORK/video. Dependências do npm ficam em cache ($WORK/.jsmotion-npm) e são reaproveitadas."""
import os, sys, json, shutil, subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageChops
from _paths import workdir

HERE = os.path.dirname(os.path.abspath(__file__))
TPL = os.path.join(HERE, '..', 'templates', 'remotion')

def cutout(im, name='', tol=34, soft=34, holes=False):
    """Imagem sem transparência com fundo LISO (branco, preto ou cor sólida) → PNG transparente.
    Só remove o fundo ligado às bordas (o branco DENTRO da logo fica), com borda suave (antisserrilhado).
    holes=True também remove a cor do fundo nos miolos fechados (ex.: dentro do "A" ou do "O").
    Devolve a imagem original se já tiver transparência ou se o fundo não for liso."""
    im = im.convert('RGBA')
    if im.getextrema()[3][0] < 250: return im                     # já tem transparência
    w, h = im.size; rgb = im.convert('RGB'); px = rgb.load()
    border = [px[x, y] for x in range(0, w, max(1, w//80)) for y in (0, h-1)] + \
             [px[x, y] for y in range(0, h, max(1, h//80)) for x in (0, w-1)]
    bg = max(set(border), key=border.count) if border else (255, 255, 255)
    near = lambda c: sum((a-b)**2 for a, b in zip(c, bg)) <= tol**2
    if sum(near(c) for c in border) < 0.85*len(border): return im   # fundo não é liso (foto, degradê): não mexe
    # distância de cada pixel até a cor do fundo (0 = fundo)
    diff = ImageChops.difference(rgb, Image.new('RGB', im.size, bg)).convert('L')
    diff = diff.point(lambda v: min(255, v*2))
    # máscara do fundo ligado às bordas: flood fill a partir da moldura da imagem
    m = diff.point(lambda v: 255 if v <= tol else 0); mp = m.load()
    for x in range(w):
        for y in (0, h-1):
            if mp[x, y] == 255: ImageDraw.floodfill(m, (x, y), 128)
    for y in range(h):
        for x in (0, w-1):
            if mp[x, y] == 255: ImageDraw.floodfill(m, (x, y), 128)
    outside = m.point(lambda v: 255 if (v == 128 or (holes and v == 255)) else 0)
    # alfa: 0 no fundo; perto da borda do fundo, proporcional à diferença de cor (borda suave); resto opaco
    ring = outside.filter(ImageFilter.MaxFilter(5))
    softa = diff.point(lambda v: 0 if v <= tol else min(255, int((v-tol)*255/soft)))
    alpha = Image.composite(softa, Image.new('L', im.size, 255), ring)
    alpha = Image.composite(Image.new('L', im.size, 0), alpha, outside)
    im.putalpha(alpha)
    print(f'✂️  {name or "imagem"}: fundo liso {"#%02X%02X%02X" % bg[:3]} removido (fica transparente)')
    return im

def new(proj):
    if os.path.exists(os.path.join(proj, 'src', 'Video.tsx')):
        print(f'ℹ️  {proj} já existe (nada sobrescrito)')
    else:
        shutil.copytree(TPL, proj, dirs_exist_ok=True)
    cache = os.path.join(workdir(), '.jsmotion-npm')
    if not os.path.isdir(os.path.join(cache, 'node_modules', 'remotion')):
        os.makedirs(cache, exist_ok=True); shutil.copy(os.path.join(TPL, 'package.json'), cache)
        print('📦 instalando Remotion (1ª vez, ~1 min)…')
        subprocess.run(['npm', 'install', '--no-audit', '--no-fund', '--loglevel=error'], cwd=cache, check=True)
    nm = os.path.join(proj, 'node_modules')
    if not os.path.exists(nm): os.symlink(os.path.join(cache, 'node_modules'), nm)
    print(f'✅ projeto Remotion em {proj}  (edite src/style.ts e src/Video.tsx)')

def add(proj, files):
    d = os.path.join(proj, 'public', 'media'); os.makedirs(d, exist_ok=True)
    for f in files:
        name = os.path.basename(f); dst = os.path.join(d, name)
        if f.lower().endswith(('.mp4', '.mov', '.webm', '.mkv')):
            dst = os.path.splitext(dst)[0] + '.mp4'
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-an', '-c:v', 'libx264', '-crf', '17', '-preset', 'veryfast',
                            '-pix_fmt', 'yuv420p', '-g', '15', dst], check=True)
        else:
            im = Image.open(f); im = im.convert('RGB') if im.mode not in ('RGB', 'L') else im
            if max(im.size) > 2400: im.thumbnail((2400, 2400), Image.LANCZOS)
            dst = os.path.splitext(dst)[0] + '.jpg'; im.save(dst, 'JPEG', quality=90)
        print(f'🎞️  media/{os.path.basename(dst)}')

def logo(proj, f, keep_bg=False, holes=False, name=None):
    d = os.path.join(proj, 'public', 'brand'); os.makedirs(d, exist_ok=True)
    im = Image.open(f).convert('RGBA')
    if not keep_bg: im = cutout(im, os.path.basename(f), holes=holes)
    bb = im.getbbox(); im = im.crop(bb) if bb else im
    if im.width > 1400: im = im.resize((1400, round(im.height * 1400 / im.width)), Image.LANCZOS)
    dst = os.path.join(d, (name or os.path.splitext(os.path.basename(f))[0]) + '.png'); im.save(dst, optimize=True)
    print(f'🏷️  brand/{os.path.basename(dst)} {im.size[0]}x{im.size[1]}')

def voice(proj, wj):
    v = json.load(open(wj, encoding='utf-8'))
    if v.get('audio'):
        shutil.copy(os.path.join(os.path.dirname(os.path.abspath(wj)), v['audio']), os.path.join(proj, 'public', 'voz.mp3')); v['audio'] = 'voz.mp3'
    json.dump(v, open(os.path.join(proj, 'src', 'words.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    print(f'🎙️  {len(v["words"])} palavras · {len(v.get("marks", {}))} marcadores · {v["dur"]:.1f}s → src/words.json')

def music(proj, mj):
    m = json.load(open(mj, encoding='utf-8'))
    shutil.copy(os.path.join(os.path.dirname(os.path.abspath(mj)), m['audio']), os.path.join(proj, 'public', 'trilha.mp3')); m['audio'] = 'trilha.mp3'
    json.dump(m, open(os.path.join(proj, 'src', 'music.json'), 'w'))
    print(f'🎵 trilha {m["dur"]:.1f}s · {m.get("bpm") or "?"} BPM → public/trilha.mp3 (use <Soundtrack music="trilha.mp3" …/>)')

def font(proj, files):
    d = os.path.join(proj, 'public', 'fonts'); os.makedirs(d, exist_ok=True)
    for f in files: shutil.copy(f, d); print(f'🔤 fonts/{os.path.basename(f)}')

if __name__ == '__main__':
    a = sys.argv[1:]
    if len(a) < 2: sys.exit(__doc__)
    cmd, proj, rest = a[0], os.path.abspath(a[1]), a[2:]
    if cmd == 'new': new(proj)
    elif cmd == 'add': add(proj, rest)
    elif cmd == 'logo':
        nm = rest[rest.index('--name') + 1] if '--name' in rest else None
        logo(proj, rest[0], '--keep-bg' in rest, '--holes' in rest, nm)
    elif cmd == 'voice': voice(proj, rest[0])
    elif cmd == 'music': music(proj, rest[0])
    elif cmd == 'font': font(proj, rest)
    else: sys.exit(__doc__)
