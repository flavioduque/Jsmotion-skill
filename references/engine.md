# Anatomia do motor (templates/example_anim.js)

Tudo é desenhado por `render(ctx, t)` (t em segundos). Ordem por quadro:
`drawBackground` → cenas (`scene1..6`) → `drawSpark` (elemento condutor) → `transitions` → `drawNoise` → fade-in inicial.

## Globais que o shell/render usam
`W, H, DUR, FPS` (obrigatórios), `render(ctx,t)`, `buildAudio(ctx, dest)`, `loadAssets()`, `clamp`.
`W, H` vêm de `window.FORMAT` (`9x16` padrão · `4x5` · `1x1` · `16x9`); `CX, CY, M` (maior lado) e `SIDE` (16:9) derivam deles.

## Palco (multiformato)
- `blk(ctx, 'media'|'text'|'center', y, {slot|s}, fn)`: desenha `fn` no espaço 1080×1920 e encaixa no formato
  (identidade no 9:16; escala na área segura no 4:5/1:1; colunas no 16:9). Detalhes em `formats.md`.
- `toCanvas(x,y)`: ponto do desenho → ponto da tela. `sparkD(t)` = condutor no desenho; `sparkPos(t)` = na tela.
- `SS`: escala do condutor · `RFL`: raio dos clarões (1500 no 9:16, proporcional à diagonal nos outros).
O shell define `renderFrame(t)`, `getWav()` e `window.READY` — usados por snap.py e render.py.

## Blocos reutilizáveis
- Easing: `eOut, eIn, eIO, eBack`; tempo relativo: `inv(a,b,t)` (0→1 entre a e b).
- `rng(seed)`: aleatório determinístico (obrigatório: o vídeo precisa sair igual em todo render).
- `beatPulse(t)`: 1 no começo de cada batida (0,5s) e cai rápido — use para pulsar anéis, brilhos, botão.
- `glow(ctx,x,y,r,cor,alpha)`: luz desfocada (gradiente radial; barato).
- `word(ctx, texto, x, y, t, t0, {size, weight, hl, out, outDur, fromScale, color, align})`:
  entrada com desfoque + escala; `hl:true` = palavra em destaque (gradiente + brilho pulsando).
  `out` = instante de saída. Multiplica o `globalAlpha` atual (fades de cena funcionam).
- `ring(...)`: anel de luz. `glassFrame(ctx,img,x,y,w,h,{bar, sheen, lit, r})`: janela de vidro
  (bar = barra de navegador; sheen = reflexo passando 0→1; lit = borda acende quando o condutor chega).
- `seqFrame(chave, tempoLocal)`: quadro do clipe de vídeo (sequência 15 fps de prep_assets).
- `sparkPos(t)` + `SPARK_KEYS [[t,x,y],...]`: caminho suave (Catmull-Rom) do elemento condutor;
  faça-o visitar cada tela no momento em que ela entra.
- `transitions`: `flash(tc, dur, cor, max)` = clarão a partir do condutor; bloco final = onda líquida.

## Linha do tempo compartilhada (sincronia som/imagem)
`WORDS` (instante de cada palavra → som de "brilho"), `WH` (whooshes, tocados 0,35s antes),
`IMPACT` (graves nos momentos-chave). Sempre que mudar tempos de cena, atualize essas listas.

## Som (buildAudio)
120 BPM. Pad (acordes Am–F–C–G a cada 2s), kick em toda batida após o gancho, hi-hat em semicolcheias,
palma a cada 1s, baixo em colcheias, arpejo nas cenas centrais, brilhos, whooshes, riser antes do
1º impacto, pausa curta antes do final, acorde final e fade-out. Tudo gerado no OfflineAudioContext
e tocado como um buffer — por isso a gravação no navegador e o MP4 daqui soam iguais.
No MP4, o `render.py` ainda **masteriza** o áudio: ganho + limitador com superamostragem até −14 LUFS (padrão de
Instagram/TikTok/YouTube) com pico real < −1,5 dBTP. Não tente "compensar" volume no `buildAudio`: mantenha a mixagem
equilibrada (pico do master perto de −1 dB) e deixe o render cuidar do volume final. `--no-norm` desliga.
Para "épico": troque pad por cordas graves (saw + lowpass 600Hz), kick mais longo, impactos a cada 4s.
Para "minimalista": remova pad/baixo/arpejo, mantenha brilhos, whooshes, impactos e um tique suave por batida.

## Assets
`window.ASSETS = {logo, projects:{k:dataURI}, seq:{k:[dataURI...]}, font}` → carregados em `IMG`.
`IMG.proj[k]` (imagens), `IMG.seq[k]` (quadros), `IMG.logo`, `IMG.noise`, `IMG.dust`.
