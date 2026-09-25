# Formatos e layout

| Formato | `--format` | Tamanho (W×H) | Uso | Área segura p/ texto |
|---|---|---|---|---|
| Vertical 9:16 | `9x16` | 1080×1920 | Reels, TikTok, Shorts, Stories | x 90–990, y 300–1650 (UI dos apps cobre topo e base) |
| Retrato 4:5 | `4x5` | 1080×1350 | Feed Instagram/Facebook | x 90–990, y 110–1240 |
| Quadrado 1:1 | `1x1` | 1080×1080 | Feed, LinkedIn | x 90–990, y 90–990 |
| Horizontal 16:9 | `16x9` | 1920×1080 | YouTube, site, apresentações | x 160–1760, y 90–990 |

Sempre 30 fps. O mesmo `anim.js` gera todos: `build_html.py … --format 1x1` ou `pack.py … --formats 9x16,1x1,16x9`
(define `window.FORMAT` antes da animação).

## Como um código serve para todos os formatos: o palco

As cenas são desenhadas **sempre no espaço 1080×1920** (o 9:16), como no exemplo. O `W, H` real vem de
`window.FORMAT` — não o altere à mão. Cada bloco da cena é envolvido por `blk()`, que o encaixa no formato:

```js
blk(ctx, 'media',  880, {},              ()=>{ /* janela, cubo, vídeo */ });
blk(ctx, 'text',  1360, {slot:'mid'},    ()=>{ /* legenda do item */ });
blk(ctx, 'center', 960, {s:0.85},        ()=>{ /* cena só de texto: gancho, promessa, final */ });
```

- **2º argumento (`y`)**: o centro vertical do bloco no desenho 1080×1920.
- **9:16**: `blk` não muda nada (o 9:16 sai idêntico ao desenho, pixel a pixel).
- **4:5 e 1:1**: todos os blocos usam o mesmo "palco" — a faixa útil do desenho (y 330–1690) é escalada para a
  área segura (4:5 ≈ 0,83×, 1:1 ≈ 0,66×) e centralizada. O layout empilhado continua igual, só menor.
- **16:9**: layout lado a lado.
  - `'media'` → coluna esquerda (centro em 31% da largura, escala 0,78).
  - `'text'` → coluna direita (centro em 72%, escala 0,75), na altura do `slot`: `top` 24% · `mid` 55% · `bot` 80%.
    Use `top` para títulos de seção, `mid` para legendas, `bot` para indicadores (pontos, barras).
  - `'center'` → tela inteira, escala `s` (0,8–0,85): para cenas só de texto e o final com logo.

O fundo (luzes, chão em perspectiva, poeira, ruído, vinheta) é desenhado direto na tela, proporcional ao formato.
O elemento condutor (`SPARK_KEYS`) também é escrito no espaço 1080×1920 e convertido por `toCanvas()`; no 16:9 ele
percorre a tela inteira. Clarões e onda líquida escalam com a diagonal da tela (`RFL`).

## Checklist ao criar/editar uma cena

1. Desenhe pensando no 9:16 (coordenadas 1080×1920).
2. Separe **mídia** (janelas, imagens) e **texto** (títulos, legendas) em `blk()` diferentes — no 16:9 eles vão
   para colunas diferentes. Cena só de texto → um único `blk('center')`.
3. Dentro do bloco, use `ctx.globalAlpha *= a` (e não `=`) para respeitar fades externos.
4. Textos longos: no 16:9 a coluna de texto tem ~600 px úteis (≈ 800 px do desenho) — títulos com mais de
   ~12 caracteres a 150 px podem precisar de fonte menor ou quebra de linha.
5. Revise com `snap.py` o formato principal inteiro e as cenas de texto dos outros formatos.

## Duração
Mantenha BEAT = 0,5s. Escale os tempos das cenas proporcionalmente; o final (logo + CTA) é sempre 2,5s.
Em vídeos longos (>40s), aumente o número de itens ou dê ~2s por item em vez de esticar animações.
Tamanhos de fonte de referência (no desenho 9:16): gancho 110–250 px, títulos 96–150, legendas 52–62, botão 60.
