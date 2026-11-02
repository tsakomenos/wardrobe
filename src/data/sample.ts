import type { ClothingItem } from '../types'
import { makeItem } from '../engine/items'
import { paletteByName } from './palette'

function it(subtype: string, color: string, extra: Partial<ClothingItem> = {}): ClothingItem {
  const c = paletteByName(color)
  return makeItem({ subtype, colorHex: c.hex, colorName: c.name, ...extra })
}

/** A realistic starter closet so the app has something to work with. */
export function sampleCloset(): ClothingItem[] {
  return [
    it('tshirt', 'White'),
    it('tshirt', 'Black'),
    it('tshirt', 'Grey', { pattern: 'stripes' }),
    it('polo', 'Navy'),
    it('shirt', 'Light blue'),
    it('shirt', 'White', { name: 'Oxford shirt' }),
    it('linen_shirt', 'Sand'),
    it('sweater', 'Grey'),
    it('sweater', 'Burgundy', { favorite: true }),
    it('hoodie', 'Charcoal'),
    it('dress_shirt', 'White'),
    it('jeans', 'Dark denim', { favorite: true }),
    it('jeans', 'Light denim'),
    it('chinos', 'Beige'),
    it('chinos', 'Olive'),
    it('trousers', 'Grey'),
    it('shorts', 'Navy'),
    it('joggers', 'Black'),
    it('sports_top', 'Black'),
    it('blazer', 'Navy'),
    it('denim_jacket', 'Denim'),
    it('overcoat', 'Camel'),
    it('puffer', 'Black'),
    it('sneakers', 'White', { favorite: true }),
    it('running', 'Charcoal'),
    it('loafers', 'Brown'),
    it('chelsea', 'Dark brown'),
    it('belt', 'Brown'),
    it('watch', 'Charcoal'),
    it('sunglasses', 'Black'),
    it('scarf', 'Grey'),
  ]
}
