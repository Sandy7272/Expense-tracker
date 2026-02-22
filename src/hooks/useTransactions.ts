import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useGlobalDateRange } from '@/contexts/DateRangeContext';
import { format } from 'date-fns';
import type { InvestmentTransaction } from './useInvestmentData';
import {
  fetchTransactions,
  createTransaction as svcCreate,
  updateTransaction as svcUpdate,
  deleteTransaction as svcDelete,
  bulkDeleteTransactions as svcBulkDelete,
  subscribeToTransactions,
} from '@/services/supabaseService';
import type { Transaction, CreateTransactionInput, UpdateTransactionInput } from '@/services/supabaseService';

// Re-export types for backward compatibility
export type { Transaction };
export type CreateTransactionData = CreateTransactionInput;

export function useTransactions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { dateRange } = useGlobalDateRange();

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['transactions', user?.id, dateRange],
    queryFn: () =>
      fetchTransactions(user!.id, {
        startDate: format(dateRange.from, 'yyyy-MM-dd'),
        endDate: format(dateRange.to, 'yyyy-MM-dd'),
      }),
    enabled: !!user,
  });

  const createTransaction = useMutation({
    mutationFn: (data: CreateTransactionInput) => svcCreate(user!.id, data),
    onSuccess: (newTx) => {
      queryClient.setQueryData<Transaction[]>(['transactions', user?.id], (old) => {
        const list = old ? [...old, newTx] : [newTx];
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['investment-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['lending-transactions'] });
      toast({ title: 'Transaction added', description: 'Your transaction has been saved successfully.' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateTransaction = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTransactionInput> }) =>
      svcUpdate(user!.id, id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<Transaction[]>(['transactions', user?.id], (old) =>
        old ? old.map(tx => (tx.id === updated.id ? { ...tx, ...updated } : tx)) : []
      );
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['investment-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['lending-transactions'] });
      toast({ title: 'Transaction updated', description: 'Your transaction has been updated successfully.' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteTransaction = useMutation({
    mutationFn: (id: string) => svcDelete(user!.id, id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Transaction[]>(['transactions', user?.id], (old) =>
        old ? old.filter(tx => tx.id !== id) : []
      );
      queryClient.setQueryData<InvestmentTransaction[]>(['investment-transactions', user?.id], (old) =>
        old ? old.filter(tx => tx.id !== id) : []
      );
      queryClient.invalidateQueries({ queryKey: ['lending-transactions'] });
      toast({ title: 'Transaction deleted', description: 'Your transaction has been deleted successfully.' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const bulkDeleteTransactions = useMutation({
    mutationFn: (ids: string[]) => svcBulkDelete(user!.id, ids),
    onSuccess: (_, ids) => {
      queryClient.setQueryData<Transaction[]>(['transactions', user?.id], (old) =>
        old ? old.filter(tx => !ids.includes(tx.id)) : []
      );
      queryClient.setQueryData<InvestmentTransaction[]>(['investment-transactions', user?.id], (old) =>
        old ? old.filter(tx => !ids.includes(tx.id)) : []
      );
      queryClient.invalidateQueries({ queryKey: ['lending-transactions'] });
      toast({ title: 'Transactions deleted', description: `${ids.length} transaction${ids.length !== 1 ? 's' : ''} deleted successfully.` });
    },
    onError: (e: Error) => toast({ title: 'Error', description: `Failed to delete transactions: ${e.message}`, variant: 'destructive' }),
  });

  // Realtime subscription via service layer
  useEffect(() => {
    if (!user) return;
    return subscribeToTransactions(user.id, () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user.id] });
    });
  }, [user, queryClient]);

  return { transactions, isLoading, error, createTransaction, updateTransaction, deleteTransaction, bulkDeleteTransactions };
}
