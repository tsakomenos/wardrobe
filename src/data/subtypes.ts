import type { Category, StyleTag, Warmth, WardrobeKind } from '../types'

export interface SubtypeDef {
  key: string
  label: string
  category: Category
  formality: number
  warmth: Warmth
  styles: StyleTag[]
  leather?: boolean // shoes/belts whose leather colour should match
  kind?: WardrobeKind
}

export const SUBTYPES: SubtypeDef[] = [
  // Tops
  { key: 'tshirt', label: 'T-shirt', category: 'top', formality: 1, warmth: 'light', styles: ['casual', 'street', 'minimal'] },
  { key: 'tank', label: 'Tank top', category: 'top', formality: 1, warmth: 'light', styles: ['casual', 'sporty'] },
  { key: 'polo', label: 'Polo', category: 'top', formality: 2, warmth: 'light', styles: ['casual', 'smart'] },
  { key: 'shirt', label: 'Casual shirt', category: 'top', formality: 3, warmth: 'mid', styles: ['smart', 'casual'] },
  { key: 'linen_shirt', label: 'Linen shirt', category: 'top', formality: 2, warmth: 'light', styles: ['casual', 'boho', 'smart'] },
  { key: 'dress_shirt', label: 'Dress shirt', category: 'top', formality: 4, warmth: 'mid', styles: ['business', 'formal'] },
  { key: 'blouse', label: 'Blouse', category: 'top', formality: 3, warmth: 'mid', styles: ['smart', 'business', 'elegant'], kind: 'w' },
  { key: 'sweater', label: 'Sweater / knit', category: 'top', formality: 3, warmth: 'warm', styles: ['smart', 'casual', 'minimal'] },
  { key: 'cardigan', label: 'Cardigan', category: 'top', formality: 3, warmth: 'warm', styles: ['smart', 'casual'] },
  { key: 'turtleneck', label: 'Turtleneck', category: 'top', formality: 3, warmth: 'warm', styles: ['minimal', 'smart', 'elegant'] },
  { key: 'hoodie', label: 'Hoodie', category: 'top', formality: 1, warmth: 'warm', styles: ['street', 'casual', 'sporty'] },
  { key: 'sweatshirt', label: 'Sweatshirt', category: 'top', formality: 1, warmth: 'warm', styles: ['street', 'casual', 'sporty'] },
  { key: 'sports_top', label: 'Sports top', category: 'top', formality: 1, warmth: 'light', styles: ['sporty'] },
  { key: 'waistcoat', label: 'Waistcoat', category: 'top', formality: 4, warmth: 'mid', styles: ['formal', 'business'] },
  // Bottoms
  { key: 'jeans', label: 'Jeans', category: 'bottom', formality: 2, warmth: 'mid', styles: ['casual', 'smart', 'street'] },
  { key: 'chinos', label: 'Chinos', category: 'bottom', formality: 3, warmth: 'mid', styles: ['smart', 'business', 'casual'] },
  { key: 'trousers', label: 'Dress trousers', category: 'bottom', formality: 4, warmth: 'mid', styles: ['business', 'formal'] },
  { key: 'shorts', label: 'Shorts', category: 'bottom', formality: 1, warmth: 'light', styles: ['casual', 'sporty'] },
  { key: 'cargo', label: 'Cargo pants', category: 'bottom', formality: 1, warmth: 'mid', styles: ['street', 'casual'] },
  { key: 'joggers', label: 'Joggers', category: 'bottom', formality: 1, warmth: 'mid', styles: ['sporty', 'street'] },
  { key: 'leggings', label: 'Leggings', category: 'bottom', formality: 1, warmth: 'mid', styles: ['sporty', 'casual'], kind: 'w' },
  { key: 'skirt', label: 'Skirt', category: 'bottom', formality: 3, warmth: 'light', styles: ['smart', 'elegant', 'boho'], kind: 'w' },
  { key: 'pencil_skirt', label: 'Pencil skirt', category: 'bottom', formality: 4, warmth: 'mid', styles: ['business', 'elegant'], kind: 'w' },
  // Outerwear
  { key: 'blazer', label: 'Blazer', category: 'outer', formality: 4, warmth: 'mid', styles: ['business', 'smart', 'formal'] },
  { key: 'suit_jacket', label: 'Suit jacket', category: 'outer', formality: 5, warmth: 'mid', styles: ['formal', 'business'] },
  { key: 'denim_jacket', label: 'Denim jacket', category: 'outer', formality: 2, warmth: 'mid', styles: ['casual', 'street'] },
  { key: 'leather_jacket', label: 'Leather jacket', category: 'outer', formality: 2, warmth: 'mid', styles: ['street', 'casual', 'elegant'] },
  { key: 'bomber', label: 'Bomber', category: 'outer', formality: 2, warmth: 'mid', styles: ['street', 'casual'] },
  { key: 'overshirt', label: 'Overshirt', category: 'outer', formality: 2, warmth: 'mid', styles: ['casual', 'smart'] },
  { key: 'overcoat', label: 'Overcoat', category: 'outer', formality: 4, warmth: 'warm', styles: ['business', 'elegant', 'formal'] },
  { key: 'trench', label: 'Trench coat', category: 'outer', formality: 4, warmth: 'mid', styles: ['smart', 'business', 'elegant'] },
  { key: 'puffer', label: 'Puffer / parka', category: 'outer', formality: 1, warmth: 'warm', styles: ['casual', 'street', 'sporty'] },
  { key: 'rain_jacket', label: 'Rain jacket', category: 'outer', formality: 1, warmth: 'mid', styles: ['casual', 'sporty'] },
  // One-piece
  { key: 'casual_dress', label: 'Casual dress', category: 'onepiece', formality: 2, warmth: 'light', styles: ['casual', 'boho'], kind: 'w' },
  { key: 'midi_dress', label: 'Midi dress', category: 'onepiece', formality: 3, warmth: 'mid', styles: ['smart', 'elegant'], kind: 'w' },
  { key: 'cocktail_dress', label: 'Cocktail dress', category: 'onepiece', formality: 4, warmth: 'light', styles: ['elegant', 'formal'], kind: 'w' },
  { key: 'gown', label: 'Evening gown', category: 'onepiece', formality: 5, warmth: 'light', styles: ['formal', 'elegant'], kind: 'w' },
  { key: 'jumpsuit', label: 'Jumpsuit', category: 'onepiece', formality: 3, warmth: 'mid', styles: ['smart', 'elegant'], kind: 'w' },
  { key: 'suit', label: 'Full suit', category: 'onepiece', formality: 5, warmth: 'mid', styles: ['formal', 'business'] },
  { key: 'tracksuit', label: 'Tracksuit', category: 'onepiece', formality: 1, warmth: 'mid', styles: ['sporty', 'street'] },
  // Shoes
  { key: 'sneakers', label: 'Sneakers', category: 'shoes', formality: 1, warmth: 'mid', styles: ['casual', 'street', 'smart'] },
  { key: 'running', label: 'Running shoes', category: 'shoes', formality: 1, warmth: 'mid', styles: ['sporty'] },
  { key: 'loafers', label: 'Loafers', category: 'shoes', formality: 3, warmth: 'mid', styles: ['smart', 'business'], leather: true },
  { key: 'boots', label: 'Boots', category: 'shoes', formality: 2, warmth: 'warm', styles: ['casual', 'street'], leather: true },
  { key: 'chelsea', label: 'Chelsea boots', category: 'shoes', formality: 3, warmth: 'warm', styles: ['smart', 'elegant', 'casual'], leather: true },
  { key: 'dress_shoes', label: 'Dress shoes', category: 'shoes', formality: 4, warmth: 'mid', styles: ['business', 'formal'], leather: true },
  { key: 'heels', label: 'Heels', category: 'shoes', formality: 4, warmth: 'mid', styles: ['elegant', 'formal', 'business'], leather: true, kind: 'w' },
  { key: 'flats', label: 'Flats', category: 'shoes', formality: 2, warmth: 'mid', styles: ['smart', 'casual'], leather: true, kind: 'w' },
  { key: 'sandals', label: 'Sandals', category: 'shoes', formality: 1, warmth: 'light', styles: ['casual', 'boho'] },
  { key: 'espadrilles', label: 'Espadrilles', category: 'shoes', formality: 1, warmth: 'light', styles: ['casual', 'boho'] },
  // Accessories
  { key: 'belt', label: 'Belt', category: 'accessory', formality: 3, warmth: 'mid', styles: ['smart', 'business', 'casual'], leather: true },
  { key: 'watch', label: 'Watch', category: 'accessory', formality: 3, warmth: 'mid', styles: ['smart', 'business', 'minimal'] },
  { key: 'bag', label: 'Bag', category: 'accessory', formality: 3, warmth: 'mid', styles: ['smart', 'business', 'elegant'] },
  { key: 'tie', label: 'Tie', category: 'accessory', formality: 4, warmth: 'mid', styles: ['business', 'formal'], kind: 'm' },
  { key: 'scarf', label: 'Scarf', category: 'accessory', formality: 3, warmth: 'warm', styles: ['smart', 'elegant', 'casual'] },
  { key: 'beanie', label: 'Beanie', category: 'accessory', formality: 1, warmth: 'warm', styles: ['street', 'casual'] },
  { key: 'cap', label: 'Cap / hat', category: 'accessory', formality: 1, warmth: 'light', styles: ['casual', 'street', 'sporty'] },
  { key: 'sunglasses', label: 'Sunglasses', category: 'accessory', formality: 2, warmth: 'light', styles: ['casual', 'smart', 'elegant'] },
  { key: 'jewellery', label: 'Jewellery', category: 'accessory', formality: 3, warmth: 'mid', styles: ['elegant', 'boho', 'minimal'] },
]

export const SUBTYPE_MAP: Record<string, SubtypeDef> = Object.fromEntries(SUBTYPES.map((s) => [s.key, s]))

export function subtypeLabel(key: string): string {
  return SUBTYPE_MAP[key]?.label ?? key
}
