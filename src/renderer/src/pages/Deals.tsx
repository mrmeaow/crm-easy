import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useContacts } from '../api/contacts'
import { useCreateDeal, useDeals, useDeleteDeal, useSettleDeal, useUpdateDeal } from '../api/deals'
import { useStages } from '../api/leads'
import { useSettings } from '../store/settings'
import { formatCurrency, formatDate } from '@shared/format'
import { weightedForecast } from '@shared/export'
import { inputToDate, dateToInput } from '../lib/datetime'
import type { Deal } from '@shared/types'
import EntityTimeline from '../components/EntityTimeline'

interface DealFormState {
  title: string
  value: string
  stageId: string
  contactId: string
  probability: string
  closeDate: string
  owner: string
}

const EMPTY_FORM: DealFormState = {
  title: '',
  value: '',
  stageId: '',
  contactId: '',
  probability: '',
  closeDate: '',
  owner: '',
}

function DealModal({
  deal,
  onClose,
}: {
  deal: Deal | 'new' | null
  onClose: () => void
}): React.JSX.Element | null {
  const { t } = useTranslation()
  const { data: stages } = useStages()
  const { data: contacts } = useContacts()
  const createDeal = useCreateDeal()
  const updateDeal = useUpdateDeal()
  const deleteDeal = useDeleteDeal()

  const [form, setForm] = useState<DealFormState>(
    deal === 'new' || deal === null
      ? EMPTY_FORM
      : {
          title: deal.title,
          value: deal.value ? String(deal.value) : '',
          stageId: deal.stageId != null ? String(deal.stageId) : '',
          contactId: deal.contactId != null ? String(deal.contactId) : '',
          probability: deal.probability ? String(deal.probability) : '',
          closeDate: deal.expectedCloseDate ? dateToInput(deal.expectedCloseDate) : '',
          owner: deal.owner ?? '',
        },
  )

  if (deal === null) return null
  const current = deal

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault()
    if (!form.title.trim()) return
    const input = {
      title: form.title.trim(),
      value: form.value ? Number(form.value) : 0,
      stageId: form.stageId ? Number(form.stageId) : null,
      contactId: form.contactId ? Number(form.contactId) : null,
      probability: form.probability ? Math.min(100, Math.max(0, Number(form.probability))) : 0,
      expectedCloseDate: inputToDate(form.closeDate),
      owner: form.owner || null,
    }
    if (current === 'new') {
      createDeal.mutate(input, { onSuccess: onClose })
    } else {
      updateDeal.mutate({ id: current.id, input }, { onSuccess: onClose })
    }
  }

  function handleDelete(): void {
    if (current !== 'new' && window.confirm(t('common.confirmDelete'))) {
      deleteDeal.mutate(current.id, { onSuccess: onClose })
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{current === 'new' ? t('deals.add') : t('deals.edit')}</h2>
        <label>
          <span>{t('deals.dealTitle')} *</span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            autoFocus
          />
        </label>
        <div className="modal-grid">
          <label>
            <span>{t('deals.value')}</span>
            <input
              type="number"
              min="0"
              step="any"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
          </label>
          <label>
            <span>{t('deals.stage')}</span>
            <select
              value={form.stageId}
              onChange={(e) => setForm({ ...form, stageId: e.target.value })}
            >
              {stages?.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="modal-grid">
          <label>
            <span>{t('deals.contact')}</span>
            <select
              value={form.contactId}
              onChange={(e) => setForm({ ...form, contactId: e.target.value })}
            >
              <option value="" />
              {contacts?.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.firstName} {contact.lastName ?? ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t('deals.owner')}</span>
            <input
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
            />
          </label>
        </div>
        <div className="modal-grid">
          <label>
            <span>{t('deals.probability')}</span>
            <input
              type="number"
              min="0"
              max="100"
              value={form.probability}
              onChange={(e) => setForm({ ...form, probability: e.target.value })}
            />
          </label>
          <label>
            <span>{t('deals.expectedCloseDate')}</span>
            <input
              type="date"
              value={form.closeDate}
              onChange={(e) => setForm({ ...form, closeDate: e.target.value })}
            />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          {deal !== 'new' && (
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              {t('common.delete')}
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={createDeal.isPending || updateDeal.isPending}
          >
            {t('common.save')}
          </button>
        </div>
        {deal !== 'new' && (
          <div className="modal-section">
            <EntityTimeline entityType="deal" entityId={deal.id} />
          </div>
        )}
      </form>
    </div>
  )
}

function SettleModal({
  deal,
  outcome,
  onClose,
}: {
  deal: Deal
  outcome: 'won' | 'lost'
  onClose: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const settleDeal = useSettleDeal()
  const [value, setValue] = useState(String(deal.value))
  const [reason, setReason] = useState('price')

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault()
    settleDeal.mutate(
      {
        id: deal.id,
        outcome,
        actualValue: outcome === 'won' ? Number(value) : undefined,
        reason: outcome === 'lost' ? reason : null,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{outcome === 'won' ? t('deals.winTitle') : t('deals.loseTitle')}</h2>
        <label>
          <span>{t('deals.dealTitle')}</span>
          <input value={deal.title} disabled />
        </label>
        {outcome === 'won' ? (
          <label>
            <span>{t('deals.winValue')}</span>
            <input
              type="number"
              min="0"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
          </label>
        ) : (
          <label>
            <span>{t('deals.loseReason')}</span>
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {(['price', 'timing', 'competitor', 'noResponse', 'other'] as const).map((r) => (
                <option key={r} value={r}>
                  {t(`deals.reason.${r}`)}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={settleDeal.isPending}>
            {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  )
}

function Deals(): React.JSX.Element {
  const { t } = useTranslation()
  const { currency, language } = useSettings()
  const { data: deals, isLoading, isError } = useDeals()
  const { data: stages } = useStages()
  const { data: contacts } = useContacts()
  const [modalDeal, setModalDeal] = useState<Deal | 'new' | null>(null)
  const [settle, setSettle] = useState<{ deal: Deal; outcome: 'won' | 'lost' } | null>(null)

  const openStages = new Set(
    (stages ?? []).filter((stage) => !stage.isWon && !stage.isLost).map((stage) => stage.id),
  )
  const openDeals = (deals ?? []).filter(
    (deal) => deal.stageId !== null && openStages.has(deal.stageId),
  )
  const pipelineTotal = openDeals.reduce((sum, deal) => sum + deal.value, 0)
  const forecast = weightedForecast(deals ?? [], openStages)
  const wonTotal = (deals ?? [])
    .filter((deal) => deal.wonAt != null)
    .reduce((sum, deal) => sum + deal.value, 0)

  const contactName = (id: number | null): string => {
    if (id == null) return '—'
    const contact = contacts?.find((item) => item.id === id)
    return contact ? `${contact.firstName} ${contact.lastName ?? ''}`.trim() : '—'
  }

  const stageName = (id: number | null): string => {
    if (id == null) return '—'
    return stages?.find((stage) => stage.id === id)?.name ?? '—'
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>{t('deals.title')}</h1>
          <p>{t('deals.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalDeal('new')}>
          + {t('deals.add')}
        </button>
      </header>

      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">{t('deals.pipelineTotal')}</span>
          <span className="metric-value">
            {pipelineTotal > 0 ? formatCurrency(pipelineTotal, currency, language) : '0'}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">{t('deals.weightedForecast')}</span>
          <span className="metric-value">
            {forecast > 0 ? formatCurrency(forecast, currency, language) : '0'}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">{t('deals.wonValue')}</span>
          <span className="metric-value">
            {wonTotal > 0 ? formatCurrency(wonTotal, currency, language) : '0'}
          </span>
        </div>
      </div>

      <div className="stage-summary">
        {stages?.map((stage) => {
          const stageDeals = (deals ?? []).filter((deal) => deal.stageId === stage.id)
          const stageTotal = stageDeals.reduce((sum, deal) => sum + deal.value, 0)
          return (
            <div key={stage.id} className="stage-summary-item">
              <span
                className="stage-dot"
                style={{ background: stage.color ?? 'var(--text-muted)' }}
              />
              <span className="stage-name">{stage.name}</span>
              <span className="stage-summary-count">{stageDeals.length}</span>
              <strong>
                {stageTotal > 0 ? formatCurrency(stageTotal, currency, language) : '0'}
              </strong>
            </div>
          )
        })}
      </div>

      <div className="card table-card">
        {isLoading && <p className="muted">{t('common.loading')}</p>}
        {isError && <p className="muted">{t('common.error')}</p>}
        {!isLoading && !isError && (deals?.length ?? 0) === 0 && (
          <p className="muted">{t('deals.empty')}</p>
        )}
        {!isLoading && !isError && (deals?.length ?? 0) > 0 && (
          <table>
            <thead>
              <tr>
                <th>{t('deals.dealTitle')}</th>
                <th>{t('deals.contact')}</th>
                <th>{t('deals.stage')}</th>
                <th>{t('deals.value')}</th>
                <th>{t('deals.probability')}</th>
                <th>{t('deals.expectedCloseDate')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {deals?.map((deal) => {
                const isOpen = deal.stageId !== null && openStages.has(deal.stageId)
                const stage = stages?.find((item) => item.id === deal.stageId)
                return (
                  <tr key={deal.id}>
                    <td>{deal.title}</td>
                    <td className="muted">{contactName(deal.contactId)}</td>
                    <td>
                      <span
                        className="stage-badge"
                        style={{ background: stage?.color ?? 'transparent' }}
                      >
                        {stageName(deal.stageId)}
                      </span>
                    </td>
                    <td>{formatCurrency(deal.value, currency, language)}</td>
                    <td className="muted">{deal.probability}%</td>
                    <td className="muted">
                      {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate, language) : '—'}
                    </td>
                    <td className="row-actions">
                      {isOpen && (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => setSettle({ deal, outcome: 'won' })}
                          >
                            {t('deals.win')}
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => setSettle({ deal, outcome: 'lost' })}
                          >
                            {t('deals.lose')}
                          </button>
                        </>
                      )}
                      <button className="btn btn-sm" onClick={() => setModalDeal(deal)}>
                        {t('common.edit')}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalDeal !== null && <DealModal deal={modalDeal} onClose={() => setModalDeal(null)} />}
      {settle && (
        <SettleModal deal={settle.deal} outcome={settle.outcome} onClose={() => setSettle(null)} />
      )}
    </section>
  )
}

export default Deals
