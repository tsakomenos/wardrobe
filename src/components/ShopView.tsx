import { useEffect, useState } from 'react'
import type { ClothingItem, Season, WardrobeKind } from '../types'
import { SEASON_LABEL } from '../types'
import { coverage, suggestPurchases, type OccasionCoverage, type Suggestion } from '../engine/shopping'
import { OutfitCard } from './OutfitCard'
import { Swatch } from './Swatch'
import { itemTitle, newId } from '../engine/items'

interface Props {
  items: ClothingItem[]
  season: Season
  wardrobeKind: WardrobeKind
  onWardrobeKind: (k: WardrobeKind) => void
  onAddToCloset: (item: ClothingItem) => void
}

const KIND_LABEL: Record<WardrobeKind, string> = { any: 'Everything', m: 'Menswear', w: 'Womenswear' }

export function ShopView({ items, season, wardrobeKind, onWardrobeKind, onAddToCloset }: Props) {
  const [result, setResult] = useState<{ suggestions: Suggestion[]; cov: OccasionCoverage[] } | null>(null)
  const [busy, setBusy] = useState(false)
  const [added, setAdded] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    setBusy(true)
    // Let the UI paint before the heavier analysis runs
    const t = setTimeout(() => {
      const cov = coverage(items, season)
      const suggestions = suggestPurchases(items, season, wardrobeKind)
      if (!cancelled) {
        setResult({ suggestions, cov })
        setBusy(false)
      }
    }, 20)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [items, season, wardrobeKind])

  if (items.length === 0) {
    return (
      <div className="empty">
        <p>Add your clothes first, then the advisor can tell you what is missing.</p>
      </div>
    )
  }

  const maxGood = Math.max(1, ...(result?.cov.map((c) => c.good) ?? [1]))

  return (
    <section>
      <div className="toolbar">
        <div className="seg small">
          {(Object.keys(KIND_LABEL) as WardrobeKind[]).map((k) => (
            <button key={k} className={k === wardrobeKind ? 'on' : ''} onClick={() => onWardrobeKind(k)}>
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <p className="tip">Suggestions are computed for {SEASON_LABEL[season].toLowerCase()} (change the season on the Outfits tab).</p>
      </div>

      {busy || !result ? (
        <div className="empty">
          <p>Analysing your closet…</p>
        </div>
      ) : (
        <>
          <h2 className="section-title">How well your closet covers each occasion</h2>
          <div className="coverage">
            {result.cov.map((c) => (
              <div key={c.occasion.id} className="cov-row">
                <span className="cov-label">
                  {c.occasion.emoji} {c.occasion.label}
                </span>
                <span className="cov-bar">
                  <span className={`cov-fill ${c.good === 0 ? 'zero' : c.good < 3 ? 'low' : ''}`} style={{ width: `${Math.max(4, (Math.min(c.good, maxGood) / maxGood) * 100)}%` }} />
                </span>
                <span className="cov-num">{c.good === 0 ? 'none' : `${c.good} good combo${c.good === 1 ? '' : 's'}`}</span>
              </div>
            ))}
          </div>

          <h2 className="section-title">What to buy next</h2>
          {result.cov.every((c) => c.good >= 3) && result.suggestions.length > 0 && (
            <p className="tip" style={{ marginBottom: 10 }}>
              Your closet already covers every occasion. These pieces add the most new combinations.
            </p>
          )}
          {result.suggestions.length === 0 ? (
            <div className="empty">
              <p>Nothing stands out. Your closet covers the staples.</p>
            </div>
          ) : (
            <div className="shop-list">
              {result.suggestions.map((s, idx) => (
                <article key={s.id} className="shop-card">
                  <div className="shop-rank">{idx + 1}</div>
                  <Swatch hex={s.item.colorHex} size={56} round={false} className="shop-swatch" />
                  <div className="shop-body">
                    <h3>
                      {s.label}
                      <span className={`tag ${s.kind}`}>{s.kind === 'gap' ? 'fills a gap' : s.kind === 'accessory' ? 'finishing touch' : 'more variety'}</span>
                    </h3>
                    <p className="why">{s.why}</p>
                    <ul className="reasons">
                      {s.reasons.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                    {s.unlocks.length > 0 && (
                      <div className="chips tiny">
                        {s.unlocks.slice(0, 6).map((u) => (
                          <span key={u.occasion.id} className={`chip static ${u.fromZero ? 'highlight' : ''}`}>
                            {u.occasion.emoji} {u.occasion.label} · {u.count}
                          </span>
                        ))}
                      </div>
                    )}
                    {s.example && (
                      <details>
                        <summary>Example outfit it unlocks</summary>
                        <OutfitCard outfit={s.example} compact />
                        <p className="outfit-list">{s.example.items.map((i) => itemTitle(i)).join(' · ')}</p>
                      </details>
                    )}
                    <div className="row">
                      <button
                        className="btn small"
                        disabled={added.has(s.id)}
                        onClick={() => {
                          onAddToCloset({ ...s.item, id: newId(), createdAt: Date.now() })
                          setAdded((a) => new Set(a).add(s.id))
                        }}
                      >
                        {added.has(s.id) ? 'Added to closet' : 'I bought it: add to closet'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
