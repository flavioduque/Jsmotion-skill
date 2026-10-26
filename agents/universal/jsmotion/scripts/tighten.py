"""Aperta a fala de um vídeo de pessoa/avatar: corta as pausas, tira trechos mal ditos e acelera um pouco.

  python3 tighten.py pessoa.mp4 words.json saida.mp4 [--gap 0.16] [--pad 0.07] [--speed 1.06] [--drop 9-13,40]

words.json = a linha do tempo por palavra DESTE vídeo (voice.py fala.txt --audio pessoa.mp3 --lead 0).
--gap   silêncio máximo que fica entre duas palavras (o resto é cortado)
--pad   respiro mantido antes/depois de cada trecho (evita cortar o começo/fim da palavra)
--speed aceleração final de vídeo + áudio juntos (lábios continuam sincronizados; 1.0 = sem acelerar)
--drop  índices de palavras (do words.json) a remover, ex.: um nome pronunciado errado — a frase precisa
        continuar fazendo sentido sem elas
Saídas: saida.mp4 (com áudio) e saida.cuts.json (instantes dos cortes no vídeo novo, para alternar o enquadramento
nos jump cuts: <Presenter push={…}>). Depois: alinhe de novo (voice.py com o texto sem o trecho removido)."""
import json, os, subprocess, sys

a = sys.argv[1:]
def opt(flag, default):
    if flag not in a: return default
    i = a.index(flag); v = a[i + 1]; del a[i:i + 2]; return v
gap, pad, speed = float(opt('--gap', 0.16)), float(opt('--pad', 0.07)), float(opt('--speed', 1.06))
drop = set()
for part in filter(None, opt('--drop', '').split(',')):
    lo, _, hi = part.partition('-'); drop.update(range(int(lo), int(hi or lo) + 1))
if len(a) < 3: sys.exit(__doc__)
src, wj, out = a
words = json.load(open(wj, encoding='utf-8'))['words']
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src],
                           capture_output=True, text=True, check=True).stdout)

segs, prev_dropped = [], False
for j, w in enumerate(words):
    if j in drop: prev_dropped = True; continue
    if segs and not prev_dropped and w['t0'] - segs[-1][1] <= gap: segs[-1][1] = w['t1']
    else: segs.append([w['t0'], w['t1']])
    prev_dropped = False
segs = [[max(0.0, s - pad), min(dur, e + pad)] for s, e in segs]
segs[-1][1] = min(dur, segs[-1][1] + 0.5)                  # deixa o fim respirar
assert all(e > s for s, e in segs), 'trecho vazio: confira o words.json'

fc = []
for k, (s, e) in enumerate(segs):   # micro-fades no áudio evitam estalo no corte
    fc.append(f'[0:v]trim={s:.3f}:{e:.3f},setpts=PTS-STARTPTS[v{k}];[0:a]atrim={s:.3f}:{e:.3f},asetpts=PTS-STARTPTS,'
              f'afade=t=in:d=0.012,afade=t=out:st={max(0, e - s - 0.015):.3f}:d=0.015[a{k}]')
fc.append(''.join(f'[v{k}][a{k}]' for k in range(len(segs))) + f'concat=n={len(segs)}:v=1:a=1[vc][ac]')
fc.append(f'[vc]setpts=PTS/{speed},fps=30[vo];[ac]atempo={speed}[ao]')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-filter_complex', ';'.join(fc), '-map', '[vo]', '-map', '[ao]',
                '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', out], check=True)
t, cuts = 0.0, []
for s, e in segs[:-1]:
    t += (e - s) / speed; cuts.append(round(t, 3))
json.dump(cuts, open(os.path.splitext(out)[0] + '.cuts.json', 'w'))
new = sum(e - s for s, e in segs) / speed
print(f'✂️  {dur:.1f}s → {new:.1f}s · {len(segs)} trechos · {len(drop)} palavras removidas → {out}')
