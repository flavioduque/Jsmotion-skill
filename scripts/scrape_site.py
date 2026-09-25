"""Uso: python3 scrape_site.py https://site.com [pasta_saida]
Baixa o HTML + JS/CSS do site, extrai paleta de cores, textos e baixa imagens/vídeos referenciados.
Funciona bem com sites SPA (Vite/React), onde a mídia está citada dentro do bundle JS."""
import re, sys, os, json, subprocess, urllib.parse, collections
url=sys.argv[1].rstrip('/'); out=sys.argv[2] if len(sys.argv)>2 else '/home/claude/site'
os.makedirs(out,exist_ok=True)
def get(u,path=None):
    r=subprocess.run(['curl','-sfL','-A','Mozilla/5.0',u]+(['-o',path] if path else []),capture_output=not path)
    return r.stdout.decode('utf-8','ignore') if not path else r.returncode==0
html=get(url); blobs=[html]
for ref in re.findall(r'(?:src|href)="([^"]+\.(?:js|css))"',html):
    blobs.append(get(urllib.parse.urljoin(url+'/',ref)) or '')
txt='\n'.join(blobs)
title=(re.findall(r'<title>([^<]*)',html) or [''])[0]
colors=collections.Counter(c.lower() for c in re.findall(r'#[0-9a-fA-F]{6}\b',txt))
media=sorted(set(re.findall(r'["\'(]([^"\'()\s]+\.(?:mp4|webm|png|jpe?g|webp|svg|gif))["\')]',txt)))
got=[]
for m in media:
    if m.startswith('data:'): continue
    full=urllib.parse.urljoin(url+'/',m); dest=os.path.join(out,'media',urllib.parse.urlparse(full).path.lstrip('/'))
    os.makedirs(os.path.dirname(dest),exist_ok=True)
    if get(full,dest): got.append(dest)
info={'title':title,'top_colors':colors.most_common(20),'media':got}
json.dump(info,open(os.path.join(out,'site_info.json'),'w'),indent=1,ensure_ascii=False)
print(json.dumps({'title':title,'top_colors':colors.most_common(12),'n_media':len(got)},ensure_ascii=False))
for g in got: print(g)
