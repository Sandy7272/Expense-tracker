import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import { useAllEMIData } from "@/hooks/useAllEMIData";
import { format } from "date-fns";
import { useState } from "react";
import { AddExpenseModal } from "./AddExpenseModal";

export function EMITrackingCard() {
  const currencyContext = useCurrency();
  const { formatAmount } = currencyContext;
  const { emiSummary, isLoading } = useAllEMIData();
  const [showAddModal, setShowAddModal] = useState(false);

  if (isLoading) {
    return (
      <Card className="glass-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (emiSummary.activeLoansCount === 0) {
    return null; // Don't show card if no active loans
  }

  const completionPercentage = emiSummary.totalMonthlyEMI > 0 
    ? Math.round((emiSummary.totalPaidThisMonth / emiSummary.totalMonthlyEMI) * 100) 
    : 0;

  const overdueEMIs = emiSummary.upcomingEMIs.filter(emi => {
    const dueDate = new Date(emi.dueDate);
    const today = new Date();
    return !emi.isPaid && dueDate < today;
  });

  return (
    <>
      <Card className="glass-card glow-accent overflow-hidden">
        {/* Cyber Grid Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/30 via-transparent to-accent/30" />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '20px 20px'
          }} />
        </div>

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl glass-card bg-gradient-to-br from-warning/20 to-accent/20 border border-warning/30">
                <CreditCard className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-foreground">
                  EMI Tracker
                </h3>
                <p className="text-sm text-muted-foreground">
                  {emiSummary.activeLoansCount} active {emiSummary.activeLoansCount === 1 ? 'loan' : 'loans'}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddModal(true)}
              size="sm"
              className="glass-card bg-gradient-to-r from-warning/20 to-accent/20 hover:from-warning/30 hover:to-accent/30 border-warning/40"
            >
              Pay EMI
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="glass-card p-4 rounded-lg border border-white/10">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Monthly EMI</p>
              <p className="text-lg font-bold font-heading text-foreground">
                {formatAmount(emiSummary.totalMonthlyEMI)}
              </p>
            </div>
            <div className="glass-card p-4 rounded-lg border border-success/30 bg-success/5">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Paid</p>
              <p className="text-lg font-bold font-heading text-success">
                {formatAmount(emiSummary.totalPaidThisMonth)}
              </p>
            </div>
            <div className="glass-card p-4 rounded-lg border border-warning/30 bg-warning/5">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Pending</p>
              <p className="text-lg font-bold font-heading text-warning">
                {formatAmount(emiSummary.totalPendingThisMonth)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">This Month's Progress</span>
              <span className="text-sm font-semibold text-foreground">{completionPercentage}%</span>
            </div>
            <Progress 
              value={completionPercentage} 
              className="h-3 glass-card"
            />
          </div>

          {/* Upcoming EMIs List */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Upcoming EMIs
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {emiSummary.upcomingEMIs.map((emi) => {
                const dueDate = new Date(emi.dueDate);
                const today = new Date();
                const isOverdue = !emi.isPaid && dueDate < today;
                const isDueSoon = !emi.isPaid && dueDate.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000;

                return (
                  <div
                    key={emi.loanId}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg glass-card border transition-all duration-200",
                      emi.isPaid && "border-success/30 bg-success/5",
                      isOverdue && "border-destructive/30 bg-destructive/5 animate-pulse",
                      isDueSoon && !emi.isPaid && !isOverdue && "border-warning/30 bg-warning/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {emi.isPaid ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : isOverdue ? (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <Clock className="h-5 w-5 text-warning" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{emi.loanName}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {format(dueDate, 'MMM dd, yyyy')}
                          {isOverdue && <span className="text-destructive ml-2 font-semibold">OVERDUE</span>}
                          {isDueSoon && !isOverdue && <span className="text-warning ml-2 font-semibold">DUE SOON</span>}
                        </p>
                      </div>
                    </div>
                    <p className={cn(
                      "text-sm font-bold font-heading",
                      emi.isPaid ? "text-success" : "text-foreground"
                    )}>
                      {formatAmount(emi.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overdue Alert */}
          {overdueEMIs.length > 0 && (
            <div className="mt-4 p-3 rounded-lg glass-card border border-destructive/50 bg-destructive/10">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm font-semibold text-destructive">
                  {overdueEMIs.length} overdue EMI{overdueEMIs.length > 1 ? 's' : ''} - Pay now to avoid penalties!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Neon Border Effect */}
        <div className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-warning/20 to-transparent animate-pulse" />
        </div>
      </Card>

      <AddExpenseModal open={showAddModal} onOpenChange={setShowAddModal} />
    </>
  );
}
