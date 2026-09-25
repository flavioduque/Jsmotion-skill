#!/usr/bin/env bash
# Instala a skill /watch (claude-watch) e dependências no ambiente atual. Idempotente.
set -e
source "$(dirname "$0")/paths.sh"
DIR="${WATCH_DIR:-$WORK/watch}"
if [ ! -f "$DIR/scripts/watch.py" ]; then
  git clone -q https://github.com/taoufik123-collab/claude-watch.git "$DIR"
fi
command -v yt-dlp >/dev/null 2>&1 || pip install -q yt-dlp --break-system-packages
command -v ffmpeg >/dev/null 2>&1 || (apt-get install -y -qq ffmpeg >/dev/null 2>&1 || true)
pip show brotli >/dev/null 2>&1 || pip install -q brotli --break-system-packages
python3 -c "import playwright" 2>/dev/null || pip install -q playwright --break-system-packages
echo "watch pronto em $DIR · trabalho: $WORK · entregas: $OUT"
