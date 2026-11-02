import type { ClothingItem, Outfit, Season } from '../types'
import type { Occasion } from '../data/occasions'
import { SUBTYPE_MAP } from '../data/subtypes'
import { colorBucket, describe, isChromatic, pairScore } from './color'
import { itemTitle } from './items'
import { t } from '../i18n'
import { lowerFirst, occasionLabel } from '../labels'

export interface GenerateOptions {
  season: Season
  limit?: number
  mustInclude?: string
  minScore?: number
  /** Skip the diversity filter and return every combination. */
  raw?: boolean
}

export const GOOD_SCORE = 68

function fmtItem(i: ClothingItem): string {
  return lowerFirst(itemTitle(i))
}

function occ_(occ: Occasion): string {
  return occasionLabel(occ).toLowerCase()
}

function seasonAllows(item: ClothingItem, season: Season): boolean {
  if (season === 'summer' && item.warmth === 'warm') return false
  if (season === 'winter' && item.warmth === 'light' && item.category !== 'top' && item.category !== 'accessory') return false
  if (season === 'winter' && item.category === 'accessory' && (item.subtype === 'sunglasses' || item.subtype === 'cap')) return false
  if (season === 'summer' && item.category === 'accessory' && (item.subtype === 'scarf' || item.subtype === 'beanie')) return false
  return true
}

function formalityNear(item: ClothingItem, occ: Occasion): boolean {
  const [min, max] = occ.formality
  return item.formality >= min - 1 && item.formality <= max + 1
}

interface CoreScore {
  score: number
  notes: string[]
  warnings: string[]
}

function scoreCore(core: ClothingItem[], shoes: ClothingItem | null, occ: Occasion, season: Season): CoreScore {
  let score = 40
  const notes: string[] = []
  const warnings: string[] = []
  const all = shoes ? [...core, shoes] : core
  const [min, max] = occ.formality

  // --- Formality ---
  const fs = all.map((i) => i.formality)
  const avg = fs.reduce((a, b) => a + b, 0) / fs.length
  if (avg >= min - 0.25 && avg <= max + 0.25) {
    score += 12
  } else {
    const dist = avg < min ? min - avg : avg - max
    score -= Math.round(14 * dist)
    warnings.push(avg < min ? t('n.formalityCasual', { occasion: occ_(occ) }) : t('n.formalityOver', { occasion: occ_(occ) }))
  }
  const spread = Math.max(...fs) - Math.min(...fs)
  if (spread >= 3) {
    const hi = all.find((i) => i.formality === Math.max(...fs))!
    const lo = all.find((i) => i.formality === Math.min(...fs))!
    score -= 10
    warnings.push(t('n.formalitySpread', { a: capitalise(fmtItem(hi)), b: fmtItem(lo) }))
  } else if (spread === 2) {
    score -= 3
  }

  // --- Style tags ---
  const matching = all.filter((i) => i.styles.some((s) => occ.styles.includes(s))).length
  const frac = matching / all.length
  score += Math.round(10 * frac)
  if (frac === 1) notes.push(t('n.styleAll', { occasion: occ_(occ) }))
  else if (frac < 0.5) warnings.push(t('n.styleFew'))

  // --- Colour harmony ---
  const pairs: [ClothingItem, ClothingItem][] = []
  for (let i = 0; i < core.length; i++) for (let j = i + 1; j < core.length; j++) pairs.push([core[i], core[j]])
  if (shoes) {
    const anchor = core.find((i) => i.category === 'bottom' || i.category === 'onepiece') ?? core[0]
    pairs.push([anchor, shoes])
  }
  let total = 0
  const seenNotes = new Set<string>()
  for (const [a, b] of pairs) {
    const r = pairScore(describe(a.colorHex), describe(b.colorHex))
    total += r.score
    if (r.note && !seenNotes.has(r.note)) {
      seenNotes.add(r.note)
      notes.push(r.note)
    }
    if (r.warning && !seenNotes.has(r.warning)) {
      seenNotes.add(r.warning)
      warnings.push(t('n.pair', { a: capitalise(fmtItem(a)), b: fmtItem(b), note: r.warning }))
    }
  }
  if (pairs.length) score += Math.round((total / pairs.length) * 12)

  const buckets = new Set(all.map((i) => colorBucket(describe(i.colorHex))))
  const chromatic = new Set(all.filter((i) => isChromatic(describe(i.colorHex))).map((i) => colorBucket(describe(i.colorHex))))
  if (chromatic.size > 2) {
    score -= chromatic.size > 3 ? 16 : 8
    warnings.push(t('n.tooMany'))
  } else if (chromatic.size === 0) {
    notes.push(t('n.allNeutral'))
    if (occ.mood === 'bright') {
      score -= 4
      warnings.push(t('n.popColour'))
    }
  } else if (chromatic.size === 1) {
    notes.push(t('n.oneColour'))
  }
  if (buckets.size > 4) score -= 5

  // --- Mood ---
  const infos = all.map((i) => describe(i.colorHex))
  const coreInfos = core.map((i) => describe(i.colorHex))
  if (occ.mood === 'dark') {
    const f = coreInfos.filter((c) => c.tone === 'dark').length / coreInfos.length
    score += Math.round(6 * f)
    if (f >= 0.75) notes.push(t('n.darkPalette'))
  } else if (occ.mood === 'light') {
    const f = coreInfos.filter((c) => c.tone === 'light').length / coreInfos.length
    score += Math.round(6 * f)
    if (f >= 0.5) notes.push(t('n.lightPalette'))
  } else if (occ.mood === 'bright') {
    if (infos.some((c) => c.saturated)) {
      score += 5
      notes.push(t('n.boldColour'))
    }
  } else if (occ.mood === 'muted') {
    if (coreInfos.some((c) => c.saturated && c.kind === 'color')) {
      score -= 6
      warnings.push(t('n.loudColour', { occasion: occ_(occ) }))
    } else {
      score += 3
    }
  }

  // --- Patterns ---
  const patterned = core.filter((i) => i.pattern !== 'solid' && i.pattern !== 'texture')
  if (patterned.length > 1) {
    score -= 7
    warnings.push(t('n.twoPatterns'))
  } else if (patterned.length === 1) {
    notes.push(t('n.patternInterest', { item: fmtItem(patterned[0]) }))
  }

  // --- Top/bottom contrast ---
  const top = core.find((i) => i.category === 'top')
  const bottom = core.find((i) => i.category === 'bottom')
  if (top && bottom) {
    const ti = describe(top.colorHex)
    const bi = describe(bottom.colorHex)
    if (isChromatic(ti) && isChromatic(bi) && Math.abs(ti.l - bi.l) < 0.08 && colorBucket(ti) === colorBucket(bi)) {
      score -= 4
      warnings.push(t('n.blend'))
    }
    if (ti.tone === 'light' && bi.tone === 'dark') notes.push(t('n.lightOverDark'))
  }

  // --- Shoes ---
  if (!shoes) {
    score -= 12
    warnings.push(t('n.noShoes'))
  } else {
    const s = describe(shoes.colorHex)
    const anchor = bottom ?? core.find((i) => i.category === 'onepiece')
    if (anchor) {
      const a = describe(anchor.colorHex)
      if (s.kind === 'earth' && a.kind === 'black' && shoes.formality >= 3) {
        score -= 6
        warnings.push(t('n.brownBlack'))
      }
      if (s.kind === 'white' && shoes.subtype === 'sneakers') notes.push(t('n.whiteSneakers'))
      if (s.kind === 'earth' && a.kind === 'navy') notes.push(t('n.brownNavy'))
    }
    if (occ.id === 'sport' && shoes.subtype !== 'running' && shoes.subtype !== 'sneakers') {
      score -= 15
      warnings.push(t('n.wrongSportShoes'))
    }
  }

  // --- Season & layers ---
  const outer = core.find((i) => i.category === 'outer')
  if (season === 'winter') {
    if (!outer) {
      score -= 8
      warnings.push(t('n.addLayer'))
    }
    if (top && top.warmth === 'light' && !outer) {
      score -= 6
    }
    if (outer && outer.warmth === 'warm') notes.push(t('n.warmEnough'))
  } else if (season === 'autumn' || season === 'spring') {
    if (!outer && occ.outer === 'encouraged') score -= 4
    if (season === 'autumn' && all.some((i) => i.warmth === 'light' && (i.category === 'bottom' || i.category === 'shoes'))) {
      score -= 8
      warnings.push(t('n.autumnLight'))
    }
    if (outer && outer.warmth === 'warm' && season === 'spring') score -= 3
  } else if (season === 'summer') {
    if (outer && occ.outer !== 'encouraged') score -= 4
    if (top && top.warmth === 'light') notes.push(t('n.lightFabric'))
  }
  if (outer && occ.outer === 'encouraged') {
    score += 5
    notes.push(t('n.outerFinishes', { item: fmtItem(outer) }))
  }
  if (outer && occ.outer === 'none') score -= 10

  // --- Occasion specials ---
  if (occ.id === 'wedding') {
    const white = core.find((i) => describe(i.colorHex).kind === 'white' && (i.category === 'onepiece' || i.category === 'bottom'))
    if (white) {
      score -= 20
      warnings.push(t('n.whiteWedding'))
    }
  }
  if (occ.id === 'meeting' || occ.id === 'work') {
    const navyOrCharcoal = core.some((i) => {
      const c = describe(i.colorHex)
      return c.kind === 'navy' || (c.kind === 'grey' && c.tone === 'dark')
    })
    if (navyOrCharcoal) {
      score += 3
      notes.push(t('n.professional'))
    }
  }

  // --- Favourites ---
  const favs = all.filter((i) => i.favorite).length
  score += favs * 2

  return { score, notes, warnings }
}

function scoreAccessory(acc: ClothingItem, core: ClothingItem[], shoes: ClothingItem | null, occ: Occasion, season: Season): { score: number; note?: string } | null {
  const [min, max] = occ.formality
  if (acc.formality < min - 1 || acc.formality > max + 1) return null
  if (!seasonAllows(acc, season)) return null
  let score = occ.accessories.includes(acc.subtype) ? 3 : 0
  let note: string | undefined
  const ai = describe(acc.colorHex)
  const def = SUBTYPE_MAP[acc.subtype]

  if (acc.subtype === 'belt') {
    if (!shoes) return null
    const shoeDef = SUBTYPE_MAP[shoes.subtype]
    if (!shoeDef?.leather) return null
    const si = describe(shoes.colorHex)
    const match = si.kind === ai.kind || (si.neutral && ai.neutral && si.kind !== 'white' && ai.kind !== 'white')
    if (match) {
      score += 5
      note = t('n.beltMatches')
    } else {
      return null
    }
  } else if (acc.subtype === 'tie') {
    const shirt = core.find((i) => i.subtype === 'dress_shirt' || i.subtype === 'shirt')
    if (!shirt || min < 4) return null
    const r = pairScore(ai, describe(shirt.colorHex))
    if (r.score < 0.3) return null
    score += 4 + r.score
    note = t('n.tieCompletes')
  } else if (acc.subtype === 'watch') {
    score += 2
  } else if (acc.subtype === 'scarf' || acc.subtype === 'beanie') {
    if (season !== 'autumn' && season !== 'winter') return null
    if (acc.subtype === 'scarf' && !core.some((i) => i.category === 'outer')) return null
    score += 2
  } else if (acc.subtype === 'sunglasses' || acc.subtype === 'cap') {
    if (season === 'winter') return null
    if (occ.mood === 'muted') return null
    if (season === 'autumn' && !occ.accessories.includes(acc.subtype)) return null
    score += 1
  } else if (acc.subtype === 'jewellery') {
    score += occ.styles.includes('elegant') ? 3 : 1
  } else {
    score += 1
  }

  if (def && !acc.styles.some((s) => occ.styles.includes(s)) && !def.styles.some((s) => occ.styles.includes(s))) score -= 2

  // Colour against the core pieces
  let total = 0
  for (const c of core) total += pairScore(ai, describe(c.colorHex)).score
  score += (total / Math.max(1, core.length)) * 1.5

  return score > 0 ? { score, note } : null
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function generateOutfits(closet: ClothingItem[], occ: Occasion, opts: GenerateOptions): Outfit[] {
  const { season, limit = 12, mustInclude, minScore = -Infinity, raw = false } = opts
  const fits = (i: ClothingItem) => seasonAllows(i, season) && formalityNear(i, occ)
  const by = (cat: ClothingItem['category']) => closet.filter((i) => i.category === cat && fits(i))

  const tops = by('top')
  const bottoms = by('bottom')
  const onepieces = by('onepiece')
  const outers = occ.outer === 'none' ? [] : by('outer')
  const shoes = by('shoes')
  const accessories = closet.filter((i) => i.category === 'accessory')

  const bases: ClothingItem[][] = []
  for (const t of tops) for (const b of bottoms) bases.push([t, b])
  for (const o of onepieces) bases.push([o])

  const shoeOptions: (ClothingItem | null)[] = shoes.length ? shoes : [null]
  const outerOptions: (ClothingItem | null)[] = [null, ...outers]

  const results: Outfit[] = []
  for (const base of bases) {
    for (const shoe of shoeOptions) {
      for (const outer of outerOptions) {
        const core = outer ? [...base, outer] : base
        const ids = [...core, ...(shoe ? [shoe] : [])].map((i) => i.id)
        if (mustInclude && !ids.includes(mustInclude)) {
          // may still be satisfied by an accessory below
          if (!accessories.some((a) => a.id === mustInclude)) continue
        }
        const cs = scoreCore(core, shoe, occ, season)
        let score = cs.score
        const notes = [...cs.notes]
        const chosen: ClothingItem[] = []
        const scored = accessories
          .map((a) => ({ a, r: scoreAccessory(a, core, shoe, occ, season) }))
          .filter((x): x is { a: ClothingItem; r: { score: number; note?: string } } => x.r !== null)
          .sort((x, y) => y.r.score - x.r.score)
        const usedSubtypes = new Set<string>()
        let others = 0
        let accBonus = 0
        for (const { a, r } of scored) {
          if (usedSubtypes.has(a.subtype)) continue
          const structural = a.subtype === 'belt' || a.subtype === 'tie'
          if (!structural && others >= 2) continue
          usedSubtypes.add(a.subtype)
          if (!structural) others++
          chosen.push(a)
          accBonus += Math.min(4, r.score)
          if (r.note) notes.push(r.note)
        }
        score += Math.min(8, accBonus)
        if (mustInclude && !ids.includes(mustInclude) && !chosen.some((a) => a.id === mustInclude)) continue
        const items = [...core, ...(shoe ? [shoe] : []), ...chosen]
        const final = Math.max(0, Math.min(100, Math.round(score)))
        if (final < minScore) continue
        results.push({ id: items.map((i) => i.id).join('|'), items, score: final, notes, warnings: cs.warnings })
      }
    }
  }

  results.sort((a, b) => b.score - a.score)
  if (raw) return results.slice(0, limit)

  // Diversity: do not show the same top+bottom pair more than twice
  const pairCount = new Map<string, number>()
  const topCount = new Map<string, number>()
  const out: Outfit[] = []
  const maxPerTop = mustInclude ? Infinity : 3
  for (const o of results) {
    const key = o.items
      .filter((i) => i.category === 'top' || i.category === 'bottom' || i.category === 'onepiece')
      .map((i) => i.id)
      .join('+')
    const top = o.items.find((i) => i.category === 'top' || i.category === 'onepiece')
    const n = pairCount.get(key) ?? 0
    const t = top ? (topCount.get(top.id) ?? 0) : 0
    if (n >= 2 || t >= maxPerTop) continue
    pairCount.set(key, n + 1)
    if (top) topCount.set(top.id, t + 1)
    out.push(o)
    if (out.length >= limit) break
  }
  return out
}

/** Distinct good combinations of top/bottom (or one-piece) and shoes for an occasion, keyed by those item ids. */
export function goodCombos(closet: ClothingItem[], occ: Occasion, season: Season, mustInclude?: string): Set<string> {
  const outs = generateOutfits(closet, occ, { season, limit: 20000, mustInclude, minScore: GOOD_SCORE, raw: true })
  const keys = new Set<string>()
  for (const o of outs) {
    keys.add(
      o.items
        .filter((i) => i.category === 'top' || i.category === 'bottom' || i.category === 'onepiece' || i.category === 'shoes')
        .map((i) => i.id)
        .sort()
        .join('+'),
    )
  }
  return keys
}

export function countGoodOutfits(closet: ClothingItem[], occ: Occasion, season: Season): number {
  return goodCombos(closet, occ, season).size
}
