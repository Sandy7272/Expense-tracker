import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface UserSettings {
  id: string;
  user_id: string;
  currency: string;
  theme: string;
  language: string;
  notifications_email: boolean;
  notifications_budget_alerts: boolean;
  notifications_loan_reminders: boolean;
  auto_sync: boolean;
  sheet_url?: string;
  google_access_token?: string;
  google_refresh_token?: string;
  google_token_expires_at?: string;
  last_synced?: string;
  sync_status?: string;
  sync_errors?: string;
  created_at: string;
  updated_at: string;
}

interface UpdateSettingsData {
  currency?: string;
  theme?: string;
  language?: string;
  notifications_email?: boolean;
  notifications_budget_alerts?: boolean;
  notifications_loan_reminders?: boolean;
  auto_sync?: boolean;
  sheet_url?: string;
  google_access_token?: string;
  google_refresh_token?: string;
  google_token_expires_at?: string;
}

export const useSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user settings
  const {
    data: settings,
    isLoading,
    error
  } = useQuery({
    queryKey: ['settings', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data: settings, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, create default settings
      if (!settings) {
        const defaultSettings = {
          user_id: user.id,
          currency: 'INR',
          theme: 'system',
          language: 'en',
          notifications_email: true,
          notifications_budget_alerts: true,
          notifications_loan_reminders: true,
          auto_sync: true,
        };

        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (insertError) throw insertError;
        return newSettings as UserSettings;
      }

      return settings as UserSettings;
    },
    enabled: !!user?.id,
  });

  // Update settings mutation
  const updateSettings = useMutation({
    mutationFn: async (updates: UpdateSettingsData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as UserSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: 'Settings Updated',
        description: 'Your preferences have been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
      console.error('Settings update error:', error);
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings,
  };
};