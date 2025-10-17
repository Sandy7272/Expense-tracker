import { useMemo } from 'react';
import { useLoans } from './useLoans';
import { useTransactions } from './useTransactions';
import { useAuth } from './useAuth';
import { useGlobalDateRange } from '@/contexts/DateRangeContext';
import { format } from 'date-fns';

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
  const { dateRange } = useGlobalDateRange();

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

    const currentMonthStart = dateRange.from;
    const currentMonthEnd = dateRange.to;

    const thisMonthEMITransactions = transactions.filter(t => {
      if (!t.loan_id) return false;
      const transactionDate = new Date(t.date);
      return (
        transactionDate >= currentMonthStart &&
        transactionDate <= currentMonthEnd &&
        t.type === 'expense'
      );
    });

    const totalPaidThisMonth = thisMonthEMITransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    const upcomingEMIs = activeLoans.map(loan => {
      const loanStartDate = new Date(loan.start_date);
      const loanStartDay = loanStartDate.getDate();

      let nextDueDate = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth(), loanStartDay);

      // If the calculated due date is before the start of the current range,
      // and it's not the same month, move it to the next month.
      // This handles cases where the loan's start day is late in the month
      // and the current date range starts earlier.
      if (nextDueDate < currentMonthStart && nextDueDate.getMonth() === currentMonthStart.getMonth()) {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }
      
      // Ensure the due date is within the selected date range, or the next one if it passed
      if (nextDueDate < currentMonthStart) {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }

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
  }, [loans, transactions, user, dateRange]);

  return {
    emiSummary,
    isLoading: loansLoading || transactionsLoading,
  };
}
