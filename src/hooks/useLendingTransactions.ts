import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { useGlobalDateRange } from '@/contexts/DateRangeContext';
import { format } from 'date-fns';
import {
  fetchLendingTransactions,
  fetchUniqueLendingPersons,
  createLendingTransaction as svcCreate,
  updateLendingTransaction as svcUpdate,
  deleteLendingTransaction as svcDelete,
} from '@/services/supabaseService';
import type { LendingTransaction, CreateLendingInput } from '@/services/supabaseService';

export type { LendingTransaction };

export interface CreateLendingTransactionData {
  type: 'lent' | 'borrowed' | 'repaid_by_them' | 'repaid_by_me';
  person_name: string;
  amount: number;
  description?: string;
  date: string;
  due_date?: string;
  related_transaction_id?: string;
}

export const useLendingTransactions = (personFilter?: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { dateRange } = useGlobalDateRange();

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ['lending-transactions', user?.id, dateRange, personFilter],
    queryFn: () =>
      fetchLendingTransactions(user!.id, {
        startDate: format(dateRange.from, 'yyyy-MM-dd'),
        endDate: format(dateRange.to, 'yyyy-MM-dd'),
        personFilter: personFilter || undefined,
      }),
    enabled: !!user?.id,
  });

  const createTransaction = useMutation({
    mutationFn: (data: CreateLendingTransactionData) => svcCreate(user!.id, data as CreateLendingInput),
    onSuccess: () => {
      toast({ title: 'Transaction Added', description: 'Lending transaction has been recorded successfully.' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['lending-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['unique-lending-persons'] });
    },
    onError: () => {
      toast({ title: 'Failed to Add Transaction', description: 'Please check your details and try again.', variant: 'destructive' });
    },
  });

  const updateTransaction = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<LendingTransaction> }) =>
      svcUpdate(user!.id, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lending-transactions'] });
      toast({ title: 'Transaction Updated', description: 'Lending transaction has been updated successfully.' });
    },
    onError: () => {
      toast({ title: 'Update Failed', description: 'Failed to update transaction. Please try again.', variant: 'destructive' });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: (id: string) => svcDelete(user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lending-transactions'] });
      toast({ title: 'Transaction Deleted', description: 'Lending transaction has been deleted successfully.' });
    },
    onError: () => {
      toast({ title: 'Delete Failed', description: 'Failed to delete transaction. Please try again.', variant: 'destructive' });
    },
  });

  const { data: uniquePersons = [], isLoading: isLoadingPersons } = useQuery({
    queryKey: ['unique-lending-persons', user?.id],
    queryFn: () => fetchUniqueLendingPersons(user!.id),
    enabled: !!user?.id,
  });

  return { transactions, isLoading, error, createTransaction, updateTransaction, deleteTransaction, uniquePersons, isLoadingPersons };
};
