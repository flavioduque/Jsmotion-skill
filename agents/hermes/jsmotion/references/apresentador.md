# Modo apresentador — editar o vídeo de alguém falando

Para quando o material principal é uma **pessoa falando para a câmera**: gravação do cliente, depoimento, aula, ou
**avatar** (HeyGen e afins). A fala já existe; o trabalho é fazer a imagem conduzir a compreensão dela — legenda,
cartões com o que a pessoa menciona, 3D de impacto, imagens de apoio e um final acionável — sem nunca perder o rosto.

Peças prontas: `src/presenter.tsx` (`Presenter`, `Captions`, `Clip`, `layout`, `boxes`), `src/three.tsx` (3D),
`scripts/face_track.py` (rosto). Leia também `lettering.md` e `motion-explicativo.md`.

## 1. Preparar (antes do roteiro de edição)

```bash
bash $SK/scripts/install_watch.sh --apresentador                 # OpenCV (rosto) + faster-whisper (fala)
python3 $SK/scripts/assets.py presenter $WORK/video pessoa.mp4    # → media/apresentador.mp4 (mudo) + src/face.json
ffmpeg -i pessoa.mp4 -vn -c:a libmp3lame -q:a 2 $WORK/voz.mp3
python3 $SK/scripts/voice.py --transcribe $WORK/voz.mp3 --out $WORK/fala.txt   # (pule se houver o roteiro exato)
python3 $SK/scripts/voice.py $WORK/fala.txt --audio $WORK/voz.mp3 --lead 0     # linha do tempo por palavra
python3 $SK/scripts/assets.py voice $WORK/video $WORK/voice/words.json
```
- **Assista ao vídeo inteiro e ouça o áudio** antes de desenhar a edição. Avatar (HeyGen…) feito de um roteiro seu?
  Use o roteiro como `fala.txt`. Senão, transcreva e **revise nomes, números, siglas e negações** contra o áudio
  ("Paraguai o lançou" → "paraguaio lançou"); a transcrição automática erra justamente onde a legenda mais aparece.
  `--lead 0`: a fala começa onde começa no arquivo. Marque `*destaques*` e `[marcadores]` no texto como no narrado.
- O tempo da edição = o tempo do arquivo original, salvo se você cortar. **Cortou ou mudou a velocidade?** Converta os
  tempos antes de consultar o `face.json` e o `words.json` (os dois estão no tempo do arquivo original).
- Confira a linha `🙂 rosto em N de M amostras`: abaixo de ~60%, olhe a folha de revisão com atenção (perfil, mão no
  rosto, pouca luz). Onde não há rosto, o `Presenter` mantém o último trecho bom — nunca salta para o centro.

## 2. Direção de edição (o roteiro de edição que o usuário aprova)

Separe a fala em **unidades de sentido** (não em intervalos iguais). Para cada uma, decida e escreva no roteiro:
- **O que entender** — a conclusão concreta para quem assiste.
- **O que olhar** — pessoa, objeto, ação, prova ou palavra que transmite essa conclusão.
- **O que muda** — a transformação visível que acompanha a ideia (se houver; nem toda frase pede inserção).
- **O que permanece** — voz, objeto, posição ou enquadramento que liga a próxima cena.

Sem função clara para uma inserção, **deixe a pessoa**. Trocar o layout a cada frase não é objetivo.

| Intenção da fala | Escolha de cena | Funcionou quando… |
|---|---|---|
| Confiança, opinião, relato, gancho, convite | Pessoa em **tela cheia** (F), enquadramento estável | a expressão é percebida sem texto disputando |
| Explicar um procedimento | Objeto/esquema grande, **uma ação por etapa**; pessoa em moldura (M) ou fora (O) | ação e efeito aparecem na mesma sequência |
| Comparar | Mesmo enquadramento e mesma escala para os dois lados | a diferença aparece sem legenda explicativa |
| Revelar um resultado/número | O resultado é o protagonista (O = tela toda para ele) | dá para ler o resultado antes da próxima troca |
| Conectar ideias | O mesmo elemento muda de estado (documento que percorre etapas) | a relação aparece sem reapresentar tudo |

Cena cheia demais (pessoa + título + cartões + ícones + legenda brigando)? Ache o elemento que carrega a ideia
**daquele instante**, aumente-o, adie o que é da próxima frase e tire o que repete a mesma mensagem. Liberar espaço
não é deixar fundo vazio: o espaço liberado vai para o que importa.

O roteiro de edição mostra, por trecho: tempo (da fala real), composição (F/M/O), o que entra na tela, de onde vem
cada imagem (filmagem do cliente, gerada, 3D) e o som. **Espere o "ok"** antes de gerar qualquer mídia paga.

## 3. Composição: F · M · O

- `KEYS: Keys = [[0,'F'], [4.5,'F'], [5.3,'M'], …, [99,'F']]` — pares instante→estado; dois iguais seguidos =
  estado parado; diferentes = transição (~0,6–0,8 s, easing in-out). Mude no fim de uma frase, nunca no meio da palavra.
- **F** quando expressão e confiança carregam a mensagem; **M** quando pessoa e explicação precisam ser vistas juntas;
  **O** quando a demonstração precisa da tela toda (a voz continua conduzindo).
- `boxes(W, H)` dá caixas padrão por formato (vertical: moldura embaixo; quadrado/horizontal: coluna à direita).
  Passe `B` próprio se o layout pedir; reserve **áreas distintas** para rosto, explicação e legenda.
- O recorte é **recalculado a cada quadro**: `s = max(caixa.w/origem.w, caixa.h/origem.h) × push`; janela centrada no
  rosto, com o rosto a `head` (36%) da altura — sobra espaço acima da cabeça. Animar só a caixa, sem recalcular o
  recorte, desloca o rosto e corta a testa no meio da transição.
- Se a janela não comporta cabeça + gestos que importam, nenhuma posição resolve: diminua o push, mude a caixa ou use a
  imagem inteira com fundo de apoio. **Nunca** comprima a largura da pessoa.
- `push` (aproximação lenta) só em 1–2 momentos de ênfase (gancho, pergunta final), 5–6%. Zoom contínuo e
  reenquadramento nervoso como "preenchimento" cansam e parecem erro.
- Moldura: borda e brilho na cor de destaque, nome/cargo no rodapé (`label`), sombra para separar do fundo.

## 4. Legenda (`Captions`)

- Frase da vez (quebra em `. ? !` e em vírgula depois de 3+ palavras, no máximo 6), **palavra falada no destaque**,
  palavras ainda não ditas apagadas. Caixa alta, sombra forte, ≥ 40 px no 1080.
- **Faixa própria em cada composição** (`bands`): em F embaixo do peito; em M acima da moldura; em O no rodapé. Nunca
  em cima do rosto nem da explicação.
- **Some durante as transições de composição** (texto não "viaja" com a moldura) e nos trechos em que o lettering/3D
  já mostra as mesmas palavras (`mute={[[a, b]]}`) — dois blocos grandes com a mesma frase brigam com o rosto.
- Termos com grafia certa: confira nomes próprios, números e siglas contra o áudio (a transcrição automática erra).

## 5. Imagens de apoio (atrás da explicação)

1. **Filmagem/fotos reais do cliente primeiro.** Trecho curto? Reaproveite com `rate` 0,45–0,6 (câmera lenta) e
   recortes diferentes (`s`, `o`) — não parece repetido.
2. **Gerar vídeo (ElevenLabs/Seedance, Higgsfield, Magnific…) só quando:** o usuário autorizou o gasto, a cena é
   genérica e não finge ser um lugar/pessoa real (mãos com chaves, contrato sendo assinado, notebook com formulário),
   ou parte de uma **referência real** dele. Antes de gerar: estimativa de custo (`estimate_only`/simulação) e diga o
   valor; respeite o teto aprovado (5 s em vez de 6 s se passar). Confira cada clipe gerado: plano inventado sai.
   Serviço bloqueado ou sem saldo: diga, não troque de serviço pago sem autorização.
3. `Clip` escurece o fundo (`dim` 0,3–0,55) e põe vinheta: o texto respira por cima. Comece o clipe no instante da
   ideia (`a`), não antes.

## 6. Recorte alfa (pessoa na frente do texto) — só se for real

Texto atrás da pessoa ou troca de fundo exigem **silhueta verdadeira** (vídeo com canal alfa / máscara por quadro de
uma ferramenta de segmentação que funcione aqui). Máscara oval/retangular ou ordem de camadas sem silhueta **não** é
remoção de fundo. Teste ~5 s com cabelo, mãos e movimento, sobre fundo claro e escuro: cabelo e dedos inteiros, sem
buracos, sem borda pulsando, sem halo. Não passou? Use moldura com o fundo original e diga o limite — não esconda com
brilho ou desfoque. MP4 H.264 não guarda alfa: mantenha a camada em formato com alfa e entregue já composto.

## 7. Final e revisão

- Final acionável **sem a pessoa** ou com ela pequena: logo, assinatura, CTA da fala (ex.: "comente X"), WhatsApp em
  pílula, "CLIQUE AQUI" + seta animada para baixo (aponta para o botão/legenda da rede). 3–4 s, tudo legível.
- Folha de revisão com: entrada e saída de cada moldura (meio da transição incluído), o maior gesto, a maior
  inclinação de cabeça, cada inserção e o final. A cabeça mantém folga; gestos com significado continuam visíveis.
- Prévia (`--draft`) para ver **em movimento**: uma coleção de quadros bons ainda esconde trajetória ruim entre eles.
- Vídeo longo (> 30 s) com 3D: o `render.py` renderiza em blocos e retoma sozinho se a máquina reiniciar — avise o
  tempo antes (o 3D sem GPU é lento: ~4–6 min a cada 8 s de vídeo, mais uma passada do áudio).
