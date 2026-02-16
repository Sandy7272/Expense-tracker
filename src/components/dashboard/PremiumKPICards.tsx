import { Card } from "@/components/ui/card";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  PiggyBank,
  AlertTriangle,
  CalendarClock,
  BarChart3,
} from "lucide-react";

interface PremiumKPICardsProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netProfit: number;
  savingsRate: number;
  outstandingPayments: number;
  upcomingBills: number;
  cashFlowTrend: number;
}

export function PremiumKPICards({
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  netProfit,
  savingsRate,
  outstandingPayments,
  upcomingBills,
  cashFlowTrend,
}: PremiumKPICardsProps) {
  const { formatAmount } = useCurrency();

  const cards = [
    {
      title: "Total Balance",
      value: formatAmount(totalBalance),
      icon: Wallet,
      accent: "bg-primary/10 text-primary border-primary/20",
      iconBg: "bg-primary/15",
    },
    {
      title: "Monthly Income",
      value: formatAmount(monthlyIncome),
      icon: TrendingUp,
      accent: "bg-income/10 text-income border-income/20",
      iconBg: "bg-income/15",
    },
    {
      title: "Monthly Expenses",
      value: formatAmount(monthlyExpenses),
      icon: TrendingDown,
      accent: "bg-expense/10 text-expense border-expense/20",
      iconBg: "bg-expense/15",
    },
    {
      title: "Net Profit",
      value: formatAmount(netProfit),
      icon: Target,
      accent: netProfit >= 0
        ? "bg-success/10 text-success border-success/20"
        : "bg-expense/10 text-expense border-expense/20",
      iconBg: netProfit >= 0 ? "bg-success/15" : "bg-expense/15",
    },
    {
      title: "Savings Rate",
      value: `${savingsRate.toFixed(1)}%`,
      icon: PiggyBank,
      accent: savingsRate >= 20
        ? "bg-success/10 text-success border-success/20"
        : "bg-warning/10 text-warning border-warning/20",
      iconBg: savingsRate >= 20 ? "bg-success/15" : "bg-warning/15",
    },
    {
      title: "Outstanding",
      value: formatAmount(outstandingPayments),
      icon: AlertTriangle,
      accent: outstandingPayments > 0
        ? "bg-warning/10 text-warning border-warning/20"
        : "bg-success/10 text-success border-success/20",
      iconBg: outstandingPayments > 0 ? "bg-warning/15" : "bg-success/15",
    },
    {
      title: "Upcoming Bills",
      value: upcomingBills.toString(),
      icon: CalendarClock,
      accent: "bg-investment/10 text-investment border-investment/20",
      iconBg: "bg-investment/15",
    },
    {
      title: "Cash Flow",
      value: `${cashFlowTrend >= 0 ? "+" : ""}${cashFlowTrend.toFixed(1)}%`,
      icon: BarChart3,
      accent: cashFlowTrend >= 0
        ? "bg-success/10 text-success border-success/20"
        : "bg-expense/10 text-expense border-expense/20",
      iconBg: cashFlowTrend >= 0 ? "bg-success/15" : "bg-expense/15",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.title}
            className={cn(
              "kpi-card group cursor-default",
              "animate-fade-in"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn("p-2 rounded-xl", card.iconBg)}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {card.title}
            </p>
            <p className="text-xl font-bold text-foreground tracking-tight">
              {card.value}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
