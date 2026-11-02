import { useEffect, useState } from 'react'
import type { Category, ClothingItem, Pattern, StyleTag, Warmth } from '../types'
import { ALL_STYLES, CATEGORIES } from '../types'
import { SUBTYPES, SUBTYPE_MAP } from '../data/subtypes'
import { PALETTE } from '../data/palette'
import { makeItem } from '../engine/items'
import { nearestPaletteName } from '../engine/color'
import { t } from '../i18n'
import { categoryLabel, colourLabel, formalityLabel, patternLabel, styleLabel, subtypeLabel, warmthLabel } from '../labels'
import { Swatch } from './Swatch'

interface Props {
  initial?: ClothingItem
  onSave: (item: ClothingItem) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

const PATTERNS: Pattern[] = ['solid', 'stripes', 'checks', 'print', 'texture']
const WARMTHS: Warmth[] = ['light', 'mid', 'warm']

export function ItemForm({ initial, onSave, onDelete, onClose }: Props) {
  const [category, setCategory] = useState<Category>(initial?.category ?? 'top')
  const [subtype, setSubtype] = useState(initial?.subtype ?? 'tshirt')
  const [colorHex, setColorHex] = useState(initial?.colorHex ?? '#FFFFFF')
  const [colorName, setColorName] = useState(initial?.colorName ?? 'White')
  const [name, setName] = useState(initial?.name ?? '')
  const [pattern, setPattern] = useState<Pattern>(initial?.pattern ?? 'solid')
  const [formality, setFormality] = useState(initial?.formality ?? 1)
  const [warmth, setWarmth] = useState<Warmth>(initial?.warmth ?? 'light')
  const [styles, setStyles] = useState<StyleTag[]>(initial?.styles ?? ['casual'])
  const [favorite, setFavorite] = useState(initial?.favorite ?? false)
  const [customHex, setCustomHex] = useState('')

  const subtypesFor = SUBTYPES.filter((s) => s.category === category)

  function changeCategory(c: Category) {
    setCategory(c)
    const first = SUBTYPES.find((s) => s.category === c)
    if (first) changeSubtype(first.key)
  }

  function changeSubtype(key: string) {
    setSubtype(key)
    const def = SUBTYPE_MAP[key]
    if (def) {
      setFormality(def.formality)
      setWarmth(def.warmth)
      setStyles([...def.styles])
    }
  }

  function pickPalette(hex: string, nm: string) {
    setColorHex(hex)
    setColorName(nm)
    setCustomHex('')
  }

  function pickCustom(hex: string) {
    setCustomHex(hex)
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      setColorHex(hex.toUpperCase())
      setColorName(nearestPaletteName(hex))
    }
  }

  function toggleStyle(s: StyleTag) {
    setStyles((xs) => (xs.includes(s) ? xs.filter((x) => x !== s) : [...xs, s]))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    onSave(
      makeItem({
        id: initial?.id,
        createdAt: initial?.createdAt,
        subtype,
        colorHex,
        colorName,
        name: name.trim(),
        pattern,
        formality,
        warmth,
        styles: styles.length ? styles : [...(SUBTYPE_MAP[subtype]?.styles ?? ['casual'])],
        favorite,
      }),
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <header className="modal-head">
          <h2>{initial ? t('form.edit') : t('form.add')}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('form.close')}>
            ×
          </button>
        </header>

        <div className="modal-body">
          <div className="field">
            <span>{t('form.category')}</span>
            <div className="seg">
              {CATEGORIES.map((c) => (
                <button key={c} type="button" className={c === category ? 'on' : ''} onClick={() => changeCategory(c)}>
                  {categoryLabel(c)}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span>{t('form.type')}</span>
            <select value={subtype} onChange={(e) => changeSubtype(e.target.value)}>
              {subtypesFor.map((s) => (
                <option key={s.key} value={s.key}>
                  {subtypeLabel(s.key)}
                </option>
              ))}
            </select>
          </label>

          <div className="field">
            <span>
              {t('form.colour')}: <strong>{colourLabel(colorName)}</strong>
              <Swatch hex={colorHex} pattern={pattern} size={18} className="inline-swatch" />
            </span>
            <div className="palette">
              {PALETTE.map((p) => (
                <button
                  key={p.hex}
                  type="button"
                  className={`pal ${p.hex === colorHex ? 'on' : ''}`}
                  style={{ backgroundColor: p.hex }}
                  title={colourLabel(p.name)}
                  aria-label={colourLabel(p.name)}
                  onClick={() => pickPalette(p.hex, p.name)}
                />
              ))}
            </div>
            <div className="row">
              <input type="color" value={colorHex} onChange={(e) => pickCustom(e.target.value)} aria-label={t('form.custom')} />
              <input type="text" placeholder={t('form.hex')} value={customHex} onChange={(e) => pickCustom(e.target.value)} className="hex-input" />
            </div>
          </div>

          <div className="grid2">
            <label className="field">
              <span>{t('form.pattern')}</span>
              <select value={pattern} onChange={(e) => setPattern(e.target.value as Pattern)}>
                {PATTERNS.map((p) => (
                  <option key={p} value={p}>
                    {patternLabel(p)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{t('form.season')}</span>
              <select value={warmth} onChange={(e) => setWarmth(e.target.value as Warmth)}>
                {WARMTHS.map((w) => (
                  <option key={w} value={w}>
                    {warmthLabel(w)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>
              {t('form.formality')}: <strong>{formalityLabel(formality)}</strong>
            </span>
            <input type="range" min={1} max={5} step={1} value={formality} onChange={(e) => setFormality(Number(e.target.value))} />
          </label>

          <div className="field">
            <span>{t('form.style')}</span>
            <div className="chips">
              {ALL_STYLES.map((s) => (
                <button key={s} type="button" className={`chip ${styles.includes(s) ? 'on' : ''}`} onClick={() => toggleStyle(s)}>
                  {styleLabel(s)}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span>{t('form.name')}</span>
            <input type="text" value={name} placeholder={t('form.name.placeholder')} onChange={(e) => setName(e.target.value)} />
          </label>

          <label className="check">
            <input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} />
            <span>{t('form.favorite')}</span>
          </label>
        </div>

        <footer className="modal-foot">
          {initial && onDelete && (
            <button type="button" className="btn danger" onClick={() => onDelete(initial.id)}>
              {t('form.delete')}
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn" onClick={onClose}>
            {t('form.cancel')}
          </button>
          <button type="submit" className="btn primary">
            {initial ? t('form.save') : t('form.submit')}
          </button>
        </footer>
      </form>
    </div>
  )
}
