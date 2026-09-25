"""Uso: python3 snap.py pagina.html t1 t2 ...  -> /tmp/review.jpg (folha de contato) + erros do console"""
import base64,sys,subprocess,glob,os
from playwright.sync_api import sync_playwright
page=sys.argv[1]; ts=[float(x) for x in sys.argv[2:]]
for f in glob.glob('/tmp/snap_*.jpg'): os.remove(f)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None); pg=b.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    pg.goto('file://'+os.path.abspath(page)); pg.wait_for_function('window.READY===true',timeout=180000)
    W,H=pg.evaluate('[W,H]')
    for i,t in enumerate(ts):
        d=pg.evaluate(f'renderFrame({t})'); open(f'/tmp/snap_{i:03d}.jpg','wb').write(base64.b64decode(d.split(',')[1]))
    b.close()
cols=min(6,len(ts)); tw=270 if H>=W else 400; th=round(tw*H/W)
subprocess.run(['ffmpeg','-loglevel','error','-y','-pattern_type','glob','-i','/tmp/snap_*.jpg','-vf',f'scale={tw}:{th},tile={cols}x{-(-len(ts)//cols)}','/tmp/review.jpg'],check=True)
print('erros:',errs or 'nenhum','| /tmp/review.jpg')
