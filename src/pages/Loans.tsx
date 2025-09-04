import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { Plus, CreditCard, Calendar, TrendingUp, Clock } from "lucide-react";
import { useLoans } from "@/hooks/useLoans";
import { AddLoanModal } from "@/components/loans/AddLoanModal";
import { LoanCard } from "@/components/loans/LoanCard";

export default function Loans() {
  const { loans, isLoading } = useLoans();
  const [addOpen, setAddOpen] = useState(false);

  const totalPrincipal = loans.reduce((sum, loan) => sum + loan.principal_amount, 0);
  const totalMonthlyEMI = loans.reduce((sum, loan) => sum + loan.monthly_emi, 0);
  const activeLoans = loans.filter(loan => loan.status === 'active');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Loans</h1>
            <p className="text-muted-foreground">Track and manage your loans and EMI payments</p>
          </div>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Loan
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Loans</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loans.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeLoans.length} active
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Principal</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalPrincipal)}</div>
              <p className="text-xs text-muted-foreground">
                Across all loans
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Monthly EMI</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalMonthlyEMI)}</div>
              <p className="text-xs text-muted-foreground">
                Total monthly commitment
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Loans</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeLoans.length}</div>
              <p className="text-xs text-muted-foreground">
                Currently paying
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Loans List */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Your Loans</CardTitle>
            <CardDescription>
              Manage your loans and track EMI payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-32 bg-muted/20 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : loans.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No loans yet</h3>
                <p className="text-muted-foreground">Get started by adding your first loan</p>
                <Button onClick={() => setAddOpen(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Loan
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {loans.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <AddLoanModal
          open={addOpen}
          onOpenChange={setAddOpen}
        />
      </div>
    </DashboardLayout>
  );
}