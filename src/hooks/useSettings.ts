import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import {
  fetchUserSettings,
  createDefaultSettings,
  updateUserSettings as svcUpdate,
} from '@/services/supabaseService';
import type { UserSettings, UpdateSettingsInput } from '@/services/supabaseService';

export type { UserSettings };

export const useSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['settings', user?.id],
    queryFn: async () => {
      const existing = await fetchUserSettings(user!.id);
      if (existing) return existing;
      return createDefaultSettings(user!.id);
    },
    enabled: !!user?.id,
  });

  const updateSettings = useMutation({
    mutationFn: (updates: UpdateSettingsInput) => svcUpdate(user!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({ title: 'Settings Updated', description: 'Your preferences have been saved successfully.' });
    },
    onError: () => {
      toast({ title: 'Update Failed', description: 'Failed to update settings. Please try again.', variant: 'destructive' });
    },
  });

  return { settings, isLoading, error, updateSettings };
};
