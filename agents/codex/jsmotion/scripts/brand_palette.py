"""Uso: python3 brand_palette.py logo.png [outros materiais da marca: cartão, post, foto da fachada...] [--out PASTA]
Paleta da marca quando NÃO há site (ou para confirmar a do site): extrai as cores reais da logo e dos materiais,
separa cores de marca e neutros, propõe os papéis do STYLE (fundo, texto, destaque...) com contraste conferido
(WCAG) e gera uma amostra visual para mostrar ao usuário.
Saída: $WORK/brand/palette.json + $WORK/brand/palette.png (+ resumo no terminal)."""
import sys, os, json, colorsys
from PIL import Image, ImageDraw, ImageFont
from _paths import workdir

args = sys.argv[1:]
out = workdir() + '/brand'
if '--out' in args:
    i = args.index('--out'); out = args[i+1]; del args[i:i+2]
files = [a for a in args if os.path.isfile(a)]
if not files: sys.exit(__doc__)
os.makedirs(out, exist_ok=True)

def hx(c): return '#%02X%02X%02X' % tuple(int(round(v)) for v in c[:3])
def lum(c):
    def ch(v):
        v /= 255; return v/12.92 if v <= 0.03928 else ((v+0.055)/1.055)**2.4
    r, g, b = c[:3]; return 0.2126*ch(r) + 0.7152*ch(g) + 0.0722*ch(b)
def contrast(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True); return (la+0.05)/(lb+0.05)
def hsv(c): return colorsys.rgb_to_hsv(*(v/255 for v in c[:3]))
def from_hsv(h, s, v): return tuple(round(x*255) for x in colorsys.hsv_to_rgb(h, s, v))

# ---- coleta de cores (pixels visíveis; a logo pesa mais que os outros materiais) ----
counts = {}
for n, f in enumerate(files):
    im = Image.open(f).convert('RGBA'); im.thumbnail((400, 400))
    has_alpha = im.getextrema()[3][0] < 250
    q = im.convert('RGB').quantize(colors=12, method=Image.Quantize.MEDIANCUT)
    flat = lambda x: list(x.get_flattened_data() if hasattr(x, 'get_flattened_data') else x.getdata())
    pal = q.getpalette()[:36]; idx = flat(q); alpha = flat(im.getchannel('A'))
    w = 3.0 if n == 0 else 1.0
    tot = sum(1 for a in alpha if a > 200) or 1
    for p, a in zip(idx, alpha):
        if a <= 200: continue
        c = tuple(pal[p*3:p*3+3]); counts[c] = counts.get(c, 0) + w/tot
    if n == 0 and not has_alpha:
        print('ℹ️  a logo não tem fundo transparente: a cor de fundo dela entra na contagem (normal se for a cor da marca).')

if not counts: sys.exit('❌ nenhuma cor visível nas imagens (arquivo vazio ou todo transparente)')
# agrupa cores parecidas
groups = []
for c, v in sorted(counts.items(), key=lambda x: -x[1]):
    for g in groups:
        if sum((a-b)**2 for a, b in zip(g['c'], c)) < 38**2: g['v'] += v; break
    else: groups.append({'c': c, 'v': v})
total = sum(g['v'] for g in groups) or 1
for g in groups:
    h, s, v = hsv(g['c']); g['share'] = g['v']/total
    g['kind'] = 'neutro' if (s < 0.18 or v < 0.12) else 'marca'
brand = [g for g in groups if g['kind'] == 'marca' and g['share'] > 0.01]
neutral = [g for g in groups if g['kind'] == 'neutro' and g['share'] > 0.01]
# destaque = cor de marca mais presente, com peso para saturação (a cor "que a gente lembra")
brand.sort(key=lambda g: -(g['share'] * (0.5 + hsv(g['c'])[1])))

if brand:
    acc = brand[0]['c']
    acc2 = brand[1]['c'] if len(brand) > 1 else from_hsv(hsv(acc)[0], max(0.25, hsv(acc)[1]*0.6), min(1, hsv(acc)[2]*1.15+0.1))
else:   # logo só em preto/branco/cinza: o destaque sai do neutro mais forte, e isso é avisado
    acc = min(neutral, key=lambda g: lum(g['c']))['c'] if neutral else (20, 20, 20)
    acc2 = (120, 120, 120)
    print('⚠️  logo sem cor de marca (só neutros): confirme com o usuário qual cor de destaque usar.')

h, s, v = hsv(acc)
dark_n = [g['c'] for g in neutral if lum(g['c']) < 0.03]
light_n = [g['c'] for g in neutral if lum(g['c']) > 0.8]
# fundo escuro: o preto da própria logo, senão o matiz do destaque bem escuro (tom da marca, não preto genérico)
bg_dark = dark_n[0] if dark_n else from_hsv(h, min(0.55, s*0.7), 0.10)
bg_dark2 = from_hsv(hsv(bg_dark)[0], hsv(bg_dark)[1], min(1, hsv(bg_dark)[2]+0.07))
bg_light = light_n[0] if light_n else from_hsv(h, 0.05, 0.97)
bg_light2 = from_hsv(hsv(bg_light)[0], min(1, hsv(bg_light)[1]+0.04), max(0, hsv(bg_light)[2]-0.05))

def roles(bg, bg2, dark):
    ink = (247, 245, 241) if dark else from_hsv(h, min(0.5, s*0.6), 0.12)
    soft = tuple(round(a*0.62 + b*0.38) for a, b in zip(ink, bg))
    on = (11, 11, 11) if contrast(acc, (11, 11, 11)) >= contrast(acc, (255, 255, 255)) else (255, 255, 255)
    # destaque para TEXTO: se a cor da marca some no fundo, escurece/clareia mantendo o matiz (a cor original fica para blocos)
    at, hh, ss, vv = acc, *hsv(acc)
    for _ in range(40):
        if contrast(at, bg) >= 4.5: break
        vv = max(0, vv-0.03) if not dark else min(1, vv+0.03); ss = min(1, ss+0.01) if not dark else max(0, ss-0.02)
        at = from_hsv(hh, ss, vv)
    r = {'bg': hx(bg), 'bg2': hx(bg2), 'ink': hx(ink), 'soft': hx(soft), 'accent': hx(acc), 'accent2': hx(acc2), 'onAccent': hx(on),
         'accentText': hx(at)}
    chk = {'texto/fundo': round(contrast(ink, bg), 1), 'destaque/fundo': round(contrast(acc, bg), 1),
           'destaque-texto/fundo': round(contrast(at, bg), 1), 'texto-no-destaque': round(contrast(on, acc), 1)}
    return r, chk

dark, cdark = roles(bg_dark, bg_dark2, True)
light, clight = roles(bg_light, bg_light2, False)
res = {'fontes': files,
       'cores_da_marca': [{'hex': hx(g['c']), 'presenca': f"{g['share']*100:.0f}%"} for g in brand[:5]],
       'neutros': [{'hex': hx(g['c']), 'presenca': f"{g['share']*100:.0f}%"} for g in neutral[:4]],
       'proposta_escura': dark, 'contraste_escura': cdark,
       'proposta_clara': light, 'contraste_clara': clight,
       'origem': 'logo' + (' + materiais' if len(files) > 1 else '')}
json.dump(res, open(os.path.join(out, 'palette.json'), 'w'), indent=2, ensure_ascii=False)

# ---- amostra visual para o usuário ----
W, H = 1200, 700
img = Image.new('RGB', (W, H), '#FFFFFF'); d = ImageDraw.Draw(img)
try: F = ImageFont.truetype('DejaVuSans.ttf', 22); FB = ImageFont.truetype('DejaVuSans-Bold.ttf', 26)
except Exception: F = FB = ImageFont.load_default()
logo = Image.open(files[0]).convert('RGBA'); logo.thumbnail((360, 150))
d.rectangle([0, 0, W, 190], fill='#F2F2F2'); img.paste(logo, (30, (190-logo.height)//2), logo)
x = 430
for g in (brand[:4] + neutral[:2]):
    d.rectangle([x, 40, x+90, 130], fill=hx(g['c'])); d.text((x, 140), hx(g['c']), fill='#222', font=F); x += 125
for k, (name, r) in enumerate([('Proposta escura', dark), ('Proposta clara', light)]):
    y = 220 + k*240
    d.rectangle([30, y, W-30, y+210], fill=r['bg'])
    d.text((60, y+25), name.upper(), fill=r['accentText'], font=FB)
    d.text((60, y+75), 'Título do vídeo', fill=r['ink'], font=FB)
    d.text((60, y+120), 'texto de apoio · fundo ' + r['bg'], fill=r['soft'], font=F)
    d.rounded_rectangle([760, y+70, 1120, y+150], 40, fill=r['accent']); d.text((800, y+97), 'Botão / destaque', fill=r['onAccent'], font=FB)
img.save(os.path.join(out, 'palette.png'))

print('🎨 cores da marca:', ', '.join(f"{c['hex']} ({c['presenca']})" for c in res['cores_da_marca']) or '—')
print('   neutros:', ', '.join(f"{c['hex']} ({c['presenca']})" for c in res['neutros']) or '—')
print('   proposta escura:', dark, '· contraste', cdark)
print('   proposta clara: ', light, '· contraste', clight)
low = [k for k, v in cdark.items() if v < 4.5 and k != 'destaque/fundo'] + [k+' (clara)' for k, v in clight.items() if v < 4.5 and k != 'destaque/fundo']
if low: print('⚠️  contraste baixo (<4.5) em:', ', '.join(low), '— ajuste antes de usar.')
for nm, c in (('escura', cdark), ('clara', clight)):
    if c['destaque/fundo'] < 3: print(f'ℹ️  proposta {nm}: a cor da marca sobre o fundo tem contraste {c["destaque/fundo"]} → use "accent" em blocos/botões/marca-texto e "accentText" em texto.')
print('→', os.path.join(out, 'palette.json'), '·', os.path.join(out, 'palette.png'))
