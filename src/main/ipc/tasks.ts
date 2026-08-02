import { ipcMain, Notification } from 'electron'
import { asc, and, eq, isNull, lt } from 'drizzle-orm'
import { IpcChannels } from '@shared/ipc'
import type { TaskInput } from '@shared/types'
import { getDb } from '../db'
import { tasks } from '../db/schema'

export function registerTasksIpc(): void {
  ipcMain.handle(IpcChannels.tasks.list, () => {
    return getDb().select().from(tasks).orderBy(asc(tasks.dueAt), asc(tasks.id)).all()
  })

  ipcMain.handle(IpcChannels.tasks.create, (_event, input: TaskInput) => {
    return getDb()
      .insert(tasks)
      .values({
        title: input.title,
        dueAt: input.dueAt ?? null,
        reminderAt: input.reminderAt ?? null,
        contactId: input.contactId ?? null,
        dealId: input.dealId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
      .get()
  })

  ipcMain.handle(IpcChannels.tasks.update, (_event, id: number, input: Partial<TaskInput>) => {
    return getDb()
      .update(tasks)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning()
      .get()
  })

  ipcMain.handle(IpcChannels.tasks.remove, (_event, id: number) => {
    getDb().delete(tasks).where(eq(tasks.id, id)).run()
  })
}

export function startReminderLoop(): void {
  setInterval(checkReminders, 30_000)
  setTimeout(checkReminders, 3_000)
}

function checkReminders(): void {
  if (!Notification.isSupported()) return
  const now = new Date()
  const due = getDb()
    .select()
    .from(tasks)
    .where(and(lt(tasks.reminderAt, now), isNull(tasks.reminderSentAt), eq(tasks.done, false)))
    .all()

  for (const task of due) {
    new Notification({ title: 'CRM-Easy', body: task.title }).show()
    getDb().update(tasks).set({ reminderSentAt: now }).where(eq(tasks.id, task.id)).run()
  }
}
