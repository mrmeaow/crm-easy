import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CustomFieldDef,
  CustomFieldDefInput,
  CustomFieldValue,
  EntityType,
} from '@shared/types'

export const customFieldDefsKey = ['customFieldDefs'] as const

export function useCustomFieldDefs(entityType?: EntityType) {
  return useQuery({
    queryKey: [...customFieldDefsKey, entityType] as const,
    queryFn: () => window.crm.customFields.listDefs(entityType),
  })
}

export function useCreateCustomFieldDef() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CustomFieldDefInput) => window.crm.customFields.createDef(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customFieldDefsKey }),
  })
}

export function useDeleteCustomFieldDef() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => window.crm.customFields.deleteDef(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customFieldDefsKey }),
  })
}

export function useCustomFieldValues(entityType: EntityType, entityId: number | null) {
  return useQuery({
    queryKey: ['customFieldValues', entityType, entityId] as const,
    queryFn: () => window.crm.customFields.listValues(entityType, entityId!),
    enabled: entityId != null,
  })
}

export function useSaveCustomFieldValues() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      values,
    }: {
      entityType: EntityType
      entityId: number
      values: Array<{ defId: number; value: string | null }>
    }) => window.crm.customFields.saveValues(entityType, entityId, values),
    onSuccess: (_data, { entityType, entityId }) =>
      queryClient.invalidateQueries({ queryKey: ['customFieldValues', entityType, entityId] }),
  })
}

export type { CustomFieldDef, CustomFieldValue }
