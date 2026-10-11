"""Fonte da direção de arte → fonte 3D do three.js (typeface JSON), para texto extrudado com <Text3D>.

  python3 font3d.py <fonte.woff2|.ttf|.otf> <saida.json> [--weight 800]

Mesmo formato do TTFLoader do three.js (FontLoader lê direto). Fonte variável (ex.: Inter, Montserrat do Google
Fonts): --weight escolhe o peso. Leva só os caracteres de que o vídeo precisa: latim com acentos (PT/ES/EN), números,
pontuação e símbolos comuns (US$ € % – “ ” …). Requer fonttools (e brotli para .woff2)."""
import json, sys

a = sys.argv[1:]
weight = None
if '--weight' in a: i = a.index('--weight'); weight = float(a[i + 1]); del a[i:i + 2]
if len(a) < 2: sys.exit(__doc__)
try:
    from fontTools.ttLib import TTFont
    from fontTools.pens.basePen import BasePen
except ImportError:
    sys.exit('❌ falta o fonttools: pip install fonttools brotli')

font = TTFont(a[0])
if 'fvar' in font:
    from fontTools.varLib import instancer
    axes = {ax.axisTag: ax.defaultValue for ax in font['fvar'].axes}
    if weight is not None and 'wght' in axes: axes['wght'] = weight
    font = instancer.instantiateVariableFont(font, axes)

upm = font['head'].unitsPerEm
S = 100000 / (upm * 72)          # a mesma escala do TTFLoader (resolution 1000)
r = lambda v: round(v * S)

class Pen(BasePen):              # três.js: m x y · l x y · q x y cx cy (ponto final antes do controle) · b x y c1x c1y c2x c2y
    def __init__(self, gs): super().__init__(gs); self.o = []; self.xs = []
    def _add(self, cmd, *pts):
        self.o.append(cmd); self.xs.append(r(pts[0][0]))
        for p in pts: self.o += [r(p[0]), r(p[1])]
    def _moveTo(self, p): self._add('m', p)
    def _lineTo(self, p): self._add('l', p)
    def _qCurveToOne(self, c, p): self._add('q', p, c)
    def _curveToOne(self, c1, c2, p): self._add('b', p, c1, c2)

CHARS = set(range(0x20, 0x7F)) | set(range(0xA0, 0x180)) | {ord(c) for c in '–—‘’‚“”„•…€™№'}
cmap, gs, hmtx = font.getBestCmap(), font.getGlyphSet(), font['hmtx']
glyphs = {}
for code in sorted(CHARS):
    name = cmap.get(code)
    if not name: continue
    pen = Pen(gs); gs[name].draw(pen)
    xs = pen.xs or [0]
    glyphs[chr(code)] = {'ha': r(hmtx[name][0]), 'x_min': min(xs), 'x_max': max(xs), 'o': ' '.join(map(str, pen.o))}

hh, head, os2 = font['hhea'], font['head'], font['OS/2']
nm = font['name']; name = nm.getDebugName(16) or nm.getDebugName(1) or 'font'   # família, sem o nome da instância
json.dump({'glyphs': glyphs, 'familyName': name, 'ascender': r(hh.ascent), 'descender': r(hh.descent),
           'underlinePosition': r(font['post'].underlinePosition), 'underlineThickness': r(font['post'].underlineThickness),
           'boundingBox': {'xMin': r(head.xMin), 'yMin': r(head.yMin), 'xMax': r(head.xMax), 'yMax': r(head.yMax)},
           'resolution': 1000, 'cssFontWeight': 'bold' if os2.usWeightClass >= 600 else 'normal', 'cssFontStyle': 'normal'},
          open(a[1], 'w'), separators=(',', ':'))
print(f'🔠 {name} {int(weight or os2.usWeightClass)} → {a[1]} ({len(glyphs)} caracteres)')
