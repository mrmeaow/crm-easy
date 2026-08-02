import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Route, Routes } from 'react-router-dom'
import { useSettings } from './store/settings'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Leads from './pages/Leads'
import Deals from './pages/Deals'
import Tasks from './pages/Tasks'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import SetupWizard from './pages/SetupWizard'

function App(): React.JSX.Element {
  const { t } = useTranslation()
  const { language, setLanguage, hydrated, setupComplete } = useSettings()

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
          <div className="search-box">
            <span aria-hidden="true">⌕</span>
            <input type="search" placeholder={t('common.search')} />
          </div>
          <div className="lang-toggle" role="group" aria-label="Language">
            <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>
              English
            </button>
            <button className={language === 'bn' ? 'active' : ''} onClick={() => setLanguage('bn')}>
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
  )
}

export default App
