"""Uso: python3 scrape_site.py https://site.com [pasta_saida]   (padrão: $WORK/site)
Baixa o HTML + JS/CSS do site, extrai paleta de cores, FONTES da marca, TEXTOS DE MARKETING (meta, títulos, frases,
listas, botões, preços, números de prova) e baixa imagens/vídeos referenciados.
Funciona com sites SPA (Vite/React): os textos saem das traduções/strings do bundle JS, separados por idioma.
Saídas: site_info.json (tudo) e textos.md (os textos organizados, para ler antes de escrever o roteiro)."""
import re, sys, os, json, subprocess, urllib.parse, collections, html as H
from html.parser import HTMLParser
from _paths import workdir
url=sys.argv[1].rstrip('/'); out=sys.argv[2] if len(sys.argv)>2 else os.path.join(workdir(),'site')
os.makedirs(out,exist_ok=True)
def get(u,path=None):
    r=subprocess.run(['curl','-sfL','--compressed','-A','Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140.0',u]+(['-o',path] if path else []),capture_output=not path)
    return r.stdout.decode('utf-8','ignore') if not path else r.returncode==0
html=get(url); blobs=[html]
for ref in re.findall(r'(?:src|href)="([^"]+\.(?:js|css))"',html):
    if '//' in ref and urllib.parse.urlparse(ref).netloc not in ('',urllib.parse.urlparse(url).netloc): continue   # CDN de terceiros
    blobs.append(get(urllib.parse.urljoin(url+'/',ref)) or '')
txt='\n'.join(blobs)
title=(re.findall(r'<title>([^<]*)',html) or [''])[0]
colors=collections.Counter(c.lower() for c in re.findall(r'#[0-9a-fA-F]{6}\b',txt))
# fontes da marca: famílias do CSS + do Google Fonts (a direção de arte parte delas; baixe com get_font.py)
GEN={'inherit','initial','sans-serif','serif','monospace','system-ui','cursive','fantasy','-apple-system','blinkmacsystemfont',
     'segoe ui','roboto','helvetica','helvetica neue','arial','ui-sans-serif','ui-serif','ui-monospace','apple color emoji',
     'segoe ui emoji','segoe ui symbol','noto color emoji','var','unset','revert'}
fonts=collections.Counter()
for decl in re.findall(r'font-family\s*:\s*([^;}{]+)',txt):
    for f in decl.split(','):
        f=f.strip().strip('"\'').strip()
        if f and f.lower() not in GEN and not f.startswith('var(') and len(f)<40: fonts[f]+=1
for q in re.findall(r'fonts\.googleapis\.com/css2?\?([^"\'\s)]+)',txt):
    for fam in re.findall(r'family=([^&:]+)',q): fonts[fam.replace('+',' ')]+=5
media=sorted(set(re.findall(r'["\'(]([^"\'()\s]+\.(?:mp4|webm|png|jpe?g|webp|svg|gif))["\')]',txt)))
got=[]
for m in media:
    if m.startswith('data:'): continue
    full=urllib.parse.urljoin(url+'/',m); dest=os.path.join(out,'media',urllib.parse.urlparse(full).path.lstrip('/'))
    os.makedirs(os.path.dirname(dest),exist_ok=True)
    if get(full,dest): got.append(dest)
# ---------- textos de marketing ----------
LANG={'pt':'você voce seu sua seus suas não nao são também então para com uma dos das pelo pela em do da no na é às grátis agora'.split(),
      'es':'tu tus más también qué para con una los las del el y en es al vos tenés podés sin gratis ahora usted'.split(),
      'en':'you your the and to of is with for our free now get without'.split()}
def lang(t):
    tl=t.lower(); w=re.findall(r"[a-záéíóúâêôãõçñü']+",tl); sc={k:sum(x in v for x in w) for k,v in LANG.items()}
    sc['pt']+=3*len(re.findall(r'ção|ções|ã|õ|ç|lh|nh',tl)); sc['es']+=3*len(re.findall(r'ción|ciones|ñ|¿|¡|ll',tl))
    b=max(sc,key=sc.get); return b if sc[b]>=2 and list(sc.values()).count(sc[b])==1 else '?'
def clean(t): return re.sub(r'\s+',' ',H.unescape(t)).strip()
class P(HTMLParser):
    def __init__(s): super().__init__(); s.stack=[]; s.out=[]; s.skip=0; s.buf=''
    def handle_starttag(s,t,a):
        if t in ('script','style','noscript','svg'): s.skip+=1
        if t in ('h1','h2','h3','h4','p','li','button','a','span','small','strong','div','label'): s.flush(); s.stack.append(t)
    def handle_endtag(s,t):
        if t in ('script','style','noscript','svg'): s.skip=max(0,s.skip-1)
        if s.stack and t==s.stack[-1]: s.flush(); s.stack.pop()
    def handle_data(s,d):
        if not s.skip: s.buf+=d
    def flush(s):
        t=clean(s.buf); s.buf=''
        if t and s.stack: s.out.append((s.stack[-1],t))
p=P(); p.feed(html); p.flush()
meta={}
for k,v in re.findall(r'<meta[^>]+(?:name|property)="([^"]+)"[^>]+content="([^"]*)"',html)+[(b,a) for a,b in re.findall(r'<meta[^>]+content="([^"]*)"[^>]+(?:name|property)="([^"]+)"',html)]:
    if any(x in k for x in ('description','title')) and v.strip(): meta[k]=clean(v)
T={'headings':[],'paragraphs':[],'bullets':[],'ctas':[]}
seen=set()
def add(kind,t,mx=200):
    if 5<=len(t)<=mx and t.lower() not in seen: seen.add(t.lower()); T[kind].append(t)
for tag,t in p.out:
    if tag in ('h1','h2','h3','h4'): add('headings',t,140)
    elif tag in ('button','a') and len(t)<=40 and len(t.split())<=6: add('ctas',t,40)
    elif tag=='li': add('bullets',t,160)
    elif len(t.split())>=4: add('paragraphs',t,260)
# SPA: textos nas traduções/strings do bundle ("chave":"texto"); chaves de marketing primeiro, telas internas do app depois
KW={5:('hero','headline','tagline','slogan','promise','kicker','pitch'),4:('badge','subtitle','finalcta','value'),
    3:('title','cta','benefit','feature','step','testimonial','proof','result'),2:('description','desc','text','body','sub')}
SKIPKEY=re.compile(r'^(?:class\w*|type|id|name|path|url|src|href|key|icon|variant|method|mode|role|as|to|rel|target|placeholder|error\w*|aria\w*|data\w*)$',re.I)
bundle=collections.defaultdict(list); bseen=set(); cand=[]
jsblob='\n'.join(blobs[1:])
for m in re.finditer(r'[{,]\s*"?([A-Za-z_]\w{0,40})"?\s*:\s*"([^"\\]{10,240})"',jsblob):
    key,t=m.group(1),clean(m.group(2))
    if SKIPKEY.match(key) or len(t.split())<2 or re.search(r'[{}<>=;|]|https?:|\\|\.(?:js|css|png|svg)\b|^[\w.\-/ ]+$(?<=\w)(?<![a-zà-ú])',t): continue
    if not re.search(r'[a-zà-ú]{3}',t) or t.lower() in bseen: continue
    kl=key.lower(); sc=max([k for k,v in KW.items() if any(x in kl for x in v)] or [0])
    ctx=jsblob[max(0,m.start()-400):m.start()].lower()
    if re.search(r'\b(?:hero|landing|home|pricing|plans?|features|benefits|testimonials|finalcta|cta)\s*:\s*\{',ctx): sc+=3
    if re.search(r'grátis|gratis|free|garant|promo|%|\d',t.lower()): sc+=1
    if len(t.split())>=5: sc+=1
    bseen.add(t.lower()); cand.append((sc,len(cand),t))
for sc,_,t in sorted(cand,key=lambda x:(-x[0],x[1])): bundle[lang(t)].append(t)
if sum(len(v) for v in bundle.values())<20:   # sem pares chave:texto: frases soltas com cara de texto humano
    for t in re.findall(r'"([A-ZÁÉÍÓÚÂÊÔ¿¡][^"\\{}<>=;]{18,200})"',jsblob):
        t=clean(t)
        if len(t.split())>=3 and t.lower() not in bseen and not re.search(r'https?:|\.(js|css|png)\b',t): bseen.add(t.lower()); bundle[lang(t)].append(t)
page_lang=(re.findall(r'<html[^>]+lang="([a-zA-Z]{2})',html) or [''])[0].lower()
alltext=' '.join(meta.values())+' | '+' | '.join(t for _,t in p.out)+' | '+' | '.join(x for v in bundle.values() for x in v)
PRICE=r'(?:R\$|Gs\.?|₲|US\$|USD|U\$S|\$|€|£)\s?\d[\d.,]*(?:\s?(?:/\s?(?:m[eê]s|mes|month|mo|año|ano|year|dia|día)|por m[eê]s|al mes|/ano))?'
prices=list(dict.fromkeys(m.strip().rstrip(',.') for m in re.findall(PRICE,alltext)))[:15]
STAT=r'(?<![\w.,])(?:\d{1,3}(?:[.,]\d{3})*\+|\d{1,3}(?:[.,]\d)?\s?%|24/7|\d+\s?(?:x|mil|k|M)\b|\d+\s(?:d[ií]as?|days?|horas?|hours?|minutos?|minutes?|segundos?))'
stats=list(dict.fromkeys(re.findall(STAT,alltext)))[:15]
texts={'lang':page_lang,'meta':meta,**{k:v[:40] for k,v in T.items()},'prices':prices,'stats':stats,
       'bundle':{k:v[:120] for k,v in sorted(bundle.items(),key=lambda x:(x[0]!=page_lang, x[0]=='?', -len(x[1])))}}
with open(os.path.join(out,'textos.md'),'w') as f:
    f.write(f'# Textos de {title or url}\n\nIdioma da página: {page_lang or "?"}\n\n')
    for k,v in meta.items(): f.write(f'- **{k}:** {v}\n')
    for k,lab in (('headings','Títulos'),('paragraphs','Frases'),('bullets','Listas'),('ctas','Botões / chamadas')):
        if T[k]: f.write(f'\n## {lab}\n'+''.join(f'- {x}\n' for x in T[k][:40]))
    if prices: f.write('\n## Preços\n'+''.join(f'- {x}\n' for x in prices))
    if stats: f.write('\n## Números de prova\n'+''.join(f'- {x}\n' for x in stats))
    for lg,v in texts['bundle'].items(): f.write(f'\n## Textos do app/bundle — idioma {lg} ({len(v)})\n'+''.join(f'- {x}\n' for x in v))
info={'title':title,'top_colors':colors.most_common(20),'fonts':fonts.most_common(8),'media':got,'texts':texts}
json.dump(info,open(os.path.join(out,'site_info.json'),'w'),indent=1,ensure_ascii=False)
print(json.dumps({'title':title,'top_colors':colors.most_common(12),'fonts':fonts.most_common(6),'n_media':len(got)},ensure_ascii=False))
nb={k:len(v) for k,v in texts['bundle'].items()}
print(f"📝 textos: {len(T['headings'])} títulos · {len(T['paragraphs'])} frases · {len(T['bullets'])} itens · {len(T['ctas'])} botões"
      f" · preços {prices[:4]} · números {stats[:6]} · bundle {nb} → {os.path.join(out,'textos.md')}")
for h in (T['headings'] or next(iter(texts['bundle'].values()),[]))[:6]: print('   ·', h)
for g in got: print(g)
