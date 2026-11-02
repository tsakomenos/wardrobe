import { useMemo, useState } from 'react'
import type { ClothingItem, Season } from '../types'
import { ALL_SEASONS } from '../types'
import { OCCASIONS, OCCASION_MAP } from '../data/occasions'
import { generateOutfits } from '../engine/outfit'
import { gapForOccasion } from '../engine/shopping'
import { t, type Lang } from '../i18n'
import { occasionLabel, occasionTip, seasonLabel } from '../labels'
import { OutfitCard } from './OutfitCard'

interface Props {
  items: ClothingItem[]
  season: Season
  lang: Lang
  onSeason: (s: Season) => void
  onGoShop: () => void
}

export function OutfitsView({ items, season, lang, onSeason, onGoShop }: Props) {
  const [occasionId, setOccasionId] = useState('casual')
  const [shown, setShown] = useState(8)
  const occasion = OCCASION_MAP[occasionId]

  // lang is a dependency because the engine writes its explanations in the current language
  const outfits = useMemo(() => generateOutfits(items, occasion, { season, limit: 30 }), [items, occasion, season, lang])
  const gaps = useMemo(() => (outfits.length === 0 ? gapForOccasion(items, occasion, season) : []), [items, occasion, season, outfits.length, lang])

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
              <span className="emoji">{o.emoji}</span> {occasionLabel(o)}
            </button>
          ))}
        </div>
        <div className="row between">
          <div className="seg small">
            {ALL_SEASONS.map((s) => (
              <button key={s} className={s === season ? 'on' : ''} onClick={() => onSeason(s)}>
                {seasonLabel(s)}
              </button>
            ))}
          </div>
          <p className="tip">
            {occasion.emoji} {occasionTip(occasion)}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <p>{t('outfits.noItems')}</p>
        </div>
      ) : outfits.length === 0 ? (
        <div className="empty">
          <h2>{t('outfits.none.title', { occasion: occasionLabel(occasion).toLowerCase(), season: seasonLabel(season).toLowerCase() })}</h2>
          <p>{gaps.length > 0 ? t('outfits.none.missing', { gaps: gaps.join(', ') }) : t('outfits.none.generic')}</p>
          <button className="btn primary" onClick={onGoShop}>
            {t('outfits.seeShop')}
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
                {t('outfits.showMore')}
              </button>
            </div>
          )}
          {outfits[0].score < 68 && (
            <p className="hint">
              {t('outfits.hint', { score: outfits[0].score })}{' '}
              <button className="link" onClick={onGoShop}>
                {t('outfits.hint.link')}
              </button>
            </p>
          )}
        </>
      )}
    </section>
  )
}
