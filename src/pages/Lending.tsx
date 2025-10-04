import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { LendBorrowOverview } from "@/components/dashboard/LendBorrowOverview";
import { PersonLendingTable } from "@/components/dashboard/PersonLendingTable";
import { LendingTransactionModal } from "@/components/dashboard/LendingTransactionModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { useLendingTransactions } from "@/hooks/useLendingTransactions";
import { useDateRangeFilter } from "@/hooks/useDateRangeFilter";
import { Plus, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function Lending() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { dateRange, formatDateRange } = useDateRangeFilter();
  const { transactions, isLoading } = useLendingTransactions(dateRange);

  // Process lending transactions for overview
  const lendBorrowData = useMemo(() => {
    const lent = transactions.filter(t => t.type === 'lent').reduce((sum, t) => sum + Number(t.amount), 0);
    const borrowed = transactions.filter(t => t.type === 'borrowed').reduce((sum, t) => sum + Number(t.amount), 0);
    const repaidByThem = transactions.filter(t => t.type === 'repaid_by_them').reduce((sum, t) => sum + Number(t.amount), 0);
    const repaidByMe = transactions.filter(t => t.type === 'repaid_by_me').reduce((sum, t) => sum + Number(t.amount), 0);
    
    return {
      usneDile: lent - repaidByThem,
      usnePrtAle: repaidByThem,
      usneGhetle: borrowed - repaidByMe,
      usnePrtDile: repaidByMe
    };
  }, [transactions]);

  // Process person lending summary
  const personLendingData = useMemo(() => {
    const personMap = new Map<string, { name: string; lent: number; borrowed: number; repaidByThem: number; repaidByMe: number }>();
    
    transactions.forEach(t => {
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
    })).filter(p => p.amount > 0);
  }, [transactions]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const lendTransactions = transactions.filter(t => t.type === 'lent');
    const borrowTransactions = transactions.filter(t => t.type === 'borrowed');
    const repaidByThemTotal = transactions.filter(t => t.type === 'repaid_by_them').reduce((sum, t) => sum + Number(t.amount), 0);
    const repaidByMeTotal = transactions.filter(t => t.type === 'repaid_by_me').reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalLent = lendTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalBorrowed = borrowTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const activeLends = lendTransactions.filter(t => t.status === 'active').length;
    const activeBorrows = borrowTransactions.filter(t => t.status === 'active').length;
    const overdueLends = transactions.filter(t => t.type === 'lent' && t.status === 'overdue').reduce((sum, t) => sum + Number(t.amount), 0);
    
    const avgLent = lendTransactions.length > 0 ? totalLent / lendTransactions.length : 0;
    const avgBorrowed = borrowTransactions.length > 0 ? totalBorrowed / borrowTransactions.length : 0;
    const recoveryRate = totalLent > 0 ? (repaidByThemTotal / totalLent) * 100 : 0;
    const repaymentRate = totalBorrowed > 0 ? (repaidByMeTotal / totalBorrowed) * 100 : 0;
    
    return {
      avgLent,
      avgBorrowed,
      recoveryRate,
      repaymentRate,
      activeLends,
      activeBorrows,
      overdueLends,
      pendingRepayment: lendBorrowData.usneGhetle
    };
  }, [transactions, lendBorrowData]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "lent":
        return <ArrowUpRight className="h-4 w-4 text-expense" />;
      case "borrowed":
        return <ArrowDownRight className="h-4 w-4 text-income" />;
      case "repaid_by_me":
        return <ArrowUpRight className="h-4 w-4 text-lending" />;
      case "repaid_by_them":
        return <ArrowDownRight className="h-4 w-4 text-success" />;
      default:
        return null;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case "lent": return "Usne Dile";
      case "borrowed": return "Usne Ghetle";
      case "repaid_by_me": return "Usne Prt Dile";
      case "repaid_by_them": return "Usne Prt Ale";
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'overdue':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'overdue':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Lending & Borrowing</h1>
            <p className="text-muted-foreground">Track money lent to and borrowed from friends & family ({formatDateRange(dateRange)})</p>
          </div>
          <Button className="cyber-button" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>

        {/* Overview Cards */}
        <LendBorrowOverview data={lendBorrowData} />

        {/* Person-wise Summary */}
        {personLendingData.length > 0 && <PersonLendingTable data={personLendingData} />}

        {/* Recent Transactions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Recent Lending Transactions</CardTitle>
            <CardDescription>Latest lending and borrowing activities</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found for the selected date range.
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.slice(0, 10).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 rounded-lg border glass-card hover:glow-primary transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted/20">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{transaction.person_name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">{getTransactionTypeLabel(transaction.type)}</span>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{format(new Date(transaction.date), 'MMM dd, yyyy')}</span>
                            {transaction.due_date && (
                              <>
                                <span className="text-sm text-muted-foreground">•</span>
                                <span className="text-sm text-muted-foreground">Due: {format(new Date(transaction.due_date), 'MMM dd, yyyy')}</span>
                              </>
                            )}
                          </div>
                          {transaction.description && (
                            <p className="text-sm text-muted-foreground mt-1">{transaction.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            transaction.type === 'lent' || transaction.type === 'repaid_by_me' ? 'text-expense' : 'text-income'
                          }`}>
                            {transaction.type === 'lent' || transaction.type === 'repaid_by_me' ? '-' : '+'}{formatCurrency(transaction.amount)}
                          </div>
                          <Badge className={`text-xs ${getStatusColor(transaction.status)}`}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(transaction.status)}
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </div>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Lending Statistics</CardTitle>
              <CardDescription>Your lending patterns over time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Average Amount Lent</span>
                <span className="font-bold">{formatCurrency(statistics.avgLent)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Recovery Rate</span>
                <span className="font-bold text-success">{statistics.recoveryRate.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Lends</span>
                <span className="font-bold">{statistics.activeLends}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Overdue Amount</span>
                <span className="font-bold text-destructive">{formatCurrency(statistics.overdueLends)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Borrowing Statistics</CardTitle>
              <CardDescription>Your borrowing patterns over time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Average Amount Borrowed</span>
                <span className="font-bold">{formatCurrency(statistics.avgBorrowed)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Repayment Rate</span>
                <span className="font-bold text-success">{statistics.repaymentRate.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Borrows</span>
                <span className="font-bold">{statistics.activeBorrows}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending Repayment</span>
                <span className="font-bold text-warning">{formatCurrency(statistics.pendingRepayment)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lending Transaction Modal */}
        <LendingTransactionModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />
      </div>
    </DashboardLayout>
  );
}