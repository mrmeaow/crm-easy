import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Lead, LeadInput } from '@shared/types'
import { contactsKey } from './contacts'

export const leadsKey = ['leads'] as const
export const stagesKey = ['stages'] as const

export function useLeads() {
  return useQuery({
    queryKey: leadsKey,
    queryFn: () => window.crm.leads.list(),
  })
}

export function useStages() {
  return useQuery({
    queryKey: stagesKey,
    queryFn: () => window.crm.stages.list(),
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LeadInput) => window.crm.leads.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKey }),
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<LeadInput> }) =>
      window.crm.leads.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKey }),
  })
}

export function useMoveLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stageId }: { id: number; stageId: number }) =>
      window.crm.leads.move(id, stageId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKey }),
  })
}

export function useDeleteLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => window.crm.leads.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadsKey }),
  })
}

export function useConvertLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => window.crm.leads.convert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsKey })
      queryClient.invalidateQueries({ queryKey: contactsKey })
    },
  })
}

export function useCreateStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; color?: string | null }) => window.crm.stages.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: stagesKey }),
  })
}

export function useUpdateStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: { name: string; color?: string | null } }) =>
      window.crm.stages.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: stagesKey }),
  })
}

export function useDeleteStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => window.crm.stages.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: stagesKey }),
  })
}

export function useReorderStages() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: number[]) => window.crm.stages.reorder(orderedIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: stagesKey }),
  })
}

export type { Lead }
