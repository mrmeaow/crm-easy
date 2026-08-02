import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ImportMapping } from '@shared/types'

export function useImportLeads() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ filePath, mapping }: { filePath: string; mapping: ImportMapping }) =>
      window.crm.leads.importRun(filePath, mapping),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  })
}
