import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { WelcomeCard } from "@/components/dashboard/WelcomeCard";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { MonthlyTrendsChart } from "@/components/dashboard/MonthlyTrendsChart";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { AddExpenseModal } from "@/components/dashboard/AddExpenseModal";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { data, isLoading, refetch, addTransaction } = useGoogleSheets();
  const [showAddModal, setShowAddModal] = useState(false);

  if (isLoading && !data) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Loading skeletons */}
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
              No data available
            </h2>
            <p className="text-muted-foreground">
              Unable to load data from Google Sheets
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const topCategory = data.categoryData.length > 0 
    ? data.categoryData.reduce((max, current) => 
        current.amount > max.amount ? current : max
      ).category
    : "None";

  return (
    <DashboardLayout onRefresh={refetch} isLoading={isLoading}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Section */}
        <WelcomeCard userName="Sandy" lastUpdated={data.lastUpdated} />

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Card - spans 2 columns on large screens */}
          <div className="lg:col-span-2">
            <BalanceCard 
              totalIncome={data.totalIncome}
              totalExpenses={data.totalExpenses}
            />
          </div>
          
          {/* Category Pie Chart */}
          <div className="lg:col-span-1">
            <CategoryPieChart data={data.categoryData} />
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards
          totalIncome={data.totalIncome}
          totalExpenses={data.totalExpenses}
          transactionCount={data.transactions.length}
          topCategory={topCategory}
        />

        {/* Charts and Transactions */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Monthly Trends Chart */}
          <MonthlyTrendsChart data={data.monthlyData} />
          
          {/* Recent Transactions */}
          <RecentTransactions 
            transactions={data.transactions.slice(0, 8)}
            onAddNew={() => setShowAddModal(true)}
          />
        </div>

        {/* Add Expense Modal */}
        <AddExpenseModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          onSubmit={addTransaction}
        />
      </div>
    </DashboardLayout>
  );
};

export default Index;
