"""Uso: python3 render.py pagina.html saida.mp4
Renderiza quadro a quadro (determinístico via render(t)) no Chromium headless + áudio do OfflineAudioContext -> MP4 H.264/AAC."""
import base64,subprocess,sys,time,os
from playwright.sync_api import sync_playwright
page,dst=sys.argv[1],sys.argv[2]; T0=time.time()
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page()
    pg.goto('file://'+os.path.abspath(page)); pg.wait_for_function('window.READY===true',timeout=180000)
    DUR,FPS=pg.evaluate('[DUR,FPS]')
    open('/tmp/_audio.wav','wb').write(base64.b64decode(pg.evaluate('getWav()')))
    ff=subprocess.Popen(['ffmpeg','-loglevel','error','-y','-f','image2pipe','-framerate',str(FPS),'-c:v','mjpeg','-i','-','-i','/tmp/_audio.wav',
        '-c:v','libx264','-preset','slow','-crf','17','-pix_fmt','yuv420p','-profile:v','high','-c:a','aac','-b:a','192k',
        '-movflags','+faststart','-shortest',dst],stdin=subprocess.PIPE)
    for f in range(round(DUR*FPS)):
        d=pg.evaluate(f'renderFrame({f/FPS})'); ff.stdin.write(base64.b64decode(d.split(',')[1]))
    ff.stdin.close(); ff.wait(); b.close()
print(f'{dst} pronto em {round(time.time()-T0)}s')
subprocess.run(['ffprobe','-v','error','-show_entries','format=duration,size:stream=codec_name,width,height','-of','compact',dst])
