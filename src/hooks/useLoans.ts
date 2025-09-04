import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface Loan {
  id: string;
  user_id: string;
  loan_name: string;
  principal_amount: number;
  interest_rate: number;
  tenure_months: number;
  monthly_emi: number;
  start_date: string;
  status: string;
  lender_name?: string;
  loan_type: string;
  created_at: string;
  updated_at: string;
}

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

  // Calculate EMI using standard formula
  const calculateEMI = (principal: number, rate: number, tenure: number) => {
    const monthlyRate = rate / (12 * 100);
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1);
    return Math.round(emi * 100) / 100;
  };

  // Fetch loans
  const { data: loans = [], isLoading, error } = useQuery({
    queryKey: ['loans', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Loan[];
    },
    enabled: !!user,
  });

  // Create loan mutation
  const createLoan = useMutation({
    mutationFn: async (loanData: CreateLoanData) => {
      if (!user) throw new Error('User not authenticated');

      const monthly_emi = calculateEMI(
        loanData.principal_amount,
        loanData.interest_rate,
        loanData.tenure_months
      );

      const { data, error } = await supabase
        .from('loans')
        .insert({
          ...loanData,
          monthly_emi,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({
        title: "Success",
        description: "Loan added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add loan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update loan mutation
  const updateLoan = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Loan> & { id: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Recalculate EMI if relevant fields changed
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

      const { data, error } = await supabase
        .from('loans')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({
        title: "Success",
        description: "Loan updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update loan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete loan mutation
  const deleteLoan = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({
        title: "Success",
        description: "Loan deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete loan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    loans,
    isLoading,
    error,
    createLoan,
    updateLoan,
    deleteLoan,
    calculateEMI,
  };
};