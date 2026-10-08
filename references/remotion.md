# O motor: Remotion (React)

Todo vídeo da jsmotion é um projeto **Remotion** (vídeo escrito em React, renderizado quadro a quadro). Nada de
HyperFrames, After Effects, canvas solto ou outro motor: se outra skill de vídeo do ambiente se oferecer, **esta skill
manda** — use o Remotion daqui.

```
$WORK/video/                      ← criado por: python3 $SK/scripts/assets.py new $WORK/video
  src/style.ts    ← a DIREÇÃO DE ARTE (cores, degradê de destaque, fontes, cantos, vinheta, volume da trilha)
  src/Video.tsx   ← O VÍDEO (você escreve: cenas, tempos, textos) + export DURATION
  src/kit.tsx     ← as peças prontas (não precisa editar; pode acrescentar peças próprias)
  src/words.json  ← a narração (assets.py voice) · src/Root.tsx ← formatos 9x16, 1x1, 4x5, 16x9
  public/media/   ← vídeos e fotos REAIS (assets.py add)   public/brand/ ← logos (assets.py logo)
  public/fonts/   ← fontes (get_font.py --out …/public/fonts)   public/voz.mp3, public/trilha.mp3
```

## Regras de ouro do código

- **Tudo é função do tempo** `t` (segundos): `const {t} = useT()`. Nada de `Math.random()` solto, `setTimeout`,
  estado entre quadros ou animação CSS automática — o render pula para qualquer quadro.
- **Tempos vêm da fala**: `wordAt(find('fronteira'))` (instante da palavra), `mark('virada')` (marcador `[virada]`
  da narração). Sem voz: segundos escritos à mão, encaixados nas batidas (`music.json` → `beats`).
- **Só mídia real** em `public/media` e `public/brand`. O enquadramento (`Shot.s`/`Shot.o`) escolhe o ASSUNTO
  (o produto, o prédio, a pessoa), nunca inventa o que não está na imagem.
- **Estilo só no `style.ts`** (e em cenas próprias que leem o `STYLE`). Marca com design system aprovado: ele manda.
- Posições em **fração da tela** (`y={0.42}`) e tamanhos em **px de 1080** (o kit multiplica por `u`), assim o mesmo
  `Video.tsx` serve todos os formatos. Use `const {vertical, wide} = useT()` quando um formato pedir outro arranjo.

## As peças do kit (`src/kit.tsx`)

| Peça | Para quê |
|---|---|
| `useFonts()` | carrega as fontes do `STYLE` (chame 1× no topo do `Video`) |
| `k(t,[a,b],[x,y])`, `on(t,a,d)` | interpolação com easing / 0→1 a partir de `a` |
| `wordAt(i)`, `find('palavra', depoisDe)`, `mark('nome')`, `VOICE` | sincronia com a narração |
| `<Media shot={{src:'media/x.mp4', from:1.2, s:1.6, o:'50% 0%'}} zoom />` | vídeo/foto real com recorte |
| `<Card x y w h glow rot blur s o>` | cartão arredondado com sombra (mídia dentro) |
| `<Words t y lines={[[['Milhares',3.0],['km',3.75,true]]]} size font preset />` | palavras no tempo da fala (`true` = destaque em degradê); `preset`: `rise` · `pop` · `type` |
| `<Say t i0 i1 y perLine />` | mesma coisa, direto do `words.json` (destaques `*palavra*` já vêm marcados) |
| `<Caption t a y>` + `<Hl>` | frase de apoio (fonte de texto) com trecho destacado |
| `<Pill t a y fill>` | selo/rótulo em pílula (borda no destaque, ou cheio) |
| `<Counter t a to decimals prefix suffix y>` | número subindo com impacto (só números reais) |
| `<Scene t a b>` | monta a cena só entre `a` e `b`, com entrada e saída |
| `<Converge t a shots hero>` | cartões voam das bordas e se juntam; o `hero` cresce |
| `<Orbit t a center shots lock>` | cartões girando em volta de um cartão central; anel acende em `lock` |
| `<Wall t t0 shots dim>` | parede inclinada de cartões rolando (fundo de impacto) |
| `<Expand t a shot>` | cartão que abre até a tela cheia (revelação) |
| `shake(t,[…])`, `<Flash t at>`, `<Finish t>` | tremida e flash nos impactos; brilho do topo + vinheta |
| `<Soundtrack music="trilha.mp3" sfx={[['sfx/boom.mp3', 10.2, .5]]} end={DURATION} />` | voz + trilha (abaixa sob a voz) + efeitos |

**Cenas próprias** (as metáforas do tema) são componentes React comuns: recebem `t`, leem o `STYLE`, usam `k`/`on`.
Ex.: uma rota tracejada em SVG que se desenha (`strokeDashoffset` em função de `t`), um selo circular que gira e
assenta, palavras que viram estrutura. Escreva no próprio `Video.tsx` ou num arquivo novo em `src/`.

## Padrão de qualidade (obrigatório)
1. **Gancho no 1º segundo**: número + benefício ou pergunta forte. Nunca abrir só com a logo.
2. **Mídia real** (fotos/renders/vídeos do cliente) sempre que existir; ≥ 1080 px de largura. O enquadramento mostra
   o **assunto do vídeo** (num imóvel, o EDIFÍCIO; num produto, o produto) — figurantes e calçada ficam fora do quadro.
3. **Uma ideia por cena**, 2–3,5 s cada (≈ 20–30 trocas por minuto).
4. **Legível no celular**: títulos ≥ 70 px, legendas ≥ 34 px (no desenho de 1080); listas até 5 itens; linhas curtas.
5. **Hierarquia tipográfica** da direção de arte; destaque só na palavra-chave (uma por cena).
6. **Moldura da marca** fixa (logos + assinatura/contato), menos no final.
7. **Números animados** para dados e provas (`Counter`).
8. **Final acionável**: botão com WhatsApp/telefone/site + logo; 3–4 s.
9. **Som** coerente com o tom; o `render.py` entrega −14 LUFS sem cortes.
10. **Metáforas do tema** em pelo menos 1–2 cenas: é o que faz o vídeo ser DESTA marca e não genérico.

## Ciclo de trabalho

```bash
python3 $SK/scripts/assets.py new   $WORK/video
python3 $SK/scripts/assets.py add   $WORK/video clip1.mp4 foto.jpg …      # mídia real
python3 $SK/scripts/assets.py logo  $WORK/video logo.png                  # logo (fundo liso removido)
python3 $SK/scripts/assets.py voice $WORK/video $WORK/voice/words.json    # narrado
python3 $SK/scripts/assets.py music $WORK/video $WORK/music/music.json    # trilha
python3 $SK/scripts/get_font.py "Montserrat" --out $WORK/video/public/fonts
# escreva src/style.ts e src/Video.tsx, então:
python3 $SK/scripts/render.py $WORK/video nome --stills 0.5 2 4.2 … --ref $WORK/ref/sheet.jpg   # folha de revisão
python3 $SK/scripts/render.py $WORK/video nome --formats 9x16 --draft                          # prévia rápida
python3 $SK/scripts/render.py $WORK/video nome --formats 9x16,1x1,16x9                         # final, −14 LUFS
```

Erros comuns: arquivo que não existe em `public/` (o render para com "404"), fonte com nome diferente do `family`
do `STYLE` (o texto cai numa fonte padrão — confira na folha), vídeo curto demais para a cena (use `from` menor ou
outro trecho; o Remotion congela no último quadro), e textos que passam da borda no 16:9 (use `wide`).
