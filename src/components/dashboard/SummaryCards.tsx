import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, PieChart, CreditCard } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface SummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
  transactionCount: number;
  topCategory?: string;
}

export function SummaryCards({ 
  totalIncome, 
  totalExpenses, 
  transactionCount, 
  topCategory = "Food" 
}: SummaryCardsProps) {
  const { formatAmount } = useCurrency();

  const cards = [
    {
      title: "Total Income",
      value: formatAmount(totalIncome),
      icon: TrendingUp,
      change: "+12.5%",
      changeType: "positive" as const,
      gradient: "from-income/10 to-success/10",
      iconColor: "text-income",
      emoji: "💰"
    },
    {
      title: "Total Expenses",
      value: formatAmount(totalExpenses),
      icon: TrendingDown,
      change: "+8.2%",
      changeType: "negative" as const,
      gradient: "from-expense/10 to-destructive/10",
      iconColor: "text-expense",
      emoji: "💸"
    },
    {
      title: "Transactions",
      value: transactionCount.toString(),
      icon: CreditCard,
      change: "+5 this week",
      changeType: "neutral" as const,
      gradient: "from-secondary/10 to-primary/10",
      iconColor: "text-primary",
      emoji: "📊"
    },
    {
      title: "Top Category",
      value: topCategory,
      icon: PieChart,
      change: "Most spent",
      changeType: "neutral" as const,
      gradient: "from-accent/10 to-secondary/10",
      iconColor: "text-accent",
      emoji: "🍕"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={card.title}
            className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} border-border/50 shadow-card hover:shadow-hover transition-all duration-300 hover:scale-[1.02] group cursor-pointer`}
          >
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-20 h-20 opacity-5">
              <div className="w-full h-full bg-gradient-to-br from-foreground to-transparent rounded-full blur-2xl" />
            </div>
            
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${card.gradient} border border-border/30`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <span className="text-2xl">{card.emoji}</span>
                </div>
                
                <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  card.changeType === 'positive' ? 'bg-success/10 text-success' :
                  card.changeType === 'negative' ? 'bg-expense/10 text-expense' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {card.change}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  {card.title}
                </p>
                <p className="text-2xl lg:text-3xl font-bold font-heading text-foreground group-hover:scale-105 transition-transform duration-200">
                  {card.value}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}