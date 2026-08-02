import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Contact, ContactInput, ImportMapping } from '@shared/types'

export const contactsKey = ['contacts'] as const

export function useContacts() {
  return useQuery({
    queryKey: contactsKey,
    queryFn: () => window.crm.contacts.list(),
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ContactInput) => window.crm.contacts.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactsKey }),
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<ContactInput> }) =>
      window.crm.contacts.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactsKey }),
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => window.crm.contacts.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactsKey }),
  })
}

export function useMergeContacts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ masterId, duplicateIds }: { masterId: number; duplicateIds: number[] }) =>
      window.crm.contacts.merge(masterId, duplicateIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactsKey }),
  })
}

export function useImportContacts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ filePath, mapping }: { filePath: string; mapping: ImportMapping }) =>
      window.crm.contacts.importRun(filePath, mapping),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contactsKey }),
  })
}

export function useContactCount(): number | undefined {
  const { data } = useContacts()
  return data?.length
}

export type { Contact }
