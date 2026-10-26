"""Mapa REAL (OpenStreetMap) na direção de arte do vídeo: ponto A (o imóvel/negócio) → ponto B (referência conhecida).

  python3 map_osm.py <PROJ> --a "-25.5105,-54.6443" --b "Puente de la Amistad, Ciudad del Este" [--zoom 15]
                     [--bg "#0b0a09"] [--road "#3a342c"] [--major "#8c7242"] [--water "#16202a"]

--a / --b: "lat,lon" ou um nome para buscar (Nominatim/OSM). Sem endereço exato no mapa público, use o centro do bairro e
           mostre o selo "localização aproximada" no vídeo.
Gera public/media/mapa.png (ruas e água reais, sem rótulos, nas cores passadas) e src/map.json:
  {W, H, a:[x,y], b:[x,y], route:[[x,y]…]} em pixels do mapa — a rota segue as vias principais (amarelas/laranjas do OSM)
  entre A e B. A legenda "© OpenStreetMap" é OBRIGATÓRIA na tela (licença ODbL).
Uso educado dos servidores do OSM: baixa poucas dezenas de blocos, uma vez, com identificação."""
import json, math, os, subprocess, sys, time, urllib.parse, urllib.request
import numpy as np
from PIL import Image, ImageFilter

a = sys.argv[1:]
def opt(flag, default=None):
    if flag not in a: return default
    i = a.index(flag); v = a[i + 1]; del a[i:i + 2]; return v
A, Bq, z = opt('--a'), opt('--b'), int(opt('--zoom', 15))
hexc = lambda h: tuple(int(h.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
BG, ROAD, MAJOR, WATER = (hexc(opt(f, d)) for f, d in (('--bg', '#0b0a09'), ('--road', '#3a342c'), ('--major', '#8c7242'), ('--water', '#16202a')))
if not a or not A or not Bq: sys.exit(__doc__)
proj = os.path.abspath(a[0]); UA = 'jsmotion/1.0 (motion video renderer)'

def geo(q):
    try: lat, lon = (float(v) for v in q.split(',')); return lat, lon
    except ValueError: pass
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode({'q': q, 'format': 'json', 'limit': 1})
    r = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=30))
    if not r: sys.exit(f'❌ não achei "{q}" no OpenStreetMap; passe "lat,lon"')
    print(f'📍 {q} → {r[0]["display_name"][:90]}'); time.sleep(1)
    return float(r[0]['lat']), float(r[0]['lon'])

def tile_xy(lat, lon):
    n = 2 ** z; r = math.radians(lat)
    return (lon + 180) / 360 * n, (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * n

pa, pb = geo(A), geo(Bq)
(xa, ya), (xb, yb) = tile_xy(*pa), tile_xy(*pb)
m = max(abs(xa - xb), abs(ya - yb)) * 0.35 + 0.6            # margem em volta dos dois pontos
X = range(int(min(xa, xb) - m), int(max(xa, xb) + m) + 1); Y = range(int(min(ya, yb) - m), int(max(ya, yb) + m) + 1)
if len(X) * len(Y) > 80: sys.exit('❌ área grande demais para este zoom; use --zoom menor')
cache = os.path.join(proj, '.osm'); os.makedirs(cache, exist_ok=True)
img = Image.new('RGB', (len(X) * 256, len(Y) * 256))
for i, x in enumerate(X):
    for j, y in enumerate(Y):
        f = os.path.join(cache, f'{z}_{x}_{y}.png')
        if not os.path.exists(f):
            req = urllib.request.Request(f'https://tile.openstreetmap.org/{z}/{x}/{y}.png', headers={'User-Agent': UA})
            open(f, 'wb').write(urllib.request.urlopen(req, timeout=30).read()); time.sleep(0.2)
        img.paste(Image.open(f).convert('RGB'), (i * 256, j * 256))

# estilo: só ruas e água reais (rótulos e ícones somem), nas cores da marca
p = np.asarray(img).astype(int); r, g, b = p[..., 0], p[..., 1], p[..., 2]
water = (b > r + 20) & (b > 175); major = (r > 215) & ((r - b) > 30) & ~water; road = (r > 247) & (g > 247) & (b > 247)
out = np.zeros_like(p); out[:] = BG; out[water] = WATER; out[road] = ROAD; out[major] = MAJOR
os.makedirs(os.path.join(proj, 'public', 'media'), exist_ok=True)
Image.fromarray(out.astype('uint8')).filter(ImageFilter.GaussianBlur(0.6)).save(os.path.join(proj, 'public', 'media', 'mapa.png'))

px = lambda xy: [round((xy[0] - X.start) * 256, 1), round((xy[1] - Y.start) * 256, 1)]
PA, PB = px((xa, ya)), px((xb, yb))
# rota: anda de A até B pelas vias principais mais próximas da reta.
# shortcut: segue a via principal coluna a coluna (bom para rotas quase horizontais); rota real com curvas pede um roteador (OSRM)
route, prev = [], None
step = 8 if PB[0] >= PA[0] else -8
for x in range(int(PA[0]), int(PB[0]), step):
    f = (x - PA[0]) / (PB[0] - PA[0]) if PB[0] != PA[0] else 0
    yl = PA[1] + (PB[1] - PA[1]) * f
    lo, hi = int(max(0, yl - 160)), int(min(out.shape[0], yl + 160))
    ys = np.nonzero(major[lo:hi, x])[0] + lo
    if not len(ys): continue
    y = int(ys[np.argmin(abs(ys - (prev if prev is not None else yl)))])
    if prev is not None and abs(y - prev) > 25: continue
    route.append([x, y]); prev = y
json.dump({'W': img.width, 'H': img.height, 'a': PA, 'b': PB, 'route': [PA] + route + [PB]},
          open(os.path.join(proj, 'src', 'map.json'), 'w'))
print(f'🗺️  {img.width}x{img.height} (zoom {z}, {len(X) * len(Y)} blocos) · rota com {len(route)} pontos → public/media/mapa.png + src/map.json')
print('   Na tela: "© OpenStreetMap" (obrigatório) e, se o ponto for aproximado, "localização aproximada".')
