// Runtime theming so users can recolor the whole app (premium / customizable feel).

export type ThemeName = 'midnight' | 'light' | 'mocha' | 'ocean' | 'forest' | 'rose' | 'slate' | 'grape' | 'custom'

type Palette = Record<string, string>

const THEMES: Record<string, Palette> = {
  midnight: { '--surface': '11 15 26', '--card': '20 25 41', '--ink': '232 236 245', '--muted': '148 158 178', '--line': '38 44 64' },
  light: { '--surface': '245 247 251', '--card': '255 255 255', '--ink': '17 24 39', '--muted': '107 114 128', '--line': '226 232 240' },
  mocha: { '--surface': '24 18 16', '--card': '38 28 25', '--ink': '243 234 228', '--muted': '176 158 148', '--line': '64 48 42' },
  ocean: { '--surface': '8 18 28', '--card': '14 28 42', '--ink': '224 240 248', '--muted': '138 162 182', '--line': '30 50 68' },
  forest: { '--surface': '10 20 16', '--card': '16 32 25', '--ink': '226 240 230', '--muted': '142 170 152', '--line': '34 54 44' },
  rose: { '--surface': '26 14 18', '--card': '40 22 28', '--ink': '245 230 235', '--muted': '188 152 164', '--line': '64 38 46' },
  slate: { '--surface': '16 18 22', '--card': '26 29 35', '--ink': '232 234 240', '--muted': '150 156 168', '--line': '44 48 56' },
  grape: { '--surface': '20 14 30', '--card': '32 22 48', '--ink': '236 230 248', '--muted': '170 156 192', '--line': '52 40 72' },
}

export const ACCENTS: { name: string; value: string }[] = [
  { name: 'Violet', value: '124 92 255' },
  { name: 'Emerald', value: '16 185 129' },
  { name: 'Sky', value: '14 165 233' },
  { name: 'Rose', value: '244 63 94' },
  { name: 'Amber', value: '245 158 11' },
  { name: 'Indigo', value: '99 102 241' },
  { name: 'Pink', value: '236 72 153' },
  { name: 'Teal', value: '20 184 166' },
  { name: 'Orange', value: '249 115 22' },
  { name: 'Lime', value: '132 204 22' },
]

export function hexToRgbTriple(hex: string): string | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i)
  if (!m) return null
  const int = parseInt(m[1], 16)
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`
}

// Build a full palette from a single background color (custom theme).
function deriveCustom(bg: string): Palette {
  const [r, g, b] = bg.split(' ').map(Number)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const dark = lum < 0.5
  const mix = (a: number, t: [number, number, number]) =>
    `${Math.round(r * (1 - a) + t[0] * a)} ${Math.round(g * (1 - a) + t[1] * a)} ${Math.round(b * (1 - a) + t[2] * a)}`
  const toward: [number, number, number] = dark ? [255, 255, 255] : [0, 0, 0]
  return {
    '--surface': bg,
    '--card': mix(0.08, toward),
    '--ink': dark ? '240 242 248' : '17 24 39',
    '--muted': dark ? '160 168 184' : '90 96 110',
    '--line': mix(0.16, toward),
  }
}

export function applyTheme(theme: ThemeName, accent: string, customBg?: string) {
  const root = document.documentElement
  const palette = theme === 'custom' && customBg ? deriveCustom(customBg) : THEMES[theme] ?? THEMES.midnight
  Object.entries(palette).forEach(([k, v]) => root.style.setProperty(k, v))
  root.style.setProperty('--brand', accent)
  const [r, g, b] = accent.split(' ').map(Number)
  root.style.setProperty('--brand-soft', `${Math.round(r * 0.4)} ${Math.round(g * 0.4)} ${Math.round(b * 0.45)}`)
  // light mode = light theme, or custom with a bright background
  const isLight = theme === 'light' || (theme === 'custom' && customBg && (() => { const [cr, cg, cb] = customBg.split(' ').map(Number); return (0.299 * cr + 0.587 * cg + 0.114 * cb) / 255 >= 0.5 })())
  root.classList.toggle('dark', !isLight)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', isLight ? '#f5f7fb' : '#0b0f1a')
}
