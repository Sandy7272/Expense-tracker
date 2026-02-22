import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  fetchBudgets,
  createBudget as svcCreate,
  updateBudget as svcUpdate,
  deleteBudget as svcDelete,
} from '@/services/supabaseService';
import type { Budget, CreateBudgetInput } from '@/services/supabaseService';

export type { Budget };
export type CreateBudgetData = CreateBudgetInput;

export function useBudgets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: () => fetchBudgets(user!.id),
    enabled: !!user,
  });

  const createBudget = useMutation({
    mutationFn: (data: CreateBudgetInput) => svcCreate(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget set successfully' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateBudget = useMutation({
    mutationFn: ({ id, monthly_limit }: { id: string; monthly_limit: number }) =>
      svcUpdate(user!.id, id, monthly_limit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget updated' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteBudget = useMutation({
    mutationFn: (id: string) => svcDelete(user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Budget removed' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { budgets, isLoading, createBudget, updateBudget, deleteBudget };
}
