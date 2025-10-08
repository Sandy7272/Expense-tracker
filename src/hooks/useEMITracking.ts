import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Transaction } from './useTransactions';

export function useEMITracking(loanId: string) {
  const { user } = useAuth();

  // Fetch transactions linked to this loan
  const { data: emiTransactions = [], isLoading } = useQuery({
    queryKey: ['loan-transactions', loanId, user?.id],
    queryFn: async () => {
      if (!user || !loanId) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('loan_id', loanId)
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user && !!loanId,
  });

  // Calculate EMI statistics
  const emiStats = useMemo(() => {
    const totalPaidFromTransactions = emiTransactions.reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );

    const emiCount = emiTransactions.length;
    const lastEMIDate = emiTransactions.length > 0 
      ? emiTransactions[emiTransactions.length - 1].date 
      : null;

    return {
      totalPaidFromTransactions,
      emiCount,
      lastEMIDate,
      transactions: emiTransactions,
    };
  }, [emiTransactions]);

  return {
    emiTransactions,
    emiStats,
    isLoading,
  };
}
