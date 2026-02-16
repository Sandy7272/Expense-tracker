import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface BudgetItem {
  category: string;
  budget: number;
  spent: number;
}

interface BudgetProgressSectionProps {
  budgets: BudgetItem[];
}

function getBudgetStatus(percent: number) {
  if (percent > 90) return { color: "bg-expense", text: "text-expense", label: "Over budget" };
  if (percent > 70) return { color: "bg-warning", text: "text-warning", label: "Caution" };
  return { color: "bg-success", text: "text-success", label: "On track" };
}

export function BudgetProgressSection({ budgets }: BudgetProgressSectionProps) {
  const { formatAmount } = useCurrency();

  if (budgets.length === 0) {
    return (
      <Card className="kpi-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Budget Progress</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="p-3 rounded-full bg-primary/10 mb-3">
            <AlertTriangle className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">No budgets set yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Set category budgets to track your spending limits
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="kpi-card p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Budget Progress</h3>
      <div className="space-y-4">
        {budgets.map((item) => {
          const percent = item.budget > 0 ? (item.spent / item.budget) * 100 : 0;
          const remaining = item.budget - item.spent;
          const status = getBudgetStatus(percent);

          return (
            <div key={item.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{item.category}</span>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", 
                    percent > 90 ? "bg-expense/15 text-expense" :
                    percent > 70 ? "bg-warning/15 text-warning" :
                    "bg-success/15 text-success"
                  )}>
                    {Math.round(percent)}%
                  </span>
                </div>
              </div>
              <Progress
                value={Math.min(percent, 100)}
                className={cn("h-2 bg-muted/50", 
                  "[&>div]:transition-all [&>div]:duration-500",
                  percent > 90 ? "[&>div]:bg-expense" :
                  percent > 70 ? "[&>div]:bg-warning" :
                  "[&>div]:bg-success"
                )}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatAmount(item.spent)} spent</span>
                <span>{remaining >= 0 ? `${formatAmount(remaining)} left` : `${formatAmount(Math.abs(remaining))} over`}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
