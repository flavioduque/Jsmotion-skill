#!/usr/bin/env bash
# Instala a skill jsmotion no seu agente.
#   ./install.sh <agente> [--project [PASTA]]
# agentes: claude · codex · gemini · hermes · cursor · copilot · universal
#   (padrão: pasta pessoal do agente; --project instala na pasta do projeto, padrão: pasta atual)
# Sem clonar:  curl -fsSL https://raw.githubusercontent.com/flavioduque/Jsmotion-skill/main/install.sh | bash -s -- codex
set -e
REPO="${JSMOTION_REPO:-https://github.com/flavioduque/Jsmotion-skill.git}"   # JSMOTION_REPO: fork ou clone local
AGENT="${1:-}"; SCOPE=user; PROJ="$PWD"
if [ "${2:-}" = "--project" ]; then SCOPE=project; [ -n "${3:-}" ] && PROJ="$3"; fi

usage(){ sed -n 2,6p "$0" 2>/dev/null | sed 's/^# \{0,1\}//' || true
  echo "uso: install.sh <claude|codex|gemini|hermes|cursor|copilot|universal> [--project [PASTA]]"; exit 1; }
[ -z "$AGENT" ] && usage

# fonte: este repositório (se rodando de um clone) ou um clone temporário (curl | bash)
SRC="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || true)"
if [ ! -f "$SRC/SKILL.md" ] || [ ! -d "$SRC/agents" ]; then
  SRC="$(mktemp -d)/jsmotion-src"; git clone -q --depth 1 "$REPO" "$SRC"
fi

# variante + destino de cada agente (pessoal | projeto)
case "$AGENT" in
  claude)    VAR="$SRC";                          U="$HOME/.claude/skills/jsmotion";          P="$PROJ/.claude/skills/jsmotion" ;;
  codex)     VAR="$SRC/agents/codex/jsmotion";     U="$HOME/.agents/skills/jsmotion";          P="$PROJ/.agents/skills/jsmotion" ;;
  gemini)    VAR="$SRC/agents/gemini/jsmotion";    U="$HOME/.gemini/skills/jsmotion";          P="$PROJ/.gemini/skills/jsmotion" ;;
  hermes)    VAR="$SRC/agents/hermes/jsmotion";    U="${HERMES_HOME:-$HOME/.hermes}/skills/creative/jsmotion"; P="" ;;
  cursor)    VAR="$SRC/agents/universal/jsmotion"; U="$HOME/.cursor/skills/jsmotion";          P="$PROJ/.cursor/skills/jsmotion" ;;
  copilot)   VAR="$SRC/agents/universal/jsmotion"; U="$HOME/.copilot/skills/jsmotion";         P="$PROJ/.github/skills/jsmotion" ;;
  universal) VAR="$SRC/agents/universal/jsmotion"; U="$HOME/.agents/skills/jsmotion";          P="$PROJ/.agents/skills/jsmotion" ;;
  *) usage ;;
esac
[ -f "$VAR/SKILL.md" ] || { echo "variante não encontrada: $VAR (repositório desatualizado?)"; exit 1; }
DEST="$U"; [ "$SCOPE" = project ] && DEST="$P"
[ -z "$DEST" ] && { echo "o Hermes só usa skills pessoais (~/.hermes/skills); rode sem --project"; exit 1; }

rm -rf "$DEST"; mkdir -p "$DEST"
cp "$VAR/SKILL.md" "$DEST/"
for d in scripts templates references agents; do
  [ -d "$VAR/$d" ] && [ "$VAR/$d" != "$SRC/agents" ] && cp -R "$VAR/$d" "$DEST/"
done
chmod +x "$DEST"/scripts/*.sh 2>/dev/null || true
echo "✅ jsmotion instalada para $AGENT em: $DEST"
case "$AGENT" in
  claude)  echo "   Abra o Claude Code e peça: \"Quero um vídeo jsmotion da minha marca\"" ;;
  codex)   echo "   Reinicie o Codex. Use: \$jsmotion (ou peça um vídeo animado). Rede: aprove quando pedir." ;;
  gemini)  echo "   No Gemini CLI: /skills reload (ou reinicie) e peça um vídeo animado da sua marca." ;;
  hermes)  echo "   No Hermes: /reset (ou nova sessão) e /jsmotion — ou só peça um vídeo animado." ;;
  cursor)  echo "   Reinicie o Cursor; a skill aparece em Settings → Rules/Skills." ;;
  copilot) echo "   Reinicie o VS Code / Copilot CLI; peça um vídeo animado no modo agente." ;;
  *)       echo "   Agentes que leem ~/.agents/skills (Codex, Gemini CLI, Copilot, OpenCode…) já encontram a skill." ;;
esac
