import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { InvestmentTransaction } from './useInvestmentData';
import { useGlobalDateRange } from '@/contexts/DateRangeContext';
import { format } from 'date-fns';

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense' | 'lend' | 'borrow' | 'investment' | 'emi';
  amount: number;
  category: string;
  description?: string;
  person?: string;
  source?: string;
  status: 'completed' | 'pending' | 'received';
  date: string;
  created_at: string;
  updated_at: string;
  loan_id?: string;
}

export interface CreateTransactionData {
  type: 'income' | 'expense' | 'lend' | 'borrow' | 'investment' | 'emi';
  amount: number;
  category: string;
  description?: string;
  person?: string;
  date: string;
  loan_id?: string;
  status?: 'completed' | 'pending' | 'received';
  source?: string;
}

export function useTransactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { dateRange } = useGlobalDateRange();

  const {
    data: transactions = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['transactions', user?.id, dateRange],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user
  });

  const createTransaction = useMutation({
    mutationFn: async (data: CreateTransactionData) => {
      if (!user) throw new Error('User not authenticated');

      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert([{
          ...data,
          user_id: user.id,
          status: data.status || 'completed' // Use provided status or default to 'completed'
        }])
        .select()
        .single();

      if (error) throw error;
      return transaction;
    },
    onSuccess: (newTransaction) => {
      queryClient.setQueryData<Transaction[]>(['transactions', user?.id], (oldData) => {
        const newData = oldData ? [...oldData, newTransaction] : [newTransaction];
        return newData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['investment-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['lending-transactions'] }); // Invalidate lending for dashboard updates
      toast({
        title: "Transaction added",
        description: "Your transaction has been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTransactionData> }) => {
      if (!user) throw new Error('User not authenticated');
      const { data: transaction, error } = await supabase
        .from('transactions')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return transaction;
    },
    onSuccess: (updatedTransaction) => {
      queryClient.setQueryData<Transaction[]>(['transactions', user?.id], (oldData) => {
        return oldData ? oldData.map(tx => (tx.id === updatedTransaction.id ? { ...tx, ...updatedTransaction } : tx)) : [];
      });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['investment-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['lending-transactions'] }); // Invalidate lending for dashboard updates
      toast({
        title: "Transaction updated",
        description: "Your transaction has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData<Transaction[]>(['transactions', user?.id], (oldData) => {
        return oldData ? oldData.filter(tx => tx.id !== id) : [];
      });
      queryClient.setQueryData<InvestmentTransaction[]>(['investment-transactions', user?.id], (oldData) => {
        return oldData ? oldData.filter(tx => tx.id !== id) : [];
      });
      queryClient.invalidateQueries({ queryKey: ['lending-transactions'] });
      toast({
        title: "Transaction deleted",
        description: "Your transaction has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Add bulk delete functionality
  const bulkDeleteTransactions = useMutation({
    mutationFn: async (transactionIds: string[]) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', transactionIds)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: (_, transactionIds) => {
      queryClient.setQueryData<Transaction[]>(['transactions', user?.id], (oldData) => {
        return oldData ? oldData.filter(tx => !transactionIds.includes(tx.id)) : [];
      });
      queryClient.setQueryData<InvestmentTransaction[]>(['investment-transactions', user?.id], (oldData) => {
        return oldData ? oldData.filter(tx => !transactionIds.includes(tx.id)) : [];
      });
      queryClient.invalidateQueries({ queryKey: ['lending-transactions'] });
      toast({
        title: "Transactions deleted",
        description: `${transactionIds.length} transaction${transactionIds.length !== 1 ? 's' : ''} deleted successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete transactions: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['transactions', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    transactions,
    isLoading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    bulkDeleteTransactions
  };
}