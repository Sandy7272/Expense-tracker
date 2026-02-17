import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBudgetData {
  category: string;
  monthly_limit: number;
}

export function useBudgets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["budgets", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id)
        .order("category");
      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!user,
  });

  const createBudget = useMutation({
    mutationFn: async (data: CreateBudgetData) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("budgets")
        .insert([{ ...data, user_id: user.id }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({ title: "Budget set successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateBudget = useMutation({
    mutationFn: async ({ id, monthly_limit }: { id: string; monthly_limit: number }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("budgets")
        .update({ monthly_limit })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({ title: "Budget updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("budgets")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      toast({ title: "Budget removed" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return { budgets, isLoading, createBudget, updateBudget, deleteBudget };
}
