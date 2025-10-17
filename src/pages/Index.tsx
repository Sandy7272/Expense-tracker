import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { FinancialSummaryCards } from "@/components/dashboard/FinancialSummaryCards";
import { InvestmentBreakdown } from "@/components/dashboard/InvestmentBreakdown";
import { LendBorrowOverview } from "@/components/dashboard/LendBorrowOverview";
import { PersonLendingTable } from "@/components/dashboard/PersonLendingTable";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { MonthlyTrendsChart } from "@/components/dashboard/MonthlyTrendsChart";
import { AddExpenseModal } from "@/components/dashboard/AddExpenseModal";
import { FloatingAddButton } from "@/components/dashboard/FloatingAddButton";
import { EMITrackingCard } from "@/components/dashboard/EMITrackingCard";
import { useTransactions } from "@/hooks/useTransactions";
import { useDateRangeFilter, DateRange } from "@/hooks/useDateRangeFilter";
import { useInvestmentData } from "@/hooks/useInvestmentData";
import { useLendingTransactions } from "@/hooks/useLendingTransactions";
import { format } from "date-fns";

export default function Index() {
  const [showAddModal, setShowAddModal] = useState(false);
  const { transactions, isLoading } = useTransactions();
  const { transactions: filteredTransactions } = useTransactions(); // Use transactions directly from hook
  const { dateRange } = useDateRangeFilter(); // Get dateRange from global context
  const { investmentData, isLoading: investmentLoading } = useInvestmentData(); // Use global dateRange
  const { transactions: lendingTransactions, isLoading: lendingLoading } = useLendingTransactions(); // Use global dateRange

  // Process lending transactions for overview
  const lendBorrowData = useMemo(() => {
    const lent = lendingTransactions.filter(t => t.type === 'lent').reduce((sum, t) => sum + Number(t.amount), 0);
    const borrowed = lendingTransactions.filter(t => t.type === 'borrowed').reduce((sum, t) => sum + Number(t.amount), 0);
    const repaidByThem = lendingTransactions.filter(t => t.type === 'repaid_by_them').reduce((sum, t) => sum + Number(t.amount), 0);
    const repaidByMe = lendingTransactions.filter(t => t.type === 'repaid_by_me').reduce((sum, t) => sum + Number(t.amount), 0);
    
    return {
      usneDile: lent - repaidByThem, // Outstanding amount we lent
      usnePrtAle: repaidByThem, // Amount they repaid us
      usneGhetle: borrowed - repaidByMe, // Outstanding amount we borrowed
      usnePrtDile: repaidByMe // Amount we repaid them
    };
  }, [lendingTransactions]);

  // Process person lending summary
  const personLendingData = useMemo(() => {
    const personMap = new Map<string, { name: string; lent: number; borrowed: number; repaidByThem: number; repaidByMe: number }>();
    
    lendingTransactions.forEach(t => {
      if (!personMap.has(t.person_name)) {
        personMap.set(t.person_name, { name: t.person_name, lent: 0, borrowed: 0, repaidByThem: 0, repaidByMe: 0 });
      }
      const person = personMap.get(t.person_name)!;
      
      if (t.type === 'lent') person.lent += Number(t.amount);
      else if (t.type === 'borrowed') person.borrowed += Number(t.amount);
      else if (t.type === 'repaid_by_them') person.repaidByThem += Number(t.amount);
      else if (t.type === 'repaid_by_me') person.repaidByMe += Number(t.amount);
    });
    
    return Array.from(personMap.values()).map(person => ({
      name: person.name,
      amount: person.lent + person.borrowed,
      totalRemaining: (person.lent - person.repaidByThem) - (person.borrowed - person.repaidByMe)
    })).filter(p => p.amount > 0); // Only show people with transactions
  }, [lendingTransactions]);

  // Calculate financial data from filtered transactions
  const financialData = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Calculate EMI from transactions with "EMI" in category
    const emi = filteredTransactions
      .filter(t => t.type === 'expense' && t.category?.toLowerCase().includes('emi'))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    return {
      totalIncome: income,
      totalSpend: expenses,
      totalInvestment: investmentData?.totalInvestment || 0,
      emi,
      usneDile: lendBorrowData.usneDile,
      usneGhetle: lendBorrowData.usneGhetle,
      savingInBank: income - expenses - (investmentData?.totalInvestment || 0)
    };
  }, [filteredTransactions, investmentData, lendBorrowData]);

  // Transform filtered transactions to category data for pie chart
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
      color: `hsl(${index * 45}, 70%, 60%)`
    }));
  }, [filteredTransactions]);

  // Transform filtered transactions to monthly data for trends chart
  const monthlyData = useMemo(() => {
    const monthlyTotals = filteredTransactions.reduce((acc, t) => {
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
  }, [filteredTransactions]);

  const isAnyLoading = isLoading || investmentLoading || lendingLoading;

  return (
    <DashboardLayout onRefresh={() => {}} isLoading={isAnyLoading}>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
              Financial Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Track your cyberpunk-style financial journey</p>
          </div>
        </div>

        <FinancialSummaryCards {...financialData} />
        
        <EMITrackingCard />
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <InvestmentBreakdown data={investmentData || { mutualFunds: 0, stocks: 0, insurancePolicy: 0, chitFunds: 0, gold: 0, crypto: 0, policy: 0, generalInvestment: 0, totalInvestment: 0 }} />
          <LendBorrowOverview data={lendBorrowData} />
        </div>

        {personLendingData.length > 0 && <PersonLendingTable data={personLendingData} />}

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