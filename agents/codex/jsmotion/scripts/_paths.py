"""Pastas da skill (mesma regra do paths.sh): JSMOTION_WORKDIR / JSMOTION_OUTDIR,
senão as pastas do claude.ai se existirem, senão ./jsmotion-work e ./jsmotion-out."""
import os
def _pick(value, cloud, local):
    d = value or (cloud if os.path.isdir(cloud) and os.access(cloud, os.W_OK) else os.path.join(os.getcwd(), local))
    os.makedirs(d, exist_ok=True); return d
# nomes literais: deixam claro quais variáveis a skill lê (e passam nos scanners de segurança dos agentes)
def workdir(): return _pick(os.environ.get('JSMOTION_WORKDIR'), '/home/claude', 'jsmotion-work')
def outdir():  return _pick(os.environ.get('JSMOTION_OUTDIR'), '/mnt/user-data/outputs', 'jsmotion-out')
