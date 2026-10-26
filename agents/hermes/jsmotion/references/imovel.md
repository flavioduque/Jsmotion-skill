# Modo imóvel — o imóvel explicado num "mundo contínuo"

Para empreendimentos, lançamentos e anúncios de imóvel. O nível que prende (reels de corretor "2.0"): **um mundo só, sem
cortes**, em que cada fato dito vira uma mudança de estado na tela — a torre sobe andar por andar enquanto o contador
conta, a câmera vai para o mapa e a rota se desenha até a referência, a planta ganha paredes, o preço desce numa
etiqueta e assenta quando a pessoa aponta. A pessoa (gravação ou avatar) fica na moldura embaixo, com legenda curta.

Peças: `src/imovel.tsx` (`MarcaCabecalho`, `Predio3D`, `ContadorAndares`, `MapaRota`, `EtiquetaPreco`, `Selo`),
`src/presenter.tsx` (`Presenter`, `Captions maxWords={3}`, `Clip`), `scripts/map_osm.py`, `scripts/tighten.py`.
Leia também `apresentador.md`, `motion-explicativo.md` (3D) e `efeitos.md`.

## 1. Dados — só reais, e conferidos

- Andares, tipologias e metragens, preço "a partir de", endereço/bairro, distância/tempo até a referência, entrega,
  forma de pagamento: do material do cliente ou de anúncio oficial (citado). **Fontes divergentes** (ex.: anúncio diz
  US$ 37.700 e a apresentação US$ 36.000)? Pergunte qual vale **antes** do roteiro.
- Nunca afirme o que não foi dado (área, ano, "reformado", condomínio). Descreva **o imóvel**, nunca quem vai morar nem o
  bairro ("ideal para famílias", "bairro seguro" — é regra legal em vários países e propaganda enganosa em todos).
- Preço sempre com a ressalva que o cliente usa ("conforme disponibilidade"). Telefone e endereço: leia de volta,
  dígito por dígito, antes de entregar.

## 2. Roteiro (fala de 18–25 s, um fato por frase)

`[marca]` nome do empreendimento → `[andares]` altura/porte → `[mapa]` onde fica (tempo até uma referência que o
público conhece) → `[planta]` por dentro (metragem) → `[tipos]` tipologias → `[preco]` "a partir de" → `[cta]` comente
X / WhatsApp. Números **em algarismos** no texto da voz (14, 8, 29, 36 mil): mais curto (custa menos créditos) e a voz lê
certo. Nomes de rua difíceis: escreva como se fala ou deixe só na tela.

## 3. A pessoa (HeyGen ou gravação)

- Roteiro sem quebras longas: cada quebra de linha vira pausa. Velocidade ~1.05–1.1 se o motor permitir.
- Avatar de foto no HeyGen: motor **Avatar IV** aceita `motionPrompt` (gestos); Avatar V pede um "digital twin" na
  mesma pessoa. Peça o gesto que a edição precisa (ex.: "aponta para cima quando diz o preço" — a etiqueta fica acima).
- **Gerar de novo só a imagem**: tire o áudio do vídeo já feito e mande como `audioAssetId` com um `motionPrompt` novo —
  não gasta crédito de voz. Voz clonada do ElevenLabs dentro do HeyGen usa a cota do ElevenLabs (o erro diz quantos
  créditos faltam); sem cota, nada é cobrado.
- Ficou lenta ou com pausas? `python3 $SK/scripts/tighten.py pessoa.mp4 words.json curta.mp4 [--drop 9-13]`: corta
  silêncios, tira um trecho mal dito (a frase tem que continuar fazendo sentido), acelera 6% com lábios sincronizados e
  grava `curta.cuts.json` → use em `<Presenter push={(t) => 1 + 0.06 * (cuts.filter((c) => t >= c).length % 2)}>` para
  o jump cut parecer intencional. Depois alinhe de novo (`voice.py` com o texto final) e `assets.py presenter`.

## 4. O mundo contínuo (parte de cima, 0–1000 px no 9:16)

| Fala | Peça | Regras |
|---|---|---|
| marca | `MarcaCabecalho` | logo + nome se escrevendo; em ~2,2 s encolhe e vira cabeçalho fixo até o fim |
| andares | `Predio3D` + `ContadorAndares` | a torre sobe junto do contador (o número É a imagem); selo **"volume ilustrativo"**; ao terminar, **funda no render real** (`Clip` com varredura de luz) e rotule "Projeto real" |
| mapa | `MapaRota` (`scripts/map_osm.py`) | ruas e rio reais do OpenStreetMap nas cores da marca; alfinete cai em "fica", rota se desenha no número; **"© OpenStreetMap"** obrigatório; ponto aproximado (centro do bairro) → selo **"localização aproximada"** — com o pino exato do cliente, tire o selo |
| planta | contador de m² + planta | com a **planta oficial**: trace os cômodos e suba as paredes em 3D, etiquetas de m² presas a cada cômodo no instante falado; sem planta: só a metragem num quadro (nada de cômodos inventados) |
| tipos | etiquetas/pílulas | cada uma entra na palavra exata (cuidado: `find('2')` acha "29" — use o índice da palavra) |
| preço | `EtiquetaPreco` | desce balançando, conta até o valor e **assenta no gesto** da pessoa (`settle`), com brilho; ressalva embaixo |
| cta | final | logos, [COMENTE] PALAVRA, assinatura, WhatsApp, "CLIQUE AQUI" com seta |

- Legenda curta (`maxWords={3}`), faixa dentro da moldura; uma informação por vez em cima; selos discretos no canto.
- Fotos/clipes reais primeiro (render, fachada, decorado). Tour com fotos: rota que dá para andar (fachada → entrada →
  sala → **cozinha** (2 planos) → quarto principal → banheiro → área externa), nunca voltar do interior para a fachada
  nem banheiro logo após a cozinha; 8–12 planos de 3–3,5 s; movimento por plano (aproxima no ponto focal, afasta nas
  revelações, lateral em cômodo largo); descarte fotos com pessoas/reflexo do fotógrafo, escuras, com marca d'água.
- Animar foto real com IA (Higgsfield, Seedance): só com o "ok" do gasto e prompt que **preserva** a arquitetura
  ("avanço lento e constante até {ponto focal}, sem panorâmica, giro ou tremida, sem distorção, sem pessoas nem objetos
  novos, movimento baixo"); a luz da foto manda mais que o clima pedido.

## 5. Render e revisão

3D sem GPU: ~4–6 min a cada 8 s de vídeo (o `render.py` faz em blocos retomáveis). Folha de revisão com: torre no meio
do crescimento, a fusão no render, mapa com a rota completa, cada etiqueta, a etiqueta assentando no gesto e o final.
Confira em reprodução a sincronia número↔fala e a passagem entre cenas (nenhum "buraco" escuro entre preço e convite:
o fundo do convite entra antes de a cena anterior sair).
