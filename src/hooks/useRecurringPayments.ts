import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface RecurringPayment {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  frequency: string;
  next_due_date: string;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringPaymentData {
  title: string;
  amount: number;
  category: string;
  frequency: string;
  next_due_date: string;
  description?: string;
  is_active?: boolean;
}

export function useRecurringPayments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["recurring-payments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("recurring_payments")
        .select("*")
        .eq("user_id", user.id)
        .order("next_due_date", { ascending: true });
      if (error) throw error;
      return data as RecurringPayment[];
    },
    enabled: !!user,
  });

  const createPayment = useMutation({
    mutationFn: async (data: CreateRecurringPaymentData) => {
      if (!user) throw new Error("Not authenticated");
      const { data: payment, error } = await supabase
        .from("recurring_payments")
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      return payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-payments"] });
      toast({ title: "Recurring payment created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateRecurringPaymentData> }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("recurring_payments")
        .update(data)
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-payments"] });
      toast({ title: "Payment updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("recurring_payments")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-payments"] });
      toast({ title: "Payment deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return { payments, isLoading, createPayment, updatePayment, deletePayment };
}
