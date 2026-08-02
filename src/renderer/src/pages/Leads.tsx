import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSettings } from '../store/settings'
import {
  useConvertLead,
  useCreateLead,
  useCreateStage,
  useDeleteLead,
  useDeleteStage,
  useLeads,
  useMoveLead,
  useReorderStages,
  useStages,
  useUpdateLead,
  useUpdateStage,
} from '../api/leads'
import { formatCurrency } from '@shared/format'
import { inputToDate, dateToInput } from '../lib/datetime'
import type { Lead } from '@shared/types'
import EntityTimeline from '../components/EntityTimeline'

const SOURCES = ['walkin', 'call', 'web', 'referral', 'other'] as const

const STAGE_COLORS = [
  '#6366f1',
  '#0ea5e9',
  '#f59e0b',
  '#8b5cf6',
  '#22c55e',
  '#ef4444',
  '#14b8a6',
  '#ec4899',
]

function StageColumn({
  stageId,
  name,
  color,
  count,
  total,
  muted,
  children,
}: {
  stageId: number
  name: string
  color: string | null
  count: number
  total: string
  muted: boolean
  children: React.ReactNode
}): React.JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stageId}` })
  return (
    <div
      ref={setNodeRef}
      className={`board-column${isOver ? ' over' : ''}${muted ? ' muted' : ''}`}
    >
      <div className="board-column-header">
        <span className="stage-dot" style={{ background: color ?? 'var(--text-muted)' }} />
        <span className="stage-name">{name}</span>
        <span className="stage-count">{count}</span>
      </div>
      <div className="board-column-total">{total}</div>
      <div className="board-column-body">{children}</div>
    </div>
  )
}

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }): React.JSX.Element {
  const { t } = useTranslation()
  const { currency, language } = useSettings()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`lead-card${isDragging ? ' dragging' : ''}`}
      {...attributes}
      {...listeners}
      onClick={onClick}
    >
      <strong>{lead.name}</strong>
      <div className="lead-card-meta">
        {lead.phone && <span>{lead.phone}</span>}
        {lead.source && <span>{t(`leads.source.${lead.source}`)}</span>}
      </div>
      {lead.expectedValue != null && lead.expectedValue > 0 && (
        <div className="lead-card-value">
          {formatCurrency(lead.expectedValue, currency, language)}
        </div>
      )}
    </div>
  )
}

function LeadModal({
  lead,
  onClose,
}: {
  lead: Lead | 'new' | null
  onClose: () => void
}): React.JSX.Element | null {
  const { t } = useTranslation()
  const { data: stages } = useStages()
  const createLead = useCreateLead()
  const updateLead = useUpdateLead()
  const deleteLead = useDeleteLead()
  const convertLead = useConvertLead()

  const [name, setName] = useState(lead === 'new' || lead === null ? '' : (lead.name ?? ''))
  const [phone, setPhone] = useState(lead !== 'new' && lead !== null ? (lead.phone ?? '') : '')
  const [email, setEmail] = useState(lead !== 'new' && lead !== null ? (lead.email ?? '') : '')
  const [source, setSource] = useState(lead !== 'new' && lead !== null ? (lead.source ?? '') : '')
  const [expectedValue, setExpectedValue] = useState(
    lead !== 'new' && lead !== null && lead.expectedValue != null ? String(lead.expectedValue) : '',
  )
  const [closeDate, setCloseDate] = useState(
    lead !== 'new' && lead !== null && lead.expectedCloseDate
      ? dateToInput(lead.expectedCloseDate)
      : '',
  )
  const [stageId, setStageId] = useState(
    lead !== 'new' && lead !== null && lead.stageId != null ? String(lead.stageId) : '',
  )

  if (lead === null) return null
  const current = lead

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault()
    if (!name.trim()) return
    const input = {
      name: name.trim(),
      phone: phone || null,
      email: email || null,
      source: source || null,
      expectedValue: expectedValue ? Number(expectedValue) : null,
      expectedCloseDate: inputToDate(closeDate),
      stageId: stageId ? Number(stageId) : null,
    }
    if (current === 'new') {
      createLead.mutate(input, { onSuccess: onClose })
    } else {
      updateLead.mutate({ id: current.id, input }, { onSuccess: onClose })
    }
  }

  function handleDelete(): void {
    if (current !== 'new' && window.confirm(t('common.confirmDelete'))) {
      deleteLead.mutate(current.id, { onSuccess: onClose })
    }
  }

  function handleConvert(): void {
    if (current !== 'new' && window.confirm(t('leads.convertConfirm'))) {
      convertLead.mutate(current.id, { onSuccess: onClose })
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{lead === 'new' ? t('leads.add') : t('leads.edit')}</h2>
        <label>
          <span>{t('leads.name')} *</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <div className="modal-grid">
          <label>
            <span>{t('leads.phone')}</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label>
            <span>{t('leads.email')}</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        </div>
        <div className="modal-grid">
          <label>
            <span>{t('leads.source')}</span>
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="" />
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {t(`leads.source.${s}`)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t('leads.stage')}</span>
            <select value={stageId} onChange={(e) => setStageId(e.target.value)}>
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
            <span>{t('leads.expectedValue')}</span>
            <input
              type="number"
              min="0"
              step="any"
              value={expectedValue}
              onChange={(e) => setExpectedValue(e.target.value)}
            />
          </label>
          <label>
            <span>{t('leads.expectedCloseDate')}</span>
            <input type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          {lead !== 'new' && (
            <>
              <button type="button" className="btn btn-primary" onClick={handleConvert}>
                {t('leads.convert')}
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>
                {t('common.delete')}
              </button>
            </>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={createLead.isPending || updateLead.isPending}
          >
            {t('common.save')}
          </button>
        </div>
        {lead !== 'new' && (
          <div className="modal-section">
            <EntityTimeline entityType="lead" entityId={lead.id} />
          </div>
        )}
      </form>
    </div>
  )
}

function StageManager({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation()
  const { data: stages } = useStages()
  const createStage = useCreateStage()
  const updateStage = useUpdateStage()
  const deleteStage = useDeleteStage()
  const reorderStages = useReorderStages()
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(STAGE_COLORS[0])
  const [error, setError] = useState<string | null>(null)

  function move(index: number, direction: -1 | 1): void {
    if (!stages) return
    const target = index + direction
    if (target < 0 || target >= stages.length) return
    const reordered = [...stages]
    const [item] = reordered.splice(index, 1)
    reordered.splice(target, 0, item)
    reorderStages.mutate(reordered.map((stage) => stage.id))
  }

  function handleDelete(id: number): void {
    deleteStage.mutate(id, {
      onSuccess: () => setError(null),
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : ''
        setError(message === 'STAGE_IN_USE' ? t('leads.stageInUse') : t('common.error'))
      },
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t('leads.manageStages')}</h2>
        {error && <p className="error-text">{error}</p>}
        <div className="stage-list">
          {stages?.map((stage, index) => (
            <div key={stage.id} className="stage-row">
              <input
                type="color"
                value={stage.color ?? STAGE_COLORS[0]}
                onChange={(e) =>
                  updateStage.mutate({
                    id: stage.id,
                    input: { name: stage.name, color: e.target.value },
                  })
                }
                title={t('leads.stageColor')}
              />
              <input
                value={stage.name}
                onChange={(e) =>
                  updateStage.mutate({
                    id: stage.id,
                    input: { name: e.target.value, color: stage.color },
                  })
                }
                placeholder={t('leads.stageName')}
              />
              <button
                type="button"
                className="btn btn-sm"
                title={t('leads.up')}
                onClick={() => move(index, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="btn btn-sm"
                title={t('leads.down')}
                onClick={() => move(index, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                title={t('leads.removeStage')}
                onClick={() => handleDelete(stage.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="stage-row">
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            title={t('leads.stageColor')}
          />
          <input
            value={newName}
            placeholder={t('leads.newStage')}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!newName.trim() || createStage.isPending}
            onClick={() => {
              createStage.mutate(
                { name: newName.trim(), color: newColor },
                { onSuccess: () => setNewName('') },
              )
            }}
          >
            {t('leads.addStage')}
          </button>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

function Leads(): React.JSX.Element {
  const { t } = useTranslation()
  const { currency, language } = useSettings()
  const { data: leads, isLoading, isError } = useLeads()
  const { data: stages } = useStages()
  const moveLead = useMoveLead()
  const [modalLead, setModalLead] = useState<Lead | 'new' | null>(null)
  const [showStageManager, setShowStageManager] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event
    if (!over) return
    const lead = leads?.find((item) => item.id === Number(active.id))
    if (!lead) return

    const overLead =
      typeof over.id !== 'string' ? leads?.find((item) => item.id === Number(over.id)) : undefined
    const targetStageId =
      typeof over.id === 'string' && over.id.startsWith('stage-')
        ? Number(over.id.slice('stage-'.length))
        : (overLead?.stageId ?? null)

    if (targetStageId !== null && targetStageId !== lead.stageId) {
      moveLead.mutate({ id: lead.id, stageId: targetStageId })
    }
  }

  return (
    <section className="page page-full">
      <header className="page-header">
        <div>
          <h1>{t('leads.title')}</h1>
          <p>{t('leads.subtitle')}</p>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={() => setShowStageManager(true)}>
            {t('leads.manageStages')}
          </button>
          <button className="btn btn-primary" onClick={() => setModalLead('new')}>
            + {t('leads.add')}
          </button>
        </div>
      </header>

      {isLoading && <p className="muted">{t('common.loading')}</p>}
      {isError && <p className="muted">{t('common.error')}</p>}
      {!isLoading && !isError && (leads?.length ?? 0) === 0 && (
        <div className="placeholder-card">{t('leads.empty')}</div>
      )}
      {!isLoading && !isError && (leads?.length ?? 0) > 0 && (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="board">
            {stages?.map((stage) => {
              const stageLeads = leads?.filter((lead) => lead.stageId === stage.id) ?? []
              const total = stageLeads.reduce((sum, lead) => sum + (lead.expectedValue ?? 0), 0)
              return (
                <StageColumn
                  key={stage.id}
                  stageId={stage.id}
                  name={stage.name}
                  color={stage.color}
                  count={stageLeads.length}
                  total={total > 0 ? formatCurrency(total, currency, language) : ''}
                  muted={stage.isWon || stage.isLost}
                >
                  <SortableContext
                    items={stageLeads.map((lead) => lead.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {stageLeads.length === 0 && (
                      <div className="board-empty">{t('leads.noLeads')}</div>
                    )}
                    {stageLeads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} onClick={() => setModalLead(lead)} />
                    ))}
                  </SortableContext>
                </StageColumn>
              )
            })}
          </div>
        </DndContext>
      )}

      {modalLead !== null && <LeadModal lead={modalLead} onClose={() => setModalLead(null)} />}
      {showStageManager && <StageManager onClose={() => setShowStageManager(false)} />}
    </section>
  )
}

export default Leads
