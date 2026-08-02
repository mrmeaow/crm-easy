import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Task, TaskInput } from '@shared/types'

export const tasksKey = ['tasks'] as const

export function useTasks() {
  return useQuery({
    queryKey: tasksKey,
    queryFn: () => window.crm.tasks.list(),
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TaskInput) => window.crm.tasks.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey }),
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<TaskInput> }) =>
      window.crm.tasks.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey }),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => window.crm.tasks.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey }),
  })
}

export function useOpenTaskCount(): number | undefined {
  const { data } = useTasks()
  return data?.filter((task) => !task.done).length
}

export type { Task }
