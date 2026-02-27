import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { PROFILE_STORAGE_KEY } from '@/constants/profile';
import { EMPTY_PROFILE, UserProfile } from '@/types/profile';

const profileKeys = {
  all: ['profile'] as const,
};

async function loadProfile(): Promise<UserProfile> {
  const data = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
  if (data === null || data === '') return EMPTY_PROFILE;
  return JSON.parse(data) as UserProfile;
}

async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: loadProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const current = await loadProfile();
      const updated = { ...current, ...updates };
      await saveProfile(updated);
      return updated;
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: profileKeys.all });
      const previous = queryClient.getQueryData<UserProfile>(profileKeys.all);
      queryClient.setQueryData<UserProfile>(profileKeys.all, (old) => ({
        ...(old ?? EMPTY_PROFILE),
        ...updates,
      }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(profileKeys.all, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}
