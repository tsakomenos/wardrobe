import type { ClothingItem } from '../types'
import { SUBTYPE_MAP } from '../data/subtypes'
import { nearestPaletteName } from './color'
import { pieceLabel } from '../labels'

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/** Build an item from a subtype, taking defaults (formality, warmth, styles) from the subtype catalogue. */
export function makeItem(partial: Partial<ClothingItem> & { subtype: string; colorHex: string }): ClothingItem {
  const def = SUBTYPE_MAP[partial.subtype]
  if (!def) throw new Error(`Unknown subtype ${partial.subtype}`)
  return {
    id: partial.id ?? newId(),
    name: partial.name ?? '',
    category: def.category,
    subtype: partial.subtype,
    colorHex: partial.colorHex.toUpperCase(),
    colorName: partial.colorName ?? nearestPaletteName(partial.colorHex),
    pattern: partial.pattern ?? 'solid',
    formality: partial.formality ?? def.formality,
    warmth: partial.warmth ?? def.warmth,
    styles: partial.styles ?? [...def.styles],
    favorite: partial.favorite ?? false,
    createdAt: partial.createdAt ?? Date.now(),
  }
}

export function itemTitle(item: ClothingItem): string {
  if (item.name) return item.name
  return pieceLabel(item.subtype, item.colorName)
}
