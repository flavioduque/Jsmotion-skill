# Direção de arte — o estilo nasce da análise, nunca de um modelo pronto

A skill **não tem estilo padrão**. Os exemplos (`templates/kit.js`, `templates/example_anim.js`) mostram o motor
funcionando; **não copie o visual deles**. Cada vídeo começa com uma direção de arte própria, escrita a partir de:

1. **A marca** — logo (cores, formas, peso), site (`scrape_site.py`: paleta, **fontes**, fotos, tom dos textos),
   redes, materiais que o usuário mandou.
2. **O tema e o público** — o que se vende, para quem, em que país, qual o medo e o desejo do cliente.
3. **A referência** (se houver) — `watch_reference.sh` + folha de contato. Sem referência, a direção vem de 1 e 2
   (é o caso mais comum — e o mais importante de acertar).
4. **O destino** — Reels/TikTok (ritmo alto, gancho forte), LinkedIn (sóbrio), YouTube/site (mais respiro).

## O que escrever em `$WORK/ref/estilo.md` (antes de qualquer código)

```
Marca/tema: …                      Público: …                 Tom (3 adjetivos): …
Conceito: uma frase que resume a ideia visual (ex.: "o dossiê jurídico de uma corretora de confiança")
Paleta (papéis): fundo · fundo2 · texto · texto2 · destaque · destaque2 · texto-sobre-destaque   (hex + de onde veio)
Tipografia: display = … (por quê) · texto = … (por quê) · números em … · caixa alta? tracking?
Destaque da palavra-chave: itálico | cor | sublinhado | marca-texto | caixa | contorno
Composição: centralizado | alinhado à esquerda · margens · cantos (0 = reto … 30 = arredondado)
Movimento: entrada do texto (máscara | fade | deslize | escala | máquina de escrever) · ritmo (0.75 | 1 | 1.3)
Transições: fade | deslize | empurrão | cortina | zoom | corte seco | clarão
Textura e foto: grão | papel | scanlines | nenhuma · tratamento (natural | quente | frio | P&B | duotone)
Metáforas do tema (2–3): elementos visuais que SÓ fazem sentido para este assunto → viram cenas próprias
Som: premium | energético | calmo | épico | minimalista · BPM
O que evitar: … (o que deixaria o vídeo genérico ou fora do tom da marca)
```

Depois, traduza para o objeto `STYLE` do `kit.js` (ver `references/kit.md`) e crie as cenas das metáforas.

## Como decidir (critérios, não modelos)

**Paleta** — comece pelas cores da logo e do site (as mais frequentes do `scrape_site.py`). Defina papéis: um fundo
dominante, um texto com contraste alto, **um** destaque (a cor mais forte da marca). Fundo escuro dá peso e luxo;
fundo claro dá leveza, confiança e "editorial de revista". Nunca mais de 1 destaque + 1 variação.

**Tipografia** — use as fontes do site da marca se estiverem no Google Fonts (`get_font.py "Nome"`); se forem
comerciais (Söhne, Circular, Gotham…), escolha a alternativa livre mais próxima (ex.: Inter, DM Sans, Montserrat).
Combinações que funcionam: serifa de título + sans de texto (confiança, tradição, premium); sans geométrica pesada +
sans leve (tecnologia, startup); condensada em caixa alta + grotesca (esporte, energia, varejo); serifa suave
(Fraunces, Instrument Serif) + sans arredondada (bem-estar, gastronomia, lifestyle); mono nos rótulos (tech, dados).

**Movimento e ritmo** — combine com o tom: calmo/premium → entradas por máscara ou fade, transições suaves, ritmo 1–1.3;
enérgico/jovem → escala, cortes secos ou zoom, ritmo 0.75, batida rápida; institucional → deslize, fade, ritmo 1.

**Metáforas do tema** — o que transforma "um vídeo bonito" em "um vídeo sobre ESTE assunto". Pergunte: que objetos,
documentos, gestos ou símbolos o público reconhece na hora? Exemplos:
- curso imobiliário → carimbos "EMBARGO / HIPOTECA", folhas de contrato, matrícula do imóvel, selo "RUN / Catastro";
- clínica odontológica → o antes/depois deslizando, a régua de cor dos dentes, o agendamento no celular;
- restaurante → a comanda escrita à mão, o prato girando, o preço na lousa;
- academia/esporte → cronômetro, contagem de repetições, a barra de progresso;
- software/app → a interface real flutuando, o cursor clicando, o gráfico subindo;
- imóvel de lançamento → a planta baixa se desenhando, o mapa com o pino, o calendário da entrega.
Use `stamp()` e os helpers do kit, ou escreva a cena do zero (`SC.nome = (ctx, s, lt) => {…}`).

## Direções como vocabulário (inspiração, não presets)

| Direção | Quando faz sentido | Sinais |
|---|---|---|
| Editorial premium | imóvel, curso, marca pessoal, luxo | serifa + sans, fotos reais, destaque em itálico, muito respiro |
| Minimal claro | saúde, bem-estar, arquitetura, B2B confiável | fundo claro, 1 cor forte, alinhado à esquerda, deslizes calmos |
| Bold energético | esporte, varejo, eventos, promoções | condensada em caixa alta, marca-texto, cortes, batida rápida |
| Tech | software, SaaS, IA, apps | fundo escuro, telas de UI, mono/geométrica, luz de destaque |
| Artesanal/orgânico | gastronomia, moda autoral, natural | textura de papel, cores terrosas, serifa suave, ritmo lento |
| Institucional | governo, jurídico, finanças | azul/grafite, sans sóbria, dados em cartões, transições discretas |

Misture e adapte: a direção final tem que ser **desta marca**. Teste: se trocar a logo por outra e o vídeo continuar
"servindo", a direção está genérica demais — volte e acrescente as metáforas e as escolhas da marca.

## Na pergunta de estilo (Passo 2)

Ofereça **3 direções de arte geradas pela análise** (não as da tabela acima): nome curto + paleta + fontes + 1 frase
de conceito, a 1ª recomendada e baseada na referência/marca. Ex.: "1. Dossiê de confiança — marinho, dourado e creme,
serifa jurídica + sans, carimbos e contratos (recomendado)".
