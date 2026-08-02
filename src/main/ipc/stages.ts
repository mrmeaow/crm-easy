import { ipcMain } from 'electron'
import { asc, eq, max, count } from 'drizzle-orm'
import { IpcChannels } from '@shared/ipc'
import type { PipelineStageInput } from '@shared/types'
import { getDb } from '../db'
import { pipelineStages, leads, deals } from '../db/schema'

export function registerStagesIpc(): void {
  ipcMain.handle(IpcChannels.stages.list, () => {
    return getDb().select().from(pipelineStages).orderBy(asc(pipelineStages.position)).all()
  })

  ipcMain.handle(IpcChannels.stages.create, (_event, input: PipelineStageInput) => {
    const current = getDb()
      .select({ m: max(pipelineStages.position) })
      .from(pipelineStages)
      .get()
    const position = (current?.m ?? -1) + 1
    return getDb()
      .insert(pipelineStages)
      .values({ name: input.name, color: input.color ?? null, position })
      .returning()
      .get()
  })

  ipcMain.handle(IpcChannels.stages.update, (_event, id: number, input: PipelineStageInput) => {
    return getDb()
      .update(pipelineStages)
      .set({ name: input.name, color: input.color ?? null, updatedAt: new Date() })
      .where(eq(pipelineStages.id, id))
      .returning()
      .get()
  })

  ipcMain.handle(IpcChannels.stages.remove, (_event, id: number) => {
    const db = getDb()
    const leadCount = db.select({ c: count() }).from(leads).where(eq(leads.stageId, id)).get()
    const dealCount = db.select({ c: count() }).from(deals).where(eq(deals.stageId, id)).get()
    if ((leadCount?.c ?? 0) > 0 || (dealCount?.c ?? 0) > 0) {
      throw new Error('STAGE_IN_USE')
    }
    db.delete(pipelineStages).where(eq(pipelineStages.id, id)).run()
  })

  ipcMain.handle(IpcChannels.stages.reorder, (_event, orderedIds: number[]) => {
    const db = getDb()
    orderedIds.forEach((id, index) => {
      db.update(pipelineStages)
        .set({ position: index, updatedAt: new Date() })
        .where(eq(pipelineStages.id, id))
        .run()
    })
  })
}
