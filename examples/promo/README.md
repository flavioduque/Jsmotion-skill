# Exemplo — o vídeo de apresentação do próprio jsmotion (16:9 e 9:16 · PT/EN)

Os demos do README foram feitos **com a própria skill**: este `anim.js` usa o mesmo motor do
`templates/example_anim.js` e gera **os dois formatos e os dois idiomas a partir do mesmo código** (12s cada).

| | 🖥️ 16:9 (1280×720) | 📱 9:16 (720×1280) |
|---|---|---|
| 🇧🇷 Português | [GIF](../../docs/demo.gif) · [MP4](../../docs/demo.mp4) | [GIF](../../docs/demo-vertical.gif) · [MP4](../../docs/demo-vertical.mp4) |
| 🇺🇸 English | [GIF](../../docs/demo-en.gif) · [MP4](../../docs/demo-en.mp4) | [GIF](../../docs/demo-vertical-en.gif) · [MP4](../../docs/demo-vertical-en.mp4) |

Os MP4 têm trilha e efeitos sonoros; os GIFs são mudos e sem granulação (para ficarem leves).

## Como um código vira quatro vídeos

Duas variáveis definidas antes da animação:

```js
window.FORMAT = '9x16';  // '16x9' (padrão) ou '9x16'
window.LANG   = 'en';    // 'pt' (padrão) ou 'en'
```

- **Idioma:** os textos ficam no objeto `TXT` (uma entrada por idioma).
- **Tamanho:** `row()` e `fit()` calculam a posição e o tamanho de cada frase pela largura real do texto, então
  "conversation." (EN) cabe onde "conversa." (PT) cabia. Para ter mais um idioma, como `es`, basta adicionar os textos.
- **Formato:** `W, H, CX, CY` mudam com `FORMAT`. O fundo, a vinheta e o chão em perspectiva são proporcionais à tela.
  O caminho da faísca é desenhado em 1280×720 e convertido. As cenas que precisam de outro layout têm um ramo `if(V)`:

| Cena | 16:9 | 9:16 |
|---|---|---|
| Gancho | "nível **estúdio**" na mesma linha | uma palavra por linha, fonte ajustada à largura |
| Passos + celulares | passos à esquerda, celulares à direita | passos em cima, celulares embaixo |
| Final | slogan numa linha com "·" | slogan em duas linhas, logo e botão menores |

## Linha do tempo

| Tempo | Cena | Som |
|---|---|---|
| 0–2,8s | Gancho: "Seu vídeo de marca **nível estúdio**, feito pelo Claude." | pulso abafado + riser |
| 2,8–5,45s | "Sem After Effects / Sem editor / Sem template" riscados → "Só uma **conversa**." | impacto, kick, palma |
| 5,45–9,6s | Passos (Logo + site → Roteiro → Animação → Trilha → **MP4 pronto**) + 3 celulares com quadros reais | hi-hat, baixo, arpejo |
| 9,6–12s | Logo jsmotion + "Skill para Claude · do briefing ao MP4" + botão do repositório | onda líquida, impacto, acorde final |

As telas dos celulares mostram quadros reais do vídeo 9:16 da Constructiva.dev (recortados de `docs/preview.jpg`).

## Reproduzir

```bash
# formato e idioma antes da animação
printf "window.FORMAT='9x16';window.LANG='en';\n" | cat - examples/promo/anim.js > anim.js

# assets.js: fonte + imagens em data URIs (window.ASSETS = {projects:{f0..f12}, seq:{}, font})
python3 scripts/build_html.py anim.js assets.js promo.html "jsmotion" jsmotion-promo
python3 scripts/render.py promo.html promo.mp4

# GIF leve para README: acrescente window.NOGRAIN=true (a granulação muda a cada quadro e triplica o tamanho do GIF)
ffmpeg -i promo.mp4 -vf "fps=12,scale=360:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=160:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" demo.gif
gifsicle -O3 --lossy=80 demo.gif -o demo.gif   # 9:16 em 360px ≈ 2,8 MB · 16:9 em 800px ≈ 4,3 MB
```
