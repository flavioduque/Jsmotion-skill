// Converte WOFF -> typeface JSON (formato do FontLoader do three.js), como o facetype.js.
// opentype.js vem do node_modules do projeto (pasta atual), não da pasta da skill
const opentype = require(require.resolve('opentype.js', { paths: [process.cwd()] }));
const fs = require('fs');
const [src, out] = process.argv.slice(2);
const buf = fs.readFileSync(src);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const scale = (1000 * 100) / ((font.unitsPerEm || 2048) * 72);
const res = { glyphs: {}, familyName: 'f', ascender: Math.round(font.ascender * scale),
  descender: Math.round(font.descender * scale), underlinePosition: 0, underlineThickness: 0,
  boundingBox: { yMin: Math.round(font.tables.head.yMin * scale), xMin: Math.round(font.tables.head.xMin * scale),
    yMax: Math.round(font.tables.head.yMax * scale), xMax: Math.round(font.tables.head.xMax * scale) },
  resolution: 1000, cssFontWeight: 'bold', cssFontStyle: 'normal' };
for (let i = 0; i < font.glyphs.length; i++) {
  const g = font.glyphs.get(i);
  const us = g.unicodes && g.unicodes.length ? g.unicodes : (g.unicode !== undefined ? [g.unicode] : []);
  if (!us.length) continue;
  const tok = { ha: Math.round(g.advanceWidth * scale), x_min: Math.round((g.xMin || 0) * scale), x_max: Math.round((g.xMax || 0) * scale), o: '' };
  for (const c of g.path.commands) {
    if (c.type === 'Q') tok.o += `q ${Math.round(c.x * scale)} ${Math.round(c.y * scale)} ${Math.round(c.x1 * scale)} ${Math.round(c.y1 * scale)} `;
    else if (c.type === 'C') tok.o += `b ${Math.round(c.x * scale)} ${Math.round(c.y * scale)} ${Math.round(c.x1 * scale)} ${Math.round(c.y1 * scale)} ${Math.round(c.x2 * scale)} ${Math.round(c.y2 * scale)} `;
    else if (c.type !== 'Z') tok.o += `${c.type.toLowerCase()} ${Math.round(c.x * scale)} ${Math.round(c.y * scale)} `;
  }
  for (const u of us) res.glyphs[String.fromCodePoint(u)] = tok;
}
fs.writeFileSync(out, JSON.stringify(res));
console.log(out, Object.keys(res.glyphs).length, 'glyphs; has Ô Ç Ã %:', ['Ô', 'Ç', 'Ã', '%'].map(c => !!res.glyphs[c]).join(','));
