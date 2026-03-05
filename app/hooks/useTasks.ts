import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { Alert } from 'react-native';

import {
  createTaskApi,
  deleteTaskApi,
  fetchTasks,
  isBackendConfigured,
  updateTaskApi,
} from '@/services/api';
import { cancelTaskReminder, scheduleTaskReminder } from '@/services/task-notifications';
import { Task, TaskSource, TaskStatus } from '@/types/task';

const STORAGE_KEY = 'launchpad_tasks';
const useApi = isBackendConfigured();

const taskKeys = {
  all: ['tasks'] as const,
};

function calculateReminderDate(dueDate: string): string {
  const due = new Date(dueDate);
  due.setMinutes(due.getMinutes() - 15);
  return due.toISOString();
}

async function loadTasks(): Promise<Task[]> {
  if (useApi) {
    const apiTasks = await fetchTasks();
    return apiTasks.map((t) => ({
      taskId: t.taskId,
      title: t.title,
      description: t.description,
      dueDate: t.dueDate,
      reminderDate: t.reminderDate,
      linkedIdeaId: t.linkedIdeaId,
      status: t.status as TaskStatus,
      source: t.source as TaskSource,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  if (data === null || data === '') return [];
  return JSON.parse(data) as Task[];
}

async function saveTasks(tasks: Task[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ── Queries ──────────────────────────────────────────────

export function useTasks(filters?: { status?: TaskStatus; linkedIdeaId?: string }) {
  return useQuery({
    queryKey: taskKeys.all,
    queryFn: loadTasks,
    select:
      filters !== undefined
        ? (tasks: Task[]) => {
            let filtered = tasks;
            if (filters.status !== undefined) {
              filtered = filtered.filter((t) => t.status === filters.status);
            }
            if (filters.linkedIdeaId !== undefined) {
              filtered = filtered.filter((t) => t.linkedIdeaId === filters.linkedIdeaId);
            }
            return filtered.sort(
              (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
            );
          }
        : (tasks: Task[]) =>
            [...tasks].sort(
              (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
            ),
  });
}

export function useUpcomingTasks() {
  return useQuery({
    queryKey: taskKeys.all,
    queryFn: loadTasks,
    select: (tasks: Task[]) =>
      tasks
        .filter((t) => t.status === 'pending')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5),
  });
}

// ── Mutations ────────────────────────────────────────────

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      dueDate,
      linkedIdeaId,
      source = 'manual',
    }: {
      title: string;
      description?: string;
      dueDate: string;
      linkedIdeaId?: string;
      source?: TaskSource;
    }) => {
      if (useApi) {
        const apiTask = await createTaskApi({ title, description, dueDate, linkedIdeaId, source });
        return {
          taskId: apiTask.taskId,
          title: apiTask.title,
          description: apiTask.description,
          dueDate: apiTask.dueDate,
          reminderDate: apiTask.reminderDate,
          linkedIdeaId: apiTask.linkedIdeaId,
          status: apiTask.status as TaskStatus,
          source: apiTask.source as TaskSource,
          createdAt: apiTask.createdAt,
          updatedAt: apiTask.updatedAt,
        } satisfies Task;
      }
      const tasks = await loadTasks();
      const now = new Date().toISOString();
      const newTask: Task = {
        taskId: Crypto.randomUUID(),
        title,
        description,
        dueDate,
        reminderDate: calculateReminderDate(dueDate),
        linkedIdeaId,
        status: 'pending',
        source,
        createdAt: now,
        updatedAt: now,
      };
      tasks.push(newTask);
      await saveTasks(tasks);
      return newTask;
    },
    onMutate: async ({ title, description, dueDate, linkedIdeaId, source = 'manual' }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all);
      const now = new Date().toISOString();
      const optimistic: Task = {
        taskId: `temp-${Date.now()}`,
        title,
        description,
        dueDate,
        reminderDate: calculateReminderDate(dueDate),
        linkedIdeaId,
        status: 'pending',
        source,
        createdAt: now,
        updatedAt: now,
      };
      queryClient.setQueryData<Task[]>(taskKeys.all, (old) => [...(old ?? []), optimistic]);
      return { previous };
    },
    onSuccess: (task) => {
      void scheduleTaskReminder(task.taskId, task.title, task.dueDate);
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(taskKeys.all, context.previous);
      }
      Alert.alert('Error', 'Failed to create task. Please try again.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: Partial<Pick<Task, 'title' | 'description' | 'dueDate' | 'status'>>;
    }) => {
      if (useApi) {
        await updateTaskApi(taskId, updates);
        return;
      }
      const tasks = await loadTasks();
      const index = tasks.findIndex((t) => t.taskId === taskId);
      if (index === -1) throw new Error('Task not found');
      const updated = { ...tasks[index], ...updates, updatedAt: new Date().toISOString() };
      if (updates.dueDate !== undefined) {
        updated.reminderDate = calculateReminderDate(updates.dueDate);
      }
      tasks[index] = updated;
      await saveTasks(tasks);
      return tasks[index];
    },
    onMutate: async ({ taskId, updates }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all);
      queryClient.setQueryData<Task[]>(taskKeys.all, (old) =>
        (old ?? []).map((task) =>
          task.taskId === taskId
            ? { ...task, ...updates, updatedAt: new Date().toISOString() }
            : task,
        ),
      );

      // Cancel or reschedule the local notification
      if (updates.status === 'done' || updates.status === 'dismissed') {
        void cancelTaskReminder(taskId);
      } else if (updates.dueDate !== undefined) {
        const task = (previous ?? []).find((t) => t.taskId === taskId);
        const title = updates.title ?? task?.title ?? '';
        void scheduleTaskReminder(taskId, title, updates.dueDate);
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(taskKeys.all, context.previous);
      }
      Alert.alert('Error', 'Failed to update task. Please try again.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      if (useApi) {
        await deleteTaskApi(taskId);
        return;
      }
      const tasks = await loadTasks();
      const filtered = tasks.filter((t) => t.taskId !== taskId);
      await saveTasks(filtered);
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previous = queryClient.getQueryData<Task[]>(taskKeys.all);
      queryClient.setQueryData<Task[]>(taskKeys.all, (old) =>
        (old ?? []).filter((task) => task.taskId !== taskId),
      );
      void cancelTaskReminder(taskId);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(taskKeys.all, context.previous);
      }
      Alert.alert('Error', 'Failed to delete task. Please try again.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
