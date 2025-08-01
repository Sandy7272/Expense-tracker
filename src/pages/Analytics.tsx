import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { MonthlyTrendsChart } from "@/components/dashboard/MonthlyTrendsChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/currency";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { TrendingUp, TrendingDown, Target, PieChart, BarChart3, Activity } from "lucide-react";

export default function Analytics() {
  const { data, isLoading } = useGoogleSheets();
  
  const analytics = {
    monthlyGrowth: 12.5,
    savingsRate: 35,
    topCategory: "Food & Dining",
    topCategoryAmount: 45000,
    budgetUtilization: 78,
    averageDaily: 1250,
    thisMonthIncome: 125000,
    thisMonthExpenses: 87000,
    previousMonthIncome: 118000,
    previousMonthExpenses: 92000
  };

  const insights = [
    {
      title: "Spending Pattern",
      description: "Your highest spending is on weekends",
      type: "warning",
      icon: Activity
    },
    {
      title: "Savings Goal",
      description: "You're 78% towards your monthly savings target",
      type: "success",
      icon: Target
    },
    {
      title: "Budget Alert",
      description: "Food & Dining budget is 95% utilized",
      type: "destructive",
      icon: TrendingUp
    }
  ];

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
          <CategoryPieChart data={data?.categoryData || []} />
          <MonthlyTrendsChart data={data?.monthlyData || []} />
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

        {/* Savings Progress */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Savings Progress</CardTitle>
            <CardDescription>Track your progress towards financial goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Emergency Fund</span>
                <span className="text-sm font-medium">₹2,50,000 / ₹5,00,000</span>
              </div>
              <Progress value={50} className="h-3" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Vacation Fund</span>
                <span className="text-sm font-medium">₹75,000 / ₹1,00,000</span>
              </div>
              <Progress value={75} className="h-3" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Investment Goal</span>
                <span className="text-sm font-medium">₹1,80,000 / ₹3,00,000</span>
              </div>
              <Progress value={60} className="h-3" />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}