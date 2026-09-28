# Template editorial (`templates/example_editorial.js`)

Para marcas "premium": imóveis, cursos e mentorias, marcas pessoais, moda, luxo, gastronomia, turismo, eventos,
clínicas. Visual de revista: **fotos reais em tela cheia**, título em **serifa** (Playfair Display) com a palavra-chave
em **itálico dourado**, dados em **sans** (Inter), rótulos pequenos espaçados, **moldura fixa da marca**.
Referências de nível: vídeos de lançamento imobiliário e de infoproduto prontos para Reels.

O vídeo é uma lista de cenas (`SCRIPT`). Você preenche o conteúdo; o template cuida de animação, transições,
contadores, som e dos 4 formatos (9:16, 4:5, 1:1, 16:9).

## O que editar
- **`C`** — paleta: `bg`/`bg2` (fundo), `ink` (texto), `soft` (texto secundário), `accent`/`accent2` (destaque; dourado
  por padrão — use a cor forte da marca), `cream` (fundo claro opcional).
- **`FRAME`** — chaves de `ASSETS.logos`: `left` e `right` (logos no topo, ex.: marca + empreendimento/parceiro),
  `bottom` (assinatura/marca pessoal embaixo). `''` para não usar.
- **`LOCALE`** — separador de milhar dos números (`es-PY`/`pt-BR` → `69.539`; `en-US` → `69,539`).
- **`SCRIPT`** — as cenas.

## Tipos de cena

Todos aceitam `dur` (segundos), `eyebrow` (rótulo pequeno), `trans:'flash'` (clarão na saída; use 1× no gancho),
`kb:'in'|'out'|'left'|'right'` (movimento da foto) e `frame:false` (esconde a moldura).

| type | Para quê | Campos |
|---|---|---|
| `hook` | **gancho dos 3 primeiros segundos**: número grande animado + benefício | `photo`, `from`, `value`, `prefix`, `suffix`, `label`, `sub` |
| `statement` | frase de impacto em serifa (pergunta, virada, promessa) | `lines` (2–3), `hl` (índice da linha em itálico dourado), `photo` ou `bg:'dark'|'cream'`, `sub`, `strike` (índice da linha riscada) |
| `photo` | foto em tela cheia com legenda (produto, ambiente, resultado) | `photo`, `title`, `sub` |
| `cards` | 2–4 dados em cartões (números animam) | `photo`, `title` (1–2 linhas), `cards:[{value,prefix,suffix,label} ou {text,label}]` |
| `list` | até **5** itens (módulos, benefícios, etapas) | `title`, `items:[{t, s}]`, `photo` ou `bg` |
| `price` | preço animado + tabela de condições | `photo`, `label`, `prefix`, `from`, `value`, `rows:[[rótulo, valor]]` (até 4) |
| `person` | a pessoa por trás da marca (foto no círculo com anel dourado) | `photo` (retrato), `title`, `hl` |
| `cta` | final: logo/assinatura + frase + **botão de contato** | `logo`, `title`, `hl`, `button` (telefone/site/@), `icon:'phone'`, `small` |

## Padrão de qualidade (obrigatório — é o que separa "pronto para postar" de "amador")
1. **Gancho no 1º segundo**: número + benefício (`hook`) ou pergunta forte (`statement`). **Nunca** abrir só com a logo.
2. **Mídia real**: fotos/renders/vídeos do cliente em tela cheia sempre que existirem (site, Instagram, anexos).
   Fotos de pelo menos 1080 px de largura — foto pequena ampliada fica borrada.
3. **Uma ideia por cena**, 2–3,5 s cada (≈ 20–30 trocas por minuto). Vídeo de 30 s ≈ 9–12 cenas.
4. **Legível no celular**: títulos ≥ 70 px, legendas ≥ 34 px (no desenho de 1080 de largura); listas até 5 itens;
   textos curtos (título ≤ 28 caracteres por linha).
5. **Tipografia com hierarquia**: rótulo pequeno espaçado → título serifa → apoio sans. Itálico dourado **só** na
   palavra-chave (uma por cena).
6. **Moldura da marca** fixa (logos no topo, assinatura embaixo) em todas as cenas, menos no final.
7. **Números animados** para dados (renda, preço, alunos, m²…): prova concreta segura a atenção.
8. **Final acionável**: botão com WhatsApp/telefone/site + logo; 3–4 s.
9. **Som**: cama discreta + whoosh nas trocas + tique nos contadores; o render entrega −14 LUFS sem cortes.
10. **Estrutura de venda**: gancho → contexto/problema → produto/solução (fotos) → provas/dados → oferta/preço →
    pessoa/autoridade → chamada.

## Assets (`config.json` do `prep_assets.py`)
```json
{
  "photos": {"p1": "fachada.jpg", "p2": "living.jpg", "person": "retrato.jpg"},
  "logos":  {"logoL": "logo.png", "logoR": "parceiro.png", "sign": "assinatura.png"},
  "fonts":  "editorial"
}
```
`photos` vão inteiras (o template enquadra); `logos` mantêm a transparência. Sem foto numa cena → fundo sólido da marca.
