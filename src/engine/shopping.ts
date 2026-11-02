import type { ClothingItem, Outfit, Season, WardrobeKind } from '../types'
import { OCCASIONS, type Occasion } from '../data/occasions'
import { STAPLES, type Staple } from '../data/staples'
import { SUBTYPE_MAP } from '../data/subtypes'
import { paletteByName } from '../data/palette'
import { describe } from './color'
import { generateOutfits, goodCombos } from './outfit'
import { itemTitle, makeItem } from './items'
import { t } from '../i18n'
import { colourLabel, lowerFirst, occasionLabel, pieceLabel, stapleWhy } from '../labels'

export interface Suggestion {
  id: string
  item: ClothingItem // virtual item describing what to buy
  label: string
  why: string
  reasons: string[]
  impact: number
  unlocks: { occasion: Occasion; count: number; fromZero: boolean }[]
  example?: Outfit
  alreadyOwned: boolean
  kind: 'gap' | 'accessory' | 'versatility'
}

export interface OccasionCoverage {
  occasion: Occasion
  good: number
}

function stapleToItem(s: Staple): ClothingItem {
  const c = paletteByName(s.color)
  return makeItem({ subtype: s.subtype, colorHex: c.hex, colorName: c.name, id: `staple:${s.subtype}:${s.color}` })
}

function ownsSimilar(closet: ClothingItem[], item: ClothingItem): boolean {
  const want = describe(item.colorHex)
  return closet.some((c) => {
    if (c.subtype !== item.subtype) return false
    const have = describe(c.colorHex)
    if (have.kind === want.kind) return true
    // black / charcoal / navy of the same type are close enough
    return have.neutral && want.neutral && have.tone === 'dark' && want.tone === 'dark'
  })
}

function suitsSeason(item: ClothingItem, season: Season): boolean {
  if (season === 'summer') return item.warmth !== 'warm'
  if (season === 'winter') return !(item.warmth === 'light' && item.category !== 'top')
  if (season === 'autumn') return !(item.warmth === 'light' && (item.category === 'shoes' || item.category === 'bottom'))
  return true
}

export function coverage(closet: ClothingItem[], season: Season): OccasionCoverage[] {
  return coverageSets(closet, season).map(({ occasion, combos }) => ({ occasion, good: combos.size }))
}

function coverageSets(closet: ClothingItem[], season: Season): { occasion: Occasion; combos: Set<string> }[] {
  return OCCASIONS.map((occasion) => ({ occasion, combos: goodCombos(closet, occasion, season) }))
}

export function suggestPurchases(closet: ClothingItem[], season: Season, kind: WardrobeKind): Suggestion[] {
  const baseSets = coverageSets(closet, season)
  const baseMap = new Map(baseSets.map((b) => [b.occasion.id, b.combos]))

  const suggestions: Suggestion[] = []

  // With "everything" selected, only offer gendered staples if the closet already holds that kind of piece.
  const closetKinds = new Set(closet.map((i) => SUBTYPE_MAP[i.subtype]?.kind).filter((k): k is 'm' | 'w' => k === 'm' || k === 'w'))
  const allows = (k: WardrobeKind | undefined) => {
    if (!k || k === 'any') return true
    if (kind === 'any') return closetKinds.has(k)
    return k === kind
  }

  // 1. Versatility: how many good combinations would each staple add, weighted toward weak occasions?
  const candidates = STAPLES.filter((s) => allows(s.kind) && allows(SUBTYPE_MAP[s.subtype]?.kind))

  for (const s of candidates) {
    const item = stapleToItem(s)
    if (ownsSimilar(closet, item) || !suitsSeason(item, season)) continue
    const trial = [...closet, item]
    const unlocks: Suggestion['unlocks'] = []
    let impact = 0
    let example: Outfit | undefined
    let bestExample = 0
    for (const occ of OCCASIONS) {
      const baseline = baseMap.get(occ.id) ?? new Set<string>()
      const before = baseline.size
      // Only combinations that were not already good without the new piece count as unlocked
      let withItem = 0
      for (const k of goodCombos(trial, occ, season, item.id)) if (!baseline.has(k)) withItem++
      if (withItem === 0) continue
      // Weak occasions count for more; per-occasion contribution is capped so no single piece swamps the list
      const weight = 1 + 3 * (1 - Math.min(before, 10) / 10)
      impact += (10 * Math.min(withItem, 30)) / 30 * weight
      unlocks.push({ occasion: occ, count: withItem, fromZero: before === 0 })
      if (withItem > bestExample) {
        const ex = generateOutfits(trial, occ, { season, limit: 1, mustInclude: item.id })[0]
        if (ex) {
          example = ex
          bestExample = withItem
        }
      }
    }
    if (impact === 0) continue
    unlocks.sort((a, b) => Number(b.fromZero) - Number(a.fromZero) || b.count - a.count)
    const fromZero = unlocks.filter((u) => u.fromZero)
    const reasons: string[] = []
    if (fromZero.length) reasons.push(t('shop.unlock.first', { list: fromZero.map((u) => occasionLabel(u.occasion).toLowerCase()).join(', ') }))
    else reasons.push(t('shop.unlock.adds', { n: unlocks.reduce((a, u) => a + u.count, 0), k: unlocks.length }))
    suggestions.push({
      id: item.id,
      item,
      label: pieceLabel(s.subtype, s.color),
      why: stapleWhy(s),
      reasons,
      impact,
      unlocks,
      example,
      alreadyOwned: false,
      kind: fromZero.length ? 'gap' : 'versatility',
    })
  }

  // 2. Accessory rules: belt to match leather shoes, a watch, a tie for formal.
  const leatherShoes = closet.filter((i) => i.category === 'shoes' && SUBTYPE_MAP[i.subtype]?.leather)
  const belts = closet.filter((i) => i.subtype === 'belt')
  const shoeKinds = new Map<string, ClothingItem>()
  for (const s of leatherShoes) {
    const k = describe(s.colorHex).kind
    if (!shoeKinds.has(k)) shoeKinds.set(k, s)
  }
  for (const [k, shoe] of shoeKinds) {
    const hasBelt = belts.some((b) => describe(b.colorHex).kind === k)
    if (hasBelt) continue
    const colorName = k === 'earth' ? (describe(shoe.colorHex).tone === 'dark' ? 'Dark brown' : 'Brown') : k === 'black' ? 'Black' : null
    if (!colorName) continue
    const id = `rule:belt:${colorName}`
    if (suggestions.some((s) => s.id === id)) continue
    const pc = paletteByName(colorName)
    suggestions.push({
      id,
      item: makeItem({ subtype: 'belt', colorHex: pc.hex, colorName: pc.name, id }),
      label: t('shop.rule.belt.label', { colour: colourLabel(colorName), colourLower: colourLabel(colorName).toLowerCase() }),
      why: t('shop.rule.belt.why', { shoe: lowerFirst(itemTitle(shoe)) }),
      reasons: [t('shop.rule.belt.reason')],
      impact: 14,
      unlocks: [],
      alreadyOwned: false,
      kind: 'accessory',
    })
  }
  if (!closet.some((i) => i.subtype === 'watch')) {
    const pc = paletteByName('Charcoal')
    suggestions.push({
      id: 'rule:watch',
      item: makeItem({ subtype: 'watch', colorHex: pc.hex, colorName: pc.name, id: 'rule:watch' }),
      label: t('shop.rule.watch.label'),
      why: t('shop.rule.watch.why'),
      reasons: [t('shop.rule.watch.reason')],
      impact: 10,
      unlocks: [],
      alreadyOwned: false,
      kind: 'accessory',
    })
  }
  if (allows('m') && !closet.some((i) => i.subtype === 'tie') && closet.some((i) => i.subtype === 'dress_shirt' || i.subtype === 'suit' || i.subtype === 'blazer')) {
    const pc = paletteByName('Navy')
    suggestions.push({
      id: 'rule:tie',
      item: makeItem({ subtype: 'tie', colorHex: pc.hex, colorName: pc.name, id: 'rule:tie' }),
      label: t('shop.rule.tie.label'),
      why: t('shop.rule.tie.why'),
      reasons: [t('shop.rule.tie.reason')],
      impact: 9,
      unlocks: [],
      alreadyOwned: false,
      kind: 'accessory',
    })
  }

  // Remove staples the rules already cover
  const ruleSubtypes = new Set(suggestions.filter((s) => s.kind === 'accessory').map((s) => `${s.item.subtype}:${describe(s.item.colorHex).kind}`))
  const deduped = suggestions.filter((s) => s.kind === 'accessory' || !ruleSubtypes.has(`${s.item.subtype}:${describe(s.item.colorHex).kind}`))

  deduped.sort((a, b) => b.impact - a.impact)
  return deduped.slice(0, 14)
}

/** For an occasion with no good outfits, explain which slot is missing. */
export function gapForOccasion(closet: ClothingItem[], occ: Occasion, season: Season): string[] {
  const [min, max] = occ.formality
  const inRange = (i: ClothingItem) => i.formality >= min - 1 && i.formality <= max + 1
  const seasonOk = (i: ClothingItem) => !(season === 'summer' && i.warmth === 'warm')
  const have = (cat: ClothingItem['category']) => closet.some((i) => i.category === cat && inRange(i) && seasonOk(i))
  const gaps: string[] = []
  const hasBase = (have('top') && have('bottom')) || have('onepiece')
  if (!hasBase) {
    if (!have('top')) gaps.push(t('gap.top'))
    if (!have('bottom')) gaps.push(t('gap.bottom'))
  }
  if (!have('shoes')) gaps.push(t('gap.shoes'))
  if (occ.outer === 'encouraged' && !have('outer') && season !== 'summer') gaps.push(t('gap.outer'))
  return gaps
}
