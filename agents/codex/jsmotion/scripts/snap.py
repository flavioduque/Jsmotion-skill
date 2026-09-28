"""Uso: python3 snap.py pagina.html t1 t2 ... [-o folha.jpg] [--ref $WORK/ref/sheet.jpg]
Fotos de instantes para revisão -> folha de contato (padrão: $WORK/review.jpg) + erros do console.
--ref: põe a folha da referência em cima da do vídeo (comparar estilo com a referência ATUAL).
CHROMIUM_PATH=/caminho/chrome usa um Chromium já instalado."""
import base64,sys,subprocess,os,tempfile,shutil
from playwright.sync_api import sync_playwright
from _paths import workdir
args=sys.argv[1:]; dst=None
if '-o' in args: i=args.index('-o'); dst=args[i+1]; del args[i:i+2]
ref=None
if '--ref' in args: i=args.index('--ref'); ref=args[i+1]; del args[i:i+2]
page=args[0]; ts=[float(x) for x in args[1:]]
dst=dst or os.path.join(workdir(),'review.jpg')
tmp=tempfile.mkdtemp(prefix='jsmotion_snap_')  # única por execução: revisões em paralelo não se misturam
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None); pg=b.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    pg.goto('file://'+os.path.abspath(page)); pg.wait_for_function('window.READY===true',timeout=180000)
    W,H=pg.evaluate('[W,H]')
    for i,t in enumerate(ts):
        d=pg.evaluate(f'renderFrame({t})'); open(os.path.join(tmp,f'snap_{i:03d}.jpg'),'wb').write(base64.b64decode(d.split(',')[1]))
    b.close()
cols=min(6,len(ts)); tw=270 if H>=W else 400; th=round(tw*H/W)
subprocess.run(['ffmpeg','-loglevel','error','-y','-pattern_type','glob','-i',os.path.join(tmp,'snap_*.jpg'),
    '-vf',f'scale={tw}:{th},tile={cols}x{-(-len(ts)//cols)}',dst],check=True)
if ref:  # referência (em cima) x vídeo (embaixo), na mesma largura
    if not os.path.exists(ref): sys.exit(f'--ref não encontrado: {ref}')
    from PIL import Image
    v=Image.open(dst).convert('RGB'); r=Image.open(ref).convert('RGB')
    r=r.resize((v.width, round(r.height*v.width/r.width)))
    out=Image.new('RGB',(v.width, r.height+12+v.height),'white'); out.paste(r,(0,0)); out.paste(v,(0,r.height+12))
    out.save(dst,quality=90)
shutil.rmtree(tmp,ignore_errors=True)
print('erros:',errs or 'nenhum','|',dst, '(referência em cima · vídeo embaixo)' if ref else '')
