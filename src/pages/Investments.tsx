import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { InvestmentBreakdown } from "@/components/dashboard/InvestmentBreakdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/currency";
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Target } from "lucide-react";

export default function Investments() {
  const investments = [
    {
      id: 1,
      name: "HDFC Top 100 Fund",
      type: "Mutual Fund",
      amount: 125000,
      currentValue: 142000,
      returns: 13.6,
      risk: "Moderate"
    },
    {
      id: 2,
      name: "Reliance Industries",
      type: "Stock",
      amount: 85000,
      currentValue: 78000,
      returns: -8.2,
      risk: "High"
    },
    {
      id: 3,
      name: "LIC New Jeevan Anand",
      type: "Insurance",
      amount: 200000,
      currentValue: 210000,
      returns: 5.0,
      risk: "Low"
    },
    {
      id: 4,
      name: "Fixed Deposit - SBI",
      type: "Bhishi",
      amount: 300000,
      currentValue: 315000,
      returns: 5.0,
      risk: "Very Low"
    }
  ];

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalReturns = totalCurrentValue - totalInvested;
  const returnsPercentage = (totalReturns / totalInvested) * 100;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Very Low': return 'bg-success text-success-foreground';
      case 'Low': return 'bg-success/70 text-success-foreground';
      case 'Moderate': return 'bg-warning text-warning-foreground';
      case 'High': return 'bg-expense text-expense-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getReturnColor = (returns: number) => {
    return returns >= 0 ? 'text-success' : 'text-expense';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Investments</h1>
            <p className="text-muted-foreground">Track and manage your investment portfolio</p>
          </div>
          <Button className="cyber-button">
            <Plus className="w-4 h-4 mr-2" />
            Add Investment
          </Button>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Invested</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(totalInvested)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Value</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(totalCurrentValue)}</p>
                </div>
                <PieChart className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Returns</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-2xl font-bold ${getReturnColor(totalReturns)}`}>
                      {totalReturns >= 0 ? '+' : ''}{formatCurrency(totalReturns)}
                    </p>
                    {totalReturns >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-success" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-expense" />
                    )}
                  </div>
                  <p className={`text-sm ${getReturnColor(totalReturns)}`}>
                    {returnsPercentage >= 0 ? '+' : ''}{returnsPercentage.toFixed(2)}%
                  </p>
                </div>
                {totalReturns >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-success" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-expense" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Investment Breakdown Chart */}
        <InvestmentBreakdown data={{
          mutualFunds: 125000,
          stocks: 85000,
          insurancePolicy: 200000,
          bhishi: 300000,
          totalInvestment: 710000
        }} />

        {/* Investment Holdings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Investment Holdings</CardTitle>
            <CardDescription>Detailed view of your investment portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {investments.map((investment) => (
                <div
                  key={investment.id}
                  className="p-4 rounded-lg border glass-card hover:glow-primary transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-16 rounded-full bg-gradient-to-b from-investment to-primary"></div>
                      <div>
                        <h3 className="font-semibold text-foreground">{investment.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {investment.type}
                          </Badge>
                          <Badge className={getRiskColor(investment.risk)}>
                            {investment.risk} Risk
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <div className="text-sm text-muted-foreground">
                            Invested: {formatCurrency(investment.amount)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Current: {formatCurrency(investment.currentValue)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getReturnColor(investment.returns)}`}>
                        {investment.returns >= 0 ? '+' : ''}{investment.returns.toFixed(2)}%
                      </div>
                      <div className={`text-sm ${getReturnColor(investment.returns)}`}>
                        {investment.returns >= 0 ? '+' : ''}
                        {formatCurrency(investment.currentValue - investment.amount)}
                      </div>
                      <div className="mt-2">
                        <Progress 
                          value={Math.abs(investment.returns) * 2} 
                          className="w-20 h-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Investment Goals */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Investment Goals
            </CardTitle>
            <CardDescription>Track progress towards your investment targets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Retirement Fund Target</span>
                <span className="text-sm font-medium">₹7,45,000 / ₹50,00,000</span>
              </div>
              <Progress value={14.9} className="h-3" />
              <div className="text-xs text-muted-foreground">Target by 2045</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">House Down Payment</span>
                <span className="text-sm font-medium">₹5,00,000 / ₹20,00,000</span>
              </div>
              <Progress value={25} className="h-3" />
              <div className="text-xs text-muted-foreground">Target by 2028</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Child Education Fund</span>
                <span className="text-sm font-medium">₹1,50,000 / ₹15,00,000</span>
              </div>
              <Progress value={10} className="h-3" />
              <div className="text-xs text-muted-foreground">Target by 2035</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}