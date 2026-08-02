import { useQuery } from '@tanstack/react-query'
import type { Activity } from '@shared/types'

export function useActivitiesInRange(from: Date, to: Date) {
  return useQuery<Activity[]>({
    queryKey: ['reports', 'activities', from.toISOString(), to.toISOString()] as const,
    queryFn: () => window.crm.reports.activities(from.getTime(), to.getTime()),
  })
}
