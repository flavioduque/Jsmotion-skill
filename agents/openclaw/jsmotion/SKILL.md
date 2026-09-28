---
name: jsmotion
description: "Creates studio-quality motion-design videos in JavaScript (canvas + Web Audio): company, brand, product and app promos, launches, Reels/TikTok/Shorts/YouTube/LinkedIn. Delivers ready MP4s (9:16, 1:1, 4:5 and 16:9 from the same code) with a soundtrack mastered to -14 LUFS, plus an .html with a \"Download MP4\" button. Studies a reference video and the brand website (colors, projects, images), asks a few multiple-choice questions, shows the script, then produces and reviews it. Use whenever the user asks for an animated or motion video, a video of their company/brand/app, a video with their logo, a Reels/TikTok video, \"jsmotion\", or attaches a reference video asking for something similar. PT: vídeo animado, motion, vídeo da minha empresa/marca/app, vídeo para Reels/TikTok, vídeo com minha logo."
license: MIT
metadata:
  openclaw:
    emoji: "🎬"
    homepage: https://github.com/flavioduque/Jsmotion-skill
    os:
      - linux
      - darwin
    requires:
      bins:
        - python3
        - git
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
- `scripts/get_font.py` — baixa **qualquer** família do Google Fonts (a fonte vem da direção de arte, não é fixa)
- `templates/kit.js` — **KIT DE CENAS, motor sem estilo próprio**: o visual vem do objeto `STYLE` (paleta, fontes,
  destaque, cantos, movimento, transições, textura, som) que VOCÊ define na direção de arte; o vídeo é a lista
  `SCRIPT`; cenas próprias para as metáforas do tema. É a base de todo vídeo.
- `templates/example_anim.js` — exemplo de vídeo **construído do zero** (Constructiva.dev, 25s): consulte para efeitos
  avançados (telas de UI flutuando, partícula condutora, clipes de vídeo). **Não é um estilo a copiar.**
- `templates/fonts/` — Playfair Display + Inter (opcionais, para uso sem internet) · `templates/saira.woff2`
- `templates/shell.html` — página com prévia, gravação e ganchos de render
- `references/formats.md` — tamanhos por formato e como adaptar o layout
- `references/engine.md` — anatomia do motor (render(t), faísca, textos, transições, som)
- `references/direcao-de-arte.md` — **como o estilo nasce da análise** (leia sempre, antes do Passo 2)
- `references/kit.md` — tokens do `STYLE`, cenas prontas, cenas próprias e o **padrão de qualidade**

---

## Neste agente: OpenClaw

- **`$SK`** = a pasta desta SKILL.md — o OpenClaw mostra o caminho em `<location>` na lista de skills (ex.: `~/.openclaw/skills/jsmotion/SKILL.md` → pasta `~/.openclaw/skills/jsmotion`). Rode `export SK=<pasta>` com o caminho real no primeiro comando (o OpenClaw não troca variáveis no texto da skill).
- **Onde o usuário está**: normalmente num mensageiro (WhatsApp, Telegram, Discord, Slack…). Mensagens curtas,
  **uma pergunta por mensagem**, com as opções numeradas, a sua recomendação e "Não sei, escolha por mim"; espere a resposta.
- **Logo e referência**: o usuário manda pelo chat; use o arquivo recebido (caminho da mídia) no Passo 1.
- **Imagens**: ferramenta `image` no .jpg (folhas de contato e revisão).
- **Comandos**: ferramenta `exec`. O `pack.py` leva minutos: avise o usuário do tempo e, se precisar, rode em
  segundo plano (`nohup python3 … > $WORK/pack.log 2>&1 &`) e acompanhe o log até aparecer `total:`.
- **Entregar**: ferramenta `message` com `media`/`filePath` apontando para o MP4 (ou uma linha `MEDIA:/caminho/absoluto`).
  Mande primeiro o MP4 do formato principal. Para o app não recomprimir o vídeo, envie como documento se o canal permitir.
- **Tamanho**: se o canal recusar o arquivo pelo tamanho, gere uma versão leve e mande essa:
  `ffmpeg -i x.mp4 -c:v libx264 -crf 24 -preset slow -c:a copy x_leve.mp4`.
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

   Abra `$WORK/ref/sheet.jpg` com a ferramenta de imagem e escreva o que a referência faz: paleta (hex aproximados), fundo, tipografia
   (serifa ou não, peso, caixa alta), como o texto entra, ritmo (trocas por segundo), transições, composição, uso de
   fotos/vídeo/UI, tipos de cena, densidade de texto, tratamento de foto, clima do som.
   **A referência enviada pelo usuário é a PRIORIDADE**: ela define a linguagem visual do vídeo (Passo 1B). Não é para
   copiar quadro a quadro nem o conteúdo dela, mas o resultado tem que ser reconhecível como "no estilo desta referência".
2. **Site da marca** (se houver): `python3 $SK/scripts/scrape_site.py https://site` (salva em `$WORK/site`).
   Monte folhas de contato das imagens e 1 quadro de cada vídeo (`ffmpeg -ss 3 ... -frames:v 1`,
   depois `tile`) e veja com a ferramenta de imagem. Extraia: cores principais, **fontes da marca** (`fonts` no resultado), nomes de
   serviços/projetos, frases e o tom dos textos.
   Se o site for SPA, os textos estão dentro do bundle JS: `grep -oE '"[^"]{3,80}"'` com palavras-chave.
   **Separe as melhores fotos** (produto, ambiente, pessoa, resultado — ≥ 1080 px de largura): o vídeo profissional
   é feito de mídia real. Se não houver fotos boas, peça ao usuário (fotos do produto, renders, retrato, logo em PNG).
3. **Logo**: use o arquivo ORIGINAL enviado (nunca redesenhe; só recorte margem transparente e redimensione).

Resuma para o usuário, em poucas linhas, o que encontrou (estilo da referência, paleta, fontes, projetos, fotos).

## Passo 1B — Direção de arte (o estilo nasce da análise)

Leia `references/direcao-de-arte.md` e escreva **`$WORK/ref/estilo.md`**: tom, conceito em uma frase, paleta por papéis,
tipografia (com o porquê), destaque, composição, movimento, transições, textura, **2–3 metáforas visuais do tema**
e som. **Não existe estilo padrão**: nunca parta do visual dos exemplos da skill (nem neon, nem dourado).

**Ordem de prioridade:**
1. **Com referência → a referência manda no estilo.** Ritmo, composição, tipografia (caráter: serifa/sans, peso,
   caixa), entrada do texto, transições, tratamento de foto, tipos de cena, densidade e clima do som vêm DELA.
   A marca entra com a identidade: logo original, cores da marca nos papéis que a referência usa para cor, conteúdo,
   fotos e metáforas do tema — sempre dentro da linguagem da referência, sem contradizê-la.
   Se o usuário pedir "igual à referência" (inclusive nas cores), use também a paleta da referência.
   Anote no `estilo.md` o que veio da referência e o que veio da marca.
2. **Sem referência → a análise decide**: marca (logo, site, fontes), tema, público e destino.

Prepare 3 direções para a pergunta de estilo do Passo 2. Com referência, a 1ª (recomendada) é **fiel à referência**
com a identidade da marca; as outras duas são variações dela (ex.: mais calma / mais enérgica), nunca estilos
desligados da referência. Sem referência, 3 direções diferentes geradas pela análise.

## Passo 2 — Perguntas (no máximo 7, UMA por vez)

Use a ferramenta de perguntas com opções do seu agente (ver "Ferramentas por agente"); senão, texto numerado.
Cada pergunta: 3 opções numeradas + "Não sei, escolha por mim" + **sua recomendação** no enunciado.
Pule a pergunta se a resposta já estiver clara na conversa. "Não sei" → escolha a recomendação.
Cores: não pergunte se já tirou do site/logo; só pergunte se não houver nenhuma fonte.

1. **Onde vai postar (formatos)** — 1. **Pacote completo: 9:16 + 1:1 + 16:9** (Reels/TikTok + feed/LinkedIn + YouTube/site, tudo do mesmo vídeo) · 2. Só vertical 9:16 · 3. Outro formato ou combinação (4:5, 1:1, 16:9). Recomende o pacote (padrão); se ele citar um destino só, recomende o formato dele. O formato **principal** (o primeiro) é o que você revisa com mais cuidado.
2. **Duração** — ofereça 3 opções coerentes com o formato (ex.: 15s · 25s · 40s) e diga que ele pode **digitar qualquer duração** (aceite de 6s a 90s). Padrão 25s. Diga quanto conteúdo cabe em cada uma.
3. **Direção de arte** — as 3 direções que você criou no Passo 1B (nome + paleta + fontes + conceito em 1 frase),
   a 1ª recomendada. **Com referência, a 1ª é sempre "fiel à referência, com a sua marca"** e o usuário não precisa
   escolher de novo o que já mostrou. Nunca ofereça "estilos da skill".
4. **Frase de abertura (gancho dos 3 primeiros segundos)** — 3 frases no idioma do vídeo: uma pergunta provocativa, uma afirmação forte, uma promessa de velocidade/resultado.
5. **Elemento que acompanha o vídeo todo** (só se a direção de arte pedir um; senão pule — a moldura da marca e as
   metáforas do tema fazem esse papel) — ex.: faísca de luz que "liga" cada tela · anel de luz · linha que se desenha (inspire-se no da referência).
6. **Som** — 3 climas coerentes com a direção (premium · energético · calmo · épico · minimalista), recomendando o que
   combina com o tom.
7. **Chamada final** (logo + CTA por 2,5s) — 3 frases; recomende a que "fecha" o gancho.

## Passo 3 — Roteiro e aprovação

Mostre o roteiro cena por cena, linguagem simples, com os tempos, os textos exatos, o que se mexe
e o som. O começo precisa prender nos 3 primeiros segundos. Termine com a forma de entrega e
**espere o "ok"** (ou ajustes) antes de programar.

Distribuição de tempo (escale proporcionalmente à duração escolhida):
gancho ~12% · virada/revelação ~12% · conteúdo (serviços/features) ~20% · provas/projetos ~34% ·
promessa ~12% · final logo+CTA **2,5s fixos**. Menos de 15s: junte virada+conteúdo e mostre até 3 itens.

## Passo 4 — Construção

1. Leia `references/kit.md` (tokens, cenas, padrão de qualidade), `references/formats.md` e o seu `$WORK/ref/estilo.md`.
2. `cp $SK/templates/kit.js $WORK/anim.js` e:
   - **Substitua o objeto `STYLE` inteiro** pela sua direção de arte (o do arquivo é só um exemplo): `colors` da marca,
     `highlight`, `eyebrow`, `align`, `radius`, `card`, `reveal`, `speed`, `transition`, `texture`, `photo`, `frame`,
     `sound`, `locale`.
   - **Fontes da direção**: `python3 $SK/scripts/get_font.py "Família" --role display` e `--role text` (qualquer família
     do Google Fonts; se a fonte da marca for comercial, a alternativa livre mais próxima).
   - Escreva o `SCRIPT` (cenas prontas: `hook`, `statement`, `photo`, `cards`, `list`, `price`, `person`, `cta`) e
     **crie as cenas das metáforas do tema** (`SC.nome = (ctx, s, lt) => {…}` — ver `references/kit.md`).
   - Siga os 10 itens do **padrão de qualidade** (`references/kit.md`): gancho no 1º segundo, mídia real, uma ideia por
     cena, legível no celular, números animados, final acionável, metáforas do tema.
   - Efeitos que o kit não tem (telas de UI flutuando, partícula condutora, clipes de vídeo): veja como o
     `templates/example_anim.js` faz (`references/engine.md`) e traga a técnica para uma cena própria — sem trazer o visual.
3. Crie `config.json` e rode `python3 $SK/scripts/prep_assets.py config.json $WORK/assets.js`
   (clipes de vídeo: trechos de 1,5–3,5s a 15 fps; mantenha o total < ~8 MB).
4. Monte os .html de todos os formatos pedidos (sem renderizar ainda):
   `python3 $SK/scripts/pack.py $WORK/anim.js $WORK/assets.js <nome> "<Título>" --formats 9x16,1x1,16x9 --html-only`
   → `$OUT/<nome>_9x16.html`, `$OUT/<nome>_1x1.html`, … (um formato só: `--formats 9x16`).

### Regras técnicas (valem para qualquer estilo)
- Um único canvas, tudo desenhado por `render(ctx, t)` — determinístico (nada de `Math.random()` solto; use `rng(seed)`).
- Movimentos sempre com easing; transições e texturas **as da direção de arte** (o kit já faz).
- Logo original, nunca redesenhada; final com logo + chamada por 2,5–4 s.
- Trilha e efeitos com **Web Audio API** (OfflineAudioContext, em sincronia com a linha do tempo).
- O estilo (cores, fontes, brilhos, fundos, ritmo) **nunca** vem destas regras nem dos exemplos: vem do `estilo.md`.

## Passo 5 — Revisão (antes de entregar)

```bash
python3 $SK/scripts/snap.py $OUT/<nome>_9x16.html 0.5 1.5 2.5 ... -o $WORK/review_9x16.jpg   # 15–18 instantes, incluindo meios de transição
python3 $SK/scripts/snap.py $OUT/<nome>_16x9.html <8–10 instantes> -o $WORK/review_16x9.jpg     # e um pouco de cada outro formato
```
Compare com a referência atual: `python3 $SK/scripts/snap.py $OUT/<nome>_9x16.html <instantes> --ref $WORK/ref/sheet.jpg -o $WORK/compare.jpg`
(folha da referência em cima, a do seu vídeo embaixo). **Obrigatório quando há referência**: composição, tipografia,
ritmo, transições e tratamento de foto precisam ser reconhecíveis como **desta** referência; se lembrarem o exemplo
da skill, uma referência anterior ou "um estilo genérico", refaça antes de entregar. Sem referência, confira com o
`estilo.md`: se trocar a logo por outra e o vídeo continuar "servindo", falta marca — acrescente as metáforas do tema.
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
