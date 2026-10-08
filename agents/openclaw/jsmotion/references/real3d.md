# Modo MÍDIA REAL + 3D

Vídeo feito de **mídia real da marca** (clipes, renders, fotos animadas a partir de referências reais) em tela cheia,
com narração, legendas da fala e **3D de verdade só onde ele soma**: palavras-chave, números e chamadas. É o modo para
imóveis, produtos físicos, lugares, eventos — tudo o que o cliente precisa VER de verdade.

Motor: `scripts/real3d.py` + `templates/real3d/` (Remotion + three.js). O 3D é texto extrudado de verdade
(chanfro, luz que passeia, brilho metálico), não camadas de CSS empilhadas.

## Regras de ouro (aprendidas na prática — não negocie)

1. **Só referências reais.** Tudo o que aparece é do cliente: clipes, renders, fotos, logo, foto da pessoa. Nunca
   invente lugar, ponte, cidade, pessoa, escritório ou "plano de contexto" que o cliente não mandou.
2. **IA de vídeo só a partir das referências reais** (ex.: Seedance com os quadros dos clipes e a foto da pessoa como
   referência). No prompt, descreva só o que está nas referências; nada de "investidor no escritório" ou "vista aérea
   da cidade". Depois de gerar, **ache cada corte** e confira plano a plano (ver "Clipes gerados por IA").
3. **Narração/plano aprovados antes de produzir** (texto exato + o que aparece em cada trecho). Mudou o texto → voz nova.
4. **Dados verificados.** Números da narração (crescimento, preços, quantidades) vêm do cliente ou de fonte pública
   citada; mostre a fonte ao usuário antes de gravar a voz. Na dúvida, pergunte.
5. **3D com moderação:** só palavras-chave, números (com contador) e gráficos simples. Nunca 3D recriando cenário
   (prédio, ponte, cidade) — a mídia real faz esse papel.
6. **Nada cobre o rosto da pessoa nem a chamada final**: o 3D para antes do CTA.
7. **Não refaça o que já foi aprovado/entregue**; confira as saídas existentes antes de renderizar de novo.

## Passo a passo

### 1. Mídia
- Liste os clipes com `ffprobe` (resolução, duração). Para tela cheia 9:16 cada clipe precisa de ~1080×1920.
  Clipe horizontal/baixo (ex.: 1280×402): faça **upscale fiel** (Topaz pelo Higgsfield/Magnific — ele não recria a
  imagem) e depois recorte a janela vertical **corrigindo a proporção** (o Topaz pode esticar: redimensione para a
  proporção original antes de recortar). Um pan lateral lento no recorte dá movimento de câmera de graça:
  `scale=W:1920,crop=1080:1920:'(iw-1080)*(0.30+0.32*t/DUR)':0`.
- Clipe com faixa preta/marca d'água ("Veo" etc.): recorte fora; se for o mesmo plano de outro clipe, descarte.
- Sem mídia suficiente para a duração: peça mais material (renders do brochure, fotos, drone) antes de repetir demais.

### 2. Clipes gerados por IA (opcional, gasta créditos)
- Antes: `simulate_cost` / preço do conector, e **pergunte ao usuário** mostrando o custo e o saldo.
- Referências: quadros reais (`ffmpeg -ss 3.5 -i clipe.mp4 -frames:v 1 ref.jpg`) + foto da pessoa como `character`.
  Referências de vídeo podem falhar sem motivo e custam mais; quadros funcionam.
- Depois de gerar, ache os cortes: `ffmpeg -i ia.mp4 -vf "select='gt(scene,0.25)',showinfo" -an -f null - 2>&1 | grep pts_time`
  e veja um quadro de cada plano. Use só os planos fiéis às referências e corte **com folga** (≥ 0,1 s longe de cada
  corte) — senão aparece "uma cena errada por frações de segundo".

### 3. Voz e tempos
`python3 $SK/scripts/voice.py narracao.txt --audio voz.mp3 --lead 0.3` (voz gerada no conector ElevenLabs ou gravada).
As legendas saem do **texto aprovado** (não do reconhecimento de fala), já sincronizadas.

### 4. Spec (`real3d.json`)
Formato completo em `python3 $SK/scripts/real3d.py` (sem argumentos). Pontos de atenção:
- `clips`: `at` (quando entra), `dur`, `from` (de onde começa no arquivo). Sem buracos entre clipes; o script avisa
  buraco preto e clipe curto demais.
- `keywords`: 1–2 linhas curtas (ideal ≤ 13 letras por linha), ancoradas na palavra falada (`"word"`), no marcador
  (`"mark"`) ou no tempo (`"at"`). Cada uma entra ~0,1 s antes da palavra e **sai no fim da frase** (máx. 4,5 s).
  Números: `"counter": {"from":0, "to":6.6, "dec":1, "pre":"+", "suf":"%"}` (a 1ª linha vira o contador).
- `intro` (logo real por ~4 s), `header` (logo pequena), `band` (assinatura fixa: logo da imobiliária/empresa,
  assinatura, telefone), `cta` (texto + botão com o contato).
- `colors` e `fonts` vêm da direção de arte (`estilo.md`); fontes = qualquer família do Google Fonts com o peso
  (`"Montserrat:800"`), baixadas automaticamente.

### 5. Revisão e render
```bash
python3 $SK/scripts/real3d.py real3d.json --setup                       # 1ª vez (npm, ~1 min)
python3 $SK/scripts/real3d.py real3d.json --still 1.5,5,9,12,16,20,24,28,32,36,40   # → $WORK/real3d/review.jpg
python3 $SK/scripts/real3d.py real3d.json --name <nome>                 # → $OUT/<nome>_9x16.mp4 (−14 LUFS)
```
Veja a folha de revisão: palavra 3D cortada na borda, 3D por cima de rosto/CTA, legenda tampada, quadro preto, plano
inventado. O render leva ~1 min a cada 3 s de vídeo com 2 núcleos (WebGL por software) — rode em segundo plano e
acompanhe o log. Envie uma versão comprimida (`-crf 23`) se o arquivo passar do limite de envio.

## Problemas conhecidos (já resolvidos no template)
- `Text3D`/`Center` do drei ficavam invisíveis no render → o template usa `TextGeometry` do three-stdlib direto e
  centraliza pelas larguras dos glifos.
- Fontes 3D: WOFF do @fontsource convertido para typeface JSON (`scripts/tofont.cjs`); o subconjunto latin já tem
  acentos (Ô, Ç, Ã) e %.
- Sem GPU: `swangle` (WebGL por software) no `remotion.config.ts`.
