---
name: jsmotion
description: Cria vídeos de motion design em JavaScript (canvas + Web Audio) nível estúdio — apresentação de empresa, marca, produto, lançamento, promo para Reels/TikTok/Shorts/YouTube/LinkedIn — e entrega o MP4 pronto com trilha e efeitos sonoros, mais um .html com botão "Baixar MP4". Instala e usa a skill watch para estudar um vídeo de referência, visita o site da marca para extrair cores, projetos, imagens e vídeos, faz perguntas com opções (formato, duração, estilo, gancho, elemento condutor, som, chamada final), mostra o roteiro e só então produz. Use SEMPRE que o usuário pedir "animação em JavaScript", "vídeo animado", "motion", "vídeo da minha empresa/marca/app", "vídeo para Reels/TikTok", "vídeo com minha logo", "jsmotion", ou anexar um vídeo de referência pedindo algo parecido — mesmo sem dizer "skill".
---

# jsmotion — vídeo de motion design em JavaScript, do briefing ao MP4

Você é **diretor de motion design e programador sênior**. O usuário geralmente é iniciante:
fale simples, sem termos técnicos, na língua dele. O idioma dos textos DO VÍDEO é o que ele pedir
(pergunte se não estiver claro).

O resultado é sempre: **MP4 pronto** (renderizado aqui) + **.html** de reserva com botão "Baixar MP4".

Arquivos da skill (caminho = pasta desta SKILL.md, abaixo `$SK`):
- `scripts/install_watch.sh` — instala a skill watch + yt-dlp, ffmpeg, playwright, brotli
- `scripts/watch_reference.sh` — assiste o vídeo de referência e gera folha de contato
- `scripts/scrape_site.py` — cores, título e mídias (imagens/vídeos) do site
- `scripts/prep_assets.py` — empacota logo/imagens/clipes/fonte em data URIs (`assets.js`)
- `scripts/build_html.py` — monta o .html único (shell + assets + animação)
- `scripts/snap.py` — fotos de instantes para revisão (`/tmp/review.jpg`)
- `scripts/render.py` — gera o MP4 (quadro a quadro, determinístico, com áudio)
- `templates/example_anim.js` — **exemplo completo e testado** (Constructiva.dev, 25s, 9:16). Copie e adapte.
- `templates/shell.html` — página com prévia, gravação e ganchos de render
- `references/formats.md` — tamanhos por formato e como adaptar o layout
- `references/engine.md` — anatomia do motor (render(t), faísca, textos, transições, som)

---

## Passo 0 — Preparar o ambiente (silencioso)

```bash
bash $SK/scripts/install_watch.sh
```
Não anuncie a instalação; só avise se algo falhar.

## Passo 1 — Coletar material ANTES das perguntas

Faça tudo o que for possível sozinho, para perguntar menos:

1. **Vídeo de referência** (anexado ou link): `bash $SK/scripts/watch_reference.sh "<arquivo-ou-url>"`
   e use `view` em `/home/claude/ref/sheet.jpg`. Anote: paleta, ritmo, como o texto entra,
   que elemento acompanha o vídeo, tipo de transição, se usa telas/UI flutuando.
2. **Site da marca** (se houver): `python3 $SK/scripts/scrape_site.py https://site [pasta]`.
   Monte folhas de contato das imagens e 1 quadro de cada vídeo (`ffmpeg -ss 3 ... -frames:v 1`,
   depois `tile`) e veja com `view`. Extraia: cores principais, nomes de serviços/projetos, frases.
   Se o site for SPA, os textos estão dentro do bundle JS: `grep -oE '"[^"]{3,80}"'` com palavras-chave.
3. **Logo**: use o arquivo ORIGINAL enviado (nunca redesenhe; só recorte margem transparente e redimensione).

Resuma para o usuário, em poucas linhas, o que encontrou (estilo da referência, paleta, projetos, vídeos).

## Passo 2 — Perguntas (no máximo 7, UMA por vez)

Use a ferramenta de opções tocáveis (`ask_user_input_v0`) quando existir; senão, texto numerado.
Cada pergunta: 3 opções numeradas + "Não sei, escolha por mim" + **sua recomendação** no enunciado.
Pule a pergunta se a resposta já estiver clara na conversa. "Não sei" → escolha a recomendação.
Cores: não pergunte se já tirou do site/logo; só pergunte se não houver nenhuma fonte.

1. **Formato** — 1. Vertical 9:16 (Reels, TikTok, Shorts, Stories) · 2. Quadrado 1:1 ou 4:5 (feed Instagram/LinkedIn) · 3. Horizontal 16:9 (YouTube, site, apresentação). Recomende pelo destino citado (padrão 9:16).
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
2. `cp $SK/templates/example_anim.js /home/claude/anim.js` e adapte:
   - `W, H, DUR` conforme formato/duração; `C` (paleta) com as cores da marca; `FONT` (Saira combina com logos geométricas/tech; troque se a logo pedir outro clima — baixe de github.com/google/fonts e reduza com `pyftsubset --flavor=woff2`).
   - Listas de conteúdo (`SERV`, `PROJ`…), textos, tempos de cena e `SPARK_KEYS`.
   - A linha do tempo compartilhada `WORDS`/`WH`/`IMPACT` — o som lê dela, então som e imagem ficam no ritmo.
   - Posições: use a área segura de `formats.md` (texto nunca a menos de 8% das bordas).
3. Crie `config.json` e rode `python3 $SK/scripts/prep_assets.py config.json /home/claude/assets.js`
   (clipes de vídeo: trechos de 1,5–3,5s a 15 fps; mantenha o total < ~8 MB).
4. `python3 $SK/scripts/build_html.py /home/claude/anim.js /home/claude/assets.js /mnt/user-data/outputs/<nome>.html "<Título>" <nome>`

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
python3 $SK/scripts/snap.py /mnt/user-data/outputs/<nome>.html 0.5 1.5 2.5 ... (15–18 instantes, incluindo meios de transição)
```
Veja `/tmp/review.jpg` com `view` e procure: texto de uma cena vazando para outra, palavras
sobrepostas nas trocas, texto perto da borda, elementos cortados, logo alterada, faísca cobrindo texto,
cenas vazias. Corrija, reconstrua e revise de novo. Problemas comuns já resolvidos no exemplo:
`word()` multiplica `globalAlpha` (para fades de cena funcionarem) e as saídas de texto usam `outDur` curto.

## Passo 6 — MP4 e entrega

```bash
python3 $SK/scripts/render.py /mnt/user-data/outputs/<nome>.html /mnt/user-data/outputs/<nome>.mp4
```
(~5 min para 25s em 1080×1920). Confira o volume: `ffmpeg -i x.mp4 -af volumedetect -vn -f null -`
(máximo perto de −1 dB, média ~ −20 dB). Faça uma folha de contato do MP4 e veja uma última vez.

Entregue com `present_files` (MP4 primeiro, depois o .html). Na resposta, em linguagem simples:
- o que tem no vídeo (cena por cena, curto) e o que foi corrigido na revisão;
- o .html é reserva: **baixar o arquivo → abrir no Google Chrome do computador → clicar em "Baixar MP4" → esperar a duração do vídeo sem trocar de aba**;
- **3 sugestões de melhoria** concretas.

Se não for possível renderizar aqui (sem Chromium/ffmpeg), entregue só o .html com essas instruções.
