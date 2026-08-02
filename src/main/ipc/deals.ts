import { ipcMain } from 'electron'
import { desc, eq, isNull } from 'drizzle-orm'
import { IpcChannels } from '@shared/ipc'
import type { DealInput, DealSettleInput, DealLogEntry } from '@shared/types'
import { getDb } from '../db'
import { deals, pipelineStages, dealLog } from '../db/schema'
import { recordUndo } from './undo'

export function registerDealsIpc(): void {
  ipcMain.handle(IpcChannels.deals.list, () => {
    return getDb()
      .select()
      .from(deals)
      .where(isNull(deals.deletedAt))
      .orderBy(desc(deals.createdAt))
      .all()
  })

  ipcMain.handle(IpcChannels.deals.create, (_event, input: DealInput) => {
    const now = new Date()
    return getDb().transaction((tx) => {
      const deal = tx
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
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get()
      tx.insert(dealLog)
        .values({ dealId: deal.id, action: 'created', toStageId: deal.stageId, createdAt: now })
        .run()
      return deal
    })
  })

  ipcMain.handle(IpcChannels.deals.update, (_event, id: number, input: Partial<DealInput>) => {
    const db = getDb()
    const before = db.select().from(deals).where(eq(deals.id, id)).get()
    const now = new Date()
    const deal = db
      .update(deals)
      .set({ ...input, updatedAt: now })
      .where(eq(deals.id, id))
      .returning()
      .get()
    if (before && input.stageId !== undefined && input.stageId !== before.stageId) {
      db.insert(dealLog)
        .values({
          dealId: id,
          action: 'stage_change',
          fromStageId: before.stageId,
          toStageId: deal.stageId,
          createdAt: now,
        })
        .run()
    }
    if (before && input.value !== undefined && input.value !== before.value) {
      db.insert(dealLog)
        .values({
          dealId: id,
          action: 'value_change',
          note: String(input.value),
          createdAt: now,
        })
        .run()
    }
    return deal
  })

  ipcMain.handle(IpcChannels.deals.remove, (_event, id: number) => {
    const db = getDb()
    const deal = db.select().from(deals).where(eq(deals.id, id)).get()
    if (deal && deal.deletedAt === null) {
      recordUndo('deal', id, deal.title || `#${id}`)
      db.update(deals)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(deals.id, id))
        .run()
    }
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
    const deal = db
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
    db.insert(dealLog)
      .values({
        dealId: input.id,
        action: input.outcome,
        toStageId: stage?.id ?? null,
        note: input.outcome === 'lost' ? (input.reason ?? null) : null,
        createdAt: now,
      })
      .run()
    return deal
  })

  ipcMain.handle(IpcChannels.deals.history, (_event, id: number): DealLogEntry[] => {
    return getDb()
      .select()
      .from(dealLog)
      .where(eq(dealLog.dealId, id))
      .orderBy(desc(dealLog.createdAt))
      .all() as unknown as DealLogEntry[]
  })
}
