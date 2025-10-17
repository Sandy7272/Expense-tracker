import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCurrency } from "@/contexts/CurrencyContext";
import { TrendingUp, Shield, Coins, Landmark, WalletMinimal } from "lucide-react";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';

interface InvestmentData {
  mutualFunds: number;
  stocks: number;
  insurancePolicy: number;
  chitFunds: number;
  gold: number;
  crypto: number;
  policy: number;
  generalInvestment: number; // Added for the generic 'Investment' category
  totalInvestment: number;
}

interface InvestmentBreakdownProps {
  data: InvestmentData;
}

export function InvestmentBreakdown({ data }: InvestmentBreakdownProps) {
  const { formatAmount, formatAmountCompact } = useCurrency();
  const investments = [
    {
      name: "Mutual Funds",
      amount: data.mutualFunds,
      icon: TrendingUp,
      color: "hsl(var(--primary))",
      bgColor: "bg-primary/20",
      borderColor: "border-primary/30",
      glowClass: "glow-primary"
    },
    {
      name: "Stocks",
      amount: data.stocks,
      icon: TrendingUp,
      color: "hsl(var(--success))",
      bgColor: "bg-success/20",
      borderColor: "border-success/30",
      glowClass: "glow-success"
    },
    {
      name: "Gold",
      amount: data.gold,
      icon: Coins,
      color: "#FFD700", // Gold color
      bgColor: "bg-yellow-500/20",
      borderColor: "border-yellow-500/30",
      glowClass: "glow-yellow-500"
    },
    {
      name: "Crypto",
      amount: data.crypto,
      icon: WalletMinimal,
      color: "#000000", // Crypto color (black)
      bgColor: "bg-gray-800/20",
      borderColor: "border-gray-800/30",
      glowClass: "glow-gray-800"
    },
    {
      name: "Chit Funds",
      amount: data.chitFunds,
      icon: Coins,
      color: "#FF8C00", // Orange color
      bgColor: "bg-orange-500/20",
      borderColor: "border-orange-500/30",
      glowClass: "glow-orange-500"
    },
    {
      name: "Policy",
      amount: data.policy,
      icon: Shield,
      color: "#1E90FF", // Blue color
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/30",
      glowClass: "glow-blue-500"
    },
    {
      name: "Insurance Policy",
      amount: data.insurancePolicy,
      icon: Shield,
      color: "hsl(var(--warning))",
      bgColor: "bg-warning/20",
      borderColor: "border-warning/30",
      glowClass: "glow-accent"
    },
    {
      name: "Investment",
      amount: data.generalInvestment,
      icon: Landmark,
      color: "#6200EA", // A distinct color for general investment
      bgColor: "bg-purple-500/20",
      borderColor: "border-purple-500/30",
      glowClass: "glow-purple-500"
    }
  ].filter(inv => inv.amount > 0); // Only show investments with amount > 0

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
              Total: {formatAmount(data.totalInvestment)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="w-full h-48 md:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={investments}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="amount"
                  nameKey="name"
                  labelLine={false}
                >
                  {investments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {investments.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {item.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatAmount(item.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}