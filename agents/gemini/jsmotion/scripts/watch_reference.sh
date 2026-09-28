#!/usr/bin/env bash
# Uso: watch_reference.sh <link-ou-arquivo> [mais referências…]
# Assiste cada vídeo de referência com a skill watch e monta uma folha de contato (sheet.jpg).
# Quadros em intervalos REGULARES (--no-scene-change): a detecção de cenas pega justamente os clarões de transição
# e faz um vídeo claro/limpo parecer "lavado" — a folha tem que mostrar o vídeo como ele é na maior parte do tempo.
# Aceita arquivo local (mp4, mov, webm…) ou link (YouTube, Instagram, TikTok, Pinterest (pin de vídeo), Vimeo, X,
# link direto .mp4… via yt-dlp). NÃO aceita Dribbble (bloqueia download automático) nem pasta/board do Pinterest.
#
# Cada referência ganha uma pasta própria, SEMPRE do zero: $WORK/refs/<id>
# (o watch salva todo download como download/video.mp4 — reaproveitar a pasta fazia o yt-dlp pular o download
#  novo e a skill analisar a referência ANTERIOR). $WORK/ref aponta para a última analisada.
set -e
source "$(dirname "$0")/paths.sh"
DIR="${WATCH_DIR:-$WORK/watch}"
[ $# -ge 1 ] || { echo "uso: watch_reference.sh <link-ou-arquivo> [mais referências…]"; exit 1; }
[ -f "$DIR/scripts/watch.py" ] || bash "$(dirname "$0")/install_watch.sh" >/dev/null

hash10(){ if command -v sha1sum >/dev/null; then sha1sum; else shasum; fi | cut -c1-10; }
i=0
for SRC in "$@"; do
  i=$((i+1))
  [ -f "$SRC" ] || case "$SRC" in   # links que sabemos que não funcionam: explica na hora, sem tentar (arquivos locais passam)
    *dribbble.com*)
      echo "❌ referência $i: links do Dribbble não são suportados (o site bloqueia download automático)."
      echo "   Peça o arquivo: no navegador, botão direito no vídeo do shot → \"Salvar vídeo como…\" (ou uma gravação de tela)."
      exit 2 ;;
    *pinterest.*/pin/*|*pin.it/*) ;;   # pin de vídeo: ok
    *pinterest.*)
      echo "❌ referência $i: isto parece uma pasta/perfil do Pinterest. Mande o link de UM pin de vídeo (…/pin/…)."
      exit 2 ;;
  esac
  if [ -f "$SRC" ]; then   # arquivo local: caminho + tamanho + data (arquivo trocado com o mesmo nome = nova análise)
    SRC="$(cd "$(dirname "$SRC")" && pwd)/$(basename "$SRC")"
    KEY="$SRC|$(stat -c %s-%Y "$SRC" 2>/dev/null || stat -f %z-%m "$SRC")"
  else
    KEY="$SRC"
  fi
  ID="$(printf '%s' "$KEY" | hash10)"
  REF="$WORK/refs/$ID"
  rm -rf "$REF"; mkdir -p "$REF"
  printf '%s\n' "$SRC" > "$REF/source.txt"

  if ! python3 "$DIR/scripts/watch.py" "$SRC" --no-whisper --no-scene-change --max-frames 24 --out-dir "$REF" > "$REF/report.md" 2> "$REF/watch.log"; then
    echo "❌ referência $i falhou: $SRC"; tail -8 "$REF/watch.log"
    case "$SRC" in *pinterest.*|*pin.it/*)
      grep -q "No video formats" "$REF/watch.log" && echo "   Este pin é uma imagem, não um vídeo. Só pins de VÍDEO funcionam como referência." ;; esac
    exit 1
  fi
  N=$(ls "$REF"/frames/frame_*.jpg 2>/dev/null | wc -l | tr -d ' ')
  [ "$N" -gt 0 ] || { echo "❌ referência $i: nenhum quadro extraído ($SRC)"; tail -8 "$REF/watch.log"; exit 1; }

  # o vídeo que foi REALMENTE analisado (para conferir que é o que o usuário mandou)
  VID="$SRC"; [ -f "$SRC" ] || VID="$(ls "$REF"/download/video.* 2>/dev/null | grep -vE '\.(vtt|json|part)$' | head -1)"
  META="$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height:format=duration -of csv=p=0:s=x "$VID" 2>/dev/null | tr '\n' ' ')"
  WH="$(echo "$META" | grep -oE '[0-9]+x[0-9]+' | head -1)"; DUR="$(echo "$META" | grep -oE '[0-9]+\.[0-9]+' | tail -1)"
  W="${WH%x*}"; H="${WH#*x}"; ORI="?"
  if [ -n "$W" ] && [ -n "$H" ]; then
    if [ "$H" -gt "$W" ]; then ORI="vertical"; elif [ "$W" -gt "$H" ]; then ORI="horizontal"; else ORI="quadrado"; fi
  fi
  TITLE="$(python3 -c "import json,sys;print(json.load(open(sys.argv[1])).get('title',''))" "$REF/download/video.info.json" 2>/dev/null || true)"

  ROWS=$(( (N + 3) / 4 ))
  ffmpeg -loglevel error -y -pattern_type glob -i "$REF/frames/frame_*.jpg" -vf "scale=320:-2,tile=4x$ROWS" -frames:v 1 "$REF/sheet.jpg"
  printf 'fonte: %s\ntitulo: %s\nvideo: %s\nformato: %s (%s)\nduracao: %ss\nquadros: %s\n' \
    "$SRC" "$TITLE" "$VID" "$WH" "$ORI" "${DUR%.*}" "$N" > "$REF/info.txt"

  [ -e "$WORK/ref" ] && [ ! -L "$WORK/ref" ] && rm -rf "$WORK/ref"   # pasta fixa da versão antiga
  ln -sfn "$REF" "$WORK/ref"
  echo "✅ referência $i: $SRC${TITLE:+ — \"$TITLE\"}"
  echo "   $WH $ORI · ${DUR%.*}s · $N quadros · folha: $REF/sheet.jpg"
done
[ $# -gt 1 ] && echo "   (\$WORK/ref aponta para a última; cada uma tem a sua pasta em \$WORK/refs/)"
exit 0
