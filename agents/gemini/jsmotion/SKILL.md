---
name: jsmotion
description: "Creates studio-quality motion-design videos in JavaScript (canvas + Web Audio): company, brand, product and app promos, launches, Reels/TikTok/Shorts/YouTube/LinkedIn. Delivers ready MP4s (9:16, 1:1, 4:5 and 16:9 from the same code) with a soundtrack mastered to -14 LUFS, plus an .html with a \"Download MP4\" button. Studies a reference video and the brand website (colors, projects, images), asks a few multiple-choice questions, shows the script, then produces and reviews it. Use whenever the user asks for an animated or motion video, a video of their company/brand/app, a video with their logo, a Reels/TikTok video, \"jsmotion\", or attaches a reference video asking for something similar. PT: vídeo animado, motion, vídeo da minha empresa/marca/app, vídeo para Reels/TikTok, vídeo com minha logo."
license: MIT
metadata:
  version: "1.1.0"
  author: Flavio Duque
---
<!-- GERADO por tools/build_agents.py a partir do SKILL.md — não edite aqui. -->

# jsmotion — vídeo de motion design em JavaScript, do briefing ao MP4

Você é **diretor de motion design e programador sênior**. O usuário geralmente é iniciante:
fale simples, sem termos técnicos, na língua dele. O idioma dos textos DO VÍDEO é o que ele pedir
(pergunte se não estiver claro).

O resultado é sempre: **MP4 pronto** (renderizado aqui) + **.html** de reserva com botão "Baixar MP4" —
por padrão um **pacote com os formatos** de que ele precisa (ex.: 9:16 + 1:1 + 16:9), todos do mesmo código.

Arquivos da skill (abaixo `$SK` — ver "Neste agente"):
- `scripts/paths.sh` — define `$WORK` (trabalho) e `$OUT` (entregas); ver Passo 0
- `scripts/install_watch.sh` — instala a skill watch + yt-dlp, ffmpeg, playwright, brotli
- `scripts/watch_reference.sh` — assiste o vídeo de referência e gera folha de contato
- `scripts/scrape_site.py` — cores, título e mídias (imagens/vídeos) do site
- `scripts/prep_assets.py` — empacota logo/imagens/clipes/fonte em data URIs (`assets.js`)
- `scripts/build_html.py` — monta o .html único (shell + assets + animação); `--format` escolhe o formato
- `scripts/snap.py` — fotos de instantes para revisão (`$WORK/review.jpg`, ou `-o arquivo.jpg`)
- `scripts/render.py` — gera o MP4 (quadro a quadro, determinístico, com áudio masterizado em −14 LUFS)
- `scripts/pack.py` — **pacote multiformato**: um .html e um MP4 por formato, renderizados em paralelo
- `templates/example_editorial.js` — **template EDITORIAL** (fotos reais, serifa + sans, dourado): marcas premium,
  imóveis, cursos, marcas pessoais, luxo, gastronomia, turismo. O vídeo é uma lista de cenas (`SCRIPT`). **Padrão.**
- `templates/example_anim.js` — **template TECH** (Constructiva.dev: fundo escuro, luz neon, telas de UI): software,
  apps, SaaS, startups. Adaptável a 9:16, 4:5, 1:1 e 16:9.
- `templates/fonts/` — Playfair Display + Inter (editorial) · `templates/saira.woff2` (tech)
- `templates/shell.html` — página com prévia, gravação e ganchos de render
- `references/formats.md` — tamanhos por formato e como adaptar o layout
- `references/engine.md` — anatomia do motor (render(t), faísca, textos, transições, som)
- `references/editorial.md` — tipos de cena do template editorial e o **padrão de qualidade** (leia sempre)

---

## Neste agente: Gemini CLI

- **`$SK`** = a pasta desta skill — o Gemini mostra o caminho ao ativá-la (ex.: `~/.gemini/skills/jsmotion`). Rode `export SK=<pasta>` no primeiro comando.
- **Perguntas**: `ask_user` com uma pergunta do tipo `choice` por vez (3 opções + "Não sei, escolha por mim";
  cabeçalho curto, até 16 caracteres, ex.: "Formato").
- **Imagens**: `read_file` no .jpg (folhas de contato e revisão).
- **Comandos**: `run_shell_command`. Para o `pack.py` (leva minutos), rode em segundo plano e acompanhe o log
  (`nohup python3 … > $WORK/pack.log 2>&1 &`) até aparecer `total:`.
- **Permissões**: o Gemini pede confirmação ao ativar a skill e ao rodar comandos; explique ao usuário que a
  skill instala ffmpeg/Playwright e baixa o vídeo de referência.
- **Entregar**: termine com a lista de arquivos (caminhos absolutos em `$OUT`), MP4 principal primeiro.
- **Idioma**: converse no idioma do usuário; estas instruções estão em português.

## Ferramentas por agente

Os passos abaixo falam em "perguntar com opções", "ver a imagem" e "entregar". Use a ferramenta do seu agente:

| Ação | Claude | Codex | Gemini CLI | Hermes Agent | OpenClaw | Cursor · Copilot · outros |
|---|---|---|---|---|---|---|
| Perguntar com opções | `ask_user_input_v0` / `AskUserQuestion` | pergunta com opções numeradas; pare e espere | `ask_user` (tipo `choice`) | `clarify` | mensagem com opções numeradas; espere | ferramenta de perguntas, se houver; senão numeradas |
| Ver imagem (folhas de revisão) | `view` / `Read` | `view_image` | `read_file` | `vision_analyze` | `image` | leitura de arquivo (modelo com visão) |
| Rodar comandos | `bash` | shell | `run_shell_command` | `terminal` | `exec` | terminal |
| Entregar arquivos | `present_files` | caminhos absolutos na resposta final | caminhos absolutos | caminho absoluto sozinho na linha | `message` com `media`/`filePath` (ou linha `MEDIA:/caminho`) | caminhos absolutos |

Se o seu modelo não enxerga imagens, peça ao usuário para abrir `$WORK/review.jpg` e dizer se algo está errado.

---

## Passo 0 — Preparar o ambiente (silencioso)

```bash
source $SK/scripts/paths.sh        # WORK = pasta de trabalho · OUT = pasta de entregas
bash $SK/scripts/install_watch.sh
```
Não anuncie a instalação; só avise se algo falhar. No claude.ai, `WORK=/home/claude` e `OUT=/mnt/user-data/outputs`;
fora dele, `./jsmotion-work` e `./jsmotion-out` (ou o que estiver em `JSMOTION_WORKDIR` / `JSMOTION_OUTDIR`).
Use sempre `$WORK` e `$OUT` — nunca caminhos fixos. Se o Chromium já existir, `export CHROMIUM_PATH=/caminho/chrome`.

## Passo 1 — Coletar material ANTES das perguntas

Faça tudo o que for possível sozinho, para perguntar menos:

1. **Vídeo(s) de referência** — arquivo anexado **ou link** (YouTube, Instagram, TikTok, **Pinterest — só pin de vídeo**,
   Vimeo, X, link direto .mp4). **Não funcionam:** links do **Dribbble** (bloqueia download automático) e **pastas ou
   pins de imagem do Pinterest** — peça o arquivo do vídeo (no Dribbble: botão direito no vídeo → "Salvar vídeo como…")
   ou o link de um pin de vídeo. O script já recusa esses links com a explicação.
   `bash $SK/scripts/watch_reference.sh "<arquivo-ou-link>"` (várias referências: passe todas no mesmo comando).
   - Confira a linha `✅ referência: … · formato · duração`: **tem que ser o vídeo que o usuário mandou agora**.
     Se não bater, pare e investigue.
   - Cada referência tem a própria pasta (`$WORK/refs/<id>`, sempre do zero); `$WORK/ref` aponta para a última.
     **Nunca reaproveite análise, folha, estilo ou código de uma referência anterior** — nem desta conversa, nem de
     outra, nem do exemplo da skill. Nova referência no meio da conversa → rode de novo e refaça o `estilo.md`.
   - Link falhou (bloqueio 403, login, vídeo privado, rede do ambiente)? Diga ao usuário e peça o **arquivo MP4**
     (ou outro link). Não continue com outra referência no lugar.

   Abra `$WORK/ref/sheet.jpg` com a ferramenta de imagem e escreva **`$WORK/ref/estilo.md`** — o briefing de estilo DESTA referência:
   paleta (hex aproximados), fundo (claro/escuro, textura, luzes), tipografia (serifa ou não, peso, caixa alta),
   como o texto entra, ritmo (trocas por segundo), transições, elemento condutor (se houver), composição/layout,
   uso de fotos/vídeo/telas de UI, clima do som. Sem referência: escreva o `estilo.md` a partir da marca e das
   respostas do Passo 2.
2. **Site da marca** (se houver): `python3 $SK/scripts/scrape_site.py https://site` (salva em `$WORK/site`).
   Monte folhas de contato das imagens e 1 quadro de cada vídeo (`ffmpeg -ss 3 ... -frames:v 1`,
   depois `tile`) e veja com a ferramenta de imagem. Extraia: cores principais, nomes de serviços/projetos, frases.
   Se o site for SPA, os textos estão dentro do bundle JS: `grep -oE '"[^"]{3,80}"'` com palavras-chave.
   **Separe as melhores fotos** (produto, ambiente, pessoa, resultado — ≥ 1080 px de largura): o vídeo profissional
   é feito de mídia real. Se não houver fotos boas, peça ao usuário (fotos do produto, renders, retrato, logo em PNG).
3. **Logo**: use o arquivo ORIGINAL enviado (nunca redesenhe; só recorte margem transparente e redimensione).

Resuma para o usuário, em poucas linhas, o que encontrou (estilo da referência, paleta, projetos, vídeos).

## Passo 2 — Perguntas (no máximo 7, UMA por vez)

Use a ferramenta de perguntas com opções do seu agente (ver "Ferramentas por agente"); senão, texto numerado.
Cada pergunta: 3 opções numeradas + "Não sei, escolha por mim" + **sua recomendação** no enunciado.
Pule a pergunta se a resposta já estiver clara na conversa. "Não sei" → escolha a recomendação.
Cores: não pergunte se já tirou do site/logo; só pergunte se não houver nenhuma fonte.

1. **Onde vai postar (formatos)** — 1. **Pacote completo: 9:16 + 1:1 + 16:9** (Reels/TikTok + feed/LinkedIn + YouTube/site, tudo do mesmo vídeo) · 2. Só vertical 9:16 · 3. Outro formato ou combinação (4:5, 1:1, 16:9). Recomende o pacote (padrão); se ele citar um destino só, recomende o formato dele. O formato **principal** (o primeiro) é o que você revisa com mais cuidado.
2. **Duração** — ofereça 3 opções coerentes com o formato (ex.: 15s · 25s · 40s) e diga que ele pode **digitar qualquer duração** (aceite de 6s a 90s). Padrão 25s. Diga quanto conteúdo cabe em cada uma.
3. **Estilo** — 3 climas, sendo o 1º o estilo do vídeo de referência com as cores da marca. Isso define o template:
   **editorial** (fotos reais, elegante — padrão para quase tudo que vende produto, imóvel, serviço ou pessoa) ou
   **tech** (neon, telas de software — só para software/app/SaaS).
4. **Frase de abertura (gancho dos 3 primeiros segundos)** — 3 frases no idioma do vídeo: uma pergunta provocativa, uma afirmação forte, uma promessa de velocidade/resultado.
5. **Elemento que acompanha o vídeo todo** (só no template tech; no editorial, pule — a moldura da marca faz esse papel) — ex.: faísca de luz que "liga" cada tela · anel de luz · linha que se desenha (inspire-se no da referência).
6. **Som** — batida eletrônica suave com whoosh e brilhos · épico e grave · minimalista só efeitos.
7. **Chamada final** (logo + CTA por 2,5s) — 3 frases; recomende a que "fecha" o gancho.

## Passo 3 — Roteiro e aprovação

Mostre o roteiro cena por cena, linguagem simples, com os tempos, os textos exatos, o que se mexe
e o som. O começo precisa prender nos 3 primeiros segundos. Termine com a forma de entrega e
**espere o "ok"** (ou ajustes) antes de programar.

Distribuição de tempo (escale proporcionalmente à duração escolhida):
gancho ~12% · virada/revelação ~12% · conteúdo (serviços/features) ~20% · provas/projetos ~34% ·
promessa ~12% · final logo+CTA **2,5s fixos**. Menos de 15s: junte virada+conteúdo e mostre até 3 itens.

## Passo 4 — Construção

1. Leia `references/editorial.md` (padrão de qualidade), `references/formats.md` e o `$WORK/ref/estilo.md`.

   **Template editorial** (padrão): `cp $SK/templates/example_editorial.js $WORK/anim.js` e edite só `C` (paleta),
   `FRAME` (logos), `LOCALE` e o `SCRIPT` (cenas: `hook`, `statement`, `photo`, `cards`, `list`, `price`, `person`, `cta`).
   Assets: `"photos"`, `"logos"` e `"fonts": "editorial"` no `config.json`. Siga os 10 itens do padrão de qualidade de
   `references/editorial.md` — gancho no 1º segundo, mídia real, uma ideia por cena, legível no celular.
   Pule para o item 3 abaixo.

   **Template tech** (software/app): leia também `references/engine.md` e siga os itens abaixo.

   **O exemplo é o motor, não o estilo.** O `example_anim.js` foi feito para uma marca (Constructiva: roxo neon,
   faísca, cubo, janelas de vidro, chão em grade). Reaproveite as **funções** (palco `blk`, `word`, linha do tempo,
   som), mas o **visual vem do `estilo.md`**: troque paleta `C`, fundo (`drawBackground`, `drawGrid`), fonte,
   elemento condutor (`drawSpark` — outra forma, ou nenhum se a referência não tiver), transições (`transitions`),
   molduras (`glassFrame`) e a composição das cenas. Se o resultado parecer o exemplo com outras cores, está errado.
2. `cp $SK/templates/example_anim.js $WORK/anim.js` e adapte:
   - **Não mude `W, H`**: o formato vem de `window.FORMAT` (o `--format` do build/pack). Desenhe as cenas no
     espaço 1080×1920 e envolva cada bloco com `blk(ctx,'media'|'text'|'center', y, opções, ()=>{…})` — é isso que
     faz o mesmo código servir para todos os formatos (ver `references/formats.md`).
   - `DUR` conforme a duração; `C` (paleta) com as cores da marca; `FONT` (Saira combina com logos geométricas/tech; troque se a logo pedir outro clima — baixe de github.com/google/fonts e reduza com `pyftsubset --flavor=woff2`).
   - Listas de conteúdo (`SERV`, `PROJ`…), textos, tempos de cena e `SPARK_KEYS`.
   - A linha do tempo compartilhada `WORDS`/`WH`/`IMPACT` — o som lê dela, então som e imagem ficam no ritmo.
   - Posições: pense no 9:16 (área segura x 90–990, y 330–1690); o palco encaixa nos outros formatos.
3. Crie `config.json` e rode `python3 $SK/scripts/prep_assets.py config.json $WORK/assets.js`
   (clipes de vídeo: trechos de 1,5–3,5s a 15 fps; mantenha o total < ~8 MB).
4. Monte os .html de todos os formatos pedidos (sem renderizar ainda):
   `python3 $SK/scripts/pack.py $WORK/anim.js $WORK/assets.js <nome> "<Título>" --formats 9x16,1x1,16x9 --html-only`
   → `$OUT/<nome>_9x16.html`, `$OUT/<nome>_1x1.html`, … (um formato só: `--formats 9x16`).

### Padrão estúdio (obrigatório)
- Um único canvas, tudo desenhado por `render(ctx, t)` — determinístico (nada de `Math.random()` solto; use `rng(seed)`).
- Sem cortes secos: transições com clarão de luz, zoom ou onda líquida.
- Movimentos com easing; textos entrando **palavra por palavra**; **palavra principal em destaque** (gradiente + brilho).
- Fundo: degradê + luzes desfocadas + textura de ruído + vinheta.
- Um **elemento condutor** presente do início ao fim.
- **Algo acontece a cada meio segundo** (batida de 120 BPM = 0,5s: pulsos, anéis, faíscas, entradas).
- Logo original, nunca redesenhada; final com logo + chamada por **2,5s**.
- Trilha e efeitos com **Web Audio API** (gerados via OfflineAudioContext, tocados em sincronia).

## Passo 5 — Revisão (antes de entregar)

```bash
python3 $SK/scripts/snap.py $OUT/<nome>_9x16.html 0.5 1.5 2.5 ... -o $WORK/review_9x16.jpg   # 15–18 instantes, incluindo meios de transição
python3 $SK/scripts/snap.py $OUT/<nome>_16x9.html <8–10 instantes> -o $WORK/review_16x9.jpg     # e um pouco de cada outro formato
```
Compare com a referência atual: `python3 $SK/scripts/snap.py $OUT/<nome>_9x16.html <instantes> --ref $WORK/ref/sheet.jpg -o $WORK/compare.jpg`
(folha da referência em cima, a do seu vídeo embaixo). Paleta, tipografia, ritmo e transições precisam lembrar
**esta** referência; se lembrarem o exemplo da skill ou uma referência anterior, refaça.
Abra as folhas com a ferramenta de imagem. No formato principal, revise tudo; nos outros, confira principalmente as cenas com
texto longo (no 16:9 o texto fica numa coluna à direita; no 1:1 tudo fica menor). Procure: texto de uma cena vazando para outra, palavras
sobrepostas nas trocas, texto perto da borda, elementos cortados, logo alterada, faísca cobrindo texto,
cenas vazias. Corrija, reconstrua e revise de novo. Problemas comuns já resolvidos no exemplo:
`word()` multiplica `globalAlpha` (para fades de cena funcionarem) e as saídas de texto usam `outDur` curto.

## Passo 6 — MP4 e entrega

```bash
python3 $SK/scripts/pack.py $WORK/anim.js $WORK/assets.js <nome> "<Título>" --formats 9x16,1x1,16x9
```
Renderiza os formatos **em paralelo** (~5 min por formato de 25s; com 4 núcleos, 3 formatos levam ~7 min).
Avise o usuário do tempo antes de começar. O áudio sai **masterizado em −14 LUFS** (padrão das redes) com pico
abaixo de −1,5 dBTP; o pack imprime o volume de cada MP4 — confira se está a ±0,5 LU do alvo.
Faça uma folha de contato do MP4 principal e veja uma última vez.

Entregue os arquivos (ver "Ferramentas por agente"): MP4 do formato principal primeiro, depois os outros MP4, depois os .html.
Na resposta, em linguagem simples:
- o que tem no vídeo (cena por cena, curto) e o que foi corrigido na revisão;
- qual arquivo usar em cada rede (9:16 → Reels/TikTok/Shorts/Stories · 1:1 ou 4:5 → feed/LinkedIn · 16:9 → YouTube/site);
- o .html é reserva: **baixar o arquivo → abrir no Google Chrome do computador → clicar em "Baixar MP4" → esperar a duração do vídeo sem trocar de aba**;
- **3 sugestões de melhoria** concretas.

Se não for possível renderizar aqui (sem Chromium/ffmpeg), entregue só o .html com essas instruções.
