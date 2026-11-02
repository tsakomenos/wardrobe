import type { Outfit } from '../types'
import { itemTitle } from '../engine/items'
import { subtypeLabel } from '../labels'
import { Swatch } from './Swatch'

interface Props {
  outfit: Outfit
  compact?: boolean
}

export function scoreClass(score: number): string {
  if (score >= 78) return 'great'
  if (score >= 68) return 'good'
  if (score >= 55) return 'ok'
  return 'weak'
}

export function OutfitCard({ outfit, compact = false }: Props) {
  const core = outfit.items.filter((i) => i.category !== 'accessory')
  const acc = outfit.items.filter((i) => i.category === 'accessory')
  return (
    <article className={`outfit-card ${compact ? 'compact' : ''}`}>
      <header className="outfit-head">
        <div className="pieces">
          {core.map((i) => (
            <div key={i.id} className="piece" title={itemTitle(i)}>
              <Swatch hex={i.colorHex} pattern={i.pattern} size={compact ? 34 : 48} />
              <span className="piece-label">{subtypeLabel(i.subtype)}</span>
            </div>
          ))}
          {acc.length > 0 && <span className="plus">+</span>}
          {acc.map((i) => (
            <div key={i.id} className="piece small" title={itemTitle(i)}>
              <Swatch hex={i.colorHex} pattern={i.pattern} size={compact ? 22 : 28} />
              <span className="piece-label">{subtypeLabel(i.subtype)}</span>
            </div>
          ))}
        </div>
        <span className={`score ${scoreClass(outfit.score)}`}>{outfit.score}</span>
      </header>
      {!compact && (
        <div className="outfit-text">
          <p className="outfit-list">{outfit.items.map((i) => itemTitle(i)).join(' · ')}</p>
          {outfit.notes.length > 0 && (
            <ul className="notes">
              {outfit.notes.slice(0, 4).map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
          {outfit.warnings.length > 0 && (
            <ul className="warnings">
              {outfit.warnings.slice(0, 3).map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  )
}
