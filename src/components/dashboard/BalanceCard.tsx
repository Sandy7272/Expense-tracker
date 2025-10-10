import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";

interface BalanceCardProps {
  totalIncome: number;
  totalExpenses: number;
  currency?: string;
}

export function BalanceCard({ totalIncome, totalExpenses }: Omit<BalanceCardProps, 'currency'>) {
  const { formatAmount } = useCurrency();
  const balance = totalIncome - totalExpenses;
  const isPositive = balance >= 0;
  const percentageChange = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-background border-border/50 shadow-card hover:shadow-hover transition-all duration-300">
      {/* Animated background gradient */}
      <div className={cn(
        "absolute inset-0 opacity-10 transition-opacity duration-500",
        isPositive ? "bg-gradient-to-br from-success to-income" : "bg-gradient-to-br from-expense to-destructive"
      )} />
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 opacity-20">
        <DollarSign className={cn(
          "h-16 w-16",
          isPositive ? "text-success" : "text-expense"
        )} />
      </div>
      
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Current Balance
            </p>
            <div className="flex items-center gap-2 mt-1">
              {isPositive ? (
                <TrendingUp className="h-5 w-5 text-success" />
              ) : (
                <TrendingDown className="h-5 w-5 text-expense" />
              )}
              <span className={cn(
                "text-xs font-medium",
                isPositive ? "text-success" : "text-expense"
              )}>
                {isPositive ? "Positive" : "Negative"} Balance
              </span>
            </div>
          </div>
        </div>

        {/* Main balance display */}
        <div className="mb-6">
          <div className={cn(
            "text-4xl lg:text-5xl font-bold font-heading transition-colors duration-300",
            isPositive ? "text-success" : "text-expense"
          )}>
            {formatAmount(balance)}
          </div>
          
          {percentageChange !== 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                "text-sm font-medium",
                isPositive ? "text-success" : "text-expense"
              )}>
                {isPositive ? "+" : ""}{percentageChange.toFixed(1)}% of income
              </span>
            </div>
          )}
        </div>

        {/* Income vs Expenses breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Income
            </p>
            <p className="text-lg font-semibold text-income">
              {formatAmount(totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Expenses
            </p>
            <p className="text-lg font-semibold text-expense">
              {formatAmount(totalExpenses)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}