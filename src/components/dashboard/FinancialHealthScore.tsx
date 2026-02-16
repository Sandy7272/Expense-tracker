import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FinancialHealthScoreProps {
  totalIncome: number;
  totalExpenses: number;
  totalInvestment: number;
  emi: number;
  moneyLent: number;
  moneyBorrowed: number;
}

function calculateHealthScore({
  totalIncome,
  totalExpenses,
  totalInvestment,
  emi,
  moneyBorrowed,
}: FinancialHealthScoreProps): number {
  if (totalIncome === 0) return 0;

  const savingsRate = (totalIncome - totalExpenses) / totalIncome;
  const debtRatio = (emi + moneyBorrowed) / totalIncome;
  const investmentRatio = totalInvestment / totalIncome;
  const budgetDiscipline = totalExpenses <= totalIncome ? 1 : totalIncome / totalExpenses;

  const score =
    Math.min(savingsRate, 0.5) * 80 +      // max 40
    (1 - Math.min(debtRatio, 1)) * 25 +      // max 25
    Math.min(investmentRatio, 0.3) * 50 +     // max 15
    budgetDiscipline * 20;                     // max 20

  return Math.round(Math.max(0, Math.min(100, score)));
}

function getScoreLabel(score: number) {
  if (score >= 80) return { label: "Excellent", color: "text-success" };
  if (score >= 60) return { label: "Good", color: "text-income" };
  if (score >= 40) return { label: "Warning", color: "text-warning" };
  return { label: "Critical", color: "text-expense" };
}

function getStrokeColor(score: number) {
  if (score >= 80) return "stroke-success";
  if (score >= 60) return "stroke-income";
  if (score >= 40) return "stroke-warning";
  return "stroke-expense";
}

export function FinancialHealthScore(props: FinancialHealthScoreProps) {
  const score = useMemo(() => calculateHealthScore(props), [props]);
  const { label, color } = getScoreLabel(score);
  const strokeColor = getStrokeColor(score);

  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="kpi-card flex flex-col items-center justify-center p-6">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
        Financial Health
      </h3>

      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            className={cn(strokeColor, "transition-all duration-1000 ease-out")}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-bold", color)}>{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      <span className={cn("text-sm font-semibold mt-3", color)}>{label}</span>
      <p className="text-xs text-muted-foreground mt-1 text-center max-w-[180px]">
        Based on savings, debt, and budget discipline
      </p>
    </Card>
  );
}
