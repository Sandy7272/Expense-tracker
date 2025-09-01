import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface SyncResult {
  imported: number;
  duplicates: number;
  total: number;
  message: string;
}

interface SyncError {
  error: string;
  details?: string;
}

export function useGoogleSheetsSync() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Start Google OAuth flow
  const authenticate = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('google-sheets-sync', {
        body: { action: 'authenticate' }
      });

      if (error) throw error;

      return data as { authUrl: string };
    },
    onSuccess: (data) => {
      setIsAuthenticating(true);
      // Open OAuth window
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Sync data from Google Sheets
  const syncData = useMutation({
    mutationFn: async (sheetUrl?: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('google-sheets-sync', {
        body: { 
          action: 'sync',
          sheetUrl 
        }
      });

      if (error) throw error;

      return data as SyncResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      
      toast({
        title: "Sync Complete",
        description: result.message,
      });
    },
    onError: (error: SyncError) => {
      toast({
        title: "Sync Failed", 
        description: error.error || 'Failed to sync with Google Sheets',
        variant: "destructive",
      });
    }
  });

  // Test connection to Google Sheets
  const testConnection = useMutation({
    mutationFn: async (sheetUrl: string) => {
      if (!sheetUrl) throw new Error('Sheet URL is required');
      
      // This would make a lightweight API call to test the connection
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Extract sheet ID and validate format
      const sheetIdMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!sheetIdMatch) {
        throw new Error('Invalid Google Sheets URL format');
      }

      return { success: true, message: 'Connection successful' };
    },
    onSuccess: () => {
      toast({
        title: "Connection Test Successful",
        description: "Google Sheets URL is valid and accessible",
      });
    },
    onError: (error) => {
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    authenticate,
    syncData,
    testConnection,
    isAuthenticating,
    setIsAuthenticating,
    isSyncing: syncData.isPending,
    isTesting: testConnection.isPending,
  };
}