# Formatos e layout

| Formato | Tamanho (W×H) | Uso | Área segura p/ texto |
|---|---|---|---|
| Vertical 9:16 | 1080×1920 | Reels, TikTok, Shorts, Stories | x 90–990, y 300–1650 (UI dos apps cobre topo e base) |
| Retrato 4:5 | 1080×1350 | Feed Instagram/Facebook | x 90–990, y 110–1240 |
| Quadrado 1:1 | 1080×1080 | Feed, LinkedIn | x 90–990, y 90–990 |
| Horizontal 16:9 | 1920×1080 | YouTube, site, apresentações | x 160–1760, y 90–990 |

Sempre 30 fps.

## Como adaptar o exemplo (feito para 1080×1920)
O exemplo usa coordenadas absolutas pensadas para 9:16. Para outros formatos:
- Defina `W,H` e use o centro `CX=W/2, CY=H/2`; reposicione textos e janelas relativos a ele.
- **Vertical**: empilhe (título em cima, mídia no meio, legenda embaixo).
- **Quadrado / 4:5**: mídia menor (≈ 80% da largura), título e legenda mais próximos; reduza fontes ~15%.
- **Horizontal**: mídia à esquerda (≈ 55% da largura) e texto à direita alinhado à esquerda,
  ou mídia centralizada com texto embaixo; fontes ~0,8× do vertical; logo final com 45% da largura.
- Chão em perspectiva (`drawGrid`): horizonte em ~65% da altura.
- `SPARK_KEYS`: refaça o caminho dentro da área segura do novo formato.
- Tamanhos de fonte de referência (9:16): gancho 110–250 px, títulos 96–150, legendas 52–62, botão 60.

## Duração
Mantenha BEAT = 0,5s. Escale os tempos das cenas proporcionalmente; o final (logo + CTA) é sempre 2,5s.
Em vídeos longos (>40s), aumente o número de itens ou dê ~2s por item em vez de esticar animações.
