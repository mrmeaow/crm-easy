import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { EntityType, Note, NoteInput } from '@shared/types'

export function notesKey(
  entityType: EntityType,
  entityId: number,
): readonly [string, EntityType, number] {
  return ['notes', entityType, entityId] as const
}

export function useNotes(entityType: EntityType, entityId: number | null) {
  return useQuery({
    queryKey: notesKey(entityType, entityId ?? 0),
    queryFn: () => window.crm.notes.list(entityType, entityId ?? 0),
    enabled: entityId !== null,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NoteInput) => window.crm.notes.create(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: notesKey(input.entityType, input.entityId) })
    },
  })
}

export type { Note }
