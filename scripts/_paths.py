"""Pastas da skill (mesma regra do paths.sh): JSMOTION_WORKDIR / JSMOTION_OUTDIR,
senão as pastas do claude.ai se existirem, senão ./jsmotion-work e ./jsmotion-out."""
import os
def _pick(env, cloud, local):
    d = os.environ.get(env) or (cloud if os.path.isdir(cloud) and os.access(cloud, os.W_OK) else os.path.join(os.getcwd(), local))
    os.makedirs(d, exist_ok=True); return d
def workdir(): return _pick('JSMOTION_WORKDIR', '/home/claude', 'jsmotion-work')
def outdir():  return _pick('JSMOTION_OUTDIR', '/mnt/user-data/outputs', 'jsmotion-out')
