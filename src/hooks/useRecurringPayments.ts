import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  fetchRecurringPayments,
  createRecurringPayment as svcCreate,
  updateRecurringPayment as svcUpdate,
  deleteRecurringPayment as svcDelete,
} from '@/services/supabaseService';
import type { RecurringPayment, CreateRecurringPaymentInput } from '@/services/supabaseService';

export type { RecurringPayment };
export type CreateRecurringPaymentData = CreateRecurringPaymentInput;

export function useRecurringPayments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['recurring-payments', user?.id],
    queryFn: () => fetchRecurringPayments(user!.id),
    enabled: !!user,
  });

  const createPayment = useMutation({
    mutationFn: (data: CreateRecurringPaymentInput) => svcCreate(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-payments'] });
      toast({ title: 'Recurring payment created' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updatePayment = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateRecurringPaymentInput> }) =>
      svcUpdate(user!.id, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-payments'] });
      toast({ title: 'Payment updated' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deletePayment = useMutation({
    mutationFn: (id: string) => svcDelete(user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-payments'] });
      toast({ title: 'Payment deleted' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return { payments, isLoading, createPayment, updatePayment, deletePayment };
}
