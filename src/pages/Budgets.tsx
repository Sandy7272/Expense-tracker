import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PremiumGate } from "@/components/PremiumGate";
import { AiBudgetSuggestions } from "@/components/ai/AiBudgetSuggestions";
import { useBudgets } from "@/hooks/useBudgets";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Plus, Trash2, Target, AlertTriangle } from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Budgets() {
  const { budgets, isLoading, createBudget, updateBudget, deleteBudget } = useBudgets();
  const { transactions } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { formatAmount } = useCurrency();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [newLimit, setNewLimit] = useState("");

  // Calculate spending per category for current month
  const categorySpending = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === "expense" && d >= monthStart && d <= monthEnd;
      })
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);
  }, [transactions]);

  const budgetData = budgets.map(b => ({
    ...b,
    spent: categorySpending[b.category] || 0,
    percent: b.monthly_limit > 0 ? ((categorySpending[b.category] || 0) / Number(b.monthly_limit)) * 100 : 0,
  }));

  const totalBudget = budgets.reduce((s, b) => s + Number(b.monthly_limit), 0);
  const totalSpent = budgetData.reduce((s, b) => s + b.spent, 0);
  const overBudgetCount = budgetData.filter(b => b.percent > 100).length;

  const usedCategories = new Set(budgets.map(b => b.category));
  const availableCategories = categories
    .filter(c => (c.type === "expense" || c.type === "both") && !usedCategories.has(c.name));

  const handleAdd = () => {
    if (!newCategory || !newLimit) return;
    createBudget.mutate({ category: newCategory, monthly_limit: parseFloat(newLimit) });
    setAddOpen(false);
    setNewCategory("");
    setNewLimit("");
  };

  const handleAcceptSuggestion = (category: string, limit: number) => {
    createBudget.mutate({ category, monthly_limit: limit });
  };

  return (
    <DashboardLayout>
      <PremiumGate feature="Budget Management">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Budgets</h1>
              <p className="text-muted-foreground text-sm">Set and track spending limits by category</p>
            </div>
            <Button onClick={() => setAddOpen(true)} className="bg-primary text-primary-foreground" disabled={availableCategories.length === 0}>
              <Plus className="h-4 w-4 mr-2" /> Set Budget
            </Button>
          </div>

          {/* AI Budget Suggestions */}
          <AiBudgetSuggestions
            transactions={transactions}
            existingBudgetCategories={usedCategories}
            onAccept={handleAcceptSuggestion}
          />

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <Card className="kpi-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Budget</p>
              <p className="text-2xl font-bold text-foreground">{formatAmount(totalBudget)}</p>
            </Card>
            <Card className="kpi-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-expense">{formatAmount(totalSpent)}</p>
            </Card>
            <Card className="kpi-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Over Budget</p>
              <p className={cn("text-2xl font-bold", overBudgetCount > 0 ? "text-expense" : "text-success")}>
                {overBudgetCount} {overBudgetCount === 1 ? "category" : "categories"}
              </p>
            </Card>
          </div>

          {/* Budget Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              [1,2,3,4].map(i => <div key={i} className="h-32 bg-muted/20 rounded-xl animate-pulse" />)
            ) : budgetData.length === 0 ? (
              <Card className="kpi-card col-span-full p-8 text-center">
                <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No budgets set yet</p>
                <Button variant="outline" className="mt-3" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Set your first budget
                </Button>
              </Card>
            ) : (
              budgetData.map(b => (
                <Card key={b.id} className={cn(
                  "kpi-card p-5 group",
                  b.percent > 100 && "border-expense/30"
                )}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{b.category}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatAmount(b.spent)} of {formatAmount(Number(b.monthly_limit))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {b.percent > 90 && (
                        <AlertTriangle className={cn("h-4 w-4", b.percent > 100 ? "text-expense" : "text-warning")} />
                      )}
                      <span className={cn(
                        "text-sm font-semibold px-2 py-0.5 rounded-full",
                        b.percent > 100 ? "bg-expense/15 text-expense" :
                        b.percent > 70 ? "bg-warning/15 text-warning" :
                        "bg-success/15 text-success"
                      )}>
                        {Math.round(b.percent)}%
                      </span>
                      <Button
                        size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                        onClick={() => setDeleteId(b.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Progress
                    value={Math.min(b.percent, 100)}
                    className={cn("h-2.5",
                      "[&>div]:transition-all [&>div]:duration-500",
                      b.percent > 100 ? "[&>div]:bg-expense" :
                      b.percent > 70 ? "[&>div]:bg-warning" :
                      "[&>div]:bg-success"
                    )}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {b.percent > 100
                      ? `Over by ${formatAmount(b.spent - Number(b.monthly_limit))}`
                      : `${formatAmount(Number(b.monthly_limit) - b.spent)} remaining`}
                  </p>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Add Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Set Category Budget</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {availableCategories.map(c => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Limit</Label>
                <Input type="number" placeholder="0.00" value={newLimit} onChange={e => setNewLimit(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={createBudget.isPending} className="bg-primary text-primary-foreground">
                {createBudget.isPending ? "Setting..." : "Set Budget"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this budget?</AlertDialogTitle>
              <AlertDialogDescription>This will remove the spending limit for this category.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (deleteId) { deleteBudget.mutate(deleteId); setDeleteId(null); } }}>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PremiumGate>
    </DashboardLayout>
  );
}
