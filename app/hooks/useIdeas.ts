import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { Idea, IdeaStatus } from '@/types/idea';

const STORAGE_KEY = 'launchpad_ideas';

async function loadIdeas(): Promise<Idea[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  if (data === null || data === '') return [];
  return JSON.parse(data) as Idea[];
}

async function saveIdeas(ideas: Idea[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
}

export function useIdeas(statusFilter?: IdeaStatus) {
  return useQuery({
    queryKey: ['ideas', statusFilter],
    queryFn: async () => {
      const ideas = await loadIdeas();
      if (statusFilter !== undefined) {
        return ideas.filter((i) => i.status === statusFilter);
      }
      return ideas;
    },
  });
}

export function useIdeaStats() {
  return useQuery({
    queryKey: ['ideas', 'stats'],
    queryFn: async () => {
      const ideas = await loadIdeas();
      return {
        total: ideas.length,
        spark: ideas.filter((i) => i.status === 'spark').length,
        exploring: ideas.filter((i) => i.status === 'exploring').length,
        building: ideas.filter((i) => i.status === 'building').length,
        shipped: ideas.filter((i) => i.status === 'shipped').length,
      };
    },
  });
}

export function useCreateIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, description }: { title: string; description?: string }) => {
      const ideas = await loadIdeas();
      const now = new Date().toISOString();
      const newIdea: Idea = {
        ideaId: Crypto.randomUUID(),
        title,
        description,
        status: 'spark',
        tags: [],
        createdAt: now,
        updatedAt: now,
      };
      ideas.unshift(newIdea);
      await saveIdeas(ideas);
      return newIdea;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ideas'] });
    },
  });
}

export function useUpdateIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ideaId,
      updates,
    }: {
      ideaId: string;
      updates: Partial<Pick<Idea, 'title' | 'description' | 'status' | 'tags'>>;
    }) => {
      const ideas = await loadIdeas();
      const index = ideas.findIndex((i) => i.ideaId === ideaId);
      if (index === -1) throw new Error('Idea not found');
      ideas[index] = { ...ideas[index], ...updates, updatedAt: new Date().toISOString() };
      await saveIdeas(ideas);
      return ideas[index];
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ideas'] });
    },
  });
}

export function useDeleteIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ideaId: string) => {
      const ideas = await loadIdeas();
      const filtered = ideas.filter((i) => i.ideaId !== ideaId);
      await saveIdeas(filtered);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ideas'] });
    },
  });
}
