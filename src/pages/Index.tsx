import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { FinancialSummaryCards } from "@/components/dashboard/FinancialSummaryCards";
import { InvestmentBreakdown } from "@/components/dashboard/InvestmentBreakdown";
import { LendBorrowOverview } from "@/components/dashboard/LendBorrowOverview";
import { PersonLendingTable } from "@/components/dashboard/PersonLendingTable";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { MonthlyTrendsChart } from "@/components/dashboard/MonthlyTrendsChart";
import { AddExpenseModal } from "@/components/dashboard/AddExpenseModal";
import { FloatingAddButton } from "@/components/dashboard/FloatingAddButton";
import { useTransactions } from "@/hooks/useTransactions";
import { format } from "date-fns";

export default function Index() {
  const [selectedMonth, setSelectedMonth] = useState("January 2025");
  const [showAddModal, setShowAddModal] = useState(false);
  const { transactions, isLoading } = useTransactions();

  // Calculate financial data from real transactions
  const financialData = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    
    return {
      totalIncome: income,
      totalSpend: expenses,
      totalInvestment: 45000,
      emi: 15000,
      usneDile: 25000,
      usneGhetle: 8000,
      savingInBank: income - expenses
    };
  }, [transactions]);

  // Transform transactions to category data for pie chart
  const categoryData = useMemo(() => {
    const categoryTotals = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([category, amount], index) => ({
      category,
      amount,
      color: `hsl(${index * 45}, 70%, 60%)`
    }));
  }, [transactions]);

  // Transform transactions to monthly data for trends chart
  const monthlyData = useMemo(() => {
    const monthlyTotals = transactions.reduce((acc, t) => {
      const month = format(new Date(t.date), 'MMM yyyy');
      if (!acc[month]) {
        acc[month] = { month, income: 0, expenses: 0 };
      }
      if (t.type === 'income') {
        acc[month].income += Number(t.amount);
      } else {
        acc[month].expenses += Number(t.amount);
      }
      return acc;
    }, {} as Record<string, { month: string; income: number; expenses: number }>);

    return Object.values(monthlyTotals).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [transactions]);

  const availableMonths = ["December 2024", "January 2025", "February 2025"];

  // Mock data for other components
  const investmentData = {
    mutualFunds: 180000,
    stocks: 95000,
    insurancePolicy: 65000,
    bhishi: 35000,
    totalInvestment: 375000
  };

  const lendBorrowData = {
    usneDile: 45000,
    usnePrtAle: 12000,
    usneGhetle: 23000,
    usnePrtDile: 8000
  };

  const personLendingData = [
    { name: "Alex Johnson", amount: 1500, totalRemaining: 500 },
    { name: "Sarah Chen", amount: 800, totalRemaining: -300 },
  ];

  return (
    <DashboardLayout onRefresh={() => {}} isLoading={isLoading}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
              Financial Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Track your cyberpunk-style financial journey</p>
          </div>
          <MonthSelector selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} availableMonths={availableMonths} />
        </div>

        <FinancialSummaryCards {...financialData} />
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <InvestmentBreakdown data={investmentData} />
          <LendBorrowOverview data={lendBorrowData} />
        </div>

        <PersonLendingTable data={personLendingData} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <CategoryPieChart data={categoryData} />
          <MonthlyTrendsChart data={monthlyData} />
        </div>
      </div>

      <FloatingAddButton onClick={() => setShowAddModal(true)} />
      <AddExpenseModal open={showAddModal} onOpenChange={setShowAddModal} />
    </DashboardLayout>
  );
}