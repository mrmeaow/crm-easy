import { useQuery } from '@tanstack/react-query'
import type { SearchResults } from '@shared/types'

export function useSearch(query: string) {
  return useQuery<SearchResults>({
    queryKey: ['search', query] as const,
    queryFn: () => window.crm.search.query(query),
    enabled: query.trim().length >= 2,
    staleTime: 1000,
  })
}
