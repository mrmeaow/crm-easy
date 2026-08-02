import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Activity, ActivityInput, EntityType } from '@shared/types'

export function activitiesKey(
  entityType: EntityType,
  entityId: number,
): readonly [string, EntityType, number] {
  return ['activities', entityType, entityId] as const
}

export function useActivities(entityType: EntityType, entityId: number | null) {
  return useQuery({
    queryKey: activitiesKey(entityType, entityId ?? 0),
    queryFn: () => window.crm.activities.list(entityType, entityId ?? 0),
    enabled: entityId !== null,
  })
}

export function useCreateActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ActivityInput) => window.crm.activities.create(input),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({
        queryKey: activitiesKey(input.entityType, input.entityId),
      })
    },
  })
}

export type { Activity }
