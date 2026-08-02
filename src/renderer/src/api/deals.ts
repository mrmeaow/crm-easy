import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Deal, DealInput, DealSettleInput } from '@shared/types'

export const dealsKey = ['deals'] as const

export function useDeals() {
  return useQuery({
    queryKey: dealsKey,
    queryFn: () => window.crm.deals.list(),
  })
}

export function useCreateDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: DealInput) => window.crm.deals.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dealsKey }),
  })
}

export function useUpdateDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<DealInput> }) =>
      window.crm.deals.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dealsKey }),
  })
}

export function useDeleteDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => window.crm.deals.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dealsKey }),
  })
}

export function useSettleDeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: DealSettleInput) => window.crm.deals.settle(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dealsKey }),
  })
}

export type { Deal }
