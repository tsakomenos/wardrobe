import { useCallback, useEffect, useState } from 'react'
import type { ClothingItem, WardrobeKind } from '../types'

const KEY = 'wardrobe.closet.v1'
const SETTINGS_KEY = 'wardrobe.settings.v1'

export interface Settings {
  wardrobeKind: WardrobeKind
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable: keep in memory only */
  }
}

export function useCloset() {
  const [items, setItems] = useState<ClothingItem[]>(() => load<ClothingItem[]>(KEY, []))
  const [settings, setSettings] = useState<Settings>(() => load<Settings>(SETTINGS_KEY, { wardrobeKind: 'any' }))

  useEffect(() => save(KEY, items), [items])
  useEffect(() => save(SETTINGS_KEY, settings), [settings])

  const add = useCallback((item: ClothingItem) => setItems((xs) => [item, ...xs]), [])
  const update = useCallback((item: ClothingItem) => setItems((xs) => xs.map((x) => (x.id === item.id ? item : x))), [])
  const remove = useCallback((id: string) => setItems((xs) => xs.filter((x) => x.id !== id)), [])
  const replaceAll = useCallback((xs: ClothingItem[]) => setItems(xs), [])

  return { items, add, update, remove, replaceAll, settings, setSettings }
}

export function exportCloset(items: ClothingItem[]): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), items }, null, 2)
}

export function parseClosetImport(text: string): ClothingItem[] {
  const data = JSON.parse(text) as { items?: unknown } | unknown[]
  const arr = Array.isArray(data) ? data : data.items
  if (!Array.isArray(arr)) throw new Error('No items array found')
  return arr.filter((x): x is ClothingItem => typeof x === 'object' && x !== null && 'id' in x && 'subtype' in x && 'colorHex' in x)
}
