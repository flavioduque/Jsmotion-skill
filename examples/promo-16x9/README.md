# Exemplo 16:9 — o vídeo de apresentação do próprio jsmotion (PT/EN)

Os demos do README foram feitos **com a própria skill**: este `anim.js` usa o mesmo motor do
`templates/example_anim.js`, adaptado para **1280×720 · 12s**, com os textos em **português e inglês**.

| Idioma | GIF | MP4 com trilha |
|---|---|---|
| 🇧🇷 Português | [`docs/demo.gif`](../../docs/demo.gif) | [`docs/demo.mp4`](../../docs/demo.mp4) |
| 🇺🇸 English | [`docs/demo-en.gif`](../../docs/demo-en.gif) | [`docs/demo-en.mp4`](../../docs/demo-en.mp4) |

Os textos ficam no objeto `TXT` (uma entrada por idioma). Posições e tamanhos são calculados pela
largura real de cada frase (`row()` e `fit()`), então dá para adicionar outro idioma, como `es`, sem mexer no layout.

| Tempo | Cena | Som |
|---|---|---|
| 0–2,8s | Gancho: "Seu vídeo de marca **nível estúdio**, feito pelo Claude." | pulso abafado + riser |
| 2,8–5,45s | "Sem After Effects / Sem editor / Sem template" riscados → "Só uma **conversa**." | impacto, kick, palma |
| 5,45–9,6s | Passos (Logo + site → Roteiro → Animação → Trilha → **MP4 pronto**) + 3 celulares com quadros reais | hi-hat, baixo, arpejo |
| 9,6–12s | Logo jsmotion + "Skill para Claude · do briefing ao MP4" + botão do repositório | onda líquida, impacto, acorde final |

As telas dos celulares mostram quadros reais do vídeo 9:16 da Constructiva.dev (recortados de `docs/preview.jpg`).

## Reproduzir

```bash
# idioma: coloque window.LANG='en' (ou 'pt') antes da animação
printf "window.LANG='en';\n" | cat - examples/promo-16x9/anim.js > anim_en.js

# assets.js: fonte + imagens em data URIs (window.ASSETS = {projects:{f0..f12}, seq:{}, font})
python3 scripts/build_html.py anim_en.js assets.js promo.html "jsmotion" jsmotion-promo
python3 scripts/render.py promo.html promo.mp4

# GIF leve para README: use também window.NOGRAIN=true (a granulação muda a cada quadro e triplica o tamanho do GIF)
ffmpeg -i promo.mp4 -vf "fps=12,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=160:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" demo.gif
gifsicle -O3 --lossy=80 demo.gif -o demo.gif   # ~4 MB
```
