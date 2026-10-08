# Kit de cenas (`templates/kit.js`) — motor sem estilo próprio

O kit anima, faz transições, contadores, som e os 4 formatos (9:16, 4:5, 1:1, 16:9). **O visual vem inteiro do objeto
`STYLE`**, que você escreve a partir da direção de arte (`references/direcao-de-arte.md`). O `STYLE` que vem no arquivo
é só um exemplo — sempre substitua. O vídeo é a lista `SCRIPT`.

## `STYLE` — tokens da direção de arte

| Token | Valores | Efeito |
|---|---|---|
| `colors` | `bg`, `bg2`, `ink`, `soft`, `accent`, `accent2`, `onAccent`, `card`, `line` | paleta por papel (fundo claro é detectado sozinho) |
| `bg` | `gradient` · `solid` · `paper` · `grid` · `dots` | fundo das cenas sem foto |
| `font.display` | `{weight, case:'none'/'upper', tracking, scale}` | títulos (família = `ASSETS.fonts.display`) |
| `font.text` / `font.numbers` | `{weight}` / `'text'` · `'display'` | texto de apoio e números grandes |
| `highlight` | `italic` · `color` · `underline` · `marker` · `box` · `outline` | como a palavra-chave (`hl`) se destaca |
| `eyebrow` | `rule` · `pill` · `dot` · `plain` · `none` | rótulo pequeno em caixa alta |
| `align` | `center` · `left` | alinhamento dos títulos |
| `radius` | 0–40 | cantos de cartões, botões e retrato (0 = quadrado) |
| `card` | `glass` · `solid` · `outline` · `flat` | cartões de dados |
| `reveal` | `mask` · `fade` · `slide` · `scale` · `type` | entrada do texto |
| `speed` | 0.75 · 1 · 1.3 | ritmo de todas as animações |
| `transition` | `fade` · `slide` · `push` · `wipe` · `zoom` · `cut` · `flash` | troca de cena (por cena: `trans_in`) |
| `texture` | `grain` · `paper` · `scanlines` · `none` | textura por cima |
| `photo` | `{grade:'none'/'warm'/'cool'/'bw'/'duotone', dim}` | tratamento das fotos |
| `frame` | `{left, right, bottom, tint}` | moldura fixa (chaves de `ASSETS.logos`); em fundo claro as logos escurecem (`tint:'none'` desliga) |
| `sound` | `{mood:'premium'/'energetic'/'calm'/'epic'/'minimal'/'none', bpm}` | trilha gerada |
| `locale` | `es-PY`, `pt-BR`, `en-US`… | separador de milhar dos números |
| `kinetic` | `{preset, size, upper, ghost, maxLines, breaks}` | texto palavra por palavra (vídeo narrado) — presets `blurIn` · `rise` · `pop` · `decode` · `type` · `stretch` |
| `post` | `{bloom, radius, threshold, contrast, ca, caBase, sweep}` | pós-produção: brilho que vaza do que é claro, aberração cromática nos impactos, varredura de luz |
| `hud` | `{label, rec, corners, grid, meta, right, color, alpha}` | interface fixa em fonte mono (código da cena, REC, cantos, grade); `hud:false` numa cena esconde |
| `camera` | 0–0.08 | aproximação lenta e contínua em toda cena (`cam` por cena) |
| `sound.duck` / `voice` / `wordTicks` | 0.25–0.4 / 1 / bool | trilha abaixa sob a voz · volume da voz · tique em cada palavra |

Sobre foto, o texto fica sempre claro (a foto é escurecida embaixo), qualquer que seja a paleta.

## Cenas prontas

Todas aceitam `dur`, `eyebrow`, `photo` (chave de `ASSETS.photos`), `kb:'in'|'out'|'left'|'right'` (movimento da foto),
`trans:'flash'` (clarão na saída), `trans_in` (transição de entrada) e `frame:false`.

| type | Para quê | Campos |
|---|---|---|
| `hook` | gancho no 1º segundo: número animado + benefício | `from`, `value`, `prefix`, `suffix`, `label`, `sub` |
| `statement` | frase de impacto | `lines` (2–3), `hl` (linha destacada), `sub`, `strike` (linha riscada) |
| `photo` | foto em tela cheia com legenda | `title`, `sub` |
| `cards` | 2–4 dados (números animam) | `title`, `hl`, `cards:[{value,prefix,suffix,label} ou {text,label}]` |
| `list` | até 5 itens | `title`, `hl`, `items:[{t, s}]` |
| `price` | preço animado + condições | `label`, `prefix`, `from`, `value`, `rows:[[rótulo, valor]]` |
| `person` | a pessoa da marca | `photo` (retrato), `title`, `hl` |
| `cta` | final com botão de contato | `logo`, `title`, `hl`, `button`, `icon:'phone'`, `small` |
| `fala` | **narrado:** o trecho da narração entrando palavra por palavra | `mark`, `preset`, `size`, `y`, `photo`, `ghost`, `breaks` (ou `text` sem voz) |
| `gigante` | **narrado:** a palavra-chave em tela cheia, com subida de som e impacto | `mark`, `word`, `upper` |
| `caixa` | **narrado:** campo de pedido/busca sendo digitado | `mark`, `text`, `from`, `to`, `label` |
| `contador` | **narrado:** anel + número subindo | `mark`, `value`, `prefix`, `suffix`, `label`, `countAt` |

Toda cena aceita `mark:'nome'` (vídeo narrado): começa no marcador `[nome]` da narração e dura até a próxima cena
marcada; recebe `s.words` (palavras do trecho, tempo local). Detalhes em `references/narrado.md`.

## Cenas próprias (as metáforas do tema)

```js
SC.contrato = (ctx, s, lt) => {                 // ex.: curso imobiliário — folha de contrato + carimbos
  bgFill(ctx);
  T(ctx, 0.35, () => {
    eyebrow(ctx, 'El error #1', -120, lt, 0.05);
    line(ctx, 'Un solo error', 0, lt, 0.15, {size:110});
    line(ctx, 'te borra la comisión', 110, lt, 0.4, {size:64, hl:true, strike:0.9});
    stamp(ctx, 'EMBARGO', 380, 330, -0.12, lt, 1.2);
    stamp(ctx, 'HIPOTECA', 700, 430, 0.08, lt, 1.5);
  });
};
// no SCRIPT: {type:'contrato', dur:3}
```
Helpers: `T(ctx, yFração, fn)` (bloco de texto no espaço de 1080 de largura), `Tc` (bloco centralizado em todo formato),
`kwords(ctx, words, lt, o)` (tipografia cinética), `at('marcador', k)` (instante de uma palavra), `fMono` (fonte do HUD), `line`, `eyebrow`, `para`, `stamp`,
`photoBg`, `bgFill`, `card`, `rr` (retângulo arredondado), `count(s, lt, t0, t1)` (contador), `fmtNum`, `inv`/`eOut`/`eIO`/`eBack`
(tempo e easing), `C` (cores), `INK`/`SOFT` (cor de texto da cena), `SP` (ritmo), `LEFT`/`AX`/`AL` (alinhamento).

## Padrão de qualidade (obrigatório)
1. **Gancho no 1º segundo**: número + benefício ou pergunta forte. Nunca abrir só com a logo.
2. **Mídia real** (fotos/renders/vídeos do cliente) sempre que existir; ≥ 1080 px de largura.
3. **Uma ideia por cena**, 2–3,5 s cada (≈ 20–30 trocas por minuto).
4. **Legível no celular**: títulos ≥ 70 px, legendas ≥ 34 px (no desenho de 1080); listas até 5 itens; linhas curtas.
5. **Hierarquia tipográfica** da direção de arte; destaque só na palavra-chave (uma por cena).
6. **Moldura da marca** fixa (logos + assinatura), menos no final.
7. **Números animados** para dados e provas.
8. **Final acionável**: botão com WhatsApp/telefone/site + logo; 3–4 s.
9. **Som** coerente com o tom; o render entrega −14 LUFS sem cortes.
10. **Metáforas do tema** em pelo menos 1–2 cenas: é o que faz o vídeo ser DESTA marca e não genérico.

## Assets (`config.json` do `prep_assets.py`)
```json
{
  "photos": {"p1": "fachada.jpg", "person": "retrato.jpg"},
  "logos":  {"logoL": "logo.png", "sign": "assinatura.png"},
  "fonts":  {"display": "…/fraunces-normal.woff2", "display_italic": "…/fraunces-italic.woff2", "text": "…/dm-sans-normal.woff2"}
}
```
Fontes: `python3 $SK/scripts/get_font.py "Nome da Família" --role display|text` (qualquer família do Google Fonts).
Sem internet: `"fonts": "playfair-inter"` (embutidas).
