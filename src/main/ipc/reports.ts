import { ipcMain } from 'electron'
import { and, gte, lte } from 'drizzle-orm'
import { IpcChannels } from '@shared/ipc'
import type { Activity } from '@shared/types'
import { getDb } from '../db'
import { activities } from '../db/schema'

export function registerReportsIpc(): void {
  ipcMain.handle(IpcChannels.reports.activities, (_event, from: number, to: number): Activity[] => {
    return getDb()
      .select()
      .from(activities)
      .where(
        and(gte(activities.happenedAt, new Date(from)), lte(activities.happenedAt, new Date(to))),
      )
      .all() as unknown as Activity[]
  })
}
