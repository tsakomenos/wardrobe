export interface PaletteColor {
  name: string
  hex: string
  group: 'neutral' | 'earth' | 'color'
}

export const PALETTE: PaletteColor[] = [
  { name: 'White', hex: '#FFFFFF', group: 'neutral' },
  { name: 'Cream', hex: '#F3EBD8', group: 'neutral' },
  { name: 'Light grey', hex: '#C9CBCF', group: 'neutral' },
  { name: 'Grey', hex: '#8A8F96', group: 'neutral' },
  { name: 'Charcoal', hex: '#3C4046', group: 'neutral' },
  { name: 'Black', hex: '#141414', group: 'neutral' },
  { name: 'Navy', hex: '#1E2A47', group: 'neutral' },
  { name: 'Light denim', hex: '#8FB0D6', group: 'neutral' },
  { name: 'Denim', hex: '#4A6A9C', group: 'neutral' },
  { name: 'Dark denim', hex: '#2B3F63', group: 'neutral' },
  { name: 'Sand', hex: '#E5D5B7', group: 'earth' },
  { name: 'Beige', hex: '#D9C7A5', group: 'earth' },
  { name: 'Khaki', hex: '#A79A6E', group: 'earth' },
  { name: 'Tan', hex: '#C7A26E', group: 'earth' },
  { name: 'Camel', hex: '#B9834F', group: 'earth' },
  { name: 'Brown', hex: '#6F4A2C', group: 'earth' },
  { name: 'Dark brown', hex: '#3F2B1C', group: 'earth' },
  { name: 'Olive', hex: '#6B6D3C', group: 'earth' },
  { name: 'Burgundy', hex: '#6E1F2F', group: 'color' },
  { name: 'Red', hex: '#C1392B', group: 'color' },
  { name: 'Coral', hex: '#E8705F', group: 'color' },
  { name: 'Rust', hex: '#B3552B', group: 'color' },
  { name: 'Orange', hex: '#E07B39', group: 'color' },
  { name: 'Mustard', hex: '#D4A017', group: 'color' },
  { name: 'Yellow', hex: '#F2C94C', group: 'color' },
  { name: 'Sage', hex: '#9CAF88', group: 'color' },
  { name: 'Mint', hex: '#A8D5C2', group: 'color' },
  { name: 'Green', hex: '#2E8B57', group: 'color' },
  { name: 'Forest green', hex: '#1F5F3B', group: 'color' },
  { name: 'Teal', hex: '#1F7A7A', group: 'color' },
  { name: 'Turquoise', hex: '#3AB4C4', group: 'color' },
  { name: 'Light blue', hex: '#B9D4EC', group: 'color' },
  { name: 'Sky blue', hex: '#8DBCE6', group: 'color' },
  { name: 'Royal blue', hex: '#2851A3', group: 'color' },
  { name: 'Lavender', hex: '#B39DDB', group: 'color' },
  { name: 'Purple', hex: '#6A3DA3', group: 'color' },
  { name: 'Pink', hex: '#F2A6C2', group: 'color' },
  { name: 'Hot pink', hex: '#E0338B', group: 'color' },
]

export function paletteByName(name: string): PaletteColor {
  const c = PALETTE.find((p) => p.name === name)
  if (!c) throw new Error(`Unknown palette colour: ${name}`)
  return c
}
