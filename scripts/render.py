"""Uso: python3 render.py pagina.html saida.mp4 [--lufs -14 | --no-norm]
Renderiza quadro a quadro (determinístico via render(t)) no Chromium headless + áudio do OfflineAudioContext -> MP4 H.264/AAC.
O áudio é masterizado para -14 LUFS (padrão de Instagram, TikTok e YouTube) com pico real abaixo de -1,5 dBTP:
ganho + limitador com superamostragem (192 kHz), ajustado em poucas iterações até bater o alvo.
CHROMIUM_PATH=/caminho/chrome usa um Chromium já instalado (evita "playwright install")."""
import base64,subprocess,sys,time,os,shutil,json,re,tempfile
from playwright.sync_api import sync_playwright
args=sys.argv[1:]; lufs=-14.0; norm=True
if '--no-norm' in args: norm=False; args.remove('--no-norm')
if '--lufs' in args: i=args.index('--lufs'); lufs=float(args[i+1]); del args[i:i+2]
page,dst=args[0],args[1]; T0=time.time(); TP=-1.5
tmp=tempfile.mkdtemp(prefix='jsmotion_render_')  # único por execução: renders em paralelo não se atropelam
wav=os.path.join(tmp,'audio.wav')

def loud(path):
    """Mede LUFS integrado e pico real (dBTP) com o loudnorm do ffmpeg."""
    r=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',path,'-af',f'loudnorm=I={lufs}:TP={TP}:print_format=json','-f','null','-'],
        capture_output=True,text=True)
    m=json.loads(re.findall(r'\{[^{}]*\}',r.stderr)[-1]); return float(m['input_i']),float(m['input_tp'])

def master(src,dst):
    """Leva o áudio a `lufs` sem estourar: ganho + limitador (teto 1 dB abaixo de TP, margem para o AAC).
    O limitador "come" parte do ganho, então o ajuste usa o método da secante (converge em 2–4 passos)."""
    lim=10**((TP-1.0)/20)
    def apply(g):
        af=f'volume={g:.2f}dB,aresample=192000,alimiter=limit={lim:.4f}:level=disabled:attack=1:release=60,aresample=48000'
        subprocess.run(['ffmpeg','-loglevel','error','-y','-i',src,'-af',af,dst],check=True); return loud(dst)[0]
    g0=lufs-loud(src)[0]; r0=apply(g0); g1=g0+(lufs-r0)
    if abs(lufs-r0)<0.15: return
    for _ in range(5):
        r1=apply(g1)
        if abs(lufs-r1)<0.15: return
        k=min(1,max(0.2,(r1-r0)/(g1-g0))) if g1!=g0 else 1
        g0,r0,g1=g1,r1,g1+(lufs-r1)/k

with sync_playwright() as p:
    b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or None); pg=b.new_page()
    pg.goto('file://'+os.path.abspath(page)); pg.wait_for_function('window.READY===true',timeout=180000)
    DUR,FPS=pg.evaluate('[DUR,FPS]')
    open(wav,'wb').write(base64.b64decode(pg.evaluate('getWav()')))
    if norm:
        nw=os.path.join(tmp,'audio_master.wav'); master(wav,nw); wav=nw
    ff=subprocess.Popen(['ffmpeg','-loglevel','error','-y','-f','image2pipe','-framerate',str(FPS),'-c:v','mjpeg','-i','-','-i',wav,
        '-c:v','libx264','-preset','slow','-crf','17','-pix_fmt','yuv420p','-profile:v','high','-c:a','aac','-b:a','192k',
        '-movflags','+faststart','-shortest',dst],stdin=subprocess.PIPE)
    for f in range(round(DUR*FPS)):
        d=pg.evaluate(f'renderFrame({f/FPS})'); ff.stdin.write(base64.b64decode(d.split(',')[1]))
    ff.stdin.close(); ff.wait(); b.close()
shutil.rmtree(tmp,ignore_errors=True)
print(f'{dst} pronto em {round(time.time()-T0)}s')
if norm:
    i,tp=loud(dst); print(f"volume: {i:.1f} LUFS (alvo {lufs:g}) · pico {tp:.1f} dBTP (máx {TP:g})")
if shutil.which('ffprobe'): subprocess.run(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height','-of','compact',dst])
