import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { formatINR } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface LendBorrowData {
  usneDile: number;      // Lent out
  usnePrtAle: number;    // Borrowed
  usneGhetle: number;    // Received back
  usnePrtDile: number;   // Paid back
}

interface LendBorrowOverviewProps {
  data: LendBorrowData;
}

export function LendBorrowOverview({ data }: LendBorrowOverviewProps) {
  const cards = [
    {
      title: "Usne Dile",
      subtitle: "Lent Out",
      amount: data.usneDile,
      icon: ArrowUp,
      direction: "up",
      color: "text-lending",
      bgGradient: "from-lending/20 to-primary/20",
      glowClass: "glow-primary",
      emoji: "💸"
    },
    {
      title: "Usne Prt Ale",
      subtitle: "Borrowed",
      amount: data.usnePrtAle,
      icon: ArrowDown,
      direction: "down",
      color: "text-warning",
      bgGradient: "from-warning/20 to-accent/20",
      glowClass: "glow-accent",
      emoji: "💰"
    },
    {
      title: "Usne Ghetle",
      subtitle: "Received Back",
      amount: data.usneGhetle,
      icon: ArrowDown,
      direction: "down",
      color: "text-success",
      bgGradient: "from-success/20 to-income/20",
      glowClass: "glow-success",
      emoji: "✅"
    },
    {
      title: "Usne Prt Dile",
      subtitle: "Paid Back",
      amount: data.usnePrtDile,
      icon: ArrowUp,
      direction: "up",
      color: "text-expense",
      bgGradient: "from-expense/20 to-destructive/20",
      glowClass: "glow-expense",
      emoji: "💳"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className={cn("absolute inset-0 bg-gradient-to-br", card.bgGradient)} />
              <div className="absolute inset-0" style={{
                backgroundImage: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)',
                backgroundSize: '20px 20px',
                animation: 'shimmer 3s ease-in-out infinite'
              }} />
            </div>
            
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-3 rounded-xl glass-card border border-white/20",
                    `bg-gradient-to-br ${card.bgGradient}`
                  )}>
                    <Icon className={cn(
                      "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                      card.color,
                      card.direction === 'up' ? 'group-hover:-translate-y-0.5' : 'group-hover:translate-y-0.5'
                    )} />
                  </div>
                  <span className="text-2xl">{card.emoji}</span>
                </div>
                
                <div className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium glass-card",
                  card.color
                )}>
                  {card.direction === 'up' ? '↗' : '↙'}
                  {card.direction === 'up' ? 'OUT' : 'IN'}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {card.title}
                </p>
                <p className="text-xs text-muted-foreground/80 mb-2">
                  {card.subtitle}
                </p>
                <p className={cn(
                  "text-xl lg:text-2xl font-bold font-heading counter-animate transition-all duration-300 group-hover:scale-105",
                  card.color
                )}>
                  {formatINR(card.amount)}
                </p>
              </div>
            </div>

            {/* Neon Border Animation */}
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className={cn(
                "absolute inset-0 rounded-lg border-2 border-transparent",
                `bg-gradient-to-r ${card.bgGradient} bg-clip-border`,
                "animate-pulse"
              )} style={{
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'xor'
              }} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}