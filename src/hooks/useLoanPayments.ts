import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import {
  fetchLoanPayments,
  createLoanPayment as svcCreate,
  updateLoanPayment as svcUpdate,
  deleteLoanPayment as svcDelete,
} from '@/services/supabaseService';
import type { LoanPayment, CreateLoanPaymentInput } from '@/services/supabaseService';

export type { LoanPayment };
export type CreateLoanPaymentData = CreateLoanPaymentInput;

export const useLoanPayments = (loanId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ['loan-payments', loanId],
    queryFn: () => fetchLoanPayments(loanId),
    enabled: !!user && !!loanId,
  });

  const createPayment = useMutation({
    mutationFn: (data: CreateLoanPaymentInput) => svcCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-payments'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({ title: 'Success', description: 'Payment recorded successfully' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: `Failed to record payment: ${e.message}`, variant: 'destructive' }),
  });

  const updatePayment = useMutation({
    mutationFn: ({ id, ...updates }: Partial<LoanPayment> & { id: string }) => svcUpdate(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-payments'] });
      toast({ title: 'Success', description: 'Payment updated successfully' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: `Failed to update payment: ${e.message}`, variant: 'destructive' }),
  });

  const deletePayment = useMutation({
    mutationFn: (id: string) => svcDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-payments'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({ title: 'Success', description: 'Payment deleted successfully' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: `Failed to delete payment: ${e.message}`, variant: 'destructive' }),
  });

  const loanStats = {
    totalPaid: payments.reduce((sum, p) => sum + p.amount_paid, 0),
    paymentCount: payments.length,
    lastPaymentDate: payments.length > 0 ? payments[0].payment_date : null,
  };

  return { payments, isLoading, error, createPayment, updatePayment, deletePayment, loanStats };
};
