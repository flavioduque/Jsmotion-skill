# Efeitos no vídeo da pessoa (skill `effects`, 42 efeitos)

A skill obrigatória **`effects`** ([claude-video-effects](https://github.com/Vibha-Ramprakash/claude-video-effects), MIT,
de @vibha.in.progress) aplica efeitos **direto no vídeo de alguém falando** (gravação ou avatar do HeyGen). Ela detecta o
rosto (YuNet) e **recorta a pessoa de verdade** (MediaPipe Selfie Segmenter): palavra gigante, letreiro, raios de luz e
cartões ficam **atrás da cabeça** sem máscara falsa. Renderiza em Python (OpenCV + PIL), mantém o áudio original.

Ela complementa o Remotion, não o substitui: o Remotion monta a peça (mundo 3D, mapa, cartões, legenda, final); os efeitos
dão o "uau" **sobre a própria pessoa** nos momentos em que ela está em **tela cheia** (estado F do `presenter.tsx`).

## Preparar (1ª vez, silencioso)

```bash
SKD=$(bash $SK/scripts/ensure_skills.sh)          # já instala a skill effects junto das outras
bash $SKD/effects/scripts/setup.sh                 # cria o ambiente dela (.venv); imprime READY (1–3 min na 1ª vez)
FX="$SKD/effects/.venv/bin/python $SKD/effects/scripts/fx.py"   # Windows: .venv\Scripts\python.exe
```
`NEED_FFMPEG` / `NEED_PYTHON`: instale (ffmpeg; Python 3.10–3.12) e rode o setup de novo. Um aviso
`TypeError: 'NoneType' object is not callable` no fim do processo é do MediaPipe ao fechar: não afeta o resultado.

## Como encaixar no fluxo da jsmotion

1. **Roteiro de edição primeiro** (`apresentador.md` §2): marque em quais frases entra um efeito. Cada efeito dura
   **1,5–4 s** e carrega a ideia daquela frase — não é enfeite em cima de tudo.
2. **Tempos da fala**: use o `words.json` do projeto (`t0`/`t1` de cada palavra) — o mesmo que já sincroniza a edição.
3. **Plano** (`<video>_efeitos.json`), na ordem em que devem ser aplicados (efeitos de câmera primeiro):
   ```json
   {"effects": [
     {"fx": "glitter-spotlight", "start": 0.6, "end": 3.0, "text": "ZUBA", "color": "#c9a45c"},
     {"fx": "backdrop-word", "start": 3.2, "end": 5.6, "text": "14 ANDARES", "font": "serif", "color": "#c9a45c"},
     {"fx": "led-sign", "start": 15.5, "end": 19.4, "text": "A PARTIR DE|US$ 36.000", "color": "#ffcf8a"}
   ]}
   ```
4. **Folha de conferência** (rápido, antes de renderizar): `$FX --plan plano.json pessoa.mp4 $WORK/fx/check.png --still 2,4.5,17`
   → veja os PNGs: rosto livre, texto inteiro, sem estourar a borda, cores da marca.
5. **Render**: `$FX --plan plano.json pessoa.mp4 $WORK/pessoa_fx.mp4` (1080p; `--width 2160` para 4K, mais lento).
6. **Juntar com a edição**: o `pessoa_fx.mp4` vira a pessoa da edição — `assets.py presenter $WORK/video $WORK/pessoa_fx.mp4`
   (o rastreio do rosto roda de novo). Programe os estados `F` (tela cheia) **nos intervalos dos efeitos**: dentro da
   moldura pequena eles perdem força. Vídeo só da pessoa com efeitos, sem montagem? Entregue o `pessoa_fx.mp4` direto
   (passe pelo `ffmpeg … -af loudnorm=I=-14:TP=-1.5:LRA=11` para o volume das redes).

## Regras (as da jsmotion valem por cima)

- **Nunca cobrir o rosto.** Se a folha mostrar texto no rosto: mude `x`/`y`, encurte o texto ou troque o efeito.
- **Design system aprovado manda**: passe as cores da marca em `color`/`accent`. As fontes são as da skill (Archivo Black,
  Instrument Serif, Playfair Display, Montserrat, Inter, Anton, Space Mono, Permanent Marker): com marca de fonte
  definida, prefira efeitos sem texto ou com `font: serif`/looks em Playfair e Montserrat, e confira na folha.
- **Nada de marca de terceiros no vídeo do cliente.** Vários efeitos têm textos-padrão em inglês ou com "Claude"
  (`todo`, `split-headline`, `headline-box`, `timeline` → `sub`, `tier-list` → `item`, `checklist` → `title`,
  `match-cut`, `cover-star editorial` → `right`, `glass-widgets` → `title`/`pill`). **Sempre** passe os textos.
  `glass-widgets` completo tem a pílula "Edited by Claude" fixa: use `look: simple` com `pill` próprio, ou outro efeito.
- **Só dados reais**: números de `liquid-glass-graph`, `headline-wall`, `profile-wall`, `countdown-flip` vêm do material
  do cliente. `to` é número (`29`, `197K`, `59%`), sem unidade — a unidade vai no `text`.
- Efeitos de cards (`noise`, `orbit`, `carousel-spin`, `check-pills`, `profile-wall`, `phone-fan`, `broll-split`,
  `timeline`) precisam de `images` = pasta com prints/clipes **reais** do cliente (posts, fotos do imóvel, telas do app).
- Zoom máximo 2×. Não empilhe dois efeitos grandes no mesmo instante. São "versões iniciais": diga isso se o usuário
  comparar com um Reel feito à mão.

## Os 42 efeitos (o que fazem e quando usar)

| Efeito | O que faz | Bom para |
|---|---|---|
| `lean-in` | aproximação rápida numa palavra (`zoom` ≤ 2) | ênfase num número ou numa virada |
| `slow-push` | aproximação lenta e fundo desfocando (`zoom`, `blur`) | frase de conclusão, convite final |
| `locked-on` | colchetes travam no rosto e a câmera segue (`zoom`, `text`) | "presta atenção nisso" |
| `spotlight` / `glitter-spotlight` | apaga a sala, ela fica iluminada; palavra brilhando atrás (`text`, `color`) | nome do produto/projeto, revelação |
| `backdrop-word` | palavra gigante cai atrás dela (`text`, `color`, `font`) | a palavra-chave da frase |
| `led-sign` | luzes caem e um letreiro de LED se escreve atrás (`text` linhas com `\|`) | preço, oferta, data |
| `cover-star` (`look: editorial`) | vira capa de revista: título atrás, chamadas (`text`, `issue`, `lines`, `right`) | apresentação de marca/produto |
| `red-collage` | P&B, palavra vermelha atrás, 3 linhas batem (`text`, `lines`, `tag`) | contraste, "o problema" |
| `pastel-word` | sala lilás, palavra atrás, cartão de perfil seguido (`text`, `name`, `handle`) | chamada para seguir |
| `split-headline` | manchete desce e empurra ela para baixo (`text`, `hl`, `pill`) | gancho com título |
| `headline-box` | aproximação + manchete com 2ª linha em caixa (`text`, `zoom`) | gancho |
| `liquid-glass-graph` (`look: bento`) | cartão de vidro com gráfico subindo e número contando (`text`, `from`, `to`) | crescimento, resultado |
| `checklist` | lista sob o queixo: cada passo gira e fica verde (`text` `passo::detalhe\|…`, `title`) | processo em etapas |
| `todo` | lista ao lado da cabeça que vai sendo marcada (`text`, `ticks`, `title`) | "3 coisas que…" |
| `apple-toggles` | cartão de ajustes do iPhone ligando chaves (`text`, `ticks`, `color`, `pos`) | itens incluídos, diferenciais |
| `countdown-flip` | relógio 3-2-1 acima da cabeça (`from`) | lançamento, prazo |
| `the-bill` | recibo impresso na parede com linhas (`text`) | lista de itens, custos |
| `comment-box` | barra de comentário do Instagram digita e posta (`text`) | CTA "comente X" |
| `tap` | botão Seguir vira Seguindo (`at`, `x`, `y`, `color`) | CTA seguir |
| `pause-point` | congela e aponta para ela com seta desenhada (`text`) | "este sou eu / este é o detalhe" |
| `scribble` | rabiscos de marcador ao redor (`text`, `color`) | tom leve, bastidor |
| `reject-stamp` | carimbo vermelho bate na tela (`text`, `color`, `angle`) | "mito", "erro comum" |
| `uninstall` | barra de desinstalar com glitch (`text`) | "jogue isso fora" |
| `shortcut-rain` | teclas caem atrás (`text` com `\|`) | tecnologia, atalhos |
| `match-cut` | páginas de notícia cortam numa palavra, caixa vermelha atrás (`text`) | "todo mundo fala de X" |
| `tier-list` | tier list cai e um item voa para o S (`title`, `item`, `others`) | comparação/ranking |
| `moody` | tratamento de cor (`grade`: moody, bw, warm, cool, pop) | clima |
| `swipe` | antes/depois deslizando sobre ela (`grade`) | transformação |
| `dot-reveal` | a imagem se monta de pontos brilhantes (`color`, `cell`) | abertura |
| `rabbit-hole` | o quadro vira um túnel girando (`ratio`, `speed`, `spin`) | transição |
| `reel-frame` | o vídeo encolhe para um card de Reel (`text` = @) | metalinguagem / redes |
| `timeline` | cor de filme vermelha, linha do tempo e REC (`text`, `sub`, `tc`) | bastidor de edição |
| `lineup` | blocos numerados em leque sobre a cabeça (`text`) | opções numeradas |
| `noise`, `orbit`, `carousel-spin` | prints/clipes empilham, orbitam ou giram em volta dela (`images`) | portfólio, provas |
| `profile-wall`, `phone-fan`, `check-pills` | grade de posts, leque de celulares, pílulas clicadas (`images`, `text`) | redes, resultados |
| `broll-split` | imagem de apoio em cima com etiqueta de preço, ela embaixo (`images`, `text`) | produto/imóvel com preço |
| `headline-wall` | manchetes empilham atrás e um total aparece (`text` `manchete::meta\|…`, `total`) | prova social real |
| `glass-widgets` | widgets de vidro flutuando (`look: simple` + `pill` próprio) | painel de números |

Nomes alternativos aceitos: `bill`, `to-do`, `follow`, `stamp`, `countdown`, `cover`, `rain`, `pause`, `glitter`.
Lista completa e opções: `$FX --list` e a `SKILL.md` da própria skill.
