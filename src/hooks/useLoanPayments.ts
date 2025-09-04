import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface LoanPayment {
  id: string;
  loan_id: string;
  payment_date: string;
  amount_paid: number;
  principal_component?: number;
  interest_component?: number;
  outstanding_balance?: number;
  status: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
}

export interface CreateLoanPaymentData {
  loan_id: string;
  payment_date: string;
  amount_paid: number;
  payment_method?: string;
  notes?: string;
}

export const useLoanPayments = (loanId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch loan payments for a specific loan
  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ['loan-payments', loanId],
    queryFn: async () => {
      if (!user || !loanId) return [];
      
      const { data, error } = await supabase
        .from('loan_payments')
        .select('*')
        .eq('loan_id', loanId)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data as LoanPayment[];
    },
    enabled: !!user && !!loanId,
  });

  // Create payment mutation
  const createPayment = useMutation({
    mutationFn: async (paymentData: CreateLoanPaymentData) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('loan_payments')
        .insert({
          ...paymentData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-payments'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to record payment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update payment mutation
  const updatePayment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LoanPayment> & { id: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('loan_payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-payments'] });
      toast({
        title: "Success",
        description: "Payment updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update payment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete payment mutation
  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('loan_payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-payments'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({
        title: "Success",
        description: "Payment deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete payment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Calculate loan statistics
  const loanStats = {
    totalPaid: payments.reduce((sum, payment) => sum + payment.amount_paid, 0),
    paymentCount: payments.length,
    lastPaymentDate: payments.length > 0 ? payments[0].payment_date : null,
  };

  return {
    payments,
    isLoading,
    error,
    createPayment,
    updatePayment,
    deletePayment,
    loanStats,
  };
};