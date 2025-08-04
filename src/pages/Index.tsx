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
      savingInBank: income - expenses,
      categoryData: [],
      monthlyData: []
    };
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
    netAmount: 34000
  };

  const personLendingData = [
    { name: "Alex Johnson", amount: 1500, type: "lent", dueDate: "2024-03-15", status: "pending" },
    { name: "Sarah Chen", amount: 800, type: "borrowed", dueDate: "2024-03-10", status: "overdue" },
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

        <FinancialSummaryCards data={financialData} />
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <InvestmentBreakdown data={investmentData} />
          <LendBorrowOverview data={lendBorrowData} />
        </div>

        <PersonLendingTable data={personLendingData} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <CategoryPieChart data={transactions} />
          <MonthlyTrendsChart data={transactions} />
        </div>
      </div>

      <FloatingAddButton onClick={() => setShowAddModal(true)} />
      <AddExpenseModal open={showAddModal} onOpenChange={setShowAddModal} />
    </DashboardLayout>
  );
}