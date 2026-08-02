import { useQuery } from '@tanstack/react-query'
import type { DealLogEntry } from '@shared/types'

export function useDealHistory(dealId: number | null) {
  return useQuery<DealLogEntry[]>({
    queryKey: ['deals', 'history', dealId] as const,
    queryFn: () => window.crm.deals.history(dealId!),
    enabled: dealId != null,
  })
}
