"""Uso: python3 build_html.py anim.js assets.js saida.html "Título" nome_arquivo_mp4
Junta shell + assets + animação num único .html com os botões Prévia e Baixar MP4."""
import sys, os
anim,assets,out,title,name=sys.argv[1:6]
here=os.path.dirname(os.path.abspath(__file__))
s=open(os.path.join(here,'..','templates','shell.html')).read()
s=s.replace('/*TITLE*/',title).replace('/*ANIM*/',open(anim).read()+f"\nwindow.OUT_NAME={name!r};")
s=s.replace('/*ASSETS*/',open(assets).read())  # por último: assets é grande
open(out,'w').write(s); print(out, f'{len(s)/1e6:.2f} MB')
