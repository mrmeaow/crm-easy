import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Tag, TagInput } from '@shared/types'

export const tagsKey = ['tags'] as const

export function useTags() {
  return useQuery({ queryKey: tagsKey, queryFn: () => window.crm.tags.list() })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TagInput) => window.crm.tags.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tagsKey }),
  })
}

export function useTagsForContact(contactId: number | null) {
  return useQuery({
    queryKey: ['tags', 'contact', contactId] as const,
    queryFn: () => window.crm.tags.forContact(contactId!),
    enabled: contactId != null,
  })
}

export function useAssignTags() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ contactId, tagIds }: { contactId: number; tagIds: number[] }) =>
      window.crm.tags.assign(contactId, tagIds),
    onSuccess: (_data, { contactId }) =>
      queryClient.invalidateQueries({ queryKey: ['tags', 'contact', contactId] }),
  })
}

export type { Tag }
