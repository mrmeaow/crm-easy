import { ipcMain } from 'electron'
import { eq, and, asc, inArray } from 'drizzle-orm'
import { IpcChannels } from '@shared/ipc'
import type {
  CustomFieldDef,
  CustomFieldDefInput,
  CustomFieldValue,
  EntityType,
} from '@shared/types'
import { getDb } from '../db'
import { customFieldDefs, customFieldValues } from '../db/schema'

export function registerCustomFieldsIpc(): void {
  ipcMain.handle(
    IpcChannels.customFields.listDefs,
    (_event, entityType?: EntityType): CustomFieldDef[] => {
      const query = getDb().select().from(customFieldDefs)
      if (entityType) query.where(eq(customFieldDefs.entityType, entityType))
      return query.orderBy(asc(customFieldDefs.position)).all() as unknown as CustomFieldDef[]
    },
  )

  ipcMain.handle(
    IpcChannels.customFields.createDef,
    (_event, input: CustomFieldDefInput): CustomFieldDef => {
      const now = new Date()
      const db = getDb()
      const max = db
        .select({ position: customFieldDefs.position })
        .from(customFieldDefs)
        .where(eq(customFieldDefs.entityType, input.entityType))
        .all()
        .reduce((m, row) => Math.max(m, row.position), 0)
      return db
        .insert(customFieldDefs)
        .values({
          entityType: input.entityType,
          label: input.label.trim(),
          type: input.type,
          options: input.options ? JSON.stringify(input.options) : null,
          position: max + 1,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
        .get() as unknown as CustomFieldDef
    },
  )

  ipcMain.handle(IpcChannels.customFields.deleteDef, (_event, id: number): void => {
    const db = getDb()
    db.delete(customFieldValues).where(eq(customFieldValues.defId, id)).run()
    db.delete(customFieldDefs).where(eq(customFieldDefs.id, id)).run()
  })

  ipcMain.handle(
    IpcChannels.customFields.listValues,
    (_event, entityType: EntityType, entityId: number): CustomFieldValue[] => {
      return getDb()
        .select({
          id: customFieldValues.id,
          defId: customFieldValues.defId,
          entityId: customFieldValues.entityId,
          value: customFieldValues.value,
        })
        .from(customFieldDefs)
        .leftJoin(customFieldValues, eq(customFieldValues.defId, customFieldDefs.id))
        .where(
          and(eq(customFieldDefs.entityType, entityType), eq(customFieldValues.entityId, entityId)),
        )
        .all() as unknown as CustomFieldValue[]
    },
  )

  ipcMain.handle(
    IpcChannels.customFields.saveValues,
    (
      _event,
      _entityType: EntityType,
      entityId: number,
      values: Array<{ defId: number; value: string | null }>,
    ): void => {
      const db = getDb()
      const defIds = values.map((v) => v.defId)
      if (defIds.length > 0) {
        db.delete(customFieldValues)
          .where(
            and(eq(customFieldValues.entityId, entityId), inArray(customFieldValues.defId, defIds)),
          )
          .run()
      }
      const toInsert = values.filter((v) => v.value !== null && v.value.trim() !== '')
      if (toInsert.length > 0) {
        db.insert(customFieldValues)
          .values(toInsert.map((v) => ({ defId: v.defId, entityId, value: v.value })))
          .run()
      }
    },
  )
}
