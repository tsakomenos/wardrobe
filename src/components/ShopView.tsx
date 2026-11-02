import { useEffect, useState } from 'react'
import type { ClothingItem, Season, WardrobeKind } from '../types'
import { coverage, suggestPurchases, type OccasionCoverage, type Suggestion } from '../engine/shopping'
import { itemTitle, newId } from '../engine/items'
import { t, type Lang } from '../i18n'
import { occasionLabel, seasonLabel } from '../labels'
import { OutfitCard } from './OutfitCard'
import { Swatch } from './Swatch'

interface Props {
  items: ClothingItem[]
  season: Season
  lang: Lang
  wardrobeKind: WardrobeKind
  onWardrobeKind: (k: WardrobeKind) => void
  onAddToCloset: (item: ClothingItem) => void
}

const KINDS: WardrobeKind[] = ['any', 'm', 'w']

export function ShopView({ items, season, lang, wardrobeKind, onWardrobeKind, onAddToCloset }: Props) {
  const [result, setResult] = useState<{ suggestions: Suggestion[]; cov: OccasionCoverage[] } | null>(null)
  const [busy, setBusy] = useState(false)
  const [added, setAdded] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    setBusy(true)
    // Let the UI paint before the heavier analysis runs
    const timer = setTimeout(() => {
      const cov = coverage(items, season)
      const suggestions = suggestPurchases(items, season, wardrobeKind)
      if (!cancelled) {
        setResult({ suggestions, cov })
        setBusy(false)
      }
    }, 20)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [items, season, wardrobeKind, lang])

  if (items.length === 0) {
    return (
      <div className="empty">
        <p>{t('shop.empty')}</p>
      </div>
    )
  }

  const maxGood = Math.max(1, ...(result?.cov.map((c) => c.good) ?? [1]))

  return (
    <section>
      <div className="toolbar">
        <div className="seg small">
          {KINDS.map((k) => (
            <button key={k} className={k === wardrobeKind ? 'on' : ''} onClick={() => onWardrobeKind(k)}>
              {t(`shop.kind.${k}`)}
            </button>
          ))}
        </div>
        <p className="tip">{t('shop.computedFor', { season: seasonLabel(season).toLowerCase() })}</p>
      </div>

      {busy || !result ? (
        <div className="empty">
          <p>{t('shop.analysing')}</p>
        </div>
      ) : (
        <>
          <h2 className="section-title">{t('shop.coverage')}</h2>
          <div className="coverage">
            {result.cov.map((c) => (
              <div key={c.occasion.id} className="cov-row">
                <span className="cov-label">
                  {c.occasion.emoji} {occasionLabel(c.occasion)}
                </span>
                <span className="cov-bar">
                  <span
                    className={`cov-fill ${c.good === 0 ? 'zero' : c.good < 3 ? 'low' : ''}`}
                    style={{ width: `${Math.max(4, (Math.min(c.good, maxGood) / maxGood) * 100)}%` }}
                  />
                </span>
                <span className="cov-num">{c.good === 0 ? t('shop.cov.none') : c.good === 1 ? t('shop.cov.1') : t('shop.cov.n', { n: c.good })}</span>
              </div>
            ))}
          </div>

          <h2 className="section-title">{t('shop.buy')}</h2>
          {result.cov.every((c) => c.good >= 3) && result.suggestions.length > 0 && (
            <p className="tip" style={{ marginBottom: 10 }}>
              {t('shop.allCovered')}
            </p>
          )}
          {result.suggestions.length === 0 ? (
            <div className="empty">
              <p>{t('shop.nothing')}</p>
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
                      <span className={`tag ${s.kind}`}>{t(`shop.tag.${s.kind}`)}</span>
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
                            {u.occasion.emoji} {occasionLabel(u.occasion)} · {u.count}
                          </span>
                        ))}
                      </div>
                    )}
                    {s.example && (
                      <details>
                        <summary>{t('shop.example')}</summary>
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
                        {added.has(s.id) ? t('shop.added') : t('shop.bought')}
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
