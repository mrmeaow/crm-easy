import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UndoEntity, UndoEntry } from '@shared/types'

export const undoKey = ['undo'] as const

export function useUndoList() {
  return useQuery({ queryKey: undoKey, queryFn: () => window.crm.undo.list() })
}

export function useRestoreUndo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ entity, id }: { entity: UndoEntity; id: number }) =>
      window.crm.undo.restore(entity, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: undoKey })
      // Invalidate all entity lists since restore changes state
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['deals'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export type { UndoEntry }
