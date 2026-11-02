import type { ClothingItem } from '../types'
import { CATEGORY_LABEL, STYLE_LABEL } from '../types'
import { SUBTYPE_MAP } from '../data/subtypes'
import { itemTitle } from '../engine/items'
import { Swatch } from './Swatch'

interface Props {
  item: ClothingItem
  onClick: () => void
}

export function FormalityDots({ value }: { value: number }) {
  return (
    <span className="dots" title={`Formality ${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? 'dot on' : 'dot'} />
      ))}
    </span>
  )
}

export function ItemCard({ item, onClick }: Props) {
  const def = SUBTYPE_MAP[item.subtype]
  return (
    <button type="button" className="item-card" onClick={onClick}>
      <Swatch hex={item.colorHex} pattern={item.pattern} size={64} round={false} className="item-swatch" />
      <span className="item-body">
        <span className="item-title">
          {item.favorite && <span className="star">★</span>}
          {itemTitle(item)}
        </span>
        <span className="item-meta">
          {def?.label ?? item.subtype} · {CATEGORY_LABEL[item.category]}
        </span>
        <span className="item-meta">
          <FormalityDots value={item.formality} />
          <span className="muted"> {item.styles.map((s) => STYLE_LABEL[s]).join(', ')}</span>
        </span>
      </span>
    </button>
  )
}
