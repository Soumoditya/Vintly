// Runtime theming so users can recolor the whole app (premium / customizable feel).

export type ThemeName = 'midnight' | 'light' | 'mocha' | 'ocean'

type Palette = Record<string, string>

const THEMES: Record<ThemeName, Palette> = {
  midnight: {
    '--surface': '11 15 26',
    '--card': '20 25 41',
    '--ink': '232 236 245',
    '--muted': '148 158 178',
    '--line': '38 44 64',
  },
  light: {
    '--surface': '245 247 251',
    '--card': '255 255 255',
    '--ink': '17 24 39',
    '--muted': '107 114 128',
    '--line': '226 232 240',
  },
  mocha: {
    '--surface': '24 18 16',
    '--card': '38 28 25',
    '--ink': '243 234 228',
    '--muted': '176 158 148',
    '--line': '64 48 42',
  },
  ocean: {
    '--surface': '8 18 28',
    '--card': '14 28 42',
    '--ink': '224 240 248',
    '--muted': '138 162 182',
    '--line': '30 50 68',
  },
}

// Curated accent presets (rgb triples), plus free custom color support.
export const ACCENTS: { name: string; value: string }[] = [
  { name: 'Violet', value: '124 92 255' },
  { name: 'Emerald', value: '16 185 129' },
  { name: 'Sky', value: '14 165 233' },
  { name: 'Rose', value: '244 63 94' },
  { name: 'Amber', value: '245 158 11' },
  { name: 'Indigo', value: '99 102 241' },
]

export function hexToRgbTriple(hex: string): string | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i)
  if (!m) return null
  const int = parseInt(m[1], 16)
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`
}

export function applyTheme(theme: ThemeName, accent: string) {
  const root = document.documentElement
  const palette = THEMES[theme] ?? THEMES.midnight
  Object.entries(palette).forEach(([k, v]) => root.style.setProperty(k, v))
  root.style.setProperty('--brand', accent)
  // A soft, dimmed version of the accent for backgrounds.
  const [r, g, b] = accent.split(' ').map(Number)
  root.style.setProperty(
    '--brand-soft',
    `${Math.round(r * 0.4)} ${Math.round(g * 0.4)} ${Math.round(b * 0.45)}`,
  )
  root.classList.toggle('dark', theme !== 'light')
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f5f7fb' : '#0b0f1a')
}
