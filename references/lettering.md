# Lettering com hierarquia

Texto na tela é **decisão editorial**, não transcrição. Escolha o que merece destaque e faça a construção do texto
reforçar o sentido. Vale para títulos cinéticos, palavras de impacto (2D ou `Text3D`), números e chamadas.

## Escolha a mensagem

- Pegue o trecho exato da fala/roteiro que será enfatizado. Preserve **termos, acentos, negações, números e
  condições** ("NÃO É CIDADANIA", "30% do valor"). Paráfrase curta só se não muda a afirmação. Nunca invente
  benefício, resultado ou oferta para "encher" o layout.
- Dê uma função a cada texto da cena: **ideia principal**, **apoio necessário** ou **chamada para ação**. A principal
  é lida primeiro — por tamanho, peso, posição e contraste, não por ter a animação mais agitada.
- Com legenda na tela: ela tem faixa própria; o lettering destaca só a palavra/frase que acrescenta direção. Se o
  lettering diz a mesma frase, **silencie a legenda** naquele trecho.

## Forma legível

- Família e peso da **direção de arte/design system** (o `STYLE`). Condensada serve a título curto — não é remédio
  para fazer frase longa caber. **Nunca comprima o texto na horizontal**: reduza o tamanho (no 3D, `maxW`), quebre em
  duas linhas por unidade de sentido ou divida em dois momentos. Encurtar só se o conteúdo aprovado continuar inteiro.
- Fonte nova: confira licença (Google Fonts = livre), os pesos usados, **acentos do português/espanhol** (Ç, Ã, Ê, Ñ)
  e o carregamento no render (`useFonts`; `family` igual ao do arquivo). No 3D, gere a fonte com
  `assets.py three` (a mesma display do `STYLE`) e confira acentos na folha.
- Teste sobre o fundo **mais claro e o mais carregado** que aparecem no trecho (vídeo atrás muda tudo); sombra ou
  vinheta se precisar.

## Anime a ideia, não só a entrada

- O movimento segue o sentido: revelar uma conclusão, juntar partes da frase, **trocar uma palavra** por outra
  (DE → PARA), contrastar duas possibilidades, carimbar uma regra.
- Fases: preparação curta → transformação compreensível → **permanência legível** → saída que libera a próxima ideia.
  Overshoot forte só em palavra curta; frase longa entra limpa.
- A ideia principal termina de entrar antes do apoio; apoios ficam parados enquanto a transformação central acontece.
- Por letra: acentos e caracteres compostos são uma unidade (não separe o til do A); reserve a largura final para a
  linha não "escorregar" recentralizando a cada letra. Troca de palavra sem estado intermediário que forme frase
  errada (cuidado com negações e valores).
- **Sincronize pela fala real** (`wordAt`, `find`, `mark`): pode antecipar ~0,1–0,3 s por escolha, nunca contradizer o
  que ainda está sendo dito. Digitação: o tempo de leitura conta só depois da frase completa.

## Texto atrás da pessoa

Só com recorte alfa verdadeiro (ver `apresentador.md` §6). Sem alfa, componha o texto **ao lado** da pessoa ou sobre o
peito/blazer, longe do rosto. Mesmo com oclusão certa, letras suficientes precisam ficar visíveis para ler a palavra.

## Aceite

Hierarquia reconhecível no tamanho do celular; frase mais longa, acentos e a transição mais complexa conferidos no
quadro renderizado; nada cortado por máscara; leitura completa em reprodução normal. Na entrega, cite as fontes
usadas e qualquer substituição ("Montserrat no lugar da Gotham, que é paga").
