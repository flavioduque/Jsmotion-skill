#!/usr/bin/env bash
# Skill OBRIGATÓRIA da jsmotion: remotion-best-practices (oficial do Remotion, github.com/remotion-dev/skills).
# Instala se faltar e imprime o caminho da SKILL.md dela (só isso vai para a saída padrão).
#   bash ensure_remotion_skill.sh                 → pessoal (npx skills add … -g)
#   bash ensure_remotion_skill.sh --project PASTA → só no projeto
set -e
NAME=remotion-best-practices; URL=https://github.com/remotion-dev/skills
PROJ=""; [ "${1:-}" = "--project" ] && PROJ="${2:-$PWD}"

find_it() {
  local dirs
  if [ -n "$PROJ" ]; then dirs="$PROJ/.claude/skills $PROJ/.agents/skills"
  else dirs="$HOME/.claude/skills $HOME/.agents/skills $PWD/.claude/skills $PWD/.agents/skills"; fi
  for d in $dirs; do [ -f "$d/$NAME/SKILL.md" ] && { echo "$d/$NAME/SKILL.md"; return 0; }; done
  return 1
}

find_it && exit 0
command -v npx >/dev/null || { echo "❌ $NAME é obrigatória e precisa de Node/npm (npx). Instale o Node 18+ e rode de novo." >&2; exit 1; }
if [ -n "$PROJ" ]; then (cd "$PROJ" && npx -y skills add "$URL" --skill "$NAME" -y) >&2
else npx -y skills add "$URL" --skill "$NAME" -g -y >&2; fi
find_it || { echo "❌ não consegui instalar $NAME. Rode à mão: npx skills add $URL --skill $NAME -g" >&2; exit 1; }
