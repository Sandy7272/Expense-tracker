import { Card } from "@/components/ui/card";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight {
  type: "positive" | "negative" | "neutral";
  message: string;
}

interface SpendingInsightsProps {
  insights: Insight[];
}

export function SpendingInsights({ insights }: SpendingInsightsProps) {
  if (insights.length === 0) {
    return (
      <Card className="kpi-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">Spending Insights</h3>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="p-3 rounded-full bg-primary/10 mb-3">
            <Lightbulb className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">Add more transactions to see insights</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="kpi-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Spending Insights</h3>
      </div>
      <div className="space-y-3">
        {insights.map((insight, i) => {
          const Icon = insight.type === "positive" ? TrendingUp :
                       insight.type === "negative" ? TrendingDown : AlertCircle;
          const iconColor = insight.type === "positive" ? "text-success" :
                           insight.type === "negative" ? "text-expense" : "text-warning";
          
          return (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 border border-border/30"
            >
              <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", iconColor)} />
              <p className="text-sm text-foreground/80">{insight.message}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
