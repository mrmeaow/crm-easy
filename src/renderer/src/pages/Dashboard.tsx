import { useTranslation } from 'react-i18next'
import { useContactCount } from '../api/contacts'
import { useLeads } from '../api/leads'
import { useDeals } from '../api/deals'
import { useOpenTaskCount } from '../api/tasks'
import { formatNumber } from '@shared/format'
import { useSettings } from '../store/settings'

interface MetricCardProps {
  label: string
  value?: string | number
}

function MetricCard({ label, value }: MetricCardProps): React.JSX.Element {
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value ?? '—'}</span>
    </div>
  )
}

function Dashboard(): React.JSX.Element {
  const { t } = useTranslation()
  const { language } = useSettings()
  const contactCount = useContactCount()
  const { data: leads } = useLeads()
  const { data: deals } = useDeals()
  const openTaskCount = useOpenTaskCount()

  return (
    <section className="page">
      <header className="page-header">
        <h1>{t('dashboard.title')}</h1>
        <p>
          {t('dashboard.welcome')} — {t('app.tagline')}
        </p>
      </header>

      <div className="metrics-grid">
        <MetricCard
          label={t('dashboard.contacts')}
          value={contactCount === undefined ? undefined : formatNumber(contactCount, language)}
        />
        <MetricCard
          label={t('dashboard.leads')}
          value={leads === undefined ? undefined : formatNumber(leads.length, language)}
        />
        <MetricCard
          label={t('dashboard.deals')}
          value={deals === undefined ? undefined : formatNumber(deals.length, language)}
        />
        <MetricCard
          label={t('dashboard.openTasks')}
          value={openTaskCount === undefined ? undefined : formatNumber(openTaskCount, language)}
        />
      </div>

      <div className="placeholder-card">{t('dashboard.comingSoon')}</div>
    </section>
  )
}

export default Dashboard
