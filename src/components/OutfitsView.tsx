import { useMemo, useState } from 'react'
import type { ClothingItem, Season } from '../types'
import { ALL_SEASONS, SEASON_LABEL } from '../types'
import { OCCASIONS, OCCASION_MAP } from '../data/occasions'
import { generateOutfits } from '../engine/outfit'
import { gapForOccasion } from '../engine/shopping'
import { OutfitCard } from './OutfitCard'

interface Props {
  items: ClothingItem[]
  season: Season
  onSeason: (s: Season) => void
  onGoShop: () => void
}

export function OutfitsView({ items, season, onSeason, onGoShop }: Props) {
  const [occasionId, setOccasionId] = useState('casual')
  const [shown, setShown] = useState(8)
  const occasion = OCCASION_MAP[occasionId]

  const outfits = useMemo(() => generateOutfits(items, occasion, { season, limit: 30 }), [items, occasion, season])
  const gaps = useMemo(() => (outfits.length === 0 ? gapForOccasion(items, occasion, season) : []), [items, occasion, season, outfits.length])

  return (
    <section>
      <div className="toolbar col">
        <div className="chips scroll">
          {OCCASIONS.map((o) => (
            <button
              key={o.id}
              className={`chip big ${o.id === occasionId ? 'on' : ''}`}
              onClick={() => {
                setOccasionId(o.id)
                setShown(8)
              }}
            >
              <span className="emoji">{o.emoji}</span> {o.label}
            </button>
          ))}
        </div>
        <div className="row between">
          <div className="seg small">
            {ALL_SEASONS.map((s) => (
              <button key={s} className={s === season ? 'on' : ''} onClick={() => onSeason(s)}>
                {SEASON_LABEL[s]}
              </button>
            ))}
          </div>
          <p className="tip">
            {occasion.emoji} {occasion.tip}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <p>Add some clothes to your closet first.</p>
        </div>
      ) : outfits.length === 0 ? (
        <div className="empty">
          <h2>Nothing works for {occasion.label.toLowerCase()} in {SEASON_LABEL[season].toLowerCase()}</h2>
          {gaps.length > 0 ? (
            <p>
              You are missing {gaps.join(', ')}.
            </p>
          ) : (
            <p>Your pieces exist but none of them fit this formality and season together.</p>
          )}
          <button className="btn primary" onClick={onGoShop}>
            See what to buy
          </button>
        </div>
      ) : (
        <>
          <div className="outfit-grid">
            {outfits.slice(0, shown).map((o, idx) => (
              <OutfitCard key={o.id + idx} outfit={o} />
            ))}
          </div>
          {shown < outfits.length && (
            <div className="row center">
              <button className="btn" onClick={() => setShown((n) => n + 8)}>
                Show more
              </button>
            </div>
          )}
          {outfits[0].score < 68 && (
            <p className="hint">
              The best match scores only {outfits[0].score}. <button className="link" onClick={onGoShop}>See what would raise it.</button>
            </p>
          )}
        </>
      )}
    </section>
  )
}
