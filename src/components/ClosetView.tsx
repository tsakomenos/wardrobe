import { useMemo, useRef, useState } from 'react'
import type { Category, ClothingItem } from '../types'
import { CATEGORIES, CATEGORY_LABEL } from '../types'
import { ItemCard } from './ItemCard'
import { ItemForm } from './ItemForm'
import { sampleCloset } from '../data/sample'
import { exportCloset, parseClosetImport } from '../hooks/useCloset'

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
      if (items.length === 0 || confirm(`Replace your ${items.length} items with the ${imported.length} imported ones?`)) {
        onReplaceAll(imported)
      }
    } catch {
      alert('Could not read that file. Export a closet from this app to see the format.')
    }
    setMenuOpen(false)
  }

  return (
    <section>
      <div className="toolbar">
        <div className="chips scroll">
          <button className={`chip ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>
            All <span className="count">{items.length}</span>
          </button>
          {CATEGORIES.map((c) => (
            <button key={c} className={`chip ${filter === c ? 'on' : ''}`} onClick={() => setFilter(c)}>
              {CATEGORY_LABEL[c]} <span className="count">{counts[c] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          <button className="btn primary" onClick={() => setAdding(true)}>
            + Add item
          </button>
          <div className="menu-wrap">
            <button className="btn" onClick={() => setMenuOpen((o) => !o)} aria-label="More">
              ⋯
            </button>
            {menuOpen && (
              <div className="menu" onMouseLeave={() => setMenuOpen(false)}>
                <button
                  onClick={() => {
                    if (items.length === 0 || confirm('Replace your closet with the example closet?')) onReplaceAll(sampleCloset())
                    setMenuOpen(false)
                  }}
                >
                  Load example closet
                </button>
                <button onClick={doExport}>Export JSON</button>
                <button onClick={() => fileRef.current?.click()}>Import JSON</button>
                <button
                  className="danger"
                  onClick={() => {
                    if (confirm('Delete every item in your closet?')) onReplaceAll([])
                    setMenuOpen(false)
                  }}
                >
                  Clear closet
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
          <h2>Your closet is empty</h2>
          <p>Add each piece you own with its colour and type. The app will then build outfits for any occasion and tell you what is missing.</p>
          <div className="row center">
            <button className="btn primary" onClick={() => setAdding(true)}>
              Add your first item
            </button>
            <button className="btn" onClick={() => onReplaceAll(sampleCloset())}>
              Try the example closet
            </button>
          </div>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty">
          <p>Nothing in this category yet.</p>
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
