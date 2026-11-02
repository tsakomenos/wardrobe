import { useState } from 'react'
import type { Season } from './types'
import { useCloset } from './hooks/useCloset'
import { ClosetView } from './components/ClosetView'
import { OutfitsView } from './components/OutfitsView'
import { ShopView } from './components/ShopView'

type Tab = 'closet' | 'outfits' | 'shop'

function currentSeason(): Season {
  const m = new Date().getMonth() // 0..11
  if (m >= 2 && m <= 4) return 'spring'
  if (m >= 5 && m <= 8) return 'summer'
  if (m >= 9 && m <= 10) return 'autumn'
  return 'winter'
}

export default function App() {
  const closet = useCloset()
  const [tab, setTab] = useState<Tab>(closet.items.length ? 'outfits' : 'closet')
  const [season, setSeason] = useState<Season>(currentSeason)

  return (
    <div className="app">
      <header className="app-head">
        <div className="brand">
          <span className="logo" aria-hidden="true">
            👔
          </span>
          <div>
            <h1>Wardrobe</h1>
            <p className="sub">Colour-matched outfits from what you own</p>
          </div>
        </div>
        <nav className="tabs" aria-label="Sections">
          <button className={tab === 'closet' ? 'on' : ''} onClick={() => setTab('closet')}>
            Closet <span className="count">{closet.items.length}</span>
          </button>
          <button className={tab === 'outfits' ? 'on' : ''} onClick={() => setTab('outfits')}>
            Outfits
          </button>
          <button className={tab === 'shop' ? 'on' : ''} onClick={() => setTab('shop')}>
            What to buy
          </button>
        </nav>
      </header>

      <main>
        {tab === 'closet' && (
          <ClosetView items={closet.items} onAdd={closet.add} onUpdate={closet.update} onRemove={closet.remove} onReplaceAll={closet.replaceAll} />
        )}
        {tab === 'outfits' && <OutfitsView items={closet.items} season={season} onSeason={setSeason} onGoShop={() => setTab('shop')} />}
        {tab === 'shop' && (
          <ShopView
            items={closet.items}
            season={season}
            wardrobeKind={closet.settings.wardrobeKind}
            onWardrobeKind={(wardrobeKind) => closet.setSettings({ ...closet.settings, wardrobeKind })}
            onAddToCloset={closet.add}
          />
        )}
      </main>

      <footer className="app-foot">Everything is stored in this browser only. Use Export from the closet menu to back it up.</footer>
    </div>
  )
}
