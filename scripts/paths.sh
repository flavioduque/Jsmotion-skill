#!/usr/bin/env bash
# Uso: source "$SK/scripts/paths.sh"  → exporta WORK (trabalho) e OUT (entregas)
# Sobrescreva com JSMOTION_WORKDIR / JSMOTION_OUTDIR. Padrão: pastas do claude.ai se existirem,
# senão ./jsmotion-work e ./jsmotion-out na pasta atual (Claude Code, máquina local).
_jm_pick(){ # $1=variável  $2=pasta do claude.ai  $3=alternativa local
  if [ -n "$1" ]; then echo "$1"
  elif [ -d "$2" ] && [ -w "$2" ]; then echo "$2"
  else echo "$PWD/$3"; fi; }
export WORK="$(_jm_pick "$JSMOTION_WORKDIR" /home/claude jsmotion-work)"
export OUT="$(_jm_pick "$JSMOTION_OUTDIR" /mnt/user-data/outputs jsmotion-out)"
mkdir -p "$WORK" "$OUT"
unset -f _jm_pick
