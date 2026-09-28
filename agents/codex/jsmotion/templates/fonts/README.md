# Fontes embutidas (opcionais)

Funcionam sem internet, mas **não são "a fonte da skill"**: a direção de arte escolhe as fontes certas para cada marca
e baixa qualquer família do Google Fonts com `scripts/get_font.py "Nome"`. Use estas só quando fizerem sentido para a
marca, ou sem acesso à internet (`"fonts": "playfair-inter"` no `config.json`).

| Arquivo | Fonte | Licença |
|---|---|---|
| `playfair-display-normal.woff2`, `playfair-display-italic.woff2` | [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) (variável) | SIL OFL 1.1 ([OFL-Playfair.txt](OFL-Playfair.txt)) |
| `inter-normal.woff2` | [Inter](https://fonts.google.com/specimen/Inter) (variável) | SIL OFL 1.1 ([OFL-Inter.txt](OFL-Inter.txt)) |

Reduzidas ao alfabeto latino (português, espanhol, inglês) com `pyftsubset --flavor=woff2`.
