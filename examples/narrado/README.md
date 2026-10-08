# Exemplo — vídeo narrado com tipografia cinética

A voz conduz o vídeo: cada palavra aparece no instante em que é falada, a palavra-chave acende, as cenas trocam
quando a fala muda de ideia — com HUD, brilho (bloom), aberração cromática nos impactos, câmera viva e trilha que
abaixa sob a voz. O estilo aqui (verde de terminal) só demonstra o motor: **não é um estilo padrão** — num vídeo de
verdade ele vem da direção de arte da marca.

- `narracao.txt` — o texto falado, com `[marcadores]` de cena e `*destaques*`
- `anim.js` — o `templates/kit.js` com o `STYLE` e o `SCRIPT` deste exemplo (cenas `fala`, `caixa`, `contador`, `gigante`)

## Rodar

```bash
export SK=~/.claude/skills/jsmotion        # ou a pasta onde a skill está
cd examples/narrado

# 1. voz → linha do tempo por palavra (escolha UMA)
python3 $SK/scripts/voice.py narracao.txt --elevenlabs <VOICE_ID>   # precisa de ELEVENLABS_API_KEY
python3 $SK/scripts/voice.py narracao.txt --audio minha_voz.mp3     # sua gravação (bash $SK/scripts/install_watch.sh --voz)
python3 $SK/scripts/voice.py narracao.txt --estimate                # sem voz

# 2. fontes da direção + assets (a voz entra no HTML)
python3 $SK/scripts/get_font.py "Space Grotesk" --role display
python3 $SK/scripts/get_font.py "JetBrains Mono" --role mono
cat > config.json <<J
{"fonts": {"display": "jsmotion-work/fonts/space-grotesk-normal.woff2",
           "text":    "jsmotion-work/fonts/space-grotesk-normal.woff2",
           "mono":    "jsmotion-work/fonts/jetbrains-mono-normal.woff2"},
 "voice": "jsmotion-work/voice/words.json"}
J
python3 $SK/scripts/prep_assets.py config.json assets.js

# 3. prévia rápida → aprovar → render final com desfoque de movimento
python3 $SK/scripts/pack.py anim.js assets.js narrado "jsmotion narrado" --formats 9x16 --draft
python3 $SK/scripts/pack.py anim.js assets.js narrado "jsmotion narrado" --formats 9x16,1x1,16x9 --mb 3
```

Guia completo (modelos de roteiro, presets, HUD, pós, som): `references/narrado.md`.
