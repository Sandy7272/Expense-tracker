import { useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { MonthlyTrendsChart } from "@/components/dashboard/MonthlyTrendsChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PremiumGate } from "@/components/PremiumGate";
import { formatCurrency } from "@/lib/currency";
import { useTransactions } from "@/hooks/useTransactions";
import { useCurrency } from "@/contexts/CurrencyContext";
import { generateFinancialPDF } from "@/lib/pdfExport";
import { TrendingUp, TrendingDown, Target, PieChart, BarChart3, Activity, FileDown } from "lucide-react";
import { startOfMonth, endOfMonth, subMonths, differenceInDays, format } from "date-fns";

const CATEGORY_COLORS = [
  "hsl(262, 83%, 58%)", "hsl(152, 69%, 50%)", "hsl(0, 72%, 55%)",
  "hsl(217, 91%, 60%)", "hsl(45, 93%, 55%)",
];

export default function Analytics() {
  const { transactions, isLoading } = useTransactions();
  const { formatAmount, getCurrencySymbol } = useCurrency();
  
  const analytics = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    
    const thisMonthTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= thisMonthStart && d <= thisMonthEnd;
    });
    const lastMonthTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });
    
    const thisMonthIncome = thisMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const thisMonthExpenses = thisMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const previousMonthIncome = lastMonthTxs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const previousMonthExpenses = lastMonthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    
    const monthlyGrowth = previousMonthIncome > 0 ? ((thisMonthIncome - previousMonthIncome) / previousMonthIncome) * 100 : 0;
    const savingsRate = thisMonthIncome > 0 ? ((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100 : 0;
    
    const categoryExpenses = thisMonthTxs.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);
    
    const topCategory = Object.entries(categoryExpenses).sort((a, b) => b[1] - a[1])[0];
    const daysInMonth = differenceInDays(thisMonthEnd, thisMonthStart) + 1;
    
    return {
      monthlyGrowth, savingsRate,
      topCategory: topCategory?.[0] || "N/A",
      topCategoryAmount: topCategory?.[1] || 0,
      averageDaily: thisMonthExpenses / daysInMonth,
      thisMonthIncome, thisMonthExpenses, previousMonthIncome, previousMonthExpenses,
    };
  }, [transactions]);

  const insights = useMemo(() => {
    const results: { title: string; description: string; type: string; icon: any }[] = [];
    if (analytics.savingsRate >= 30) results.push({ title: "Great Savings!", description: `Saving ${analytics.savingsRate.toFixed(0)}% of income`, type: "success", icon: Target });
    else if (analytics.savingsRate < 10 && analytics.thisMonthIncome > 0) results.push({ title: "Low Savings", description: `Only ${analytics.savingsRate.toFixed(0)}% saved`, type: "destructive", icon: Target });
    if (analytics.monthlyGrowth > 0) results.push({ title: "Income Growth", description: `Up ${analytics.monthlyGrowth.toFixed(1)}% this month`, type: "success", icon: TrendingUp });
    if (analytics.topCategoryAmount > analytics.thisMonthExpenses * 0.3 && analytics.thisMonthExpenses > 0)
      results.push({ title: "High Spending", description: `${analytics.topCategory}: ${((analytics.topCategoryAmount / analytics.thisMonthExpenses) * 100).toFixed(0)}% of expenses`, type: "warning", icon: PieChart });
    return results.length > 0 ? results : [{ title: "Add Transactions", description: "More data = better insights", type: "info", icon: Activity }];
  }, [analytics]);

  const categoryData = useMemo(() => {
    const now = new Date();
    const s = startOfMonth(now), e = endOfMonth(now);
    const totals = transactions.filter(t => t.type === 'expense' && new Date(t.date) >= s && new Date(t.date) <= e)
      .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc; }, {} as Record<string, number>);
    return Object.entries(totals).map(([category, amount], i) => ({ category, amount, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] })).sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const m: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach(t => {
      const key = `${new Date(t.date).getFullYear()}-${String(new Date(t.date).getMonth() + 1).padStart(2, '0')}`;
      if (!m[key]) m[key] = { income: 0, expenses: 0 };
      if (t.type === 'income') m[key].income += Number(t.amount);
      else m[key].expenses += Number(t.amount);
    });
    return Object.entries(m).map(([month, d]) => ({ month, ...d })).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [transactions]);

  const handleExportPDF = () => {
    const totalExpenses = analytics.thisMonthExpenses;
    generateFinancialPDF({
      totalIncome: analytics.thisMonthIncome,
      totalExpenses,
      netProfit: analytics.thisMonthIncome - totalExpenses,
      savingsRate: analytics.savingsRate,
      topCategories: categoryData.slice(0, 8).map(c => ({
        category: c.category, amount: c.amount,
        percentage: totalExpenses > 0 ? (c.amount / totalExpenses) * 100 : 0,
      })),
      monthlyData: monthlyData.map(m => ({ month: m.month, income: m.income, expenses: m.expenses })),
      currency: getCurrencySymbol(),
    });
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-success/30 bg-success/5 text-success';
      case 'warning': return 'border-warning/30 bg-warning/5 text-warning';
      case 'destructive': return 'border-destructive/30 bg-destructive/5 text-destructive';
      default: return 'border-border bg-secondary/30 text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
            <p className="text-muted-foreground text-sm">Deep insights into your financial patterns</p>
          </div>
          <PremiumGate feature="PDF Export">
            <Button onClick={handleExportPDF} className="bg-primary text-primary-foreground">
              <FileDown className="h-4 w-4 mr-2" /> Export PDF Report
            </Button>
          </PremiumGate>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Monthly Growth", value: `${analytics.monthlyGrowth >= 0 ? '+' : ''}${analytics.monthlyGrowth.toFixed(1)}%`, icon: TrendingUp, color: "text-success" },
            { label: "Savings Rate", value: `${analytics.savingsRate.toFixed(1)}%`, icon: Target, color: "text-primary" },
            { label: "Avg Daily Spend", value: formatCurrency(analytics.averageDaily), icon: Activity, color: "text-expense" },
            { label: "Top Category", value: analytics.topCategory, icon: PieChart, color: "text-warning" },
          ].map(m => (
            <Card key={m.label} className="kpi-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <m.icon className={`h-4 w-4 ${m.color}`} />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{m.label}</p>
              </div>
              <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryPieChart data={categoryData} />
          <MonthlyTrendsChart data={monthlyData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Comparison */}
          <Card className="kpi-card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" /> Monthly Comparison
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">Income</span>
                  {analytics.previousMonthIncome > 0 && (
                    <Badge className="bg-income/15 text-income text-xs">
                      {((analytics.thisMonthIncome - analytics.previousMonthIncome) / analytics.previousMonthIncome * 100).toFixed(1)}%
                    </Badge>
                  )}
                </div>
                <p className="text-xl font-bold text-income">{formatCurrency(analytics.thisMonthIncome)}</p>
                <p className="text-xs text-muted-foreground">vs {formatCurrency(analytics.previousMonthIncome)} last month</p>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground">Expenses</span>
                </div>
                <p className="text-xl font-bold text-expense">{formatCurrency(analytics.thisMonthExpenses)}</p>
                <p className="text-xs text-muted-foreground">vs {formatCurrency(analytics.previousMonthExpenses)} last month</p>
              </div>
              <div className="pt-3 border-t border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Net Savings</span>
                  <span className="text-xl font-bold text-success">{formatCurrency(analytics.thisMonthIncome - analytics.thisMonthExpenses)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Insights */}
          <Card className="kpi-card p-6">
            <h3 className="text-lg font-semibold mb-4">Smart Insights</h3>
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div key={i} className={`p-3 rounded-xl border ${getInsightColor(insight.type)}`}>
                  <div className="flex items-start gap-3">
                    <insight.icon className="h-4 w-4 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <p className="text-xs opacity-80 mt-0.5">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Top Categories */}
        <Card className="kpi-card p-6">
          <h3 className="text-lg font-semibold mb-4">Top Spending Categories</h3>
          {categoryData.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">No expense data available</p>
          ) : (
            <div className="space-y-3">
              {categoryData.slice(0, 5).map(cat => {
                const pct = analytics.thisMonthExpenses > 0 ? (cat.amount / analytics.thisMonthExpenses) * 100 : 0;
                return (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{cat.category}</span>
                      <span className="text-xs text-muted-foreground">{formatCurrency(cat.amount)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-500 rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
