import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useContacts } from '../api/contacts'
import { useDeals } from '../api/deals'
import { useLeads, useStages } from '../api/leads'
import { exportFileName, toExportDate } from '@shared/export'
import type { Contact, Deal, ExportColumn, Lead } from '@shared/types'

type EntityKey = 'contacts' | 'leads' | 'deals'

const ENTITIES: EntityKey[] = ['contacts', 'leads', 'deals']

interface ColumnDef<T> {
  key: string
  labelKey: string
  getValue: (row: T) => string | number
}

function Reports(): React.JSX.Element {
  const { t } = useTranslation()
  const { data: contacts } = useContacts()
  const { data: leads } = useLeads()
  const { data: deals } = useDeals()
  const { data: stages } = useStages()
  const [entity, setEntity] = useState<EntityKey>('contacts')
  const [selected, setSelected] = useState<Set<string> | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const stageName = (id: number | null): string =>
    id == null ? '—' : (stages?.find((stage) => stage.id === id)?.name ?? '—')

  const contactName = (id: number | null): string => {
    if (id == null) return '—'
    const contact = contacts?.find((item) => item.id === id)
    return contact ? `${contact.firstName} ${contact.lastName ?? ''}`.trim() : '—'
  }

  const defs: Record<EntityKey, ColumnDef<unknown>[]> = {
    contacts: [
      {
        key: 'firstName',
        labelKey: 'contacts.firstName',
        getValue: (row) => (row as Contact).firstName,
      },
      {
        key: 'lastName',
        labelKey: 'contacts.lastName',
        getValue: (row) => (row as Contact).lastName ?? '',
      },
      { key: 'phone', labelKey: 'contacts.phone', getValue: (row) => (row as Contact).phone ?? '' },
      { key: 'email', labelKey: 'contacts.email', getValue: (row) => (row as Contact).email ?? '' },
      {
        key: 'company',
        labelKey: 'contacts.company',
        getValue: (row) => (row as Contact).company ?? '',
      },
      {
        key: 'address',
        labelKey: 'contacts.address',
        getValue: (row) => (row as Contact).address ?? '',
      },
      {
        key: 'createdAt',
        labelKey: 'common.createdAt',
        getValue: (row) => toExportDate((row as Contact).createdAt),
      },
    ],
    leads: [
      { key: 'name', labelKey: 'leads.name', getValue: (row) => (row as Lead).name },
      { key: 'phone', labelKey: 'leads.phone', getValue: (row) => (row as Lead).phone ?? '' },
      { key: 'email', labelKey: 'leads.email', getValue: (row) => (row as Lead).email ?? '' },
      { key: 'source', labelKey: 'leads.source', getValue: (row) => (row as Lead).source ?? '' },
      {
        key: 'stageId',
        labelKey: 'leads.stage',
        getValue: (row) => stageName((row as Lead).stageId),
      },
      {
        key: 'expectedValue',
        labelKey: 'leads.expectedValue',
        getValue: (row) => (row as Lead).expectedValue ?? 0,
      },
      {
        key: 'expectedCloseDate',
        labelKey: 'leads.expectedCloseDate',
        getValue: (row) =>
          (row as Lead).expectedCloseDate
            ? toExportDate((row as Lead).expectedCloseDate as Date)
            : '',
      },
      {
        key: 'createdAt',
        labelKey: 'common.createdAt',
        getValue: (row) => toExportDate((row as Lead).createdAt),
      },
    ],
    deals: [
      { key: 'title', labelKey: 'deals.dealTitle', getValue: (row) => (row as Deal).title },
      {
        key: 'contactId',
        labelKey: 'deals.contact',
        getValue: (row) => contactName((row as Deal).contactId),
      },
      {
        key: 'stageId',
        labelKey: 'deals.stage',
        getValue: (row) => stageName((row as Deal).stageId),
      },
      { key: 'value', labelKey: 'deals.value', getValue: (row) => (row as Deal).value },
      {
        key: 'probability',
        labelKey: 'deals.probability',
        getValue: (row) => (row as Deal).probability,
      },
      {
        key: 'expectedCloseDate',
        labelKey: 'deals.expectedCloseDate',
        getValue: (row) =>
          (row as Deal).expectedCloseDate
            ? toExportDate((row as Deal).expectedCloseDate as Date)
            : '',
      },
      { key: 'owner', labelKey: 'deals.owner', getValue: (row) => (row as Deal).owner ?? '' },
      {
        key: 'wonAt',
        labelKey: 'deals.won',
        getValue: (row) => ((row as Deal).wonAt ? toExportDate((row as Deal).wonAt as Date) : ''),
      },
      {
        key: 'createdAt',
        labelKey: 'common.createdAt',
        getValue: (row) => toExportDate((row as Deal).createdAt),
      },
    ],
  }

  const columnDefs = defs[entity]

  const rows: unknown[] = useMemo(() => {
    switch (entity) {
      case 'contacts':
        return contacts ?? []
      case 'leads':
        return leads ?? []
      case 'deals':
        return deals ?? []
    }
  }, [entity, contacts, leads, deals])

  async function runExport(extension: 'xlsx' | 'csv'): Promise<void> {
    const chosen = selected ?? new Set(columnDefs.map((column) => column.key))
    const columns: ExportColumn[] = columnDefs
      .filter((column) => chosen.has(column.key))
      .map((column) => ({ key: column.key, header: t(column.labelKey) }))
    if (columns.length === 0) {
      setError(t('export.noColumns'))
      return
    }
    if (rows.length === 0) {
      setError(t('export.noData'))
      return
    }
    setBusy(true)
    setMessage(null)
    setError(null)
    try {
      const result = await window.crm.export.run({
        fileName: exportFileName(entity, extension),
        columns,
        rows: rows.map((row) =>
          columnDefs
            .filter((column) => chosen.has(column.key))
            .map((column) => column.getValue(row)),
        ),
      })
      if (result.saved) setMessage(t('export.done'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>{t('reports.title')}</h1>
          <p>{t('reports.subtitle')}</p>
        </div>
      </header>

      <div className="settings-list">
        <div className="card export-card">
          <strong className="export-label">{t('export.entityLabel')}</strong>
          <p className="muted">{t('export.entityHint')}</p>
          <div className="segmented">
            {ENTITIES.map((key) => (
              <button
                key={key}
                className={entity === key ? 'active' : ''}
                onClick={() => {
                  setEntity(key)
                  setSelected(null)
                  setMessage(null)
                  setError(null)
                }}
              >
                {t(`export.entity.${key}`)}
              </button>
            ))}
          </div>

          <strong className="export-label">{t('export.columns')}</strong>
          <div className="export-columns">
            {columnDefs.map((column) => (
              <label key={column.key} className="check-row">
                <input
                  type="checkbox"
                  checked={selected === null || selected.has(column.key)}
                  onChange={(e) => {
                    const next = new Set(selected ?? columnDefs.map((c) => c.key))
                    if (e.target.checked) next.add(column.key)
                    else next.delete(column.key)
                    setSelected(next)
                  }}
                />
                <span>{t(column.labelKey)}</span>
              </label>
            ))}
          </div>

          <div className="form-actions">
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() => void runExport('xlsx')}
            >
              {t('export.exportXlsx')}
            </button>
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() => void runExport('csv')}
            >
              {t('export.exportCsv')}
            </button>
          </div>
          {busy && <p className="muted">{t('export.exporting')}</p>}
          {message && <p className="success-text">{message}</p>}
          {error && <p className="error-text">{error}</p>}
        </div>
      </div>
    </section>
  )
}

export default Reports
