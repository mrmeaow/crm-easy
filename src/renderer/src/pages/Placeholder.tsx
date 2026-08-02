import { useTranslation } from 'react-i18next'

function Placeholder({
  section,
}: {
  section: 'leads' | 'deals' | 'tasks' | 'reports'
}): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <section className="page">
      <header className="page-header">
        <h1>{t(`${section}.title`)}</h1>
        <p>{t(`${section}.subtitle`)}</p>
      </header>
      <div className="placeholder-card">{t('dashboard.comingSoon')}</div>
    </section>
  )
}

export default Placeholder
