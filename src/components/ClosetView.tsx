import { useMemo, useRef, useState } from 'react'
import type { Category, ClothingItem } from '../types'
import { CATEGORIES } from '../types'
import { ItemCard } from './ItemCard'
import { ItemForm } from './ItemForm'
import { sampleCloset } from '../data/sample'
import { exportCloset, parseClosetImport } from '../hooks/useCloset'
import { t } from '../i18n'
import { categoryLabel } from '../labels'

interface Props {
  items: ClothingItem[]
  onAdd: (item: ClothingItem) => void
  onUpdate: (item: ClothingItem) => void
  onRemove: (id: string) => void
  onReplaceAll: (items: ClothingItem[]) => void
}

export function ClosetView({ items, onAdd, onUpdate, onRemove, onReplaceAll }: Props) {
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [editing, setEditing] = useState<ClothingItem | null>(null)
  const [adding, setAdding] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const visible = useMemo(() => (filter === 'all' ? items : items.filter((i) => i.category === filter)), [items, filter])
  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const i of items) c[i.category] = (c[i.category] ?? 0) + 1
    return c
  }, [items])

  function doExport() {
    const blob = new Blob([exportCloset(items)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wardrobe-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMenuOpen(false)
  }

  async function doImport(file: File) {
    try {
      const imported = parseClosetImport(await file.text())
      if (!imported.length) throw new Error('empty')
      if (items.length === 0 || confirm(t('closet.confirm.import', { n: items.length, m: imported.length }))) {
        onReplaceAll(imported)
      }
    } catch {
      alert(t('closet.import.error'))
    }
    setMenuOpen(false)
  }

  return (
    <section>
      <div className="toolbar">
        <div className="chips scroll">
          <button className={`chip ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>
            {t('closet.all')} <span className="count">{items.length}</span>
          </button>
          {CATEGORIES.map((c) => (
            <button key={c} className={`chip ${filter === c ? 'on' : ''}`} onClick={() => setFilter(c)}>
              {categoryLabel(c)} <span className="count">{counts[c] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          <button className="btn primary" onClick={() => setAdding(true)}>
            {t('closet.add')}
          </button>
          <div className="menu-wrap">
            <button className="btn" onClick={() => setMenuOpen((o) => !o)} aria-label={t('closet.more')}>
              ⋯
            </button>
            {menuOpen && (
              <div className="menu" onMouseLeave={() => setMenuOpen(false)}>
                <button
                  onClick={() => {
                    if (items.length === 0 || confirm(t('closet.confirm.sample'))) onReplaceAll(sampleCloset())
                    setMenuOpen(false)
                  }}
                >
                  {t('closet.menu.sample')}
                </button>
                <button onClick={doExport}>{t('closet.menu.export')}</button>
                <button onClick={() => fileRef.current?.click()}>{t('closet.menu.import')}</button>
                <button
                  className="danger"
                  onClick={() => {
                    if (confirm(t('closet.confirm.clear'))) onReplaceAll([])
                    setMenuOpen(false)
                  }}
                >
                  {t('closet.menu.clear')}
                </button>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void doImport(f)
                e.target.value = ''
              }}
            />
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <h2>{t('closet.empty.title')}</h2>
          <p>{t('closet.empty.body')}</p>
          <div className="row center">
            <button className="btn primary" onClick={() => setAdding(true)}>
              {t('closet.empty.add')}
            </button>
            <button className="btn" onClick={() => onReplaceAll(sampleCloset())}>
              {t('closet.empty.sample')}
            </button>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty">
          <p>{t('closet.empty.category')}</p>
        </div>
      ) : (
        <div className="item-grid">
          {visible.map((i) => (
            <ItemCard key={i.id} item={i} onClick={() => setEditing(i)} />
          ))}
        </div>
      )}

      {adding && (
        <ItemForm
          onClose={() => setAdding(false)}
          onSave={(it) => {
            onAdd(it)
            setAdding(false)
          }}
        />
      )}
      {editing && (
        <ItemForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(it) => {
            onUpdate(it)
            setEditing(null)
          }}
          onDelete={(id) => {
            onRemove(id)
            setEditing(null)
          }}
        />
      )}
    </section>
  )
}
