# Referência a fundo: extrair regras e aplicar ao vídeo do usuário

Complementa o Passo 1B (`direcao-de-arte.md`). Use quando o usuário quer "a linguagem deste vídeo" no dele, traz
várias referências, ou pede para **extrair/guardar** o estilo de uma referência para usar depois.

## Observado × inferido × proposto

Ao analisar (`watch_reference.sh` + folha de contato + trechos assistidos em sequência), separe sempre:
- **Observado** — visto ou ouvido, com o instante (ex.: "4,2–6,0 s: pessoa vai para moldura embaixo; título fica").
- **Inferido** — hipótese de como foi feito ("parece rastreio de rosto", "parece 3D extrudado"). Não afirme fonte
  exata, plugin, modelo 3D, método de recorte ou configuração só pela aparência.
- **Proposto** — a solução nova para ESTE vídeo.
Só imagem (sem vídeo)? Ela informa composição, cor e tipografia aparente — não prova ritmo, duração nem transição.
Link inacessível? Diga o que não deu para analisar; não invente a referência.

## Regras transferíveis (o que levar da referência)

Escolha as características que fazem diferença, e escreva cada uma como **gatilho → ação → permanência → saída**:
- o que ganha tela cheia e quando a pessoa divide a tela com a demonstração;
- quanto dura um estado estável em relação à fala e o que dispara a troca;
- proporção e hierarquia dos textos (sem presumir a família exata);
- função de cor, luz, espaço vazio e contraste;
- continuidade de objetos e o tipo de ação que faz a transição.

Converta adjetivos em decisões: "dinâmico" pode ser "cada ideia nova troca o foco"; "sofisticado" pode ser "poucos
elementos, escala generosa, movimento contido". Confirme qual leitura o material sustenta.

| Evidência observada (instante) | Regra extraída | Adaptação para o usuário | Como verificar na revisão |
|---|---|---|---|
| … | … | … | … |

Use essa tabela no `estilo.md` quando houver referência com pessoa/edição (não só tipografia).

## Várias referências

Dê **uma função a cada uma** (esta orienta composição; aquela, uma técnica específica) — não tire cor de uma,
tipografia de outra e ritmo de uma terceira sem checar o conjunto. Conflito na mesma dimensão: vale a preferência
mais recente do usuário; sem preferência e com impacto real, mostre o conflito com exemplos e proponha uma solução.

## Adaptar sem copiar

- Use a duração, a voz e o sentido do material do usuário. Não acelere a fala nem corte uma condição para imitar o
  ritmo da referência; se ela é curta e o original é explicativo, mantenha a lógica das trocas e dê mais tempo.
- Recrie a **função** visual com materiais do usuário. Nunca importe textos de oferta, dados, depoimentos, marcas ou
  mídias da referência. Cores e fontes = marca/design system aprovado (a referência orienta hierarquia e composição).
- Na amostra (folha/prévia), compare a **gramática** (foco, ritmo em relação à fala, legibilidade, transição,
  presença do apresentador), não os pixels. Se só lembra a paleta mas não faz as ações que definem a referência, a
  adaptação está incompleta.
- Semelhança visual ≠ capacidade técnica: escolha uma técnica que existe aqui para cumprir a mesma função e diga a
  diferença (ex.: "a referência parece usar recorte alfa; aqui fiz com moldura").

## Pacote de extração (quando pedirem para extrair/guardar)

Pedido explícito de "extrair o estilo", "analisar a referência a fundo" ou "guardar para reutilizar": entregue, numa
pasta `$OUT/<nome>-referencia/`:
1. `referencia-de-edicao.md` — fonte e escopo (arquivo, duração, dimensões, fps), **cobertura** (o que foi visto,
   ouvido e transcrito; lacunas), mapa interpretado com instantes reais, achados por dimensão (enquadramento,
   crop/zoom, tipografia, cor/luz, legendas, inserções, transições, camadas, alfa/3D, ritmo, áudio, fala×movimento),
   **regras adaptáveis** e limites.
2. `mapa-de-cenas.csv` — uma linha por trecho: `id,inicio_s,fim_s,foco,enquadramento,texto,legenda,insercoes,
   transicao,camadas,cor_luz,audio,fala,relacao_fala_movimento,ritmo,notas` (campo não verificado = `nao_verificado`;
   gere com o módulo `csv` do Python).
3. `receita-visual.json` — `reference` (metadados), `coverage`, `findings` (cada um `observado`/`inferido`/
   `nao_verificavel`, com instantes) e `reusable_rules` (gatilho, ação, permanência, saída, materiais necessários,
   como validar).
4. `prompt-de-recriacao.txt` — prompt para aplicar as regras a outro vídeo, com `[VIDEO DESTINO]`, `[FORMATO]` e
   `[MARCA]` para o usuário preencher; diz para recalcular os tempos pela fala do vídeo destino (os instantes da
   referência são evidência, não linha do tempo para copiar) e para não copiar falas, marcas nem mídias de terceiros.
Extrair **não** autoriza produzir: só edite quando o usuário pedir o vídeo.
