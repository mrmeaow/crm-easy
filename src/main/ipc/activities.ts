import { ipcMain } from 'electron'
import { desc, eq, and } from 'drizzle-orm'
import { IpcChannels } from '@shared/ipc'
import type { ActivityInput, EntityType } from '@shared/types'
import { getDb } from '../db'
import { activities } from '../db/schema'

export function registerActivitiesIpc(): void {
  ipcMain.handle(
    IpcChannels.activities.list,
    (_event, entityType: EntityType, entityId: number) => {
      return getDb()
        .select()
        .from(activities)
        .where(and(eq(activities.entityType, entityType), eq(activities.entityId, entityId)))
        .orderBy(desc(activities.happenedAt))
        .all()
    },
  )

  ipcMain.handle(IpcChannels.activities.create, (_event, input: ActivityInput) => {
    return getDb()
      .insert(activities)
      .values({
        entityType: input.entityType,
        entityId: input.entityId,
        type: input.type,
        subject: input.subject,
        detail: input.detail ?? null,
        happenedAt: new Date(),
      })
      .returning()
      .get()
  })
}
