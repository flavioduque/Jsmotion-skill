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
- `templates/example_anim.js` — **exemplo completo e testado** (Constructiva.dev, 25s), **adaptável a 9:16, 4:5, 1:1 e 16:9**. Copie e adapte.
- `templates/shell.html` — página com prévia, gravação e ganchos de render
- `references/formats.md` — tamanhos por formato e como adaptar o layout
- `references/engine.md` — anatomia do motor (render(t), faísca, textos, transições, som)

---

## Neste agente: Cursor, GitHub Copilot, OpenCode e outros (padrão Agent Skills)

- **`$SK`** = a pasta desta SKILL.md (ex.: `~/.agents/skills/jsmotion`, `~/.cursor/skills/jsmotion`, `~/.copilot/skills/jsmotion`). Rode `export SK=<pasta>` no primeiro comando.
- **Perguntas**: use a ferramenta de perguntas do agente, se existir; senão escreva **uma** pergunta com opções
  numeradas e espere a resposta.
- **Imagens**: abra os .jpg de revisão com a ferramenta de leitura de arquivos (o modelo precisa ter visão).
- **Render longo**: o `pack.py` leva minutos; se o terminal do agente tiver limite de tempo, rode em segundo plano
  (`nohup python3 … > $WORK/pack.log 2>&1 &`) e acompanhe o log até aparecer `total:`.
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

1. **Vídeo de referência** (anexado ou link): `bash $SK/scripts/watch_reference.sh "<arquivo-ou-url>"`
   e abra `$WORK/ref/sheet.jpg` com a ferramenta de imagem. Anote: paleta, ritmo, como o texto entra,
   que elemento acompanha o vídeo, tipo de transição, se usa telas/UI flutuando.
2. **Site da marca** (se houver): `python3 $SK/scripts/scrape_site.py https://site` (salva em `$WORK/site`).
   Monte folhas de contato das imagens e 1 quadro de cada vídeo (`ffmpeg -ss 3 ... -frames:v 1`,
   depois `tile`) e veja com a ferramenta de imagem. Extraia: cores principais, nomes de serviços/projetos, frases.
   Se o site for SPA, os textos estão dentro do bundle JS: `grep -oE '"[^"]{3,80}"'` com palavras-chave.
3. **Logo**: use o arquivo ORIGINAL enviado (nunca redesenhe; só recorte margem transparente e redimensione).

Resuma para o usuário, em poucas linhas, o que encontrou (estilo da referência, paleta, projetos, vídeos).

## Passo 2 — Perguntas (no máximo 7, UMA por vez)

Use a ferramenta de perguntas com opções do seu agente (ver "Ferramentas por agente"); senão, texto numerado.
Cada pergunta: 3 opções numeradas + "Não sei, escolha por mim" + **sua recomendação** no enunciado.
Pule a pergunta se a resposta já estiver clara na conversa. "Não sei" → escolha a recomendação.
Cores: não pergunte se já tirou do site/logo; só pergunte se não houver nenhuma fonte.

1. **Onde vai postar (formatos)** — 1. **Pacote completo: 9:16 + 1:1 + 16:9** (Reels/TikTok + feed/LinkedIn + YouTube/site, tudo do mesmo vídeo) · 2. Só vertical 9:16 · 3. Outro formato ou combinação (4:5, 1:1, 16:9). Recomende o pacote (padrão); se ele citar um destino só, recomende o formato dele. O formato **principal** (o primeiro) é o que você revisa com mais cuidado.
2. **Duração** — ofereça 3 opções coerentes com o formato (ex.: 15s · 25s · 40s) e diga que ele pode **digitar qualquer duração** (aceite de 6s a 90s). Padrão 25s. Diga quanto conteúdo cabe em cada uma.
3. **Estilo** — 3 climas, sendo o 1º o estilo do vídeo de referência com as cores da marca.
4. **Frase de abertura (gancho dos 3 primeiros segundos)** — 3 frases no idioma do vídeo: uma pergunta provocativa, uma afirmação forte, uma promessa de velocidade/resultado.
5. **Elemento que acompanha o vídeo todo** — ex.: faísca de luz que "liga" cada tela · anel de luz · linha que se desenha (inspire-se no da referência).
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

1. Leia `references/engine.md` e `references/formats.md`.
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
