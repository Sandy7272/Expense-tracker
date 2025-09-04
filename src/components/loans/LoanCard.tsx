import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/currency";
import { Edit, Trash2, Calendar, TrendingUp, DollarSign, Clock } from "lucide-react";
import { useLoans, type Loan } from "@/hooks/useLoans";
import { useLoanPayments } from "@/hooks/useLoanPayments";
import { AddLoanModal } from "@/components/loans/AddLoanModal";
import { LoanDetailsModal } from "@/components/loans/LoanDetailsModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LoanCardProps {
  loan: Loan;
}

export function LoanCard({ loan }: LoanCardProps) {
  const { deleteLoan } = useLoans();
  const { loanStats } = useLoanPayments(loan.id);
  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const startDate = new Date(loan.start_date);
  const currentDate = new Date();
  const monthsPassed = Math.max(0, (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                    (currentDate.getMonth() - startDate.getMonth()));
  
  const progressPercentage = Math.min((monthsPassed / loan.tenure_months) * 100, 100);
  const remainingMonths = Math.max(0, loan.tenure_months - monthsPassed);
  const totalInterest = (loan.monthly_emi * loan.tenure_months) - loan.principal_amount;
  const remainingAmount = loan.principal_amount - loanStats.totalPaid;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-success text-success-foreground';
      case 'completed': return 'bg-primary text-primary-foreground';
      case 'overdue': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <>
      <Card className="glass-card hover:glow-primary transition-all duration-300 group">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{loan.loan_name}</h3>
              <p className="text-sm text-muted-foreground">{loan.lender_name || 'Personal Loan'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(loan.status)}>
                {loan.status}
              </Badge>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0"
                  onClick={() => setDetailsOpen(true)}
                >
                  <Calendar className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0"
                  onClick={() => setEditOpen(true)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">{formatCurrency(loan.principal_amount)}</div>
              <div className="text-xs text-muted-foreground">Principal</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">{formatCurrency(loan.monthly_emi)}</div>
              <div className="text-xs text-muted-foreground">Monthly EMI</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">{loan.interest_rate}%</div>
              <div className="text-xs text-muted-foreground">Interest Rate</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">{remainingMonths}</div>
              <div className="text-xs text-muted-foreground">Months Left</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progressPercentage)}% completed</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Paid: {formatCurrency(loanStats.totalPaid)}</span>
              <span>Remaining: {formatCurrency(Math.max(0, remainingAmount))}</span>
            </div>
          </div>

          {loanStats.lastPaymentDate && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs text-muted-foreground">
                Last payment: {new Date(loanStats.lastPaymentDate).toLocaleDateString()} 
                • {loanStats.paymentCount} payment{loanStats.paymentCount !== 1 ? 's' : ''} made
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddLoanModal
        open={editOpen}
        onOpenChange={setEditOpen}
        loan={loan}
      />

      <LoanDetailsModal
        loan={loan}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete loan?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the loan "{loan.loan_name}" 
              and all associated payment records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteLoan.mutate(loan.id, {
                  onSuccess: () => setDeleteOpen(false)
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}