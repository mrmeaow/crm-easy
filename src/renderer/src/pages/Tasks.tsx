import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateTask, useDeleteTask, useTasks, useUpdateTask } from '../api/tasks'
import { useSettings } from '../store/settings'
import { formatDateTime } from '@shared/format'
import { localInputToDate } from '../lib/datetime'
import type { Task } from '@shared/types'

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task
  onToggle: () => void
  onDelete: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const { language } = useSettings()
  return (
    <div className="task-row">
      <input
        type="checkbox"
        className="task-check"
        checked={task.done}
        onChange={onToggle}
        aria-label={task.title}
      />
      <div className="task-info">
        <strong className={task.done ? 'task-title done' : 'task-title'}>{task.title}</strong>
        <div className="task-meta muted">
          {task.dueAt && <span>{formatDateTime(task.dueAt, language)}</span>}
          {!task.dueAt && <span>{t('tasks.noDate')}</span>}
          {task.reminderAt && task.reminderSentAt && <span>{t('tasks.reminder')} ✓</span>}
          {task.reminderAt && !task.reminderSentAt && (
            <span>
              {t('tasks.reminder')}: {formatDateTime(task.reminderAt, language)}
            </span>
          )}
        </div>
      </div>
      <button className="btn btn-danger btn-sm" onClick={onDelete}>
        {t('common.delete')}
      </button>
    </div>
  )
}

function TaskModal({ onClose }: { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation()
  const createTask = useCreateTask()
  const [title, setTitle] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [reminder, setReminder] = useState(false)
  const [reminderAt, setReminderAt] = useState('')

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault()
    if (!title.trim()) return
    const due = localInputToDate(dueAt)
    createTask.mutate(
      {
        title: title.trim(),
        dueAt: due,
        reminderAt: reminder ? (localInputToDate(reminderAt) ?? due) : null,
      },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{t('tasks.add')}</h2>
        <label>
          <span>{t('tasks.taskTitle')} *</span>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('tasks.taskTitle')}
            autoFocus
          />
        </label>
        <label>
          <span>{t('tasks.dueAt')}</span>
          <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={reminder}
            onChange={(e) => setReminder(e.target.checked)}
          />
          <span>{t('tasks.reminder')}</span>
        </label>
        {reminder && (
          <label>
            <span>{t('tasks.reminderAt')}</span>
            <input
              type="datetime-local"
              value={reminderAt || dueAt}
              onChange={(e) => setReminderAt(e.target.value)}
            />
          </label>
        )}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={createTask.isPending}>
            {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  )
}

function Tasks(): React.JSX.Element {
  const { t } = useTranslation()
  const { data: tasks, isLoading, isError } = useTasks()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const [showForm, setShowForm] = useState(false)

  const now = new Date()
  const todayStart = startOfDay(now)
  const tomorrowStart = new Date(todayStart.getTime() + 86_400_000)

  const open = (tasks ?? []).filter((task) => !task.done)
  const overdue = open.filter((task) => task.dueAt != null && task.dueAt < todayStart)
  const today = open.filter(
    (task) => task.dueAt != null && task.dueAt >= todayStart && task.dueAt < tomorrowStart,
  )
  const upcoming = open.filter((task) => task.dueAt == null || task.dueAt >= tomorrowStart)
  const done = (tasks ?? []).filter((task) => task.done)

  function toggleDone(task: Task): void {
    updateTask.mutate({
      id: task.id,
      input: task.done
        ? { done: false, completedAt: null }
        : { done: true, completedAt: new Date() },
    })
  }

  function handleDelete(id: number): void {
    if (window.confirm(t('common.confirmDelete'))) {
      deleteTask.mutate(id)
    }
  }

  const renderGroup = (title: string, items: Task[]): React.JSX.Element => (
    <div className="task-group">
      <h3 className="task-group-title">
        {title} <span className="stage-count">{items.length}</span>
      </h3>
      {items.length === 0 && <p className="muted task-group-empty">{t('tasks.empty')}</p>}
      {items.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onToggle={() => toggleDone(task)}
          onDelete={() => handleDelete(task.id)}
        />
      ))}
    </div>
  )

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>{t('tasks.title')}</h1>
          <p>{t('tasks.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          + {t('tasks.add')}
        </button>
      </header>

      {isLoading && <p className="muted">{t('common.loading')}</p>}
      {isError && <p className="muted">{t('common.error')}</p>}
      {!isLoading && !isError && (tasks?.length ?? 0) === 0 && (
        <div className="placeholder-card">{t('tasks.empty')}</div>
      )}
      {!isLoading && !isError && (tasks?.length ?? 0) > 0 && (
        <div className="task-list">
          {renderGroup(t('tasks.overdue'), overdue)}
          {renderGroup(t('tasks.today'), today)}
          {renderGroup(t('tasks.upcoming'), upcoming)}
          {done.length > 0 && renderGroup(t('tasks.done'), done)}
        </div>
      )}

      {showForm && <TaskModal onClose={() => setShowForm(false)} />}
    </section>
  )
}

export default Tasks
