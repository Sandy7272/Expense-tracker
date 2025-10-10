import { useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { MonthlyTrendsChart } from "@/components/dashboard/MonthlyTrendsChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { useTransactions } from "@/hooks/useTransactions";
import { TrendingUp, TrendingDown, Target, PieChart, BarChart3, Activity } from "lucide-react";
import { startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, differenceInDays } from "date-fns";

const CATEGORY_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function Analytics() {
  const { transactions, isLoading } = useTransactions();
  
  const analytics = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    
    const thisMonthTxs = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= thisMonthStart && txDate <= thisMonthEnd;
    });
    
    const lastMonthTxs = transactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate >= lastMonthStart && txDate <= lastMonthEnd;
    });
    
    const thisMonthIncome = thisMonthTxs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const thisMonthExpenses = thisMonthTxs
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const previousMonthIncome = lastMonthTxs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const previousMonthExpenses = lastMonthTxs
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const monthlyGrowth = previousMonthIncome > 0
      ? ((thisMonthIncome - previousMonthIncome) / previousMonthIncome) * 100
      : 0;
    
    const savingsRate = thisMonthIncome > 0
      ? ((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100
      : 0;
    
    const categoryExpenses = thisMonthTxs
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);
    
    const topCategory = Object.entries(categoryExpenses).sort((a, b) => b[1] - a[1])[0];
    
    const daysInMonth = differenceInDays(thisMonthEnd, thisMonthStart) + 1;
    const averageDaily = thisMonthExpenses / daysInMonth;
    
    return {
      monthlyGrowth,
      savingsRate,
      topCategory: topCategory?.[0] || "N/A",
      topCategoryAmount: topCategory?.[1] || 0,
      averageDaily,
      thisMonthIncome,
      thisMonthExpenses,
      previousMonthIncome,
      previousMonthExpenses,
      budgetUtilization: 0, // Not implemented yet
    };
  }, [transactions]);

  const insights = useMemo(() => {
    const results = [];
    
    if (analytics.savingsRate >= 30) {
      results.push({
        title: "Great Savings!",
        description: `You're saving ${analytics.savingsRate.toFixed(0)}% of your income`,
        type: "success",
        icon: Target
      });
    } else if (analytics.savingsRate < 10) {
      results.push({
        title: "Low Savings Rate",
        description: `Only ${analytics.savingsRate.toFixed(0)}% savings - consider reducing expenses`,
        type: "destructive",
        icon: Target
      });
    }
    
    if (analytics.monthlyGrowth > 0) {
      results.push({
        title: "Income Growth",
        description: `Your income increased by ${analytics.monthlyGrowth.toFixed(1)}% this month`,
        type: "success",
        icon: TrendingUp
      });
    } else if (analytics.monthlyGrowth < -10) {
      results.push({
        title: "Income Declined",
        description: `Income decreased by ${Math.abs(analytics.monthlyGrowth).toFixed(1)}%`,
        type: "warning",
        icon: TrendingDown
      });
    }
    
    if (analytics.topCategoryAmount > analytics.thisMonthExpenses * 0.3) {
      results.push({
        title: "High Category Spending",
        description: `${analytics.topCategory} accounts for ${((analytics.topCategoryAmount / analytics.thisMonthExpenses) * 100).toFixed(0)}% of expenses`,
        type: "warning",
        icon: PieChart
      });
    }
    
    return results.length > 0 ? results : [{
      title: "No Insights Yet",
      description: "Add more transactions to get personalized insights",
      type: "info",
      icon: Activity
    }];
  }, [analytics]);

  const categoryData = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    
    const categoryTotals = transactions
      .filter(t => {
        const txDate = new Date(t.date);
        return t.type === 'expense' && txDate >= thisMonthStart && txDate <= thisMonthEnd;
      })
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);
    
    return Object.entries(categoryTotals)
      .map(([category, amount], index) => ({
        category,
        amount,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const monthsData: Record<string, { income: number; expenses: number }> = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthsData[monthKey]) {
        monthsData[monthKey] = { income: 0, expenses: 0 };
      }
      
      if (t.type === 'income') {
        monthsData[monthKey].income += Number(t.amount);
      } else {
        monthsData[monthKey].expenses += Number(t.amount);
      }
    });
    
    return Object.entries(monthsData)
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [transactions]);

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-success bg-success/10 text-success';
      case 'warning': return 'border-warning bg-warning/10 text-warning';
      case 'destructive': return 'border-destructive bg-destructive/10 text-destructive';
      default: return 'border-muted bg-muted/10 text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground">Deep insights into your financial patterns</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Growth</p>
                  <p className="text-2xl font-bold text-success">+{analytics.monthlyGrowth}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Savings Rate</p>
                  <p className="text-2xl font-bold text-primary">{analytics.savingsRate}%</p>
                </div>
                <Target className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Daily Spend</p>
                  <p className="text-2xl font-bold text-expense">{formatCurrency(analytics.averageDaily)}</p>
                </div>
                <Activity className="h-8 w-8 text-expense" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Budget Used</p>
                  <p className="text-2xl font-bold text-warning">{analytics.budgetUtilization}%</p>
                </div>
                <PieChart className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryPieChart data={categoryData} />
          <MonthlyTrendsChart data={monthlyData} />
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Comparison */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Comparison
              </CardTitle>
              <CardDescription>This month vs last month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Income</span>
                  <Badge className="bg-income text-income-foreground">
                    +{(((analytics.thisMonthIncome - analytics.previousMonthIncome) / analytics.previousMonthIncome) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="text-xl font-bold text-income">{formatCurrency(analytics.thisMonthIncome)}</div>
                <div className="text-sm text-muted-foreground">vs {formatCurrency(analytics.previousMonthIncome)} last month</div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Expenses</span>
                  <Badge className="bg-expense text-expense-foreground">
                    {(((analytics.thisMonthExpenses - analytics.previousMonthExpenses) / analytics.previousMonthExpenses) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="text-xl font-bold text-expense">{formatCurrency(analytics.thisMonthExpenses)}</div>
                <div className="text-sm text-muted-foreground">vs {formatCurrency(analytics.previousMonthExpenses)} last month</div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Net Savings</span>
                  <span className="text-xl font-bold text-success">
                    {formatCurrency(analytics.thisMonthIncome - analytics.thisMonthExpenses)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insights & Recommendations */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Smart Insights</CardTitle>
              <CardDescription>AI-powered financial recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
                  <div className="flex items-start gap-3">
                    <insight.icon className="h-5 w-5 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">{insight.title}</h4>
                      <p className="text-sm opacity-90 mt-1">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Top Categories Breakdown */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Top Spending Categories</CardTitle>
            <CardDescription>Your highest expense categories this month</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No expense data available</p>
            ) : (
              <div className="space-y-4">
                {categoryData.slice(0, 5).map((cat, idx) => {
                  const percentage = analytics.thisMonthExpenses > 0 
                    ? (cat.amount / analytics.thisMonthExpenses) * 100 
                    : 0;
                  return (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{cat.category}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(cat.amount)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: cat.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}