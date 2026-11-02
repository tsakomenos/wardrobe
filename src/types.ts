export type Category = 'top' | 'bottom' | 'outer' | 'onepiece' | 'shoes' | 'accessory'
export type Pattern = 'solid' | 'stripes' | 'checks' | 'print' | 'texture'
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type StyleTag =
  | 'casual'
  | 'smart'
  | 'business'
  | 'formal'
  | 'sporty'
  | 'street'
  | 'minimal'
  | 'boho'
  | 'elegant'
export type Warmth = 'light' | 'mid' | 'warm'
export type WardrobeKind = 'any' | 'm' | 'w'

export interface ClothingItem {
  id: string
  name: string
  category: Category
  subtype: string
  colorHex: string
  colorName: string
  pattern: Pattern
  formality: number // 1 (very casual) .. 5 (black tie)
  warmth: Warmth
  styles: StyleTag[]
  favorite?: boolean
  createdAt: number
}

export interface Outfit {
  id: string
  items: ClothingItem[]
  score: number
  notes: string[]
  warnings: string[]
}

export const CATEGORY_LABEL: Record<Category, string> = {
  top: 'Tops',
  bottom: 'Bottoms',
  outer: 'Outerwear',
  onepiece: 'One-piece',
  shoes: 'Shoes',
  accessory: 'Accessories',
}

export const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[]

export const STYLE_LABEL: Record<StyleTag, string> = {
  casual: 'Casual',
  smart: 'Smart casual',
  business: 'Business',
  formal: 'Formal',
  sporty: 'Sporty',
  street: 'Streetwear',
  minimal: 'Minimal',
  boho: 'Boho',
  elegant: 'Elegant',
}

export const ALL_STYLES = Object.keys(STYLE_LABEL) as StyleTag[]
export const ALL_SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']
export const SEASON_LABEL: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
}
export const PATTERN_LABEL: Record<Pattern, string> = {
  solid: 'Solid',
  stripes: 'Stripes',
  checks: 'Checks',
  print: 'Print',
  texture: 'Texture',
}
