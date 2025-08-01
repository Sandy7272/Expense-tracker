import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { LendBorrowOverview } from "@/components/dashboard/LendBorrowOverview";
import { PersonLendingTable } from "@/components/dashboard/PersonLendingTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { Plus, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, AlertTriangle } from "lucide-react";

export default function Lending() {
  const recentTransactions = [
    {
      id: 1,
      type: "Usne Dile",
      person: "Rahul Sharma",
      amount: 15000,
      date: "2024-01-15",
      status: "pending",
      dueDate: "2024-02-15"
    },
    {
      id: 2,
      type: "Usne Ghetle",
      person: "Priya Patel",
      amount: 8000,
      date: "2024-01-10",
      status: "completed",
      dueDate: null
    },
    {
      id: 3,
      type: "Usne Prt Dile",
      person: "Amit Kumar",
      amount: 25000,
      date: "2024-01-08",
      status: "pending",
      dueDate: "2024-02-08"
    },
    {
      id: 4,
      type: "Usne Prt Ale",
      person: "Sneha Reddy",
      amount: 12000,
      date: "2024-01-05",
      status: "overdue",
      dueDate: "2024-01-20"
    }
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "Usne Dile":
        return <ArrowUpRight className="h-4 w-4 text-expense" />;
      case "Usne Ghetle":
        return <ArrowDownRight className="h-4 w-4 text-income" />;
      case "Usne Prt Dile":
        return <ArrowUpRight className="h-4 w-4 text-lending" />;
      case "Usne Prt Ale":
        return <ArrowDownRight className="h-4 w-4 text-success" />;
      default:
        return null;
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
            <p className="text-muted-foreground">Track money lent to and borrowed from friends & family</p>
          </div>
          <Button className="cyber-button">
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>

        {/* Overview Cards */}
        <LendBorrowOverview data={{
          usneDile: 45000,
          usnePrtAle: 12000,
          usneGhetle: 8000,
          usnePrtDile: 25000
        }} />

        {/* Person-wise Summary */}
        <PersonLendingTable data={[
          { name: "Rahul Sharma", amount: 15000, totalRemaining: 15000 },
          { name: "Priya Patel", amount: -8000, totalRemaining: -8000 },
          { name: "Amit Kumar", amount: 25000, totalRemaining: 25000 }
        ]} />

        {/* Recent Transactions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Recent Lending Transactions</CardTitle>
            <CardDescription>Latest lending and borrowing activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
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
                        <h3 className="font-semibold text-foreground">{transaction.person}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">{transaction.type}</span>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{transaction.date}</span>
                          {transaction.dueDate && (
                            <>
                              <span className="text-sm text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">Due: {transaction.dueDate}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          transaction.type.includes('Dile') ? 'text-expense' : 'text-income'
                        }`}>
                          {transaction.type.includes('Dile') ? '-' : '+'}{formatCurrency(transaction.amount)}
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
                <span className="font-bold">{formatCurrency(18500)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Recovery Rate</span>
                <span className="font-bold text-success">85%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Lends</span>
                <span className="font-bold">7</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Overdue Amount</span>
                <span className="font-bold text-destructive">{formatCurrency(12000)}</span>
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
                <span className="font-bold">{formatCurrency(22000)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Repayment Rate</span>
                <span className="font-bold text-success">92%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Borrows</span>
                <span className="font-bold">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending Repayment</span>
                <span className="font-bold text-warning">{formatCurrency(25000)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}