// DIREÇÃO DE ARTE do vídeo — troque TUDO por projeto (o que está aqui é só um exemplo neutro, não um estilo a copiar).
// Marca com design system aprovado (cores, fontes, selos, barra de contato)? Ele manda: copie-o para cá.
export const STYLE = {
  colors: {
    bg: '#0d0d0f',          // fundo
    text: '#f4f2ee',        // texto principal
    dim: 'rgba(244,242,238,.6)', // texto secundário
    accent: '#6ea8ff',      // destaque (palavras-chave, bordas, selos)
    accent2: '#3b6fd9',     // 2º tom do destaque (degradês)
    ink: '#0d0d0f',         // texto sobre o destaque (botões, pílulas cheias)
  },
  // destaque em degradê (texto e pílulas). Para cor chapada, use a mesma cor duas vezes.
  accentFill: 'linear-gradient(180deg, #a9cbff 0%, #6ea8ff 55%, #3b6fd9 100%)',
  fonts: {
    // family = nome usado no CSS; files = arquivos em public/fonts (get_font.py baixa qualquer família do Google Fonts)
    display: {family: 'Inter', weight: 800, upper: true, tracking: -0.02, files: [{file: 'fonts/inter-normal.woff2', weight: '100 900', style: 'normal'}]},
    text: {family: 'Inter', weight: 500, files: []},
    serif: {family: 'Playfair Display', weight: 500, italic: true, files: [
      {file: 'fonts/playfair-display-normal.woff2', weight: '400 900', style: 'normal'},
      {file: 'fonts/playfair-display-italic.woff2', weight: '400 900', style: 'italic'}]},
    mono: {family: 'monospace', weight: 500, files: []},
  },
  radius: 26,               // cantos dos cartões
  cardBorder: 'rgba(255,255,255,.12)',
  glowTop: 0.12,            // brilho suave no topo (0 = desligado)
  vignette: 0.5,            // escurecimento das bordas (0–1)
  music: {volume: 0.24, duck: 0.55}, // volume da trilha e quanto ela abaixa sob a voz (0 = some, 1 = não abaixa)
};
