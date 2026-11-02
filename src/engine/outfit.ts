import type { ClothingItem, Outfit, Season } from '../types'
import type { Occasion } from '../data/occasions'
import { SUBTYPE_MAP } from '../data/subtypes'
import { colorBucket, describe, isChromatic, pairScore } from './color'

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
  const label = SUBTYPE_MAP[i.subtype]?.label ?? i.subtype
  return `${i.colorName.toLowerCase()} ${label.toLowerCase()}`
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
    warnings.push(avg < min ? `A bit too casual for ${occ.label.toLowerCase()}` : `Overdressed for ${occ.label.toLowerCase()}`)
  }
  const spread = Math.max(...fs) - Math.min(...fs)
  if (spread >= 3) {
    const hi = all.find((i) => i.formality === Math.max(...fs))!
    const lo = all.find((i) => i.formality === Math.min(...fs))!
    score -= 10
    warnings.push(`${fmtItem(hi)} and ${fmtItem(lo)} sit at very different formality levels`)
  } else if (spread === 2) {
    score -= 3
  }

  // --- Style tags ---
  const matching = all.filter((i) => i.styles.some((s) => occ.styles.includes(s))).length
  const frac = matching / all.length
  score += Math.round(10 * frac)
  if (frac === 1) notes.push(`Every piece suits a ${occ.label.toLowerCase()} look`)
  else if (frac < 0.5) warnings.push('Most pieces lean a different style than the occasion')

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
      warnings.push(`${capitalise(fmtItem(a))} + ${fmtItem(b)}: ${r.warning.toLowerCase()}`)
    }
  }
  if (pairs.length) score += Math.round((total / pairs.length) * 12)

  const buckets = new Set(all.map((i) => colorBucket(describe(i.colorHex))))
  const chromatic = new Set(all.filter((i) => isChromatic(describe(i.colorHex))).map((i) => colorBucket(describe(i.colorHex))))
  if (chromatic.size > 2) {
    score -= chromatic.size > 3 ? 16 : 8
    warnings.push('Too many colours: keep it to two plus neutrals')
  } else if (chromatic.size === 0) {
    notes.push('All neutrals: clean and safe')
    if (occ.mood === 'bright') {
      score -= 4
      warnings.push('A pop of colour would lift this')
    }
  } else if (chromatic.size === 1) {
    notes.push('One colour, the rest neutral: easy to pull off')
  }
  if (buckets.size > 4) score -= 5

  // --- Mood ---
  const infos = all.map((i) => describe(i.colorHex))
  const coreInfos = core.map((i) => describe(i.colorHex))
  if (occ.mood === 'dark') {
    const f = coreInfos.filter((c) => c.tone === 'dark').length / coreInfos.length
    score += Math.round(6 * f)
    if (f >= 0.75) notes.push('Dark palette suits the evening')
  } else if (occ.mood === 'light') {
    const f = coreInfos.filter((c) => c.tone === 'light').length / coreInfos.length
    score += Math.round(6 * f)
    if (f >= 0.5) notes.push('Light palette fits the daytime mood')
  } else if (occ.mood === 'bright') {
    if (infos.some((c) => c.saturated)) {
      score += 5
      notes.push('Has a bold colour for the night')
    }
  } else if (occ.mood === 'muted') {
    if (coreInfos.some((c) => c.saturated && c.kind === 'color')) {
      score -= 6
      warnings.push(`Loud colour for ${occ.label.toLowerCase()}`)
    } else {
      score += 3
    }
  }

  // --- Patterns ---
  const patterned = core.filter((i) => i.pattern !== 'solid' && i.pattern !== 'texture')
  if (patterned.length > 1) {
    score -= 7
    warnings.push('Two patterns compete with each other')
  } else if (patterned.length === 1) {
    notes.push(`The ${fmtItem(patterned[0])} adds interest`)
  }

  // --- Top/bottom contrast ---
  const top = core.find((i) => i.category === 'top')
  const bottom = core.find((i) => i.category === 'bottom')
  if (top && bottom) {
    const t = describe(top.colorHex)
    const b = describe(bottom.colorHex)
    if (isChromatic(t) && isChromatic(b) && Math.abs(t.l - b.l) < 0.08 && colorBucket(t) === colorBucket(b)) {
      score -= 4
      warnings.push('Top and bottom blend into each other')
    }
    if (t.tone === 'light' && b.tone === 'dark') notes.push('Light top over dark bottom: classic balance')
  }

  // --- Shoes ---
  if (!shoes) {
    score -= 12
    warnings.push('No suitable shoes for this in your closet')
  } else {
    const s = describe(shoes.colorHex)
    const anchor = bottom ?? core.find((i) => i.category === 'onepiece')
    if (anchor) {
      const a = describe(anchor.colorHex)
      if (s.kind === 'earth' && a.kind === 'black' && shoes.formality >= 3) {
        score -= 6
        warnings.push('Brown shoes with black trousers is a hard combination')
      }
      if (s.kind === 'white' && shoes.subtype === 'sneakers') notes.push('White sneakers go with everything')
      if (s.kind === 'earth' && a.kind === 'navy') notes.push('Brown shoes with navy: textbook')
    }
    if (occ.id === 'sport' && shoes.subtype !== 'running' && shoes.subtype !== 'sneakers') {
      score -= 15
      warnings.push('Wrong shoes for sport')
    }
  }

  // --- Season & layers ---
  const outer = core.find((i) => i.category === 'outer')
  if (season === 'winter') {
    if (!outer) {
      score -= 8
      warnings.push('Add a layer: it is winter')
    }
    if (top && top.warmth === 'light' && !outer) {
      score -= 6
    }
    if (outer && outer.warmth === 'warm') notes.push('Warm enough for winter')
  } else if (season === 'autumn' || season === 'spring') {
    if (!outer && occ.outer === 'encouraged') score -= 4
    if (season === 'autumn' && all.some((i) => i.warmth === 'light' && (i.category === 'bottom' || i.category === 'shoes'))) {
      score -= 8
      warnings.push('Shorts or open shoes are a bit cool for autumn')
    }
    if (outer && outer.warmth === 'warm' && season === 'spring') score -= 3
  } else if (season === 'summer') {
    if (outer && occ.outer !== 'encouraged') score -= 4
    if (top && top.warmth === 'light') notes.push('Light fabric for the heat')
  }
  if (outer && occ.outer === 'encouraged') {
    score += 5
    notes.push(`The ${fmtItem(outer)} finishes the look`)
  }
  if (outer && occ.outer === 'none') score -= 10

  // --- Occasion specials ---
  if (occ.id === 'wedding') {
    const white = core.find((i) => describe(i.colorHex).kind === 'white' && (i.category === 'onepiece' || i.category === 'bottom'))
    if (white) {
      score -= 20
      warnings.push('Avoid white as a wedding guest')
    }
  }
  if (occ.id === 'meeting' || occ.id === 'work') {
    const navyOrCharcoal = core.some((i) => {
      const c = describe(i.colorHex)
      return c.kind === 'navy' || (c.kind === 'grey' && c.tone === 'dark')
    })
    if (navyOrCharcoal) {
      score += 3
      notes.push('Navy/charcoal reads as professional')
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
      note = 'Belt matches the shoes'
    } else {
      return null
    }
  } else if (acc.subtype === 'tie') {
    const shirt = core.find((i) => i.subtype === 'dress_shirt' || i.subtype === 'shirt')
    if (!shirt || min < 4) return null
    const r = pairScore(ai, describe(shirt.colorHex))
    if (r.score < 0.3) return null
    score += 4 + r.score
    note = 'Tie completes the formal look'
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
