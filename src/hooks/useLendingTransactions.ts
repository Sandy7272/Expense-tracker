import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface LendingTransaction {
  id: string;
  user_id: string;
  type: 'lent' | 'borrowed' | 'repaid_by_them' | 'repaid_by_me';
  person_name: string;
  amount: number;
  description?: string;
  date: string;
  due_date?: string;
  status: 'active' | 'completed' | 'overdue';
  related_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLendingTransactionData {
  type: 'lent' | 'borrowed' | 'repaid_by_them' | 'repaid_by_me';
  person_name: string;
  amount: number;
  description?: string;
  date: string;
  due_date?: string;
  related_transaction_id?: string;
}

export const useLendingTransactions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch lending transactions
  const {
    data: transactions = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['lending-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('lending_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data as LendingTransaction[];
    },
    enabled: !!user?.id,
  });

  // Create lending transaction mutation
  const createTransaction = useMutation({
    mutationFn: async (transactionData: CreateLendingTransactionData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('lending_transactions')
        .insert({
          ...transactionData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as LendingTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lending-transactions'] });
      toast({
        title: 'Transaction Added',
        description: 'Lending transaction has been recorded successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Add Transaction',
        description: 'Please check your details and try again.',
        variant: 'destructive',
      });
      console.error('Lending transaction creation error:', error);
    },
  });

  // Update lending transaction mutation
  const updateTransaction = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LendingTransaction> }) => {
      const { data, error } = await supabase
        .from('lending_transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data as LendingTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lending-transactions'] });
      toast({
        title: 'Transaction Updated',
        description: 'Lending transaction has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update transaction. Please try again.',
        variant: 'destructive',
      });
      console.error('Lending transaction update error:', error);
    },
  });

  // Delete lending transaction mutation
  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lending_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lending-transactions'] });
      toast({
        title: 'Transaction Deleted',
        description: 'Lending transaction has been deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete transaction. Please try again.',
        variant: 'destructive',
      });
      console.error('Lending transaction deletion error:', error);
    },
  });

  return {
    transactions,
    isLoading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
};