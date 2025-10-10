import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, PiggyBank, CreditCard, ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

interface FinancialSummaryCardsProps {
  totalIncome: number;
  totalSpend: number;
  totalInvestment: number;
  emi: number;
  usneDile: number;
  usneGhetle: number;
  savingInBank: number;
}

export function FinancialSummaryCards({ 
  totalIncome, 
  totalSpend, 
  totalInvestment, 
  emi, 
  usneDile, 
  usneGhetle, 
  savingInBank 
}: FinancialSummaryCardsProps) {
  const { formatAmount } = useCurrency();
  
  const cards = [
    {
      title: "Total Income",
      value: formatAmount(totalIncome),
      icon: TrendingUp,
      gradient: "from-income/20 to-success/20",
      iconColor: "text-income",
      glowClass: "glow-success",
      emoji: "💰"
    },
    {
      title: "Total Spend",
      value: formatAmount(totalSpend),
      icon: TrendingDown,
      gradient: "from-expense/20 to-destructive/20",
      iconColor: "text-expense",
      glowClass: "glow-expense",
      emoji: "💸"
    },
    {
      title: "Total Investment",
      value: formatAmount(totalInvestment),
      icon: PiggyBank,
      gradient: "from-investment/20 to-primary/20",
      iconColor: "text-investment",
      glowClass: "glow-primary",
      emoji: "📈"
    },
    {
      title: "EMI",
      value: formatAmount(emi),
      icon: CreditCard,
      gradient: "from-warning/20 to-accent/20",
      iconColor: "text-warning",
      glowClass: "glow-accent",
      emoji: "💳"
    },
    {
      title: "Usne Dile",
      value: formatAmount(usneDile),
      icon: ArrowUpRight,
      gradient: "from-lending/20 to-primary/20",
      iconColor: "text-lending",
      glowClass: "glow-primary",
      emoji: "↗️"
    },
    {
      title: "Usne Ghetle",
      value: formatAmount(usneGhetle),
      icon: ArrowDownLeft,
      gradient: "from-success/20 to-income/20",
      iconColor: "text-success",
      glowClass: "glow-success",
      emoji: "↙️"
    },
    {
      title: "Saving in Bank",
      value: formatAmount(savingInBank),
      icon: Wallet,
      gradient: savingInBank >= 0 ? "from-success/20 to-income/20" : "from-expense/20 to-destructive/20",
      iconColor: savingInBank >= 0 ? "text-success" : "text-expense",
      glowClass: savingInBank >= 0 ? "glow-success" : "glow-expense",
      emoji: "🏦",
      isNegative: savingInBank < 0
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={card.title}
            className={cn(
              "relative overflow-hidden glass-card hover:glass-card transition-all duration-300 hover:scale-[1.02] group cursor-pointer",
              card.glowClass
            )}
          >
            {/* Cyber Grid Background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                backgroundSize: '20px 20px'
              }} />
            </div>
            
            <div className="relative p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-2 rounded-xl glass-card border border-white/20",
                    `bg-gradient-to-br ${card.gradient}`
                  )}>
                    <Icon className={cn("h-4 w-4", card.iconColor)} />
                  </div>
                  <span className="text-xl">{card.emoji}</span>
                </div>
                
                <div className={cn(
                  "px-2 py-1 rounded-lg text-xs font-medium glass-card",
                  card.isNegative ? 'text-expense' : 'text-muted-foreground'
                )}>
                  {card.isNegative ? 'Deficit' : 'Active'}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {card.title}
                </p>
                <p className={cn(
                  "text-lg lg:text-xl font-bold font-heading counter-animate transition-transform duration-200 group-hover:scale-105",
                  card.isNegative ? 'text-expense' : 'text-foreground'
                )}>
                  {card.value}
                </p>
              </div>
            </div>

            {/* Neon Border Effect */}
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className={cn(
                "absolute inset-0 rounded-lg",
                "bg-gradient-to-r from-transparent via-white/10 to-transparent",
                "animate-pulse"
              )} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}