import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ActivityType, EntityType } from '@shared/types'
import { formatDateTime } from '@shared/format'
import { useActivities, useCreateActivity } from '../api/activities'
import { useCreateNote, useNotes } from '../api/notes'
import { useSettings } from '../store/settings'

const ACTIVITY_TYPES: ActivityType[] = ['call', 'email', 'meeting', 'note', 'other']

interface EntityTimelineProps {
  entityType: EntityType
  entityId: number
}

function EntityTimeline({ entityType, entityId }: EntityTimelineProps): React.JSX.Element {
  const { t } = useTranslation()
  const { language } = useSettings()
  const { data: activities, isLoading } = useActivities(entityType, entityId)
  const { data: notes, isLoading: notesLoading } = useNotes(entityType, entityId)
  const createActivity = useCreateActivity()
  const createNote = useCreateNote()

  const [tab, setTab] = useState<'timeline' | 'notes'>('timeline')
  const [activityType, setActivityType] = useState<ActivityType>('call')
  const [subject, setSubject] = useState('')
  const [detail, setDetail] = useState('')
  const [noteBody, setNoteBody] = useState('')

  function handleAddActivity(event: React.FormEvent): void {
    event.preventDefault()
    if (!subject.trim()) return
    createActivity.mutate(
      {
        entityType,
        entityId,
        type: activityType,
        subject: subject.trim(),
        detail: detail.trim() || null,
      },
      {
        onSuccess: () => {
          setSubject('')
          setDetail('')
        },
      },
    )
  }

  function handleAddNote(event: React.FormEvent): void {
    event.preventDefault()
    if (!noteBody.trim()) return
    createNote.mutate(
      { body: noteBody.trim(), entityType, entityId },
      { onSuccess: () => setNoteBody('') },
    )
  }

  return (
    <div className="timeline">
      <div className="segmented" role="tablist">
        <button
          type="button"
          className={tab === 'timeline' ? 'active' : ''}
          onClick={() => setTab('timeline')}
          role="tab"
        >
          {t('timeline.activity')}
        </button>
        <button
          type="button"
          className={tab === 'notes' ? 'active' : ''}
          onClick={() => setTab('notes')}
          role="tab"
        >
          {t('timeline.notes')}
        </button>
      </div>

      {tab === 'timeline' && (
        <>
          <form className="card timeline-form" onSubmit={handleAddActivity}>
            <div className="form-row">
              <select
                className="select"
                value={activityType}
                onChange={(event) => setActivityType(event.target.value as ActivityType)}
              >
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`timeline.types.${type}`)}
                  </option>
                ))}
              </select>
              <input
                required
                placeholder={t('timeline.subjectPlaceholder')}
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
            </div>
            <textarea
              rows={2}
              placeholder={t('timeline.detailPlaceholder')}
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
            />
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={createActivity.isPending}>
                {t('timeline.log')}
              </button>
            </div>
          </form>

          <div className="timeline-list">
            {isLoading && <p className="muted">{t('common.loading')}</p>}
            {(activities?.length ?? 0) === 0 && !isLoading && (
              <p className="muted">{t('timeline.empty')}</p>
            )}
            {activities?.map((activity) => (
              <div key={activity.id} className="timeline-item">
                <span className={`timeline-dot type-${activity.type}`} aria-hidden="true" />
                <div className="timeline-body">
                  <div className="timeline-head">
                    <strong>{t(`timeline.types.${activity.type}`)}</strong>
                    <span className="muted">{formatDateTime(activity.happenedAt, language)}</span>
                  </div>
                  <p>{activity.subject}</p>
                  {activity.detail && <p className="muted">{activity.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'notes' && (
        <>
          <form className="card timeline-form" onSubmit={handleAddNote}>
            <textarea
              required
              rows={3}
              placeholder={t('timeline.notePlaceholder')}
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
            />
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={createNote.isPending}>
                {t('timeline.addNote')}
              </button>
            </div>
          </form>

          <div className="timeline-list">
            {notesLoading && <p className="muted">{t('common.loading')}</p>}
            {(notes?.length ?? 0) === 0 && !notesLoading && (
              <p className="muted">{t('timeline.notesEmpty')}</p>
            )}
            {notes?.map((note) => (
              <div key={note.id} className="timeline-item">
                <span className="timeline-dot type-note" aria-hidden="true" />
                <div className="timeline-body">
                  <div className="timeline-head">
                    <span className="muted">{formatDateTime(note.createdAt, language)}</span>
                  </div>
                  <p className="note-body">{note.body}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default EntityTimeline
