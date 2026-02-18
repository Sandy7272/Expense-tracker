import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { FinancialHealthScore } from "@/components/dashboard/FinancialHealthScore";
import { BudgetProgressSection } from "@/components/dashboard/BudgetProgressSection";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { MonthlyTrendsChart } from "@/components/dashboard/MonthlyTrendsChart";
import { EMITrackingCard } from "@/components/dashboard/EMITrackingCard";
import { NLExpenseInput } from "@/components/ai/NLExpenseInput";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useTransactions } from "@/hooks/useTransactions";
import { useInvestmentData } from "@/hooks/useInvestmentData";
import { useLendingTransactions } from "@/hooks/useLendingTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle,
  Zap, ChevronDown, ChevronUp, LayoutGrid, Layers, Sparkles,
  AlertCircle, PiggyBank, BarChart2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function StatCard({
  label, value, icon: Icon, color, sub, trend
}: {
  label: string; value: string; icon: any;
  color: "income" | "expense" | "primary" | "warning";
  sub?: string; trend?: number;
}) {
  const colorMap = {
    income: "text-income bg-income/10 border-income/20",
    expense: "text-expense bg-expense/10 border-expense/20",
    primary: "text-primary bg-primary/10 border-primary/20",
    warning: "text-warning bg-warning/10 border-warning/20",
  };
  const textMap = {
    income: "text-income", expense: "text-expense",
    primary: "text-primary", warning: "text-warning",
  };
  return (
    <Card className="kpi-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className={cn("p-2 rounded-xl border", colorMap[color])}>
          <Icon className="h-4 w-4" />
        </div>
        {trend !== undefined && (
          <span className={cn("text-xs font-medium flex items-center gap-0.5", trend >= 0 ? "text-income" : "text-expense")}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className={cn("text-xl sm:text-2xl font-bold", textMap[color])}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

function InsightBadge({ message, type }: { message: string; type: "positive" | "negative" | "neutral" }) {
  const styles = {
    positive: "border-income/30 bg-income/5 text-income",
    negative: "border-expense/30 bg-expense/5 text-expense",
    neutral: "border-warning/30 bg-warning/5 text-warning",
  };
  const icons = {
    positive: TrendingUp, negative: AlertCircle, neutral: Sparkles,
  };
  const Icon = icons[type];
  return (
    <div className={cn("flex items-start gap-2.5 p-3 rounded-xl border text-sm", styles[type])}>
      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <span className="text-foreground/80 text-xs leading-relaxed">{message}</span>
    </div>
  );
}

export default function Index() {
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  const [showAdvancedCharts, setShowAdvancedCharts] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { transactions, isLoading } = useTransactions();
  const { investmentData } = useInvestmentData();
  const { transactions: lendingTransactions } = useLendingTransactions();
  const { budgets } = useBudgets();
  const { formatAmount } = useCurrency();

  // Show onboarding for brand new users (no transactions ever)
  useEffect(() => {
    if (!isLoading && transactions.length === 0) {
      const dismissed = localStorage.getItem("onboarding_done");
      if (!dismissed) setShowOnboarding(true);
    }
  }, [isLoading, transactions.length]);

  const lendBorrowData = useMemo(() => {
    const lent = lendingTransactions.filter(t => t.type === "lent").reduce((s, t) => s + Number(t.amount), 0);
    const borrowed = lendingTransactions.filter(t => t.type === "borrowed").reduce((s, t) => s + Number(t.amount), 0);
    const repaidByThem = lendingTransactions.filter(t => t.type === "repaid_by_them").reduce((s, t) => s + Number(t.amount), 0);
    const repaidByMe = lendingTransactions.filter(t => t.type === "repaid_by_me").reduce((s, t) => s + Number(t.amount), 0);
    return { moneyLent: lent - repaidByThem, moneyBorrowed: borrowed - repaidByMe };
  }, [lendingTransactions]);

  const financialData = useMemo(() => {
    const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const emi = transactions
      .filter(t => t.type === "expense" && t.category?.toLowerCase().includes("emi"))
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalInvestment = investmentData?.totalInvestment || 0;
    const netProfit = income - expenses;
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    return {
      totalIncome: income, totalExpenses: expenses, totalInvestment,
      emi, netProfit, savingsRate,
      totalBalance: income - expenses - totalInvestment,
    };
  }, [transactions, investmentData]);

  const categoryData = useMemo(() => {
    const totals = transactions
      .filter(t => t.type === "expense")
      .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc; }, {} as Record<string, number>);
    return Object.entries(totals).map(([category, amount], i) => ({
      category, amount, color: `hsl(${262 + i * 30}, 60%, ${55 + i * 3}%)`
    }));
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const monthly = transactions.reduce((acc, t) => {
      const month = format(new Date(t.date), "MMM yyyy");
      if (!acc[month]) acc[month] = { month, income: 0, expenses: 0 };
      if (t.type === "income") acc[month].income += Number(t.amount);
      else acc[month].expenses += Number(t.amount);
      return acc;
    }, {} as Record<string, { month: string; income: number; expenses: number }>);
    return Object.values(monthly).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [transactions]);

  const insights = useMemo(() => {
    const result: { type: "positive" | "negative" | "neutral"; message: string }[] = [];
    if (financialData.totalIncome === 0 && financialData.totalExpenses === 0) return result;
    if (financialData.savingsRate >= 30) {
      result.push({ type: "positive", message: `Excellent! You're saving ${financialData.savingsRate.toFixed(0)}% of income. Keep it up! 🎯` });
    } else if (financialData.savingsRate < 10 && financialData.totalIncome > 0) {
      result.push({ type: "negative", message: `Savings rate is only ${financialData.savingsRate.toFixed(0)}%. Aim for at least 20%.` });
    }
    if (financialData.netProfit < 0) {
      result.push({ type: "negative", message: `You're spending more than you earn by ${formatAmount(Math.abs(financialData.netProfit))}.` });
    }
    if (categoryData.length > 0) {
      const top = categoryData.reduce((a, b) => a.amount > b.amount ? a : b);
      result.push({ type: "neutral", message: `Top spend: ${top.category} — ${((top.amount / financialData.totalExpenses) * 100).toFixed(0)}% of expenses.` });
    }
    if (financialData.emi > 0 && financialData.totalIncome > 0) {
      const emiRatio = (financialData.emi / financialData.totalIncome) * 100;
      if (emiRatio > 40) {
        result.push({ type: "negative", message: `EMI load is ${emiRatio.toFixed(0)}% of income — high risk. Consider restructuring.` });
      }
    }
    return result;
  }, [financialData, categoryData]);

  const budgetProgressData = useMemo(() => {
    const now = new Date();
    return budgets.map(b => {
      const spent = transactions
        .filter(t => t.type === "expense" && t.category === b.category &&
          new Date(t.date) >= startOfMonth(now) && new Date(t.date) <= endOfMonth(now))
        .reduce((s, t) => s + Number(t.amount), 0);
      return { category: b.category, budget: Number(b.monthly_limit), spent };
    });
  }, [budgets, transactions]);

  const isAnyLoading = isLoading;

  return (
    <DashboardLayout onRefresh={() => {}} isLoading={isAnyLoading}>
      {showOnboarding && (
        <OnboardingFlow onComplete={() => {
          localStorage.setItem("onboarding_done", "true");
          setShowOnboarding(false);
        }} />
      )}
      {/* Mode Switcher */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-foreground sm:text-xl">
            {mode === "simple" ? "👋 Financial Overview" : "📊 Command Center"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mode === "simple" ? "Your money at a glance" : "Full financial analytics"}
          </p>
        </div>
        <div className="flex items-center bg-secondary rounded-xl p-1 gap-1">
          <button
            onClick={() => setMode("simple")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              mode === "simple" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Zap className="h-3.5 w-3.5" /> Simple
          </button>
          <button
            onClick={() => setMode("advanced")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              mode === "advanced" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-3.5 w-3.5" /> Advanced
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === "simple" ? (
          <motion.div
            key="simple"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* 4 Core KPIs */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Balance"
                value={formatAmount(financialData.totalBalance)}
                icon={Wallet}
                color="primary"
                sub="After all expenses"
              />
              <StatCard
                label="Income"
                value={formatAmount(financialData.totalIncome)}
                icon={ArrowUpCircle}
                color="income"
                sub="This period"
              />
              <StatCard
                label="Expenses"
                value={formatAmount(financialData.totalExpenses)}
                icon={ArrowDownCircle}
                color="expense"
                sub="This period"
              />
              <StatCard
                label="Savings Rate"
                value={`${financialData.savingsRate.toFixed(0)}%`}
                icon={PiggyBank}
                color={financialData.savingsRate >= 20 ? "income" : "warning"}
                sub={financialData.savingsRate >= 20 ? "On track 🎯" : "Needs attention"}
              />
            </div>

            {/* AI Quick Add */}
            <Card className="kpi-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">AI Expense Entry</h3>
                  <p className="text-xs text-muted-foreground">Type or speak in plain English</p>
                </div>
              </div>
              <NLExpenseInput />
            </Card>

            {/* AI Insights */}
            {insights.length > 0 && (
              <Card className="kpi-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Smart Insights</h3>
                </div>
                <div className="space-y-2">
                  {insights.slice(0, 3).map((ins, i) => (
                    <InsightBadge key={i} message={ins.message} type={ins.type} />
                  ))}
                </div>
              </Card>
            )}

            {/* EMI Summary */}
            <EMITrackingCard />

            {/* Health Score mini */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FinancialHealthScore
                totalIncome={financialData.totalIncome}
                totalExpenses={financialData.totalExpenses}
                totalInvestment={financialData.totalInvestment}
                emi={financialData.emi}
                moneyLent={lendBorrowData.moneyLent}
                moneyBorrowed={lendBorrowData.moneyBorrowed}
              />
              {/* Category mini chart */}
              <Card className="kpi-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Spending Breakdown</h3>
                {categoryData.length === 0 ? (
                  <div className="flex items-center justify-center h-24 text-muted-foreground text-xs">
                    Add expenses to see breakdown
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categoryData.slice(0, 4).map(cat => {
                      const pct = financialData.totalExpenses > 0 ? (cat.amount / financialData.totalExpenses) * 100 : 0;
                      return (
                        <div key={cat.category}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{cat.category}</span>
                            <span className="text-foreground font-medium">{pct.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Switch to advanced CTA */}
            <button
              onClick={() => setMode("advanced")}
              className="w-full py-3 rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center justify-center gap-2"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              View full analytics, budgets, investments & more
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="advanced"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Full 4 KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Net Balance" value={formatAmount(financialData.totalBalance)} icon={Wallet} color="primary" />
              <StatCard label="Income" value={formatAmount(financialData.totalIncome)} icon={ArrowUpCircle} color="income" />
              <StatCard label="Expenses" value={formatAmount(financialData.totalExpenses)} icon={ArrowDownCircle} color="expense" />
              <StatCard label="Savings Rate" value={`${financialData.savingsRate.toFixed(0)}%`} icon={PiggyBank} color={financialData.savingsRate >= 20 ? "income" : "warning"} />
            </div>

            {/* AI Entry */}
            <Card className="kpi-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">AI Quick Add</h3>
              </div>
              <NLExpenseInput />
            </Card>

            {/* Health Score + Budget + Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <FinancialHealthScore
                totalIncome={financialData.totalIncome}
                totalExpenses={financialData.totalExpenses}
                totalInvestment={financialData.totalInvestment}
                emi={financialData.emi}
                moneyLent={lendBorrowData.moneyLent}
                moneyBorrowed={lendBorrowData.moneyBorrowed}
              />
              <BudgetProgressSection budgets={budgetProgressData} />
              <Card className="kpi-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Spending Insights</h3>
                </div>
                {insights.length === 0 ? (
                  <div className="flex items-center justify-center h-20 text-muted-foreground text-xs">Add transactions for insights</div>
                ) : (
                  <div className="space-y-2">
                    {insights.map((ins, i) => <InsightBadge key={i} message={ins.message} type={ins.type} />)}
                  </div>
                )}
              </Card>
            </div>

            {/* EMI Tracking */}
            <EMITrackingCard />

            {/* Charts — Collapsible */}
            <div>
              <button
                onClick={() => setShowAdvancedCharts(!showAdvancedCharts)}
                className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors mb-3"
              >
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-primary" />
                  Charts & Analytics
                </span>
                {showAdvancedCharts ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              <AnimatePresence>
                {showAdvancedCharts && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 xl:grid-cols-2 gap-5"
                  >
                    <CategoryPieChart data={categoryData} />
                    <MonthlyTrendsChart data={monthlyData} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
}

