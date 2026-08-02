import { ipcMain } from 'electron'
import { desc, eq } from 'drizzle-orm'
import { IpcChannels } from '@shared/ipc'
import type { DealInput, DealSettleInput } from '@shared/types'
import { getDb } from '../db'
import { deals, pipelineStages } from '../db/schema'

export function registerDealsIpc(): void {
  ipcMain.handle(IpcChannels.deals.list, () => {
    return getDb().select().from(deals).orderBy(desc(deals.createdAt)).all()
  })

  ipcMain.handle(IpcChannels.deals.create, (_event, input: DealInput) => {
    return getDb()
      .insert(deals)
      .values({
        title: input.title,
        value: input.value ?? 0,
        stageId: input.stageId ?? null,
        contactId: input.contactId ?? null,
        leadId: input.leadId ?? null,
        probability: input.probability ?? 0,
        expectedCloseDate: input.expectedCloseDate ?? null,
        owner: input.owner ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
      .get()
  })

  ipcMain.handle(IpcChannels.deals.update, (_event, id: number, input: Partial<DealInput>) => {
    return getDb()
      .update(deals)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning()
      .get()
  })

  ipcMain.handle(IpcChannels.deals.remove, (_event, id: number) => {
    getDb().delete(deals).where(eq(deals.id, id)).run()
  })

  ipcMain.handle(IpcChannels.deals.settle, (_event, input: DealSettleInput) => {
    const db = getDb()
    const stage = db
      .select()
      .from(pipelineStages)
      .where(
        input.outcome === 'won' ? eq(pipelineStages.isWon, true) : eq(pipelineStages.isLost, true),
      )
      .limit(1)
      .get()
    const now = new Date()
    return db
      .update(deals)
      .set({
        stageId: stage?.id ?? null,
        value: input.actualValue ?? undefined,
        lostReason: input.outcome === 'lost' ? (input.reason ?? null) : null,
        wonAt: input.outcome === 'won' ? now : null,
        updatedAt: now,
      })
      .where(eq(deals.id, input.id))
      .returning()
      .get()
  })
}
