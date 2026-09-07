import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { TaskStatus } from "@/lib/types";

const tasksKey = (date: string) => ["tasks", date] as const;
const overdueKey = ["tasks", "overdue"] as const;
const allTasksKey = ["tasks", "all"] as const;

export function useTasksForDate(date: string) {
  return useQuery({
    queryKey: tasksKey(date),
    queryFn: () => api.fetchTasksForDate(date),
  });
}

export function useOverdueTasks() {
  return useQuery({
    queryKey: overdueKey,
    queryFn: api.fetchOverdueTasks,
  });
}

export function useAllTasks() {
  return useQuery({
    queryKey: allTasksKey,
    queryFn: api.fetchAllTasks,
  });
}

function useInvalidateTasks() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["tasks"] });
}

export function useCreateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (data: { text: string; date: string; notify?: boolean }) =>
      api.createTask(data),
    onSuccess: invalidate,
  });
}

export function useUpdateTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      text?: string;
      date?: string;
      status?: TaskStatus;
      notify?: boolean;
    }) => api.updateTask(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: invalidate,
  });
}
