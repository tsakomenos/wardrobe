import type { Category, Pattern, Season, StyleTag, Warmth } from './types'
import type { Occasion } from './data/occasions'
import type { Staple } from './data/staples'
import { SUBTYPE_MAP } from './data/subtypes'
import { getLang, t, tOr } from './i18n'

export const subtypeLabel = (key: string) => tOr(`st.${key}`, SUBTYPE_MAP[key]?.label ?? key)
export const colourLabel = (name: string) => tOr(`col.${name}`, name)
export const occasionLabel = (o: Occasion) => tOr(`occ.${o.id}`, o.label)
export const occasionTip = (o: Occasion) => tOr(`tip.${o.id}`, o.tip)
export const categoryLabel = (c: Category) => t(`cat.${c}`)
export const styleLabel = (s: StyleTag) => t(`style.${s}`)
export const seasonLabel = (s: Season) => t(`season.${s}`)
export const patternLabel = (p: Pattern) => t(`pattern.${p}`)
export const warmthLabel = (w: Warmth) => t(`warmth.${w}`)
export const formalityLabel = (n: number) => t(`formality.${n}`)
export const stapleWhy = (s: Staple) => tOr(`why.${s.subtype}.${s.color}`, s.why)

/** "Navy chinos" in English, "Chino σε ναυτικό μπλε" in Greek. */
export function pieceLabel(subtype: string, colorName: string): string {
  const type = subtypeLabel(subtype)
  const colour = colourLabel(colorName)
  if (getLang() === 'el') {
    // "Τζιν μπουφάν σε ντένιμ" is redundant
    if (colorName === 'Denim' && (subtype === 'denim_jacket' || subtype === 'jeans')) return type
    return `${type} σε ${colour.toLowerCase()}`
  }
  const typeLower = type.toLowerCase()
  if (typeLower.startsWith(colour.toLowerCase() + ' ')) return colour + typeLower.slice(colour.length)
  return `${colour} ${typeLower}`
}

export function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1)
}
