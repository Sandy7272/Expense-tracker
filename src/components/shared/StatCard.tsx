import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type StatColor = "income" | "expense" | "primary" | "warning";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: StatColor;
  sub?: string;
  trend?: number;
}

const colorMap: Record<StatColor, string> = {
  income: "text-income bg-income/10 border-income/20",
  expense: "text-expense bg-expense/10 border-expense/20",
  primary: "text-primary bg-primary/10 border-primary/20",
  warning: "text-warning bg-warning/10 border-warning/20",
};

const textMap: Record<StatColor, string> = {
  income: "text-income",
  expense: "text-expense",
  primary: "text-primary",
  warning: "text-warning",
};

export function StatCard({ label, value, icon: Icon, color, sub, trend }: StatCardProps) {
  return (
    <Card className="kpi-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className={cn("p-2 rounded-xl border", colorMap[color])} aria-hidden="true">
          <Icon className="h-4 w-4" />
        </div>
        {trend !== undefined && (
          <span
            className={cn(
              "text-xs font-medium flex items-center gap-0.5",
              trend >= 0 ? "text-income" : "text-expense"
            )}
            aria-label={`${trend >= 0 ? "Up" : "Down"} ${Math.abs(trend).toFixed(1)} percent`}
          >
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className={cn("text-xl sm:text-2xl font-bold tabular-nums", textMap[color])}>
          {value}
        </p>
        {sub && (
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        )}
      </div>
    </Card>
  );
}
