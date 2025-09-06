import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function useGoogleTokens() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Revoke Google tokens
  const revokeTokens = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('secure-google-tokens', {
        body: { action: 'revoke' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Google Account Disconnected",
        description: "Your Google account has been safely disconnected. All stored tokens have been securely removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect Google account",
        variant: "destructive",
      });
    }
  });

  return {
    revokeTokens,
    isRevoking: revokeTokens.isPending
  };
}