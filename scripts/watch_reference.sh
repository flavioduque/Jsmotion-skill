#!/usr/bin/env bash
# Uso: watch_reference.sh <video-url-ou-caminho> [saida]
# Extrai frames do vídeo de referência com a skill watch e monta uma folha de contato (sheet.jpg).
set -e
SRC="$1"; OUT="${2:-/home/claude/ref}"; DIR="${WATCH_DIR:-/home/claude/watch}"
python3 "$DIR/scripts/watch.py" "$SRC" --no-whisper --max-frames 24 --out-dir "$OUT" | tail -5
ffmpeg -loglevel error -y -pattern_type glob -i "$OUT/frames/frame_*.jpg" -vf "scale=320:-1,tile=4x6" "$OUT/sheet.jpg"
echo "Folha de contato: $OUT/sheet.jpg"
