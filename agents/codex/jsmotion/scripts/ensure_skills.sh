#!/usr/bin/env bash
# Skills OBRIGATÓRIAS da jsmotion (instala as que faltarem) e imprime a pasta onde elas estão:
#   remotion-best-practices  (oficial do Remotion: github.com/remotion-dev/skills)
#   r3f-*  (11 skills de React Three Fiber para cenas 3D: github.com/EnzeD/r3f-skills)
#   bash ensure_skills.sh                 → pessoal (npx skills add … -g)
#   bash ensure_skills.sh --project PASTA → só no projeto
set -e
PROJ=""; [ "${1:-}" = "--project" ] && PROJ="${2:-$PWD}"
PKGS="https://github.com/remotion-dev/skills|remotion-best-practices|remotion-best-practices
https://github.com/EnzeD/r3f-skills|*|r3f-fundamentals"   # url | skills a instalar | skill que prova a instalação

dirs() { if [ -n "$PROJ" ]; then echo "$PROJ/.claude/skills $PROJ/.agents/skills"
  else echo "$HOME/.claude/skills $HOME/.agents/skills $PWD/.claude/skills $PWD/.agents/skills"; fi; }
has() { for d in $(dirs); do [ -f "$d/$1/SKILL.md" ] && { echo "$d"; return 0; }; done; return 1; }

echo "$PKGS" | while IFS='|' read -r url skill probe; do
  has "$probe" >/dev/null && continue
  command -v npx >/dev/null || { echo "❌ as skills obrigatórias precisam de Node/npm (npx). Instale o Node 18+ e rode de novo." >&2; exit 1; }
  log=$(mktemp)   # </dev/null: o npx não pode ler a lista deste laço
  if [ -n "$PROJ" ]; then (cd "$PROJ" && npx -y skills add "$url" --skill "$skill" -y) </dev/null >"$log" 2>&1 || true
  else npx -y skills add "$url" --skill "$skill" -g -y </dev/null >"$log" 2>&1 || true; fi
  has "$probe" >/dev/null || { tail -15 "$log" >&2; echo "❌ não consegui instalar $probe. Rode à mão: npx skills add $url --skill '$skill' -g" >&2; exit 1; }
  echo "✓ $probe instalada" >&2
done
for d in $(dirs); do   # a pasta que tem as duas
  [ -f "$d/remotion-best-practices/SKILL.md" ] && [ -f "$d/r3f-fundamentals/SKILL.md" ] && { echo "$d"; exit 0; }
done
echo "❌ remotion-best-practices e r3f-* ficaram em pastas diferentes; instale as duas no mesmo escopo (-g ou --project)" >&2; exit 1
