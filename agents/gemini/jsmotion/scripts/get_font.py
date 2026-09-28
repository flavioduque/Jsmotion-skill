"""Uso: python3 get_font.py "Nome da Família" [--role display|text] [--out PASTA]
Baixa QUALQUER família do Google Fonts (recorte latino, woff2) — normal e itálico, se existir —
para a direção de arte usar a fonte certa para a marca, em vez de uma fonte fixa.
Imprime o trecho para o "fonts" do config.json. Ex.:
  python3 get_font.py "DM Serif Display" --role display
  python3 get_font.py "Space Grotesk" --role text
Licenças: as fontes do Google Fonts são livres (OFL/Apache) para uso comercial em vídeo."""
import sys, os, re, json, urllib.request, urllib.parse
from _paths import workdir

args = sys.argv[1:]
def opt(flag, default):
    if flag in args: i = args.index(flag); v = args[i+1]; del args[i:i+2]; return v
    return default
role = opt('--role', 'display')
out = opt('--out', None) or os.path.join(workdir(), 'fonts')
if not args: sys.exit(__doc__)
family = args[0]
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'

def css(query):
    url = 'https://fonts.googleapis.com/css2?family=' + query + '&display=swap'
    try:
        return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=30).read().decode()
    except Exception:
        return None

fam = urllib.parse.quote_plus(family)
# tenta a versão variável (todos os pesos) com itálico; senão só variável; senão a família simples
text = (css(f'{fam}:ital,wght@0,100..900;1,100..900') or css(f'{fam}:wght@100..900')
        or css(f'{fam}:ital@0;1') or css(fam))
if not text:
    sys.exit(f'❌ "{family}" não encontrada no Google Fonts (confira o nome em fonts.google.com)')

files = {}
for block in re.findall(r'/\* ([\w-]+) \*/\s*@font-face \{(.*?)\}', text, re.S):
    subset, body = block
    if subset != 'latin': continue                     # só o recorte latino (pt, es, en)
    style = re.search(r'font-style: (\w+)', body).group(1)
    src = re.search(r'url\((https://[^)]+\.woff2)\)', body).group(1)
    files.setdefault(style, src)
if not files:
    sys.exit(f'❌ "{family}" não tem recorte latino em woff2')

os.makedirs(out, exist_ok=True)
slug = re.sub(r'[^a-z0-9]+', '-', family.lower()).strip('-')
cfg = {}
for style, src in files.items():
    path = os.path.join(out, f'{slug}-{style}.woff2')
    with urllib.request.urlopen(urllib.request.Request(src, headers={'User-Agent': UA}), timeout=30) as r, open(path, 'wb') as f:
        f.write(r.read())
    cfg[role if style == 'normal' else f'{role}_italic'] = path
    print(f'✅ {family} ({style}) → {path} ({os.path.getsize(path)//1024} KB)')
print('"fonts" do config.json (junte display + text):', json.dumps(cfg, ensure_ascii=False))
