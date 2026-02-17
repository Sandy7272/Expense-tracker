import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { PremiumKPICards } from "@/components/dashboard/PremiumKPICards";
import { FinancialHealthScore } from "@/components/dashboard/FinancialHealthScore";
import { BudgetProgressSection } from "@/components/dashboard/BudgetProgressSection";
import { SpendingInsights } from "@/components/dashboard/SpendingInsights";
import { QuickAddExpense } from "@/components/dashboard/QuickAddExpense";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { MonthlyTrendsChart } from "@/components/dashboard/MonthlyTrendsChart";
import { EMITrackingCard } from "@/components/dashboard/EMITrackingCard";
import { useTransactions } from "@/hooks/useTransactions";
import { useDateRangeFilter } from "@/hooks/useDateRangeFilter";
import { useInvestmentData } from "@/hooks/useInvestmentData";
import { useLendingTransactions } from "@/hooks/useLendingTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { format, startOfMonth, endOfMonth } from "date-fns";

export default function Index() {
  const { transactions: filteredTransactions, isLoading } = useTransactions();
  const { investmentData, isLoading: investmentLoading } = useInvestmentData();
  const { transactions: lendingTransactions, isLoading: lendingLoading } = useLendingTransactions();
  const { budgets } = useBudgets();

  // Lending summary
  const lendBorrowData = useMemo(() => {
    const lent = lendingTransactions.filter(t => t.type === 'lent').reduce((s, t) => s + Number(t.amount), 0);
    const borrowed = lendingTransactions.filter(t => t.type === 'borrowed').reduce((s, t) => s + Number(t.amount), 0);
    const repaidByThem = lendingTransactions.filter(t => t.type === 'repaid_by_them').reduce((s, t) => s + Number(t.amount), 0);
    const repaidByMe = lendingTransactions.filter(t => t.type === 'repaid_by_me').reduce((s, t) => s + Number(t.amount), 0);
    return { moneyLent: lent - repaidByThem, moneyBorrowed: borrowed - repaidByMe };
  }, [lendingTransactions]);

  // Financial data
  const financialData = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const emi = filteredTransactions
      .filter(t => t.type === 'expense' && t.category?.toLowerCase().includes('emi'))
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalInvestment = investmentData?.totalInvestment || 0;
    const netProfit = income - expenses;
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    return {
      totalIncome: income,
      totalExpenses: expenses,
      totalInvestment,
      emi,
      netProfit,
      savingsRate,
      totalBalance: income - expenses - totalInvestment,
    };
  }, [filteredTransactions, investmentData]);

  // Category data for pie chart
  const categoryData = useMemo(() => {
    const categoryTotals = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([category, amount], index) => ({
      category,
      amount,
      color: `hsl(${262 + index * 30}, 60%, ${55 + index * 3}%)`
    }));
  }, [filteredTransactions]);

  // Monthly data for trends
  const monthlyData = useMemo(() => {
    const monthlyTotals = filteredTransactions.reduce((acc, t) => {
      const month = format(new Date(t.date), 'MMM yyyy');
      if (!acc[month]) acc[month] = { month, income: 0, expenses: 0 };
      if (t.type === 'income') acc[month].income += Number(t.amount);
      else acc[month].expenses += Number(t.amount);
      return acc;
    }, {} as Record<string, { month: string; income: number; expenses: number }>);
    return Object.values(monthlyTotals).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [filteredTransactions]);

  // Generate spending insights
  const insights = useMemo(() => {
    const result: { type: "positive" | "negative" | "neutral"; message: string }[] = [];
    if (financialData.totalIncome === 0 && financialData.totalExpenses === 0) return result;

    if (financialData.savingsRate >= 30) {
      result.push({ type: "positive", message: `Great savings rate of ${financialData.savingsRate.toFixed(0)}%! You're building wealth.` });
    } else if (financialData.savingsRate < 10 && financialData.totalIncome > 0) {
      result.push({ type: "negative", message: `Your savings rate is only ${financialData.savingsRate.toFixed(0)}%. Try to save at least 20%.` });
    }

    if (financialData.netProfit < 0) {
      result.push({ type: "negative", message: `You're spending more than you earn. Net loss: ${Math.abs(financialData.netProfit).toFixed(0)}` });
    }

    // Top spending category
    if (categoryData.length > 0) {
      const top = categoryData.reduce((a, b) => a.amount > b.amount ? a : b);
      result.push({ type: "neutral", message: `Highest spending: ${top.category} at ${((top.amount / financialData.totalExpenses) * 100).toFixed(0)}% of total expenses.` });
    }

    if (financialData.emi > 0 && financialData.totalIncome > 0) {
      const emiRatio = (financialData.emi / financialData.totalIncome) * 100;
      if (emiRatio > 40) {
        result.push({ type: "negative", message: `EMI payments consume ${emiRatio.toFixed(0)}% of your income. Consider restructuring.` });
      }
    }

    return result;
  }, [financialData, categoryData]);

  const isAnyLoading = isLoading || investmentLoading || lendingLoading;

  return (
    <DashboardLayout onRefresh={() => {}} isLoading={isAnyLoading}>
      <div className="space-y-6">
        {/* Quick Add */}
        <QuickAddExpense />

        {/* KPI Cards */}
        <PremiumKPICards
          totalBalance={financialData.totalBalance}
          monthlyIncome={financialData.totalIncome}
          monthlyExpenses={financialData.totalExpenses}
          netProfit={financialData.netProfit}
          savingsRate={financialData.savingsRate}
          outstandingPayments={lendBorrowData.moneyLent}
          upcomingBills={0}
          cashFlowTrend={financialData.savingsRate}
        />

        {/* Health Score + Budget + Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FinancialHealthScore
            totalIncome={financialData.totalIncome}
            totalExpenses={financialData.totalExpenses}
            totalInvestment={financialData.totalInvestment}
            emi={financialData.emi}
            moneyLent={lendBorrowData.moneyLent}
            moneyBorrowed={lendBorrowData.moneyBorrowed}
          />
          <BudgetProgressSection budgets={budgets.map(b => {
            const now = new Date();
            const spent = filteredTransactions
              .filter(t => t.type === 'expense' && t.category === b.category && new Date(t.date) >= startOfMonth(now) && new Date(t.date) <= endOfMonth(now))
              .reduce((s, t) => s + Number(t.amount), 0);
            return { category: b.category, budget: Number(b.monthly_limit), spent };
          })} />
          <SpendingInsights insights={insights} />
        </div>

        {/* EMI Tracking */}
        <EMITrackingCard />

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <CategoryPieChart data={categoryData} />
          <MonthlyTrendsChart data={monthlyData} />
        </div>
      </div>
    </DashboardLayout>
  );
}
