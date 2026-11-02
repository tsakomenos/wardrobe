import { useEffect, useState } from 'react'
import type { Season } from './types'
import { useCloset } from './hooks/useCloset'
import { getLang, setLang, t, type Lang } from './i18n'
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
  const [lang, setLangState] = useState<Lang>(getLang)

  function toggleLang() {
    const next: Lang = lang === 'el' ? 'en' : 'el'
    setLang(next)
    setLangState(next)
  }

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = t('app.title')
  }, [lang])

  return (
    <div className="app">
      <header className="app-head">
        <div className="brand">
          <span className="logo" aria-hidden="true">
            👔
          </span>
          <div>
            <h1>{t('app.title')}</h1>
            <p className="sub">{t('app.sub')}</p>
          </div>
        </div>
        <div className="head-right">
          <nav className="tabs" aria-label="Sections">
            <button className={tab === 'closet' ? 'on' : ''} onClick={() => setTab('closet')}>
              {t('tab.closet')} <span className="count">{closet.items.length}</span>
            </button>
            <button className={tab === 'outfits' ? 'on' : ''} onClick={() => setTab('outfits')}>
              {t('tab.outfits')}
            </button>
            <button className={tab === 'shop' ? 'on' : ''} onClick={() => setTab('shop')}>
              {t('tab.shop')}
            </button>
          </nav>
          <button className="btn lang" onClick={toggleLang} title={lang === 'el' ? 'Switch to English' : 'Αλλαγή σε Ελληνικά'}>
            {t('lang.toggle')}
          </button>
        </div>
      </header>

      <main>
        {tab === 'closet' && (
          <ClosetView items={closet.items} onAdd={closet.add} onUpdate={closet.update} onRemove={closet.remove} onReplaceAll={closet.replaceAll} />
        )}
        {tab === 'outfits' && <OutfitsView items={closet.items} season={season} lang={lang} onSeason={setSeason} onGoShop={() => setTab('shop')} />}
        {tab === 'shop' && (
          <ShopView
            items={closet.items}
            season={season}
            lang={lang}
            wardrobeKind={closet.settings.wardrobeKind}
            onWardrobeKind={(wardrobeKind) => closet.setSettings({ ...closet.settings, wardrobeKind })}
            onAddToCloset={closet.add}
          />
        )}
      </main>

      <footer className="app-foot">{t('app.footer')}</footer>
    </div>
  )
}
