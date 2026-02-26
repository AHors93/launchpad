import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Crypto from 'expo-crypto';

import { searchCareerPath } from '@/services/explore';
import { ExploreSearch } from '@/types/explore';

const STORAGE_KEY = 'launchpad_explore_history';

const exploreKeys = {
  all: ['explore'] as const,
};

async function loadSearchHistory(): Promise<ExploreSearch[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  if (data === null || data === '') return [];
  return JSON.parse(data) as ExploreSearch[];
}

async function saveSearchHistory(searches: ExploreSearch[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
}

export function useSearchHistory() {
  return useQuery({
    queryKey: exploreKeys.all,
    queryFn: loadSearchHistory,
  });
}

export function useExploreSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (query: string) => {
      const result = await searchCareerPath(query);

      const search: ExploreSearch = {
        id: Crypto.randomUUID(),
        query,
        result,
        createdAt: new Date().toISOString(),
      };

      // Prepend to history
      const history = await loadSearchHistory();
      history.unshift(search);
      // Keep last 20 searches
      if (history.length > 20) {
        history.length = 20;
      }
      await saveSearchHistory(history);

      return search;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: exploreKeys.all });
    },
  });
}

export function useDeleteSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (searchId: string) => {
      const history = await loadSearchHistory();
      const filtered = history.filter((s) => s.id !== searchId);
      await saveSearchHistory(filtered);
    },
    onMutate: async (searchId) => {
      await queryClient.cancelQueries({ queryKey: exploreKeys.all });
      const previous = queryClient.getQueryData<ExploreSearch[]>(exploreKeys.all);
      queryClient.setQueryData<ExploreSearch[]>(exploreKeys.all, (old) =>
        (old ?? []).filter((s) => s.id !== searchId),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(exploreKeys.all, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: exploreKeys.all });
    },
  });
}
