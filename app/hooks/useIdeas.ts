import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';
import { Alert } from 'react-native';

import { getTrackConfig } from '@/constants/tracks';
import {
  createIdeaApi,
  deleteIdeaApi,
  fetchIdeas,
  isBackendConfigured,
  updateIdeaApi,
} from '@/services/api';
import { Idea, IdeaStatus, TrackType } from '@/types/idea';

const STORAGE_KEY = 'launchpad_ideas';
const useApi = isBackendConfigured();

// Single query key — all derived queries share this cache
const ideaKeys = {
  all: ['ideas'] as const,
};

async function loadIdeas(): Promise<Idea[]> {
  if (useApi) {
    const apiIdeas = await fetchIdeas();
    return apiIdeas.map((i) => ({
      ideaId: i.ideaId,
      title: i.title,
      description: i.description,
      status: i.status as IdeaStatus,
      trackType: (i.trackType as TrackType | undefined) ?? 'side_project',
      tags: i.tags,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    }));
  }
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  if (data === null || data === '') return [];
  const ideas = JSON.parse(data) as Idea[];
  // Lazy backfill: default missing trackType to 'side_project'
  return ideas.map((i) => ({ ...i, trackType: i.trackType ?? 'side_project' }));
}

async function saveIdeas(ideas: Idea[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
}

// ── Queries (all derive from the same cache via `select`) ──

export function useIdeas(filters?: { statusFilter?: IdeaStatus; trackType?: TrackType }) {
  return useQuery({
    queryKey: ideaKeys.all,
    queryFn: loadIdeas,
    select:
      filters !== undefined
        ? (ideas: Idea[]) => {
            let filtered = ideas;
            if (filters.statusFilter !== undefined) {
              filtered = filtered.filter((i) => i.status === filters.statusFilter);
            }
            if (filters.trackType !== undefined) {
              filtered = filtered.filter(
                (i) => (i.trackType ?? 'side_project') === filters.trackType,
              );
            }
            return filtered;
          }
        : undefined,
  });
}

export function useIdea(ideaId: string | undefined) {
  return useQuery({
    queryKey: ideaKeys.all,
    queryFn: loadIdeas,
    select: (ideas: Idea[]) => ideas.find((i) => i.ideaId === ideaId),
    enabled: ideaId !== undefined && ideaId !== '',
  });
}

export interface IdeaStats {
  total: number;
  spark: number;
  exploring: number;
  building: number;
  shipped: number;
  byTrack: Record<TrackType, number>;
}

export function useIdeaStats() {
  return useQuery({
    queryKey: ideaKeys.all,
    queryFn: loadIdeas,
    select: (ideas: Idea[]): IdeaStats => {
      const byTrack = {} as Record<TrackType, number>;
      for (const idea of ideas) {
        const track = idea.trackType ?? 'side_project';
        byTrack[track] = (byTrack[track] ?? 0) + 1;
      }

      return {
        total: ideas.length,
        // Backwards-compatible counts for side_project statuses
        spark: ideas.filter((i) => i.status === 'spark').length,
        exploring: ideas.filter((i) => i.status === 'exploring').length,
        building: ideas.filter((i) => i.status === 'building').length,
        shipped: ideas.filter((i) => i.status === 'shipped').length,
        byTrack,
      };
    },
  });
}

// ── Mutations (optimistic updates + rollback) ──

export function useCreateIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      trackType,
    }: {
      title: string;
      description?: string;
      trackType?: TrackType;
    }) => {
      const track = trackType ?? 'side_project';
      const trackConfig = getTrackConfig(track);

      if (useApi) {
        const apiIdea = await createIdeaApi({ title, description, trackType: track });
        return {
          ideaId: apiIdea.ideaId,
          title: apiIdea.title,
          description: apiIdea.description,
          status: apiIdea.status as IdeaStatus,
          trackType: (apiIdea.trackType as TrackType | undefined) ?? track,
          tags: apiIdea.tags,
          createdAt: apiIdea.createdAt,
          updatedAt: apiIdea.updatedAt,
        } satisfies Idea;
      }
      const ideas = await loadIdeas();
      const now = new Date().toISOString();
      const newIdea: Idea = {
        ideaId: Crypto.randomUUID(),
        title,
        description,
        status: trackConfig.defaultStatus,
        trackType: track,
        tags: [],
        createdAt: now,
        updatedAt: now,
      };
      ideas.unshift(newIdea);
      await saveIdeas(ideas);
      return newIdea;
    },
    onMutate: async ({ title, description, trackType }) => {
      await queryClient.cancelQueries({ queryKey: ideaKeys.all });
      const previous = queryClient.getQueryData<Idea[]>(ideaKeys.all);
      const track = trackType ?? 'side_project';
      const trackConfig = getTrackConfig(track);
      const now = new Date().toISOString();
      const optimistic: Idea = {
        ideaId: `temp-${Date.now()}`,
        title,
        description,
        status: trackConfig.defaultStatus,
        trackType: track,
        tags: [],
        createdAt: now,
        updatedAt: now,
      };
      queryClient.setQueryData<Idea[]>(ideaKeys.all, (old) => [optimistic, ...(old ?? [])]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(ideaKeys.all, context.previous);
      }
      Alert.alert('Error', 'Failed to save idea. Please try again.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ideaKeys.all });
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
      updates: Partial<Pick<Idea, 'title' | 'description' | 'status' | 'tags' | 'trackType'>>;
    }) => {
      if (useApi) {
        await updateIdeaApi(ideaId, updates);
        return;
      }
      const ideas = await loadIdeas();
      const index = ideas.findIndex((i) => i.ideaId === ideaId);
      if (index === -1) throw new Error('Idea not found');
      ideas[index] = { ...ideas[index], ...updates, updatedAt: new Date().toISOString() };
      await saveIdeas(ideas);
      return ideas[index];
    },
    onMutate: async ({ ideaId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ideaKeys.all });
      const previous = queryClient.getQueryData<Idea[]>(ideaKeys.all);
      queryClient.setQueryData<Idea[]>(ideaKeys.all, (old) =>
        (old ?? []).map((idea) =>
          idea.ideaId === ideaId
            ? { ...idea, ...updates, updatedAt: new Date().toISOString() }
            : idea,
        ),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(ideaKeys.all, context.previous);
      }
      Alert.alert('Error', 'Failed to update idea. Please try again.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ideaKeys.all });
    },
  });
}

export function useDeleteIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ideaId: string) => {
      if (useApi) {
        await deleteIdeaApi(ideaId);
        return;
      }
      const ideas = await loadIdeas();
      const filtered = ideas.filter((i) => i.ideaId !== ideaId);
      await saveIdeas(filtered);
    },
    onMutate: async (ideaId) => {
      await queryClient.cancelQueries({ queryKey: ideaKeys.all });
      const previous = queryClient.getQueryData<Idea[]>(ideaKeys.all);
      queryClient.setQueryData<Idea[]>(ideaKeys.all, (old) =>
        (old ?? []).filter((idea) => idea.ideaId !== ideaId),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(ideaKeys.all, context.previous);
      }
      Alert.alert('Error', 'Failed to delete idea. Please try again.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ideaKeys.all });
    },
  });
}
