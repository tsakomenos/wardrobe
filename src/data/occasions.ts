import type { StyleTag } from '../types'

export type Mood = 'any' | 'dark' | 'light' | 'bright' | 'muted'

export interface Occasion {
  id: string
  label: string
  emoji: string
  formality: [number, number]
  styles: StyleTag[]
  mood: Mood
  outer: 'none' | 'optional' | 'encouraged'
  accessories: string[] // subtype keys that suit the occasion
  tip: string
}

export const OCCASIONS: Occasion[] = [
  { id: 'casual', label: 'Casual day', emoji: '☕', formality: [1, 2], styles: ['casual', 'street', 'minimal'], mood: 'any', outer: 'optional', accessories: ['watch', 'cap', 'sunglasses', 'bag'], tip: 'Comfort first. One good piece carries the look.' },
  { id: 'work', label: 'Office', emoji: '💼', formality: [3, 4], styles: ['business', 'smart', 'minimal'], mood: 'any', outer: 'optional', accessories: ['watch', 'belt', 'bag'], tip: 'Neutral base, one accent at most.' },
  { id: 'meeting', label: 'Meeting / interview', emoji: '🤝', formality: [4, 5], styles: ['business', 'formal'], mood: 'muted', outer: 'encouraged', accessories: ['watch', 'belt', 'tie', 'bag'], tip: 'Navy or charcoal reads as trustworthy. Avoid loud colour.' },
  { id: 'smart', label: 'Dinner / smart casual', emoji: '🍷', formality: [2, 4], styles: ['smart', 'elegant', 'minimal'], mood: 'dark', outer: 'optional', accessories: ['watch', 'belt', 'jewellery', 'bag'], tip: 'Darker tones and clean fits look intentional at night.' },
  { id: 'date', label: 'Date', emoji: '💃', formality: [2, 4], styles: ['smart', 'elegant', 'casual'], mood: 'dark', outer: 'optional', accessories: ['watch', 'jewellery', 'belt'], tip: 'Dress one notch above the venue. Keep it simple.' },
  { id: 'party', label: 'Party / night out', emoji: '🎉', formality: [2, 4], styles: ['street', 'smart', 'elegant'], mood: 'bright', outer: 'optional', accessories: ['watch', 'jewellery', 'sunglasses'], tip: 'A bold piece or a pop of colour is welcome.' },
  { id: 'wedding', label: 'Wedding / formal event', emoji: '💍', formality: [4, 5], styles: ['formal', 'elegant'], mood: 'muted', outer: 'encouraged', accessories: ['watch', 'tie', 'belt', 'jewellery'], tip: 'Formal, polished, and never white as a guest.' },
  { id: 'brunch', label: 'Weekend brunch', emoji: '🥐', formality: [2, 3], styles: ['smart', 'casual', 'boho'], mood: 'light', outer: 'optional', accessories: ['sunglasses', 'watch', 'bag'], tip: 'Lighter colours and relaxed smart pieces.' },
  { id: 'beach', label: 'Beach / summer', emoji: '🏖️', formality: [1, 2], styles: ['casual', 'boho'], mood: 'light', outer: 'none', accessories: ['sunglasses', 'cap'], tip: 'Light fabrics, light colours, open shoes.' },
  { id: 'sport', label: 'Gym / sport', emoji: '🏃', formality: [1, 1], styles: ['sporty'], mood: 'any', outer: 'none', accessories: ['cap'], tip: 'Function over form. Match tones for a put-together look.' },
  { id: 'travel', label: 'Travel', emoji: '✈️', formality: [1, 3], styles: ['casual', 'minimal', 'smart'], mood: 'any', outer: 'encouraged', accessories: ['watch', 'bag', 'sunglasses'], tip: 'Layers in neutral colours that go with everything.' },
]

export const OCCASION_MAP: Record<string, Occasion> = Object.fromEntries(OCCASIONS.map((o) => [o.id, o]))
