# Vídeo narrado — tipografia cinética guiada pela voz

O modo "narrado" é o formato dos vídeos de 30–90 s que explicam, opinam ou contam um bastidor: **a voz conduz tudo**.
Cada palavra aparece no instante em que é falada, a palavra-chave acende no tom de destaque, e as cenas mudam quando a
fala muda de ideia. Câmera que nunca para e som que abre espaço para a voz. É o que separa "slide animado" de "produção de estúdio".

Use quando: o usuário manda uma referência narrada/com texto palavra por palavra · quer explicar um produto, serviço ou
ideia · conteúdo de autoridade (bastidor, opinião, tutorial) · vídeo com voz (dele ou gerada). Para catálogo/promoção
curta (produtos + preço + CTA), o encarte animado continua melhor.

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
- `{exibido|falado}` = o que aparece na tela × o que a voz fala — números, telefones, siglas:
  `*{24 horas|vinte e quatro horas}*` · `{(45) 99928-9200|quarenta e cinco, nove nove nove dois oito, nove dois zero zero}`.
  Gere a voz com o texto FALADO (o `voice.py` imprime/usa a versão falada) e alinhe com `--audio`; a tela mostra o exibido.
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

Leve para o projeto: `python3 $SK/scripts/assets.py voice $WORK/video $WORK/voice/words.json` (a voz vai para
`public/voz.mp3` e as palavras para `src/words.json`; o `<Soundtrack>` toca a voz no instante certo).

## 3. As cenas no `Video.tsx` (Remotion)

O `words.json` traz cada palavra com `t0`/`t1` (segundos na linha do tempo), `hl` (veio de `*destaque*`) e os
marcadores `[nome]` → índice da palavra. No código (`src/kit.tsx`):

- `mark('virada')` = instante do marcador · `wordAt(i)` = instante da palavra i · `find('fronteira', depoisDe)` = índice
  da palavra (sem contar à mão). Cada `<Scene a={…} b={…}>` começa ~0,15 s antes da 1ª palavra do seu trecho e vai até
  a próxima cena.
- `<Say t i0={find('Paraguai')} i1={find('2025')} y={0.4} />` = o trecho falado entrando palavra por palavra, com os
  destaques no degradê da marca. `<Words lines=…>` quando você quer escolher as palavras exibidas (ex.: só
  "MILHARES DE KM" de uma frase longa) — sempre com os instantes da fala.
- `preset`: `rise` (sobe + desfoque; premium, institucional) · `pop` (escala com rebote; varejo, energético) ·
  `type` (máquina de escrever; bastidor, chat).
- **Momento gigante**: uma palavra só, tela cheia (`<Words size={220}>` ou `<Counter>` para número), com `shake` e
  `<Flash>` no instante e um impacto no `sfx`.
- **Mostrar além de dizer**: a cada 2–3 falas, mídia real (`Converge`, `Orbit`, `Expand`, `Wall`) ou uma cena própria
  da metáfora do tema, com o texto falado junto.

**Ritmo visual:** uma mudança na tela a cada ~0,5–1 s (a própria entrada das palavras) e uma cena nova a cada 3–6 s.

## 4. Som

- **Trilha:** faixa real (`music.py`: ElevenLabs Music com a duração exata, faixa do usuário ou biblioteca grátis) →
  `assets.py music`. O `<Soundtrack music="trilha.mp3">` abaixa a trilha sob a voz (`STYLE.music.duck`, 0,3–0,6) e
  faz o fade final.
- **Efeitos** (`sfx`): whoosh nas trocas de cena, impacto nos números e no momento gigante, subida (riser) antes dele.
  Use arquivos reais (biblioteca grátis com uso comercial) em `public/sfx/`.

## 5. Prévia e revisão

- **Folha de revisão:** `render.py $WORK/video <nome> --stills …` com os instantes de cada marcador + 0,5 s e + 1,5 s
  (o `voice.py` imprime os tempos), o meio do momento gigante e o final. Procure: palavra cortada na borda, linha
  longa demais (máx. 4 linhas), destaque fora do lugar, cena trocando no meio de uma frase.
- **Prévia rápida:** `render.py $WORK/video <nome> --formats 9x16 --draft` → `<nome>_9x16_previa.mp4` (meia resolução).
  Mande ao usuário para aprovar ritmo e sincronia ANTES do render final.
- **Sincronia (opcional):** transcreva o MP4 final com faster-whisper e compare os instantes com o `words.json`.

## 6. Checklist do narrado
1. Texto da narração aprovado antes da voz · 2. 1ª frase prende em 2 s · 3. um destaque por frase ·
4. mostrar além de dizer (mídia real, contador, metáforas) a cada 2–3 falas · 5. um momento gigante ·
6. câmera viva (zoom lento nas mídias) · 7. trilha abaixa sob a voz · 8. CTA falado E escrito na tela ·
9. legível no celular (fala: 90–130 px no desenho 9:16) · 10. prévia aprovada antes do render final.
