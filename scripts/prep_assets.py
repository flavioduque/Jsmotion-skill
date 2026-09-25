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
 "font": "/caminho/fonte.woff2"           # opcional; padrão: templates/saira.woff2
}"""
import base64, subprocess, glob, os, json, io, sys
from PIL import Image
cfg=json.load(open(sys.argv[1])); dst=sys.argv[2]; here=os.path.dirname(os.path.abspath(__file__))
b64=lambda p,m:f"data:{m};base64,"+base64.b64encode(open(p,'rb').read()).decode()
out={'projects':{},'seq':{}}
if cfg.get('logo'):
    im=Image.open(cfg['logo']).convert('RGBA'); bb=im.getbbox(); im=im.crop(bb) if bb else im
    w=cfg.get('logo_width',1400); im=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS); im.save('/tmp/_logo.png',optimize=True)
    out['logo']=b64('/tmp/_logo.png','image/png')
iw,ih=cfg.get('image_size',[1000,625])
for k,p in cfg.get('images',{}).items():
    im=Image.open(p).convert('RGB'); s=max(iw/im.width,ih/im.height)
    im=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS)
    l=(im.width-iw)//2; im=im.crop((l,0,l+iw,ih)); buf=io.BytesIO(); im.save(buf,'JPEG',quality=82,optimize=True)
    out['projects'][k]="data:image/jpeg;base64,"+base64.b64encode(buf.getvalue()).decode()
os.makedirs('/tmp/_seq',exist_ok=True)
for k,c in cfg.get('clips',{}).items():
    for x in glob.glob(f'/tmp/_seq/{k}_*'): os.remove(x)
    subprocess.run(['ffmpeg','-loglevel','error','-y','-ss',str(c.get('start',0)),'-t',str(c.get('dur',2)),'-i',c['src'],
        '-vf',f"fps=15,scale={c.get('scale','560:315')}",'-q:v','7',f'/tmp/_seq/{k}_%03d.jpg'],check=True)
    out['seq'][k]=[b64(x,'image/jpeg') for x in sorted(glob.glob(f'/tmp/_seq/{k}_*.jpg'))]
out['font']=b64(cfg.get('font') or os.path.join(here,'..','templates','saira.woff2'),'font/woff2')
js='window.ASSETS='+json.dumps(out)+';'; open(dst,'w').write(js)
print(f'{dst}: {len(js)/1e6:.2f} MB | imagens {len(out["projects"])} | clips',{k:len(v) for k,v in out['seq'].items()})
