import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { FinancialSummaryCards } from "@/components/dashboard/FinancialSummaryCards";
import { InvestmentBreakdown } from "@/components/dashboard/InvestmentBreakdown";
import { LendBorrowOverview } from "@/components/dashboard/LendBorrowOverview";
import { PersonLendingTable } from "@/components/dashboard/PersonLendingTable";
import { MonthSelector } from "@/components/dashboard/MonthSelector";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { MonthlyTrendsChart } from "@/components/dashboard/MonthlyTrendsChart";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [selectedMonth, setSelectedMonth] = useState("January 2025");
  const availableMonths = ["December 2024", "January 2025", "February 2025"];
  
  // Mock data for cyberpunk dashboard
  const mockData = {
    totalIncome: 125000,
    totalSpend: 78000,
    totalInvestment: 45000,
    emi: 15000,
    usneDile: 25000,
    usneGhetle: 8000,
    savingInBank: 32000,
    categoryData: [
      { category: "Food", amount: 25000, color: "hsl(189 100% 56%)" },
      { category: "Transport", amount: 18000, color: "hsl(320 90% 60%)" },
      { category: "Entertainment", amount: 12000, color: "hsl(120 100% 50%)" }
    ],
    monthlyData: [
      { month: "Oct", income: 120000, expenses: 75000 },
      { month: "Nov", income: 130000, expenses: 82000 },
      { month: "Dec", income: 118000, expenses: 70000 },
      { month: "Jan", income: 125000, expenses: 78000 }
    ]
  };

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
    { name: "Rahul", amount: 15000, totalRemaining: 12000 },
    { name: "Priya", amount: 8000, totalRemaining: -3000 },
    { name: "Amit", amount: 20000, totalRemaining: 20000 }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Header with Month Selector */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-heading font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Cyberpunk Finance Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Real-time financial analytics in ₹</p>
          </div>
          <MonthSelector 
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            availableMonths={availableMonths}
          />
        </div>

        {/* Financial Summary Cards */}
        <FinancialSummaryCards 
          totalIncome={mockData.totalIncome}
          totalSpend={mockData.totalSpend}
          totalInvestment={investmentData.totalInvestment}
          emi={mockData.emi}
          usneDile={mockData.usneDile}
          usneGhetle={mockData.usneGhetle}
          savingInBank={mockData.savingInBank}
        />

        {/* Investment & Lending Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <InvestmentBreakdown data={investmentData} />
          <PersonLendingTable data={personLendingData} />
        </div>

        {/* Lend/Borrow Overview */}
        <LendBorrowOverview data={lendBorrowData} />

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <CategoryPieChart data={mockData.categoryData} />
          <MonthlyTrendsChart data={mockData.monthlyData} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
