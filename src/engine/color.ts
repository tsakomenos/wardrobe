import { PALETTE } from '../data/palette'
import { t } from '../i18n'

export type ColorKind =
  | 'white'
  | 'black'
  | 'grey'
  | 'navy'
  | 'denim'
  | 'earth'
  | 'olive'
  | 'pastel'
  | 'color'

export interface ColorInfo {
  hex: string
  h: number // 0..360
  s: number // 0..1
  l: number // 0..1
  kind: ColorKind
  neutral: boolean // true for white/black/grey/navy/denim
  tone: 'light' | 'mid' | 'dark'
  temp: 'warm' | 'cool' | 'none'
  saturated: boolean
}

export function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace('#', '').trim()
  const n = m.length === 3 ? m.split('').map((c) => c + c).join('') : m
  const v = parseInt(n, 16)
  if (Number.isNaN(v)) return [128, 128, 128]
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const [r0, g0, b0] = hexToRgb(hex)
  const r = r0 / 255
  const g = g0 / 255
  const b = b0 / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return { h: h * 60, s, l }
}

const cache = new Map<string, ColorInfo>()

export function describe(hex: string): ColorInfo {
  const key = hex.toUpperCase()
  const hit = cache.get(key)
  if (hit) return hit
  const { h, s, l } = hexToHsl(hex)
  let kind: ColorKind = 'color'
  if (l >= 0.88 && s < 0.6) kind = 'white'
  else if (l <= 0.13) kind = 'black'
  else if (s < 0.12) kind = 'grey'
  else if (h >= 205 && h <= 250 && l < 0.28) kind = 'navy'
  else if (h >= 200 && h <= 230 && s <= 0.5 && l >= 0.28) kind = 'denim'
  else if (h >= 18 && h <= 48 && s <= 0.65 && l >= 0.15 && l <= 0.85 && !(s > 0.5 && l > 0.55)) kind = 'earth'
  else if (h >= 48 && h <= 90 && s <= 0.45 && l <= 0.5) kind = 'olive'
  else if (l >= 0.72 && s < 0.7) kind = 'pastel'

  const neutral = kind === 'white' || kind === 'black' || kind === 'grey' || kind === 'navy' || kind === 'denim'
  const tone: ColorInfo['tone'] = l >= 0.65 ? 'light' : l <= 0.32 ? 'dark' : 'mid'
  let temp: ColorInfo['temp'] = 'none'
  if (!neutral) {
    if (h < 70 || h >= 330) temp = 'warm'
    else if (h >= 150 && h < 300) temp = 'cool'
  }
  const saturated = s >= 0.5 && l >= 0.25 && l <= 0.7
  const info: ColorInfo = { hex: key, h, s, l, kind, neutral, tone, temp, saturated }
  cache.set(key, info)
  return info
}

export function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

export interface PairResult {
  score: number // roughly -1.5 .. 1.5
  note?: string
  warning?: string
}

/** How well two colours sit next to each other in one outfit. */
export function pairScore(a: ColorInfo, b: ColorInfo): PairResult {
  const kinds = [a.kind, b.kind]
  const has = (k: ColorKind) => kinds.includes(k)
  const both = (k: ColorKind) => a.kind === k && b.kind === k

  // Neutral with neutral
  if (a.neutral && b.neutral) {
    if (has('black') && has('navy')) return { score: -0.2, warning: t('c.blackNavy') }
    if (a.kind === b.kind) return { score: 0.8, note: t('c.tonalNeutral') }
    if (has('white') && has('black')) return { score: 1.1, note: t('c.blackWhite') }
    return { score: 1 }
  }

  // Earth tones
  if (both('earth')) return { score: 0.9, note: t('c.tonalEarth') }
  if (has('earth')) {
    const other = a.kind === 'earth' ? b : a
    if (other.kind === 'black') return { score: -0.3, warning: t('c.brownBlack') }
    if (other.kind === 'navy') return { score: 1.3, note: t('c.navyCamel') }
    if (other.kind === 'white' || other.kind === 'grey') return { score: 1 }
    if (other.kind === 'denim') return { score: 1.2, note: t('c.denimEarth') }
    if (other.kind === 'olive') return { score: 1, note: t('c.oliveEarth') }
    if (other.temp === 'warm') return { score: 0.9, note: t('c.warmOnEarth') }
    if (other.kind === 'pastel') return { score: 0.7 }
    return { score: 0.4 }
  }

  // Olive
  if (both('olive')) return { score: 0.7 }
  if (has('olive')) {
    const other = a.kind === 'olive' ? b : a
    if (other.neutral) return { score: 1, note: other.kind === 'white' ? t('c.oliveWhite') : undefined }
    if (other.kind === 'pastel') return { score: 0.6 }
    const d = hueDistance(75, other.h)
    if (d > 150) return { score: 0.9, note: t('c.oliveRed') }
    if (d < 40) return { score: 0.3 }
    return { score: 0.1 }
  }

  // Neutral grounding a colour
  if (a.neutral || b.neutral) {
    const n = a.neutral ? a : b
    const c = a.neutral ? b : a
    if (n.kind === 'white') return { score: 1.2, note: t('c.whitePop') }
    if (n.kind === 'black') return { score: 1.1, note: t('c.blackGrounds') }
    if (n.kind === 'navy') {
      if (c.kind === 'pastel') return { score: 1.2, note: t('c.navyPale') }
      if (c.temp === 'warm') return { score: 1.1, note: t('c.navyWarm') }
      return { score: 0.8 }
    }
    if (n.kind === 'grey') return { score: 1.1, note: t('c.greyBase') }
    if (n.kind === 'denim') return { score: 1.0 }
    return { score: 0.9 }
  }

  // Pastels
  if (both('pastel')) return { score: 0.8, note: t('c.pastels') }
  if (has('pastel')) {
    const d = hueDistance(a.h, b.h)
    if (d <= 40) return { score: 0.8, note: t('c.tonalShades') }
    if (d >= 150) return { score: 0.7 }
    return { score: 0.2 }
  }

  // Colour with colour
  const d = hueDistance(a.h, b.h)
  if (d <= 20) {
    if (Math.abs(a.l - b.l) < 0.12) return { score: 0.3, warning: t('c.tooSimilar') }
    return { score: 0.9, note: t('c.monochrome') }
  }
  if (d <= 60) return { score: 0.8, note: t('c.analogous') }
  if (d >= 150) {
    if (a.saturated && b.saturated) return { score: 0.2, warning: t('c.boldComplementary') }
    return { score: 1.0, note: t('c.complementary') }
  }
  if (a.saturated && b.saturated) return { score: -1.3, warning: t('c.clash') }
  return { score: -0.4, warning: t('c.disagree') }
}

export function nearestPaletteName(hex: string): string {
  const [r, g, b] = hexToRgb(hex)
  let best = PALETTE[0]
  let bestD = Infinity
  for (const p of PALETTE) {
    const [pr, pg, pb] = hexToRgb(p.hex)
    const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
    if (d < bestD) {
      bestD = d
      best = p
    }
  }
  return best.name
}

/** Human bucket used to count "how many colours" an outfit has. */
export function colorBucket(info: ColorInfo): string {
  if (info.neutral) return `n:${info.kind}`
  if (info.kind === 'earth' || info.kind === 'olive') return `e:${info.kind}`
  return `c:${Math.round(info.h / 30)}`
}

export function isChromatic(info: ColorInfo): boolean {
  return info.kind === 'color' || info.kind === 'pastel'
}

export function textColorOn(hex: string): string {
  const { l } = hexToHsl(hex)
  return l > 0.6 ? '#111' : '#fff'
}
