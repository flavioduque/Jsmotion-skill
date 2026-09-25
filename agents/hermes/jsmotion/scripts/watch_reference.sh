#!/usr/bin/env bash
# Uso: watch_reference.sh <video-url-ou-caminho> [saida]
# Extrai frames do vídeo de referência com a skill watch e monta uma folha de contato (sheet.jpg).
set -e
source "$(dirname "$0")/paths.sh"
SRC="$1"; REF="${2:-$WORK/ref}"; DIR="${WATCH_DIR:-$WORK/watch}"
python3 "$DIR/scripts/watch.py" "$SRC" --no-whisper --max-frames 24 --out-dir "$REF" | tail -5
ffmpeg -loglevel error -y -pattern_type glob -i "$REF/frames/frame_*.jpg" -vf "scale=320:-1,tile=4x6" "$REF/sheet.jpg"
echo "Folha de contato: $REF/sheet.jpg"
