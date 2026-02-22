import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import {
  fetchLoans,
  createLoan as svcCreate,
  updateLoan as svcUpdate,
  deleteLoan as svcDelete,
} from '@/services/supabaseService';
import type { Loan } from '@/services/supabaseService';

export type { Loan };

export interface CreateLoanData {
  loan_name: string;
  principal_amount: number;
  interest_rate: number;
  tenure_months: number;
  start_date: string;
  lender_name?: string;
  loan_type?: string;
}

export const useLoans = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const calculateEMI = (principal: number, rate: number, tenure: number) => {
    const monthlyRate = rate / (12 * 100);
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
                (Math.pow(1 + monthlyRate, tenure) - 1);
    return Math.round(emi * 100) / 100;
  };

  const { data: loans = [], isLoading, error } = useQuery({
    queryKey: ['loans', user?.id],
    queryFn: () => fetchLoans(user!.id),
    enabled: !!user,
  });

  const createLoan = useMutation({
    mutationFn: (data: CreateLoanData) => {
      const monthly_emi = calculateEMI(data.principal_amount, data.interest_rate, data.tenure_months);
      return svcCreate(user!.id, { ...data, monthly_emi });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({ title: 'Success', description: 'Loan added successfully' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: `Failed to add loan: ${e.message}`, variant: 'destructive' }),
  });

  const updateLoan = useMutation({
    mutationFn: ({ id, ...updates }: Partial<Loan> & { id: string }) => {
      if (updates.principal_amount || updates.interest_rate || updates.tenure_months) {
        const loan = loans.find(l => l.id === id);
        if (loan) {
          updates.monthly_emi = calculateEMI(
            updates.principal_amount || loan.principal_amount,
            updates.interest_rate || loan.interest_rate,
            updates.tenure_months || loan.tenure_months
          );
        }
      }
      return svcUpdate(user!.id, id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({ title: 'Success', description: 'Loan updated successfully' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: `Failed to update loan: ${e.message}`, variant: 'destructive' }),
  });

  const deleteLoan = useMutation({
    mutationFn: (id: string) => svcDelete(user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({ title: 'Success', description: 'Loan deleted successfully' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: `Failed to delete loan: ${e.message}`, variant: 'destructive' }),
  });

  return { loans, isLoading, error, createLoan, updateLoan, deleteLoan, calculateEMI };
};
