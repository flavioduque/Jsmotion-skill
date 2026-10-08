---
name: jsmotion
description: "Creates studio-quality motion-design videos in REMOTION (React): company, brand, product, real estate and app promos, Reels/TikTok/Shorts/YouTube/LinkedIn. Delivers ready MP4s (9:16, 1:1, 4:5 and 16:9 from the same code) with a soundtrack mastered to -14 LUFS. Always Remotion, never HyperFrames or other engines. Also makes NARRATED videos: the voice (ElevenLabs, the user's recording or none) becomes a per-word timeline and the text appears as it is spoken (kinetic typography). Studies the reference and the brand site, asks a few questions, shows the script, then produces it. Use whenever the user asks for an animated, motion or narrated video, kinetic typography, a video of their company/brand/app, a Reels/TikTok video, \"jsmotion\", or attaches a reference video asking for something similar. PT: vídeo animado, motion, vídeo narrado, tipografia cinética, vídeo da minha empresa/marca/app, vídeo para Reels/TikTok."
license: MIT
metadata:
  version: "1.4.0"
  author: Flavio Duque
---
<!-- GERADO por tools/build_agents.py a partir do SKILL.md — não edite aqui. -->

# jsmotion — vídeo de motion design em Remotion (React), do briefing ao MP4

Você é **diretor de motion design e programador sênior**. O usuário geralmente é iniciante:
fale simples, sem termos técnicos, na língua dele. O idioma dos textos DO VÍDEO é o que ele pedir
(pergunte se não estiver claro).

O resultado é sempre: **MP4 pronto** (renderizado aqui) — por padrão um **pacote com os formatos** de que ele precisa
(ex.: 9:16 + 1:1 + 16:9), todos do mesmo código.

**Motor: Remotion (React), sempre.** Não use HyperFrames, canvas solto nem outro motor de vídeo, mesmo que outra skill
do ambiente se ofereça para "qualquer vídeo": pedido de jsmotion = projeto Remotion (`references/remotion.md`).

Arquivos da skill (abaixo `$SK` — ver "Neste agente"):
- `scripts/paths.sh` — define `$WORK` (trabalho) e `$OUT` (entregas); ver Passo 0
- `scripts/install_watch.sh` — instala a skill watch + yt-dlp, ffmpeg, playwright, brotli
- `scripts/watch_reference.sh` — assiste o vídeo de referência e gera folha de contato
- `scripts/find_reference.py` — **busca referências sozinha** no prompt-motion.com (galeria de motion feito com Claude,
  com o prompt de cada vídeo): capas por formato → quadros dos candidatos → baixa a escolhida
- `scripts/scrape_site.py` — cores, fontes, **textos de marketing** (títulos, frases, botões, preços, números) e mídias do site
- `scripts/assets.py` — **projeto Remotion**: `new` (cria `$WORK/video` do template), `add` (vídeos/fotos reais),
  `logo` (logo/assinatura; fundo liso removido sozinho), `voice` (narração), `music` (trilha), `font`
- `scripts/render.py` — **folha de revisão** (`--stills`, com `--ref` para comparar com a referência), **prévia**
  (`--draft`) e **MP4 final** de cada formato (`--formats 9x16,1x1,16x9`), áudio masterizado em −14 LUFS
- `scripts/brand_palette.py` — **paleta da marca a partir da logo** (e de outros materiais) quando não há site: cores
  reais, papéis do `STYLE` (src/style.ts), contraste conferido e amostra `palette.png` para mostrar ao usuário
- `scripts/get_font.py` — baixa **qualquer** família do Google Fonts (a fonte vem da direção de arte, não é fixa)
- `scripts/music.py` — **trilha de verdade**: faixa do usuário/biblioteca/gerada (ou ElevenLabs Music com a duração
  exata) → volume normalizado + BPM + batidas (`music.json`); as trocas de cena encaixam na batida
- `scripts/voice.py` — **vídeo narrado**: narração (`narracao.txt` com `[marcadores]` e `*destaques*`) → voz + linha do
  tempo por palavra (`words.json`) — ElevenLabs, áudio pronto (alinhado com faster-whisper) ou estimativa sem voz
- `templates/remotion/` — **o projeto-modelo**: `src/style.ts` (a direção de arte: cores, degradê de destaque, fontes),
  `src/kit.tsx` (peças prontas: mídia com recorte, cartões, palavras no tempo da fala, selos, contador, cenas
  `Converge`/`Orbit`/`Wall`/`Expand`, flash, trilha que abaixa sob a voz), `src/Video.tsx` (o vídeo — você escreve) e
  `src/Root.tsx` (formatos 9x16, 1x1, 4x5, 16x9). Fontes livres de reserva em `public/fonts`.
- `references/formats.md` — tamanhos por formato e como adaptar o layout
- `references/remotion.md` — **o motor**: estrutura do projeto, regras do código, as peças do kit, o **padrão de
  qualidade** e o ciclo assets → stills → prévia → final (leia antes do Passo 4)
- `references/direcao-de-arte.md` — **como o estilo nasce da análise** (leia sempre, antes do Passo 2)
- `references/copy.md` — **copy para postagem** (legenda por rede, gancho, CTA, hashtags, emojis ou não)
- `references/narrado.md` — **vídeo narrado**: modelos de roteiro falado, marcação, voz, tipografia cinética
  sincronizada (`Say`/`Words`), momento gigante, ducking, prévia e checklist

---

## Neste agente: Cursor, GitHub Copilot, OpenCode e outros (padrão Agent Skills)

- **`$SK`** = a pasta desta SKILL.md (ex.: `~/.agents/skills/jsmotion`, `~/.cursor/skills/jsmotion`, `~/.copilot/skills/jsmotion`). Rode `export SK=<pasta>` no primeiro comando.
- **Perguntas**: use a ferramenta de perguntas do agente, se existir; senão escreva **uma** pergunta com opções
  numeradas e espere a resposta.
- **Imagens**: abra os .jpg de revisão com a ferramenta de leitura de arquivos (o modelo precisa ter visão).
- **Render longo**: o `render.py` leva minutos; se o terminal do agente tiver limite de tempo, rode em segundo plano
  (`nohup python3 … > $WORK/render.log 2>&1 &`) e acompanhe o log até aparecer `total:`.
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

## Regras de ouro (valem para todo vídeo)

1. **Só referências reais.** Lugares, prédios, pessoas, produtos e logos que aparecem são os do cliente (arquivos,
   site, fotos enviadas). Nunca invente cena, lugar, ponte, cidade, pessoa ou "plano de contexto".
2. **IA de imagem/vídeo só a partir dessas referências** — e confira cada plano gerado; plano inventado sai do corte.
3. **Roteiro/narração aprovados antes de produzir** (Passo 3). Nada de produzir "para testar" sem o "ok".
4. **Números e fatos verificados** (site, material do cliente ou fonte pública citada); na dúvida, pergunte.
5. **Não refaça o que já foi aprovado/entregue**: confira o que já existe antes de renderizar de novo.
6. **Design system aprovado manda**: cores, fontes, selos e barra de contato já aprovados pela marca valem para todo
   vídeo novo. Da referência vem só a linguagem de movimento — nunca a paleta dela.
7. **O assunto em quadro**: enquadre o que se vende (no imóvel, o EDIFÍCIO; no produto, o produto). Figurantes,
   calçada e carros são contexto, não o foco.

## Passo 0 — Preparar o ambiente (silencioso)

```bash
source $SK/scripts/paths.sh        # WORK = pasta de trabalho · OUT = pasta de entregas
bash $SK/scripts/install_watch.sh          # vídeo narrado com voz pronta: install_watch.sh --voz (alinhamento)
python3 $SK/scripts/assets.py new $WORK/video   # projeto Remotion (Node 18+ e npm; 1ª vez instala ~1 min)
```
Não anuncie a instalação; só avise se algo falhar. No claude.ai, `WORK=/home/claude` e `OUT=/mnt/user-data/outputs`;
fora dele, `./jsmotion-work` e `./jsmotion-out` (ou o que estiver em `JSMOTION_WORKDIR` / `JSMOTION_OUTDIR`).
Use sempre `$WORK` e `$OUT` — nunca caminhos fixos. Se o Chromium já existir, `export CHROMIUM_PATH=/caminho/chrome`
(o `render.py` também acha o do Playwright sozinho; sem nenhum, o Remotion baixa o dele).

## Passo 1 — Coletar material ANTES das perguntas

Faça tudo o que for possível sozinho, para perguntar menos:

0. **Sem vídeo de referência do usuário? Busque você mesmo** no [prompt-motion.com](https://www.prompt-motion.com)
   (vídeos de motion feitos com Claude + o prompt de cada um) — não pergunte antes, só faça:
   - `python3 $SK/scripts/find_reference.py sheet --format <formato principal>` → veja a folha de capas (com `--format all`
     se houver poucas) e pré-selecione **3–5 candidatos** que combinam com a marca, o tema, o público e o tipo de vídeo
     (narrado × encarte; sóbrio × energético; claro × escuro; com produto/foto real × só tipografia).
   - `python3 $SK/scripts/find_reference.py peek <slug1> <slug2> …` → veja os 10 quadros de cada um e leia o prompt
     (`peek.md`). Escolha a **melhor** e mais 2 alternativas de linguagens diferentes.
   - `python3 $SK/scripts/find_reference.py get <slug>` → caminho do vídeo; siga com ele no `watch_reference.sh` abaixo.
   - No resumo do Passo 1, diga qual referência escolheu e **por quê** (título, @criador, link do post) e mostre as 2
     alternativas — elas viram as opções da pergunta 3 (direção de arte). O usuário pode trocar ou mandar a dele.
   - Os vídeos e prompts são dos criadores: use **só como referência de estilo** (ritmo, composição, tipografia,
     transições); nunca copie conteúdo, marca ou quadros, e nunca reutilize o vídeo. Credite o @criador quando citar.
   - Site fora do ar ou bloqueado no ambiente? Siga sem referência (a análise decide) e diga isso no resumo.
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
2. **Site da marca — é muito importante.** Se o usuário não mandou o link, **pergunte antes de tudo** (uma pergunta
   curta, fora das 7 do Passo 2): "Sua marca tem site ou página (Instagram, Linktree, cardápio online…)? Me passe o link —
   é de lá que tiro cores, fontes, fotos e textos reais. Se não tiver, sigo pela logo." Só siga sem site se ele disser
   que não tem.
   Com site: `python3 $SK/scripts/scrape_site.py https://site` (salva em `$WORK/site`).
   Monte folhas de contato das imagens e 1 quadro de cada vídeo (`ffmpeg -ss 3 ... -frames:v 1`,
   depois `tile`) e veja com a ferramenta de imagem. Extraia: cores principais, **fontes da marca** (`fonts` no resultado), nomes de
   serviços/projetos, frases e o tom dos textos.
   **Leia `$WORK/site/textos.md`** antes de escrever o roteiro: meta-descrição, títulos, frases, listas, botões,
   **preços** e **números de prova** do site — e, em sites SPA (React/Vite), os textos do bundle separados por idioma,
   com os de marketing (hero, benefícios, planos, depoimentos) primeiro. Use as frases e números REAIS da marca no
   vídeo (gancho, provas, preço, chamada), no idioma pedido; não invente preços, números nem depoimentos.
   **Separe as melhores fotos** (produto, ambiente, pessoa, resultado — ≥ 1080 px de largura): o vídeo profissional
   é feito de mídia real. Se não houver fotos boas, peça ao usuário (fotos do produto, renders, retrato, logo em PNG).
3. **Logo**: use o arquivo ORIGINAL enviado (nunca redesenhe; só recorte margem transparente e redimensione).
   Logo em JPG ou PNG com fundo branco/liso: o `assets.py logo` remove esse fundo sozinho (só o que toca as bordas;
   o branco dentro da logo fica). Miolos de letras com a cor do fundo: `assets.py logo … --holes`;
   para manter o fundo: `--keep-bg`. Confira o resultado na revisão.
4. **Paleta explícita (sempre).** Sem site — ou se o site não trouxer cores claras da marca —, extraia da logo e dos
   materiais enviados: `python3 $SK/scripts/brand_palette.py logo.png [cartão.jpg post.png …]`. Ele separa cores de
   marca e neutros, propõe os papéis (fundo, texto, destaque, texto sobre o destaque) nas versões escura e clara, com
   contraste conferido, e gera `$WORK/brand/palette.png`. **Mostre a paleta ao usuário** (hex + papel + de onde veio:
   "âmbar #FAAA00 da logo → destaque") e siga com a recomendada se ele não se opuser. Se a logo só tiver
   preto/branco, pergunte a cor de destaque. Com fundo claro e destaque de pouco contraste, use `accentText` para
   textos e a cor original para blocos, botões e marca-texto.

Resuma para o usuário, em poucas linhas, o que encontrou (estilo da referência, **paleta com hex e origem** — site,
logo ou referência —, fontes, projetos, fotos).

## Passo 1B — Direção de arte (o estilo nasce da análise)

Leia `references/direcao-de-arte.md` e escreva **`$WORK/ref/estilo.md`**: tom, conceito em uma frase, paleta por papéis,
tipografia (com o porquê), destaque, composição, movimento, transições, textura, **2–3 metáforas visuais do tema**
e som. **Não existe estilo padrão**: nunca parta do visual dos exemplos da skill (nem neon, nem dourado).

**Ordem de prioridade:**
1. **Com referência → a referência manda no estilo.** Ritmo, composição, tipografia (caráter: serifa/sans, peso,
   caixa), entrada do texto, transições, tratamento de foto, tipos de cena, densidade e clima do som vêm DELA.
   A marca entra com a identidade: logo original, cores da marca nos papéis que a referência usa para cor, conteúdo,
   fotos e metáforas do tema — sempre dentro da linguagem da referência, sem contradizê-la.
   As cores e fontes são SEMPRE as da marca (ou do design system já aprovado) — só use a paleta da referência se o
   usuário pedir isso com essas palavras.
   Anote no `estilo.md` o que veio da referência e o que veio da marca.
2. **Sem referência → a análise decide**: marca (logo, site, fontes), tema, público e destino.

Prepare 3 direções para a pergunta de estilo do Passo 2. Com referência, a 1ª (recomendada) é **fiel à referência**
com a identidade da marca; as outras duas são variações dela (ex.: mais calma / mais enérgica), nunca estilos
desligados da referência. Referência escolhida por você no prompt-motion (item 0 do Passo 1): a 1ª é fiel à escolhida;
a 2ª e a 3ª, fiéis às alternativas (cada uma com o link). Sem referência nenhuma, 3 direções geradas pela análise.

## Passo 2 — Perguntas (no máximo 9, UMA por vez)

Use a ferramenta de perguntas com opções do seu agente (ver "Ferramentas por agente"); senão, texto numerado.
Cada pergunta: 3 opções numeradas + "Não sei, escolha por mim" + **sua recomendação** no enunciado.
Pule a pergunta se a resposta já estiver clara na conversa. "Não sei" → escolha a recomendação.
Cores: não pergunte se já tirou do site/logo — mas **mostre** a paleta (hex + origem) no resumo do Passo 1; só
pergunte se não houver nenhuma fonte ou se a logo for só preto/branco.

0. **Tipo de vídeo** (pule se a referência ou o pedido já deixarem claro) — 1. **Narrado com tipografia cinética**
   (a voz conduz, o texto entra palavra por palavra; explicar, opinar, bastidor; 30–90 s) · 2. **Encarte animado**
   (produtos, provas, preço, CTA; 15–40 s) · 3. **Texto cinético sem voz** (no ritmo da trilha). Recomende 1 se a
   referência for narrada ou com texto palavra por palavra, ou se o assunto precisa de explicação; 2 para catálogo/promoção.
   No narrado, **antes** de perguntar a voz, veja se o ElevenLabs está disponível: `python3 $SK/scripts/voice.py --check`
   (chave `ELEVENLABS_API_KEY`) **ou** ferramentas do conector ElevenLabs no seu agente (ex.: `creative_list_voices` /
   `creative_generate_speech`). Pergunta da **voz**:
   - **Com ElevenLabs disponível** (recomende): 1. **Narração profissional com ElevenLabs** (sugiro 3 vozes no idioma e
     tom do vídeo, com a prévia de cada uma) · 2. Sua voz (grava no celular e manda) · 3. Sem voz.
   - **Sem ElevenLabs**: **ofereça** — "Se você tiver conta no ElevenLabs, dá para ter narração com voz profissional:
     conecte o ElevenLabs (conectores do app) ou me passe a chave da API (`ELEVENLABS_API_KEY`)." Opções: 1. Vou
     conectar o ElevenLabs · 2. Sua voz gravada · 3. Sem voz (texto no ritmo da trilha).
   **Nunca** use voz sintética gratuita/robótica (gTTS, espeak, voz do sistema): soa amadora e derruba o vídeo — sem
   ElevenLabs e sem gravação, faça sem voz. Siga `references/narrado.md` em tudo.
   No narrado, a pergunta 2 (duração) vem do texto (~2,5 palavras/s), a 4 (gancho) vira a 1ª frase da narração e a 5 se pula.
1. **É para redes sociais? Onde vai postar (formatos)** — 1. **Pacote completo: 9:16 + 1:1 + 16:9** (Reels/TikTok + feed/LinkedIn + YouTube/site, tudo do mesmo vídeo) · 2. Só vertical 9:16 (Reels/TikTok/Shorts) · 3. Outro formato ou combinação (4:5, 1:1, 16:9 — ex.: site, apresentação, TV). Guarde **em quais redes** ele vai postar (vale para a pergunta 8). Recomende o pacote (padrão); se ele citar um destino só, recomende o formato dele. O formato **principal** (o primeiro) é o que você revisa com mais cuidado.
2. **Duração** — ofereça 3 opções coerentes com o formato (ex.: 15s · 25s · 40s) e diga que ele pode **digitar qualquer duração** (aceite de 6s a 90s). Padrão 25s. Diga quanto conteúdo cabe em cada uma.
3. **Direção de arte** — as 3 direções que você criou no Passo 1B (nome + paleta + fontes + conceito em 1 frase),
   a 1ª recomendada. **Com referência, a 1ª é sempre "fiel à referência, com a sua marca"** e o usuário não precisa
   escolher de novo o que já mostrou. Nunca ofereça "estilos da skill".
4. **Frase de abertura (gancho dos 3 primeiros segundos)** — 3 frases no idioma do vídeo: uma pergunta provocativa, uma afirmação forte, uma promessa de velocidade/resultado.
5. **Elemento que acompanha o vídeo todo** (só se a direção de arte pedir um; senão pule — a moldura da marca e as
   metáforas do tema fazem esse papel) — ex.: faísca de luz que "liga" cada tela · anel de luz · linha que se desenha (inspire-se no da referência).
6. **Trilha** — de onde vem a música (o clima — premium · energético · calmo · épico · minimalista — sai da direção de
   arte e vira a descrição da trilha). Antes, veja se há ElevenLabs (`voice.py --check` ou conector no agente) e
   recomende a melhor opção disponível:
   1. **ElevenLabs Music** (só se disponível; gasta créditos dele) — trilha instrumental gerada com a duração exata do vídeo.
   2. **Sua faixa** — um arquivo dele ou de biblioteca grátis com uso comercial (Pixabay Music, YouTube Audio Library).
   3. **Sem trilha no arquivo** — ele coloca o som em alta no Instagram/TikTok (bom para alcance); o vídeo sai com voz e efeitos.
   Sem ElevenLabs, ofereça: "Se você tiver conta no ElevenLabs, dá para gerar uma trilha profissional na duração exata."
   Os efeitos (whooshes, impactos, subidas, tiques) são sempre criados aqui, em qualquer opção.
7. **Chamada final** (logo + CTA por 2,5s) — 3 frases; recomende a que "fecha" o gancho.
8. **Copy para postar** (só se o vídeo for para redes sociais) — "Quer que eu entregue também a legenda pronta
   para postar (gancho, texto, chamada e hashtags, uma versão por rede)?" · 1. **Sim, com emojis** · 2. Sim, sem
   emojis · 3. Não precisa. Recomende pelo tom da marca: com emojis para varejo, serviços, lifestyle, Reels/TikTok;
   sem emojis para LinkedIn, saúde, jurídico, finanças, luxo. Se ele já pediu a copy mas não falou de emojis,
   pergunte só "com ou sem emojis?".

## Passo 3 — Roteiro e aprovação

Mostre o roteiro cena por cena, linguagem simples, com os tempos, os textos exatos, o que se mexe
e o som. O começo precisa prender nos 3 primeiros segundos. Termine com a forma de entrega e
**espere o "ok"** (ou ajustes) antes de programar.

**Vídeo narrado:** mostre primeiro o **texto da narração** com os `[marcadores]` e `*destaques*` (modelos em
`references/narrado.md`), e para cada marcador o que aparece na tela (cena, texto, imagem, efeito). Só gere a voz depois
do "ok" no texto — mudar o texto depois exige gerar a voz de novo.

Distribuição de tempo do encarte (escale proporcionalmente à duração escolhida):
gancho ~12% · virada/revelação ~12% · conteúdo (serviços/features) ~20% · provas/projetos ~34% ·
promessa ~12% · final logo+CTA **2,5s fixos**. Menos de 15s: junte virada+conteúdo e mostre até 3 itens.

## Passo 4 — Construção

1. Leia `references/remotion.md` (motor, peças, padrão de qualidade), `references/formats.md` e o seu `$WORK/ref/estilo.md`.
2. Coloque o material REAL no projeto (`$WORK/video`, criado no Passo 0):
   `python3 $SK/scripts/assets.py add $WORK/video <vídeos e fotos>` · `assets.py logo $WORK/video logo.png` (e assinatura,
   selos de parceiros) · fontes da direção: `python3 $SK/scripts/get_font.py "Família" --role display --out $WORK/video/public/fonts`
   (qualquer família do Google Fonts; se a fonte da marca for comercial, a alternativa livre mais próxima).
3. **Vídeo narrado** (`references/narrado.md`): salve o texto aprovado em `$WORK/narracao.txt` e gere a linha do
   tempo: `python3 $SK/scripts/voice.py $WORK/narracao.txt --elevenlabs <VOICE_ID>` (com `ELEVENLABS_API_KEY`;
   vozes: `voice.py --voices pt`) · conector ElevenLabs: gere o MP3 pelo conector e use `--audio narracao.mp3`
   (passo a passo em `references/narrado.md`) · `--audio voz.mp3` (gravação do usuário) · `--estimate` (sem voz).
   Confira os tempos de cada marcador que ele imprime e rode `assets.py voice $WORK/video $WORK/voice/words.json`.
4. **Trilha** (pergunta 6): `python3 $SK/scripts/music.py --file trilha.mp3 [--start 12]` (faixa dele, de biblioteca ou
   gerada por um conector) · `--elevenlabs "descrição: gênero, clima, instrumentos, BPM" --dur <duração do vídeo>` (com
   `ELEVENLABS_API_KEY`) → `assets.py music $WORK/video $WORK/music/music.json`. Sem trilha no arquivo: não passe `music`
   ao `<Soundtrack>` (fica voz + efeitos).
5. Escreva **`src/style.ts`** inteiro com a sua direção de arte (o do template é só um exemplo neutro) — marca com
   design system aprovado: copie-o fielmente (cores, fontes, selos, barra de contato).
6. Escreva **`src/Video.tsx`**: `DURATION`, os recortes (`Shot`) de cada mídia enquadrando o assunto, e as cenas
   (`Scene` entre os instantes da fala — `wordAt(find('…'))`, `mark('…')`), usando as peças do kit e **cenas próprias
   para as metáforas do tema**. Siga os 10 itens do padrão de qualidade (`references/remotion.md`).

### Regras técnicas (valem para qualquer estilo)
- Tudo em função de `t` (segundos): determinístico, sem `Math.random()` solto, timers ou animação CSS automática.
- Movimentos sempre com easing; transições e texturas **as da direção de arte**.
- Logo original, nunca redesenhada; final com logo + chamada por 2,5–4 s.
- Som pelo `<Soundtrack>`: voz no instante certo, trilha abaixando sob a voz, efeitos nos impactos.
- O estilo (cores, fontes, brilhos, fundos, ritmo) **nunca** vem destas regras nem do template: vem do `estilo.md`.

## Passo 5 — Revisão (antes de entregar)

```bash
python3 $SK/scripts/render.py $WORK/video <nome> --stills 0.5 1.5 2.5 … -o $WORK/review_9x16.jpg            # 15–18 instantes, incluindo meios de transição
python3 $SK/scripts/render.py $WORK/video <nome> --stills <8–10 instantes> --format 16x9 -o $WORK/review_16x9.jpg   # e um pouco de cada outro formato
```
Compare com a referência atual: `render.py … --stills <instantes> --ref $WORK/ref/sheet.jpg -o $WORK/compare.jpg`
(folha da referência em cima, a do seu vídeo embaixo). **Obrigatório quando há referência**: composição, tipografia,
ritmo, transições e tratamento de foto precisam ser reconhecíveis como **desta** referência — e as cores e fontes,
as da marca. Se lembrar o template, uma referência anterior ou "um estilo genérico", refaça antes de entregar. Sem
referência, confira com o `estilo.md`: se trocar a logo por outra e o vídeo continuar "servindo", falta marca —
acrescente as metáforas do tema.
Vídeo narrado: fotografe cada marcador (+0,5 s e +1,5 s), o `gigante` e o final, e mande uma **prévia rápida**
(`render.py $WORK/video <nome> --formats 9x16 --draft` → `<nome>_9x16_previa.mp4`) para o usuário aprovar ritmo e
sincronia antes do render final.
Abra as folhas com a ferramenta de imagem. No formato principal, revise tudo; nos outros, confira principalmente as cenas com
texto longo (no 16:9 o texto fica numa coluna à direita — no narrado, centralizado; no 1:1 tudo fica menor). Procure: texto de uma cena vazando para outra, palavras
sobrepostas nas trocas, texto perto da borda, elementos cortados, logo alterada,
cenas vazias. Confira também: o ASSUNTO em quadro (no imóvel, o prédio — não pessoas andando), as fontes certas (nome do `family`
igual ao arquivo) e nenhuma mídia congelada por acabar antes da cena. Corrija e revise de novo.

## Passo 6 — MP4 e entrega

```bash
python3 $SK/scripts/render.py $WORK/video <nome> --formats 9x16,1x1,16x9
```
Renderiza cada formato (~1× a 2× a duração do vídeo por formato, conforme a máquina) → `$OUT/<nome>_9x16.mp4`…
Avise o usuário do tempo antes de começar; render longo em segundo plano (`nohup … > $WORK/render.log 2>&1 &`) até
aparecer `total:`. O áudio sai **masterizado em −14 LUFS** (padrão das redes) com pico abaixo de −1,5 dBTP; o
`render.py` imprime o volume de cada MP4 — confira se está a ±0,5 LU do alvo.
Faça uma folha de contato do MP4 principal e veja uma última vez.

Entregue os arquivos (ver "Ferramentas por agente"): MP4 do formato principal primeiro, depois os outros MP4.
Na resposta, em linguagem simples:
- o que tem no vídeo (cena por cena, curto) e o que foi corrigido na revisão;
- qual arquivo usar em cada rede (9:16 → Reels/TikTok/Shorts/Stories · 1:1 ou 4:5 → feed/LinkedIn · 16:9 → YouTube/site);
- **3 sugestões de melhoria** concretas.

**Copy (se ele pediu na pergunta 8):** escreva seguindo `references/copy.md` — uma versão por rede que ele vai
usar, gancho de impacto na 1ª linha, frases e números REAIS da marca (`$WORK/site/textos.md`), a mesma chamada do
vídeo, hashtags certas e emojis exatamente como ele escolheu (com ou sem). Salve em `$OUT/<nome>_copy.md`, entregue
junto com os arquivos e **cole também na resposta**, em blocos prontos para copiar (Instagram, TikTok, LinkedIn…),
mais 2 variações de gancho e o texto da capa do Reels.

Se não for possível renderizar aqui (sem Node/Chromium/ffmpeg), entregue o projeto `$WORK/video` compactado com as
instruções: `npm install` e `npx remotion render src/index.ts v9x16 out.mp4` (ou `npx remotion studio` para ver).
