# Formatos e layout

| Formato | Composição | Tamanho (W×H) | Uso | Área segura p/ texto |
|---|---|---|---|---|
| Vertical 9:16 | `v9x16` | 1080×1920 | Reels, TikTok, Shorts, Stories | x 90–990, y 300–1650 (UI dos apps cobre topo e base) |
| Retrato 4:5 | `v4x5` | 1080×1350 | Feed Instagram/Facebook | x 90–990, y 110–1240 |
| Quadrado 1:1 | `v1x1` | 1080×1080 | Feed, LinkedIn | x 90–990, y 90–990 |
| Horizontal 16:9 | `v16x9` | 1920×1080 | YouTube, site, apresentações | x 160–1760, y 90–990 |

Sempre 30 fps. O mesmo `src/Video.tsx` gera todos (o `src/Root.tsx` registra as 4 composições);
`render.py … --formats 9x16,1x1,16x9` escolhe quais renderizar.

## Como um código serve para todos os formatos

- **Posições em fração da tela** (`y={0.42}`, `Card x={0.5} y={0.4}`) e **tamanhos em px de 1080**: o kit multiplica
  por `u = min(W, H) / 1080`. No 9:16 e no 1:1, `u = 1`; no 16:9 também (a altura é 1080) — mas sobra largura.
- `const {vertical, wide, W, H} = useT()` para mudar o arranjo quando precisar:
  - **16:9**: mídia à esquerda e texto à direita (ex.: `Card x={wide ? 0.3 : 0.5}` e o texto com `left` em 55%),
    ou tudo centralizado em cenas só de texto. O `Converge` já reduz o cartão final para caber na altura.
  - **1:1 e 4:5**: menos altura — suba os textos de baixo (`y` maior que 0,8 sai da área segura) e diminua cartões
    altos.
- Barra de contato/moldura da marca: no 9:16 acima da área de UI dos apps (y ≈ 0,82); no 16:9, rodapé estreito.

## Checklist ao criar/editar uma cena
1. Desenhe pensando no formato principal (normalmente 9:16).
2. Separe **mídia** e **texto** em elementos diferentes — no 16:9 eles vão para lados diferentes.
3. Textos longos: no 16:9 a coluna de texto tem ~800 px úteis — títulos com mais de ~12 caracteres a 150 px podem
   precisar de fonte menor ou quebra de linha.
4. Revise com `render.py --stills` o formato principal inteiro e as cenas de texto dos outros (`--format 16x9`).

## Duração
Escale os tempos das cenas pela fala (narrado) ou pelas batidas da trilha (`src/music.json`); o final (logo + CTA)
fica com 2,5–4 s. Em vídeos longos (>40 s), aumente o número de itens em vez de esticar animações.
Tamanhos de fonte de referência (9:16): gancho 110–250 px, títulos 96–150, legendas 44–62, botão 50–60.
