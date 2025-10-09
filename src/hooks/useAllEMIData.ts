import { useMemo } from 'react';
import { useLoans } from './useLoans';
import { useTransactions } from './useTransactions';
import { useAuth } from './useAuth';

export interface EMISummary {
  totalMonthlyEMI: number;
  totalPaidThisMonth: number;
  totalPendingThisMonth: number;
  activeLoansCount: number;
  upcomingEMIs: Array<{
    loanId: string;
    loanName: string;
    amount: number;
    dueDate: string;
    isPaid: boolean;
  }>;
}

export function useAllEMIData() {
  const { user } = useAuth();
  const { loans, isLoading: loansLoading } = useLoans();
  const { transactions, isLoading: transactionsLoading } = useTransactions();

  const emiSummary: EMISummary = useMemo(() => {
    if (!user || !loans.length) {
      return {
        totalMonthlyEMI: 0,
        totalPaidThisMonth: 0,
        totalPendingThisMonth: 0,
        activeLoansCount: 0,
        upcomingEMIs: [],
      };
    }

    const activeLoans = loans.filter(loan => loan.status === 'active');
    const totalMonthlyEMI = activeLoans.reduce((sum, loan) => sum + Number(loan.monthly_emi), 0);

    // Get current month's EMI transactions
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthEMITransactions = transactions.filter(t => {
      if (!t.loan_id) return false;
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear &&
        t.type === 'expense'
      );
    });

    const totalPaidThisMonth = thisMonthEMITransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    // Calculate upcoming EMIs for each active loan
    const upcomingEMIs = activeLoans.map(loan => {
      const startDate = new Date(loan.start_date);
      
      // Calculate next EMI due date (same day each month as start date)
      const nextDueDate = new Date(currentYear, currentMonth, startDate.getDate());
      
      // If the due date has passed this month, set it for next month
      if (nextDueDate < now) {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

      // Check if this month's EMI is already paid
      const isPaid = thisMonthEMITransactions.some(t => t.loan_id === loan.id);

      return {
        loanId: loan.id,
        loanName: loan.loan_name,
        amount: Number(loan.monthly_emi),
        dueDate: nextDueDate.toISOString(),
        isPaid,
      };
    });

    const totalPendingThisMonth = upcomingEMIs
      .filter(emi => !emi.isPaid)
      .reduce((sum, emi) => sum + emi.amount, 0);

    return {
      totalMonthlyEMI,
      totalPaidThisMonth,
      totalPendingThisMonth,
      activeLoansCount: activeLoans.length,
      upcomingEMIs: upcomingEMIs.sort((a, b) => 
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      ),
    };
  }, [loans, transactions, user]);

  return {
    emiSummary,
    isLoading: loansLoading || transactionsLoading,
  };
}
