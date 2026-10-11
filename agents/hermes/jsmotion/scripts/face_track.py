"""Rastreia o rosto do apresentador no vídeo ORIGINAL → src/face.json (para o <Presenter> recortar sem cortar a cabeça).

  python3 face_track.py <PROJ> [media/apresentador.mp4] [--step 0.2]

Lê public/<vídeo> do projeto (padrão media/apresentador.mp4) e grava em src/face.json:
  {"w": largura, "h": altura, "dur": s, "pts": [[t, cx, cy, altura_do_rosto], ...]}   (pixels do arquivo original)
Os tempos são do ARQUIVO original: com cortes ou mudança de velocidade na montagem, converta antes de consultar.
Quadro sem rosto (virou de lado, mão na frente) não gera ponto: o <Presenter> mantém a média dos vizinhos — nunca
salta para o centro. Detecção: OpenCV (cascata Haar, roda em CPU; `pip install opencv-python-headless`)."""
import json, os, sys

a = sys.argv[1:]
step = 0.2
if '--step' in a: i = a.index('--step'); step = float(a[i + 1]); del a[i:i + 2]
if not a: sys.exit(__doc__)
proj = os.path.abspath(a[0]); rel = a[1] if len(a) > 1 else 'media/apresentador.mp4'
src = os.path.join(proj, 'public', rel)
if not os.path.exists(src): sys.exit(f'❌ não achei {src} (rode antes: assets.py presenter {proj} video.mp4)')
try:
    import cv2
except ImportError:
    sys.exit('❌ falta o OpenCV: pip install opencv-python-headless  (ou bash $SK/scripts/install_watch.sh --apresentador)')

cap = cv2.VideoCapture(src)
fps = cap.get(cv2.CAP_PROP_FPS) or 30
W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
cascade = cv2.CascadeClassifier(os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml'))
every = max(1, round(step * fps)); sc = 540 / max(W, H) if max(W, H) > 540 else 1.0   # detecta em ~540 px (rápido)
pts, i, last = [], 0, None
while True:
    ok = cap.grab()
    if not ok: break
    if i % every == 0:
        _, fr = cap.retrieve()
        g = cv2.cvtColor(cv2.resize(fr, None, fx=sc, fy=sc) if sc != 1 else fr, cv2.COLOR_BGR2GRAY)
        g = cv2.equalizeHist(g)
        fs = cascade.detectMultiScale(g, 1.1, 6, minSize=(40, 40))
        if len(fs):
            # o maior rosto; se houver vários parecidos, o mais perto do anterior (não troca de pessoa)
            fs = sorted(fs, key=lambda f: -f[2] * f[3])[:3]
            if last and len(fs) > 1:
                fs = sorted(fs, key=lambda f: abs((f[0] + f[2] / 2) / sc - last[0]) + abs((f[1] + f[3] / 2) / sc - last[1]))
            x, y, w, h = [float(v) / sc for v in fs[0]]
            last = (x + w / 2, y + h / 2)
            pts.append([round(i / fps, 3), round(x + w / 2, 1), round(y + h / 2, 1), round(h, 1)])
    i += 1
cap.release()
dur = n / fps if n else (pts[-1][0] if pts else 0)
out = os.path.join(proj, 'src', 'face.json')
json.dump({'w': W, 'h': H, 'dur': round(dur, 3), 'pts': pts}, open(out, 'w'))
cover = len(pts) / max(1, -(-i // every))
print(f'🙂 rosto em {len(pts)} de {-(-i // every)} amostras ({cover:.0%}) · {W}x{H} · {dur:.1f}s → src/face.json')
if cover < 0.6: print('⚠️  rosto achado em poucos quadros: confira o enquadramento na folha de revisão (perfil, óculos, pouca luz).')
