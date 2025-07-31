import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatINR, formatINRCompact } from "@/lib/currency";
import { TrendingUp, Shield, Building, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvestmentData {
  mutualFunds: number;
  stocks: number;
  insurancePolicy: number;
  bhishi: number;
  totalInvestment: number;
}

interface InvestmentBreakdownProps {
  data: InvestmentData;
}

export function InvestmentBreakdown({ data }: InvestmentBreakdownProps) {
  const investments = [
    {
      name: "Mutual Funds",
      amount: data.mutualFunds,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/20",
      borderColor: "border-primary/30",
      glowClass: "glow-primary"
    },
    {
      name: "Stocks",
      amount: data.stocks,
      icon: Building,
      color: "text-success",
      bgColor: "bg-success/20",
      borderColor: "border-success/30",
      glowClass: "glow-success"
    },
    {
      name: "Insurance Policy",
      amount: data.insurancePolicy,
      icon: Shield,
      color: "text-warning",
      bgColor: "bg-warning/20",
      borderColor: "border-warning/30",
      glowClass: "glow-accent"
    },
    {
      name: "Bhishi",
      amount: data.bhishi,
      icon: Coins,
      color: "text-accent",
      bgColor: "bg-accent/20",
      borderColor: "border-accent/30",
      glowClass: "glow-accent"
    }
  ];

  const getPercentage = (amount: number) => {
    return data.totalInvestment > 0 ? (amount / data.totalInvestment) * 100 : 0;
  };

  return (
    <Card className="glass-card hover:glass-card glow-primary">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-investment/20 to-primary/20 border border-white/20">
            <TrendingUp className="h-5 w-5 text-investment" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground">
              Investment Breakdown
            </h3>
            <p className="text-sm text-muted-foreground">
              Total: {formatINR(data.totalInvestment)}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {investments.map((investment, index) => {
            const Icon = investment.icon;
            const percentage = getPercentage(investment.amount);
            
            return (
              <div 
                key={investment.name}
                className="group relative p-4 rounded-xl glass-card hover:glass-card transition-all duration-300"
              >
                {/* Cyber Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className={cn("w-full h-full rounded-xl", investment.bgColor)} />
                </div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg glass-card",
                        investment.borderColor,
                        investment.bgColor
                      )}>
                        <Icon className={cn("h-4 w-4", investment.color)} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{investment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {percentage.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("font-bold", investment.color)}>
                        {formatINRCompact(investment.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatINR(investment.amount)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Progress 
                      value={percentage} 
                      className="h-2 bg-muted/30"
                    />
                    <div 
                      className={cn(
                        "absolute top-0 left-0 h-2 rounded-full transition-all duration-1000 ease-out",
                        investment.bgColor,
                        "animate-pulse"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <div className={cn(
                  "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                  investment.glowClass
                )} />
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}