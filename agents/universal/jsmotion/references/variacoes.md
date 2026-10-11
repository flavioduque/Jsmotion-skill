# Variações controladas (testes A/B, versões de abertura, título, CTA)

Cada versão responde a **uma hipótese**. A base aprovada fica intacta e recuperável; fica explícito o que mudou, o que
ficou igual e de onde veio cada material.

## Base e hipótese

- Parta da versão **aprovada pelo usuário** (o projeto `$WORK/video` dela e as fontes). Sem base reconhecível, resolva
  isso antes de multiplicar arquivos. Não chame de "aprovada" o que o usuário não aprovou.
- Uma variável por hipótese: gancho/título de abertura, fala inicial, enquadramento, ordem de uma demonstração, CTA,
  trilha. Escreva por que a mudança poderia mudar a compreensão ou a resposta — é **hipótese, não previsão**.
- Mudou várias coisas por coerência? Chame de "nova direção"; não atribua o resultado a uma variável só.
- Título diferente pode usar o mesmo take. **Fala diferente exige áudio novo** (voz gerada de novo ou gravação
  nova) — nunca mude a legenda para dizer algo que a voz não diz. Ajuste cortes, duração e legenda só no que a fonte
  nova exigir.

## Matriz antes do lote

| ID | Base | Hipótese | Variável | Antes → depois | Preservado | Fonte nova | Arquivo |
|---|---|---|---|---|---|---|---|
| B | A (aprovada) | Explicitar o problema na abertura facilita entender | Título de abertura | "Investor Pass" → "Residência em 5 dias úteis?" | take, corpo, oferta, CTA, cores, áudio | — | `nome_abertura-pergunta_v01_9x16.mp4` |

- Evite cruzar todas as opções; priorize diferenças perceptíveis. Microvariação de animação gera arquivo, não
  aprendizado.
- Faça primeiro **uma** variante com a mudança mais difícil e compare com a base (folha de revisão das duas). Depois o
  lote. Usuário autorizou o lote com critérios? Siga após essa checagem interna; pediu ver uma antes? Mostre e espere.
- No código: as variantes leem um parâmetro (ex.: `const V = 'B'` no `Video.tsx` ou props da composição) — o corpo
  comum é o mesmo arquivo. Duração nova atualiza os tempos (a saída do final nunca antes da última frase).
- Nomes que explicam a diferença (`abertura-pergunta_v01`), nunca "final2"/"novo". Não sobrescreva a base.

## Manifesto (para lotes e para retomar depois)

`$OUT/<nome>_variacoes.md` com: base (versão preservada), fontes (caminho relativo, papel, origem/licença), trechos
usados de cada fonte, variantes (ID, hipótese, mudanças, fontes, arquivo) e estado (planejada · renderizada ·
revisada · aprovada — "aprovada" só com o ok do usuário).

## Resultados

Desempenho só com dados reais (fonte, período, métrica, verba/público). Sem medição: "não medido" — nunca eleja uma
vencedora com números inventados. Publicar ou subir anúncio não está implícito no pedido de variações.
