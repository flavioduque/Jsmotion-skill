"""Uso: python3 prep_assets.py config.json saida/assets.js
Empacota logo, imagens, trechos de vídeo (como sequência de quadros) e a fonte em data URIs,
para que o HTML final seja um arquivo único que funciona offline.
config.json:
{
 "logo": "/caminho/logo.png",            # a logo ORIGINAL (só recorte de margem transparente + redimensionar)
 "logo_width": 1400,
 "images": {"chave": "/caminho/img.png"}, # prints de projetos, fotos
 "image_size": [1000, 625],
 "clips": {"chave": {"src":"/v.mp4","start":2.0,"dur":1.8,"scale":"560:315"}},
 "font": "/caminho/fonte.woff2",          # opcional; padrão: templates/saira.woff2 (template tech)
 # --- kit de cenas (templates/kit.js) ---
 "photos": {"p1": "/foto.jpg"},             # fotos INTEIRAS (sem recorte) para tela cheia; lado maior até photo_max
 "photo_max": 1600,
 "logos": {"logoL": "/logo.png"},           # PNG com transparência preservada (moldura, assinatura, logo final)
                                            # sem transparência (JPG, PNG com fundo branco/liso)? o fundo liso que toca
                                            # as bordas é removido sozinho; para manter: {"src": "/logo.jpg", "keep_bg": true};
                                            # miolos das letras também: {"src": "/logo.jpg", "holes": true}
 "fonts": {"display": "/f.woff2", "display_italic": "/fi.woff2", "text": "/t.woff2", "mono": "/m.woff2"}
                                            # da direção de arte (get_font.py); "mono" = rótulos do HUD (opcional)
                                            # "playfair-inter" = atalho para as fontes embutidas em templates/fonts
 "voice": "/caminho/voice/words.json"       # vídeo narrado: saída do voice.py (palavras + marcadores + a voz em MP3)
}"""
import base64, subprocess, glob, os, json, io, sys, tempfile
from PIL import Image, ImageDraw, ImageFilter, ImageChops

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
cfg=json.load(open(sys.argv[1])); dst=sys.argv[2]; here=os.path.dirname(os.path.abspath(__file__))
tmp=tempfile.mkdtemp(prefix='jsmotion_')  # temporários únicos: dois processos não se atropelam
b64=lambda p,m:f"data:{m};base64,"+base64.b64encode(open(p,'rb').read()).decode()
out={'projects':{},'seq':{}}
if cfg.get('logo'):
    im=cutout(Image.open(cfg['logo']), 'logo'); bb=im.getbbox(); im=im.crop(bb) if bb else im
    w=cfg.get('logo_width',1400); im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS); lp=os.path.join(tmp,'logo.png'); im.save(lp,optimize=True)
    out['logo']=b64(lp,'image/png')
iw,ih=cfg.get('image_size',[1000,625])
for k,p in cfg.get('images',{}).items():
    im=Image.open(p).convert('RGB'); s=max(iw/im.width,ih/im.height)
    im=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS)
    l=(im.width-iw)//2; im=im.crop((l,0,l+iw,ih)); buf=io.BytesIO(); im.save(buf,'JPEG',quality=82,optimize=True)
    out['projects'][k]="data:image/jpeg;base64,"+base64.b64encode(buf.getvalue()).decode()
for k,c in cfg.get('clips',{}).items():
    subprocess.run(['ffmpeg','-loglevel','error','-y','-ss',str(c.get('start',0)),'-t',str(c.get('dur',2)),'-i',c['src'],
        '-vf',f"fps=15,scale={c.get('scale','560:315')}",'-q:v','7',os.path.join(tmp,f'{k}_%03d.jpg')],check=True)
    out['seq'][k]=[b64(x,'image/jpeg') for x in sorted(glob.glob(os.path.join(tmp,f'{k}_*.jpg')))]
out['font']=b64(cfg.get('font') or os.path.join(here,'..','templates','saira.woff2'),'font/woff2')
pm=cfg.get('photo_max',1600)
if cfg.get('photos'): out['photos']={}
for k,p in cfg.get('photos',{}).items():   # foto inteira: só reduz o lado maior (o template faz o enquadramento)
    im=Image.open(p).convert('RGB'); s=min(1,pm/max(im.size))
    if s<1: im=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS)
    buf=io.BytesIO(); im.save(buf,'JPEG',quality=86,optimize=True)
    out['photos'][k]="data:image/jpeg;base64,"+base64.b64encode(buf.getvalue()).decode()
if cfg.get('logos'): out['logos']={}
for k,p in cfg.get('logos',{}).items():    # logo/assinatura: PNG, recorta a margem transparente, largura até 1000
    o = p if isinstance(p, dict) else {'src': p}; p = o['src']
    im=Image.open(p).convert('RGBA')
    if not o.get('keep_bg'): im=cutout(im, k, holes=o.get('holes', False))
    bb=im.getbbox(); im=im.crop(bb) if bb else im
    if im.width>1000: im=im.resize((1000,round(im.height*1000/im.width)),Image.LANCZOS)
    buf=io.BytesIO(); im.save(buf,'PNG',optimize=True)
    out['logos'][k]="data:image/png;base64,"+base64.b64encode(buf.getvalue()).decode()
fc=cfg.get('fonts')
if fc:
    fd=os.path.join(here,'..','templates','fonts')
    if fc in ('playfair-inter','editorial'):
        fc={'display':os.path.join(fd,'playfair-display-normal.woff2'),'display_italic':os.path.join(fd,'playfair-display-italic.woff2'),'text':os.path.join(fd,'inter-normal.woff2')}
    out['fonts']={k:b64(v,'font/woff2') for k,v in fc.items()}
vc=cfg.get('voice')
if vc:                                     # narração: linha do tempo por palavra + a voz (MP3) embutida
    v=json.load(open(vc,encoding='utf-8'))
    if v.get('audio'): v['audio']=b64(os.path.join(os.path.dirname(os.path.abspath(vc)),v['audio']),'audio/mpeg')
    out['voice']=v
js='window.ASSETS='+json.dumps(out)+';'; open(dst,'w').write(js)
import shutil; shutil.rmtree(tmp,ignore_errors=True)
print(f'{dst}: {len(js)/1e6:.2f} MB | imagens {len(out["projects"])} | fotos {len(out.get("photos",{}))} | logos {len(out.get("logos",{}))} | fontes {list(out.get("fonts",{}))} | clips',{k:len(v) for k,v in out['seq'].items()},'| voz',(f"{len(out['voice']['words'])} palavras" if out.get('voice') else 'não'))
