import { Card } from "@/components/ui/card";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, PiggyBank, CreditCard, ArrowUpRight, ArrowDownLeft, Wallet
} from "lucide-react";

interface FinancialSummaryCardsProps {
  totalIncome: number;
  totalSpend: number;
  totalInvestment: number;
  emi: number;
  moneyLent: number;
  moneyBorrowed: number;
  savingInBank: number;
}

export function FinancialSummaryCards({ 
  totalIncome, totalSpend, totalInvestment, emi, moneyLent, moneyBorrowed, savingInBank
}: FinancialSummaryCardsProps) {
  const { formatAmount } = useCurrency();
  
  const cards = [
    { title: "Total Income", value: formatAmount(totalIncome), icon: TrendingUp, iconBg: "bg-income/15", iconColor: "text-income" },
    { title: "Total Spend", value: formatAmount(totalSpend), icon: TrendingDown, iconBg: "bg-expense/15", iconColor: "text-expense" },
    { title: "Investment", value: formatAmount(totalInvestment), icon: PiggyBank, iconBg: "bg-investment/15", iconColor: "text-investment" },
    { title: "EMI", value: formatAmount(emi), icon: CreditCard, iconBg: "bg-warning/15", iconColor: "text-warning" },
    { title: "Money Lent", value: formatAmount(moneyLent), icon: ArrowUpRight, iconBg: "bg-lending/15", iconColor: "text-lending" },
    { title: "Money Borrowed", value: formatAmount(moneyBorrowed), icon: ArrowDownLeft, iconBg: "bg-success/15", iconColor: "text-success" },
    { title: "Savings", value: formatAmount(savingInBank), icon: Wallet,
      iconBg: savingInBank >= 0 ? "bg-success/15" : "bg-expense/15",
      iconColor: savingInBank >= 0 ? "text-success" : "text-expense",
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="kpi-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("p-1.5 rounded-lg", card.iconBg)}>
                <Icon className={cn("h-3.5 w-3.5", card.iconColor)} />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {card.title}
            </p>
            <p className="text-lg font-bold text-foreground">{card.value}</p>
          </Card>
        );
      })}
    </div>
  );
}
