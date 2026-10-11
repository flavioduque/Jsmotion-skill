# Motion explicativo (e quando usar 3D)

Transforme a ideia em uma **mudança observável**: quem assiste percebe o que mudou, por qual ação e com qual
consequência — sem ler uma lista de instruções.

## A lógica visual

Para cada trecho que pede explicação, escreva: **estado inicial → ação → estado final**, e qual elemento continua
reconhecível entre eles. Use a relação que o conteúdo afirma — não transforme correlação em causa, nem ilustração em
dado medido. Escolha a representação pela relação:

- **Processo**: UMA peça percorre as etapas e muda de estado (ex.: o documento passa por SUACE → Migraciones →
  Cédula e vira CONSTÂNCIA → RESIDÊNCIA → CÉDULA). Evite mostrar as etapas como cartões iguais lado a lado.
- **Causa e efeito**: a ação vem antes do resultado, com ligação visível (linha, seta que se desenha, luz que acende).
- **Comparação**: mesma escala, mesmo enquadramento, mesma base; destaque só a diferença (15 de 18 × 3 de 18).
- **Partes de um todo**: separe e reúna os MESMOS componentes, mantendo a correspondência.
- **Relação espacial / caminho**: rota que se desenha (o caminho longo pelo Mercosul × a rota direta).
- **Checklist/regras**: itens que entram um a um e recebem ✓ quando a fala confirma.

Se a ideia não pede transformação, uma imagem clara basta. Não mexa só para preencher tempo.

## Coreografia

- Apresente o objeto **antes** de exigir que acompanhem sua transformação.
- A mudança acontece na frase que a descreve; depois, um **intervalo estável** para ver o resultado.
- Um movimento principal por vez; apoios parados. Ícone que "pulsa" não explica nada — a ação precisa ter sentido
  (peças se encaixam, o caminho se percorre, a escolha muda o resultado).
- Início, efeito e conclusão aparecem na montagem final (nenhum corte esconde a etapa difícil).
- **Números, proporções, eixos e rótulos só de dados confirmados** (com a fonte numa linha discreta: "Fonte: Rediex,
  1º sem. 2026"). Sem dado, faça ilustração qualitativa e deixe claro que é ilustrativa (ex.: a pilha de moedas
  ilustra, o `Counter` ao lado mostra o valor real).

## Técnica

- **2D (SVG, formas, cartões, kit)** para relações planas: rotas, listas, fluxos, comparações simples.
- **3D genuíno** (`src/three.tsx`, `@remotion/three`) quando volume, profundidade, peso ou mudança de ponto de vista
  são parte da ideia — ou para **palavra/número de impacto** pontual. "Parecer premium" sozinho não justifica; e girar
  um plano com imagem não cria volume. Leia antes as skills `r3f-*` que a cena usa.

### Receitas 3D que funcionam no render (aprendidas na prática)

- `remotion.config.ts` com `Config.setChromiumOpenGlRenderer('swangle')` (já no template): sem isso o WebGL falha no
  Chromium sem GPU. Com GPU local, `'angle'` é mais rápido.
- Metal sem reflexo fica preto: sempre `<Env />` (RoomEnvironment + PMREM) e `<Lights />` na cena.
- `Text3D` com `maxW` (encolhe para caber; nunca estica). Fonte 3D = display do STYLE (`assets.py three`).
- Tudo pelo quadro: rotação, entrada e crescimento são `k(t, …)`/`Math.sin(t)`. **Nada** de `useFrame`, damping,
  relógio ou física — o render pula quadros e cada quadro precisa sair igual sempre.
- `Bars3D`: barras na mesma escala, número em cima e **nome na face da barra** (rótulo solto se perde); não desenhe a
  barra enquanto `g ≤ 0,02` (senão vira uma "placa" achatada no chão). Dê altura ao canvas para o número da barra
  mais alta não cortar.
- Câmera: `fov` 30 e distância que deixe folga nas bordas; `ThreeCanvas` com `alpha: true` sobre o fundo do vídeo.
- `CoinStack` (moedas caindo e empilhando) para quantias — com o valor real num `Counter` ao lado.

### Teste antes de multiplicar

Monte ~5 s com o ângulo crítico, a oclusão e a transformação principal e veja na folha + prévia: laterais e espessura
aparecem quando a câmera gira, a luz responde à geometria, rótulos continuam presos ao que descrevem, nada atravessa a
câmera. Falhou? Identifique se é geometria, fonte, contexto WebGL ou desempenho; simplifique (menos segmentos,
menos objetos) mantendo a relação espacial. Se o ambiente não roda 3D, uma versão 2D (vista explodida, corte
esquemático) pode servir — **diga que é a alternativa**; se o usuário pediu 3D explicitamente, pergunte antes.

## Aceite

A ação visual corresponde à frase e não sugere informação nova; objetos mantêm identidade e posição coerente; a
relação fica clara em reprodução normal no tamanho do celular; o MP4 mostra a mesma transformação da prévia, sem
telas vazias, saltos ou animação faltando.
