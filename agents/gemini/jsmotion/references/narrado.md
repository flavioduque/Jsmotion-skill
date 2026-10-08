# Vídeo narrado — tipografia cinética guiada pela voz

O modo "narrado" é o formato dos vídeos de 30–90 s que explicam, opinam ou contam um bastidor: **a voz conduz tudo**.
Cada palavra aparece no instante em que é falada, a palavra-chave acende na cor de destaque, e as cenas mudam quando a
fala muda de ideia. Por cima, uma interface fixa (HUD), brilho de luz (bloom), câmera que nunca para e som que abre
espaço para a voz. É o que separa "slide animado" de "produção de estúdio".

Use quando: o usuário manda uma referência narrada/com texto palavra por palavra · quer explicar um produto, serviço ou
ideia · conteúdo de autoridade (bastidor, opinião, tutorial) · vídeo com voz (dele ou gerada). Para catálogo/promoção
curta (produtos + preço + CTA), o encarte animado (cenas prontas do kit) continua melhor.

## 1. Roteiro narrado (a estrutura que segura até o fim)

Escreva para ser **falado**: frases curtas (5–12 palavras), uma ideia por frase, ritmo de conversa, sem jargão.
~2,5 palavras por segundo → 30 s ≈ 70 palavras · 60 s ≈ 140 · 90 s ≈ 210.

Modelos (escolha pelo objetivo; adapte, não copie as frases):

| Modelo | Estrutura | Bom para |
|---|---|---|
| **"E se eu te dissesse"** | pergunta provocativa → virada ("não é X") → revelação (nome/produto) → demonstração em 2–3 passos → objeção ("substitui Y?") → resposta honesta → palavra gigante → CTA de comentário | produto novo, ferramenta, serviço que surpreende |
| **Antes × depois** | a dor de hoje (concreta) → o custo dela → o que muda → prova (número real) → como começar → CTA | serviços, saúde, finanças, B2B |
| **Objeção → resposta** | "todo mundo acha que…" → por que está errado → o que funciona → exemplo → CTA | autoridade, educação, opinião |
| **Bastidor** | "como a gente faz X" → passo 1, 2, 3 (cada um com uma tela) → o detalhe que ninguém conta → resultado → CTA | marca pessoal, processos, cases |

Regras: gancho nos 2 primeiros segundos (a 1ª frase já tem de prender) · **um destaque por frase** (`*palavra*`) ·
um "momento gigante" no clímax (uma palavra só, tela cheia) · o CTA de comentário funciona melhor que "link na bio"
em Reels ("Comenta MOTION que eu te mando…") · números e nomes SEMPRE reais (site/material da marca).

### Marcação do texto (`narracao.txt`)

```
# comentários começam com #
[abertura] E se eu te dissesse que dá pra criar um *motion* desse nível
[pedido] só descrevendo o que você quer?
[virada] Sem *After Effects*. Sem timeline. Sem keyframe na mão.
[gigante] É bem *ABSURDO*.
[final] Comenta *MOTION* que eu te mando a skill.
```
- `[nome]` = **marcador de cena**: a cena do `SCRIPT` com `mark:'nome'` começa na palavra seguinte.
- `*palavra*` = destaque (pode cobrir várias: `*After Effects*`). Na voz, os marcadores e asteriscos somem.
- Linha em branco = pausa maior (só no modo sem voz).

**Mostre ao usuário o texto da narração (com o que aparece em cada marcador) e espere o "ok" ANTES de gerar a voz** —
gerar voz custa créditos e qualquer mudança no texto exige gerar de novo.

## 2. A voz → linha do tempo por palavra (`scripts/voice.py`)

**Qualidade da voz decide o vídeo.** Prioridade: ElevenLabs > gravação do usuário > sem voz. **Nunca** use voz
sintética gratuita/robótica (gTTS, espeak, voz do sistema) — sem ElevenLabs e sem gravação, faça o vídeo sem voz.

**Detectar e oferecer o ElevenLabs** (antes da pergunta da voz):
1. `python3 $SK/scripts/voice.py --check` → diz se há `ELEVENLABS_API_KEY` (e se o faster-whisper está instalado).
2. No agente, ferramentas do **conector ElevenLabs** (Claude: `creative_list_voices`, `creative_generate_speech`,
   `creative_get_flow_run_status`) também contam.
3. Nenhum dos dois → **ofereça**: "Se você tiver conta no ElevenLabs, dá para ter narração com voz profissional —
   conecte o ElevenLabs nos conectores do app, ou me passe a chave da API." Se ele não tiver, sua voz ou sem voz.

**Escolher a voz** (sugira 3, com prévia): idioma e sotaque do público (pt-BR, es-PY…), gênero/idade coerentes com a
marca, energia da direção de arte (premium → calma, grave; varejo → animada). Pela API: `voice.py --voices pt` lista
id, nome, características e o link da prévia. Pelo conector: `creative_list_voices` com `languages:['pt']`,
`use_cases:['social_media','advertisement','informative_educational']` e `descriptives` do tom.

**Gerar pelo conector ElevenLabs** (quando não há chave da API):
1. `creative_generate_speech` com o **texto limpo** (sem `[marcadores]` nem `*`), `model_id:'eleven_multilingual_v2'`
   (ou `eleven_v3` para direção de fala), a `voice_id` escolhida e `generations_count:1` (gasta créditos do usuário;
   use `estimate_only:true` antes se o texto for longo). Nunca chame de novo para "tentar outra vez" — cobra de novo.
2. Consulte `creative_get_flow_run_status` (esperando `poll_after_seconds`) até terminar; pegue o link do áudio gerado
   e baixe para `$WORK/voice/narracao_el.mp3`. Se o download for bloqueado no ambiente, peça ao usuário para baixar o
   áudio pelo link do flow (`url`) e anexar.
3. `python3 $SK/scripts/voice.py $WORK/narracao.txt --audio $WORK/voice/narracao_el.mp3` (alinha palavra por palavra).

| Situação | Comando | Sincronia |
|---|---|---|
| Chave da API do ElevenLabs no ambiente (`ELEVENLABS_API_KEY`) | `python3 $SK/scripts/voice.py narracao.txt --elevenlabs <VOICE_ID>` | exata (tempo de cada letra devolvido pela API) |
| Voz pronta: gravada pelo usuário, ou gerada em outra ferramenta (ex.: conector ElevenLabs do claude.ai — liste as vozes, gere com o texto limpo, baixe o MP3) | `python3 $SK/scripts/voice.py narracao.txt --audio voz.mp3` | palavra a palavra com faster-whisper (`install_watch.sh --voz`); sem ele, aproximada pela energia do áudio |
| Sem voz (texto cinético no ritmo da trilha) | `python3 $SK/scripts/voice.py narracao.txt --estimate [--wpm 160]` | estimada |

Saída: `$WORK/voice/words.json` (+ `narracao.mp3`). O script lista cada marcador com o instante em que começa —
confira se batem com a fala. Se a voz foi gerada fora, o TEXTO falado tem de ser o mesmo do `narracao.txt`
(o alinhamento compara palavra por palavra; palavras não reconhecidas recebem tempo proporcional).
Voz do usuário (gravação no celular): peça num lugar silencioso, sem música, falando no ritmo natural.
Escolha da voz gerada: tom e sotaque do público (pt-BR, es-PY…), energia coerente com a direção de arte.

No `config.json` do `prep_assets.py`: `"voice": "$WORK/voice/words.json"` — a voz (MP3) entra no HTML.

## 3. As cenas no `SCRIPT`

Cada cena com `mark:'nome'` começa ~0,15 s antes da 1ª palavra do seu marcador e dura até a próxima cena marcada
(`dur` é ignorado nessas). A última cena vai até a voz terminar + 1,2 s (ou `dur`, se maior). Cenas **sem** `mark`
usam `dur` normal (ex.: um respiro só com imagem entre duas falas). Todas as cenas prontas do kit aceitam `mark`.
Cada cena com `mark` recebe `s.words` = as palavras do seu trecho, com tempo local (`{w, t, t1, hl}`).

| type | Para quê | Campos |
|---|---|---|
| `fala` | o texto do trecho entrando palavra por palavra (o "padrão" do narrado) | `preset`, `size`, `y` (0–1), `eyebrow`, `photo` (fundo escurecido), `upper`, `ghost` (0–0,3: palavras futuras apagadas), `breaks` (`'sentence'` padrão · `'lines'` = quebras do narracao.txt · `false`) |
| `gigante` | a palavra-chave (última `*destacada*` do trecho, ou `word`) ocupando a tela, com subida de som + impacto + aberração | `word`, `upper` (padrão true), `photo` |
| `caixa` | campo de pedido/busca sendo digitado (demonstração de produto, IA, busca, chat) | `text` (o que é digitado), `from`/`to` (segundos da cena), `label`, `h`, `size` |
| `contador` | anel que se completa enquanto o número sobe — provas, prazos, resultados | `value`, `from`, `prefix`, `suffix`, `decimals`, `label`, `countAt`, `countDur` |

Sem voz, `fala`/`gigante` também aceitam `text:'… *destaque* …'` (tempos estimados a partir de `wordsAt`).

**Ritmo visual:** uma mudança na tela a cada ~0,5–1 s (é a própria entrada das palavras) e uma cena nova a cada
3–6 s. Misture: `fala` → `caixa`/`contador`/cena própria da marca (mostrar, não só dizer) → `fala` → `gigante` → CTA.
As metáforas do tema (cenas próprias, `references/kit.md`) continuam obrigatórias — use `kwords()` dentro delas para
o texto falado aparecer junto da imagem.

### `kwords(ctx, words, lt, o)` — o motor de tipografia cinética
Desenha `words` no espaço de 1080 de largura (use dentro de `T()` ou `Tc()`), quebra as linhas sozinho, reduz a fonte
se passar de `maxLines`, e anima cada palavra no seu instante. `o`: `preset`, `size`, `y`, `maxw`, `align`, `x`,
`color`, `ghost`, `breaks`, `upper`, `font:(w,size)=>css` (fonte por palavra).
`Tc(ctx, yFração, fn)` = bloco centralizado em todos os formatos (no 16:9 o texto narrado fica no centro, com
`KW` de largura útil). `at('marcador', k)` = instante (s) da k-ésima palavra depois do marcador.

### Presets de entrada (`STYLE.kinetic.preset` ou por cena)
| preset | Efeito | Combina com |
|---|---|---|
| `blurIn` | desfoque → nítido, leve escala | quase tudo; premium, tech |
| `rise` | sobe por trás de uma máscara | editorial, institucional |
| `pop` | escala com rebote | varejo, jovem, energético |
| `decode` | letras embaralhadas que "decodificam" | tech, dados, segurança, IA |
| `type` | máquina de escrever com cursor | terminal, chat, bastidor |
| `stretch` | estica e assenta | esporte, impacto, moda |

## 4. Acabamento de estúdio (tokens do `STYLE`)

```js
kinetic: { preset:'blurIn', size:110, upper:false, ghost:0, maxLines:4, breaks:'sentence' },
post:    { bloom:0.6, radius:28, threshold:0.8, contrast:2.6, ca:0.6, caBase:0, sweep:true },
hud:     { label:'MARCA', rec:true, corners:true, grid:0.04, meta:'TEXTO PEQUENO', right:null, color:null, alpha:0.75 },
camera:  0.04,
sound:   { mood:'premium', bpm:100, duck:0.3, voice:1.0, wordTicks:false },
```
- **post.bloom** (0–1): a luz "vaza" do que já é claro. Forte em fundo escuro (0,5–0,9); em fundo claro o kit reduz
  sozinho. **post.ca**: aberração cromática nos impactos (gigante, gancho, final). **post.sweep**: varredura de luz
  no começo de cada cena. Grão e vinheta continuam em `texture`/`vignette`.
- **hud**: código da cena (`MARCA / 003`), timecode `REC`, cantos, grade e rótulos em fonte mono
  (`get_font.py "JetBrains Mono" --role mono`, ou outra mono da direção). Dá a sensação de "sistema", ótimo para
  tech/IA/dados/bastidor; para marcas suaves (moda, gastronomia, saúde acolhedora) desligue ou use só `corners`.
  `hud:false` numa cena esconde o HUD nela.
- **camera**: aproximação lenta e contínua em toda cena (`cam` por cena; 0 = parada). Nunca deixe a tela 100% parada.
- **sound.duck**: volume da trilha enquanto alguém fala (0,25–0,4). A voz entra por cima, sem compressão da trilha.
  `wordTicks`: tique sutil em cada palavra (bom com `type`/`decode`). Antes de cada `gigante` o kit põe uma subida
  (riser) e um impacto.

## 5. Prévia, desfoque de movimento e revisão

- **Prévia rápida (animatic):** `pack.py … --formats 9x16 --draft` → `<nome>_9x16_previa.mp4` (metade da resolução,
  15 fps, ~4× mais rápido). Mande ao usuário para aprovar ritmo e sincronia ANTES do render final.
- **Render final:** `pack.py … --mb 3` = desfoque de movimento (3 subquadros por quadro; ~3× mais lento). Use no
  final quando houver tempo; sem `--mb` o render é o normal.
- **Revisão:** fotografe com `snap.py` os instantes de cada marcador + 0,5 s e + 1,5 s (o `voice.py` imprime os
  tempos), o meio do `gigante` e o final. Procure: palavra cortada na borda, linha longa demais (máx. 4 linhas),
  destaque fora do lugar, cena trocando no meio de uma frase (marcador mal posto), HUD cobrindo texto.
- **Sincronia (opcional):** transcreva o MP4 final com faster-whisper e compare os instantes com o `words.json`.

## 6. Checklist do narrado
1. Texto da narração aprovado antes da voz · 2. 1ª frase prende em 2 s · 3. um destaque por frase ·
4. mostrar além de dizer (caixa, contador, metáforas, fotos reais) a cada 2–3 falas · 5. um momento gigante ·
6. câmera viva, HUD e brilho coerentes com a direção (não por padrão) · 7. trilha abaixa sob a voz ·
8. CTA falado E escrito na tela · 9. legível no celular (fala: 90–130 px no desenho 9:16) · 10. prévia aprovada antes do render final.
