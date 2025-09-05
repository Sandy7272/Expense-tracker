import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { InvestmentBreakdown } from "@/components/dashboard/InvestmentBreakdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/currency";
import { useInvestmentData } from "@/hooks/useInvestmentData";
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Target, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Investments() {
  const navigate = useNavigate();
  const { 
    investmentData, 
    investmentHoldings, 
    totalTransactions,
    isLoading, 
    error 
  } = useInvestmentData();
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-muted-foreground">Failed to load investment data</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalInvested = investmentData.totalInvestment;
  const totalCurrentValue = investmentData.totalInvestment; // Since we don't track current values
  const totalReturns = 0; // No return data available from transactions
  const returnsPercentage = 0;

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
          <Button 
            className="cyber-button"
            onClick={() => navigate('/transactions')}
          >
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
        <InvestmentBreakdown data={investmentData} />

        {/* Investment Holdings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Investment Holdings</CardTitle>
            <CardDescription>
              {totalTransactions > 0 
                ? `Based on ${totalTransactions} investment transactions`
                : "No investment transactions found"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {investmentHoldings.length > 0 ? (
              <div className="space-y-4">
                {investmentHoldings.map((investment) => (
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
                              Total Invested: {formatCurrency(investment.amount)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Transactions: {investment.transactionCount}
                            </div>
                            {investment.lastInvestment && (
                              <div className="text-sm text-muted-foreground">
                                Last Investment: {new Date(investment.lastInvestment).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-muted-foreground">
                          No return data
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Based on transactions
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No Investments Found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start adding investment transactions to track your portfolio.
                </p>
                <p className="text-xs text-muted-foreground">
                  Add transactions with categories: Mutual Funds, Investment, Insurance, or Bhishi
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investment Goals */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Investment Goals
            </CardTitle>
            <CardDescription>Track progress towards your investment targets based on your current investments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Retirement Fund Target</span>
                <span className="text-sm font-medium">{formatCurrency(totalInvested)} / ₹50,00,000</span>
              </div>
              <Progress value={(totalInvested / 5000000) * 100} className="h-3" />
              <div className="text-xs text-muted-foreground">
                {totalInvested > 0 
                  ? `${((totalInvested / 5000000) * 100).toFixed(1)}% complete - Keep investing!`
                  : "Start investing to reach your retirement goal"
                }
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">House Down Payment</span>
                <span className="text-sm font-medium">{formatCurrency(Math.min(totalInvested, 2000000))} / ₹20,00,000</span>
              </div>
              <Progress value={(Math.min(totalInvested, 2000000) / 2000000) * 100} className="h-3" />
              <div className="text-xs text-muted-foreground">
                {totalInvested >= 2000000 
                  ? "Goal achieved! 🎉"
                  : totalInvested > 0 
                    ? `${((Math.min(totalInvested, 2000000) / 2000000) * 100).toFixed(1)}% towards your house goal`
                    : "Start saving for your dream home"
                }
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Child Education Fund</span>
                <span className="text-sm font-medium">{formatCurrency(Math.min(totalInvested * 0.3, 1500000))} / ₹15,00,000</span>
              </div>
              <Progress value={(Math.min(totalInvested * 0.3, 1500000) / 1500000) * 100} className="h-3" />
              <div className="text-xs text-muted-foreground">
                {(totalInvested * 0.3) >= 1500000 
                  ? "Education fund secured! 🎓"
                  : totalInvested > 0 
                    ? `Allocating 30% of investments - ${((Math.min(totalInvested * 0.3, 1500000) / 1500000) * 100).toFixed(1)}% complete`
                    : "Secure your child's future education"
                }
              </div>
            </div>

            {totalInvested === 0 && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Pro Tip:</strong> Add investment transactions with categories like "Mutual Funds", "Insurance", 
                  "Bhishi", or "Investment" to start tracking your progress towards these goals!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}