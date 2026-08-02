import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { useSettings } from './store/settings'
import { useSearch } from './api/search'
import { useUndoList, useRestoreUndo } from './api/undo'
import type { SearchResults, UndoEntry } from '@shared/types'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Leads from './pages/Leads'
import Deals from './pages/Deals'
import Tasks from './pages/Tasks'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import SetupWizard from './pages/SetupWizard'

function SearchDropdown({
  query,
  onClose,
}: {
  query: string
  onClose: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data } = useSearch(query)
  const results = data as SearchResults | undefined
  const groups: Array<{
    label: string
    items: Array<{ label: string; sub?: string; onClick: () => void }>
  }> = []

  if (results) {
    if (results.contacts.length > 0)
      groups.push({
        label: t('nav.contacts'),
        items: results.contacts.map((c) => ({
          label: `${c.firstName} ${c.lastName ?? ''}`.trim() || c.email || '—',
          sub: c.company ?? c.phone ?? undefined,
          onClick: () => {
            navigate('/contacts')
            onClose()
          },
        })),
      })
    if (results.leads.length > 0)
      groups.push({
        label: t('nav.leads'),
        items: results.leads.map((l) => ({
          label: l.name,
          sub: l.email ?? undefined,
          onClick: () => {
            navigate('/leads')
            onClose()
          },
        })),
      })
    if (results.deals.length > 0)
      groups.push({
        label: t('nav.deals'),
        items: results.deals.map((d) => ({
          label: d.title,
          sub: `${d.value}`,
          onClick: () => {
            navigate('/deals')
            onClose()
          },
        })),
      })
    if (results.tasks.length > 0)
      groups.push({
        label: t('nav.tasks'),
        items: results.tasks.map((t2) => ({
          label: t2.title,
          sub: t2.done
            ? t('tasks.done')
            : t2.dueAt
              ? new Date(t2.dueAt).toLocaleDateString()
              : undefined,
          onClick: () => {
            navigate('/tasks')
            onClose()
          },
        })),
      })
  }

  if (groups.length === 0) {
    groups.push({
      label: t('common.search'),
      items: [{ label: t('search.noResults'), onClick: onClose }],
    })
  }

  return (
    <div className="search-dropdown">
      {groups.map((group) => (
        <div key={group.label} className="search-group">
          <div className="search-group-label">{group.label}</div>
          {group.items.map((item, i) => (
            <button key={i} className="search-result-item" onClick={item.onClick}>
              <span className="search-result-label">{item.label}</span>
              {item.sub && <span className="search-result-sub">{item.sub}</span>}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

function UndoToast(): React.JSX.Element | null {
  const { t } = useTranslation()
  const { data: undoEntries } = useUndoList()
  const restore = useRestoreUndo()
  const [visible, setVisible] = useState(false)
  const [entry, setEntry] = useState<UndoEntry | null>(null)

  useEffect(() => {
    if (!undoEntries || undoEntries.length === 0) return
    const latest = undoEntries[0]
    if (latest === entry) return
    setEntry(latest)
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 8000)
    return () => clearTimeout(timer)
  }, [undoEntries, entry])

  if (!visible || !entry) return <></>

  return (
    <div className="undo-toast">
      <span>{t('undo.deleted', { label: entry.label })}</span>
      <button
        className="btn btn-sm"
        onClick={() => {
          void restore
            .mutateAsync({ entity: entry.entity, id: entry.id })
            .then(() => setVisible(false))
        }}
      >
        {t('undo.restore')}
      </button>
      <button className="btn btn-sm btn-ghost" onClick={() => setVisible(false)}>
        ×
      </button>
    </div>
  )
}

function AppLockScreen({ onUnlock }: { onUnlock: () => void }): React.JSX.Element {
  const { t } = useTranslation()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ok = await window.crm.settings.verifyPin(pin)
    if (ok) onUnlock()
    else {
      setError(t('lock.wrongPin'))
      setPin('')
    }
  }

  return (
    <div className="lock-screen">
      <div className="lock-card card">
        <h2>{t('lock.title')}</h2>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoFocus
            className="input"
            placeholder={t('lock.enterPin')}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value)
              setError(null)
            }}
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary">
            {t('lock.unlock')}
          </button>
        </form>
      </div>
    </div>
  )
}

function App(): React.JSX.Element {
  const { t } = useTranslation()
  const { language, setLanguage, hydrated, setupComplete } = useSettings()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [locked, setLocked] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Check if PIN is set and verify on mount
  useEffect(() => {
    if (!hydrated) return
    void window.crm.settings.hasPin().then((hasPin) => {
      if (hasPin) setLocked(true)
    })
  }, [hydrated])

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    void window.crm.settings.get().then((record) => {
      const { hydrate } = useSettings.getState()
      hydrate(record)
    })
  }, [])

  if (!hydrated) return <div className="boot-splash" />

  if (!setupComplete) {
    return <SetupWizard />
  }

  if (locked) {
    return <AppLockScreen onUnlock={() => setLocked(false)} />
  }

  const navItems = [
    { to: '/', key: 'dashboard' },
    { to: '/contacts', key: 'contacts' },
    { to: '/leads', key: 'leads' },
    { to: '/deals', key: 'deals' },
    { to: '/tasks', key: 'tasks' },
    { to: '/reports', key: 'reports' },
    { to: '/settings', key: 'settings' },
  ] as const

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <span className="brand-logo" aria-hidden="true">
              CE
            </span>
            <div className="brand-text">
              <strong>{t('app.name')}</strong>
              <small>{t('app.tagline')}</small>
            </div>
          </div>
          <nav className="nav">
            {navItems.map((item) => (
              <NavLink
                key={item.key}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {t(`nav.${item.key}`)}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-footer">v0.1.0</div>
        </aside>

        <div className="main-area">
          <header className="topbar">
            <div className="search-box" ref={searchRef}>
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSearch(e.target.value.trim().length >= 2)
                }}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setShowSearch(true)
                }}
              />
              {showSearch && searchQuery.trim().length >= 2 && (
                <SearchDropdown query={searchQuery} onClose={() => setShowSearch(false)} />
              )}
            </div>
            <div className="lang-toggle" role="group" aria-label="Language">
              <button
                className={language === 'en' ? 'active' : ''}
                onClick={() => setLanguage('en')}
              >
                English
              </button>
              <button
                className={language === 'bn' ? 'active' : ''}
                onClick={() => setLanguage('bn')}
              >
                বাংলা
              </button>
            </div>
          </header>

          <main className="content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
      <UndoToast />
    </>
  )
}

export default App
