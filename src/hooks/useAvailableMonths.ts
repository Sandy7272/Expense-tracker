import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { format } from 'date-fns';

export interface MonthOption {
  value: string;
  label: string;
  transactionCount: number;
}

export function useAvailableMonths() {
  const { transactions } = useTransactions();

  const availableMonths = useMemo(() => {
    if (!transactions.length) return [];

    const monthMap = new Map<string, { label: string; count: number }>();

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthValue = format(date, 'yyyy-MM');
      const monthLabel = format(date, 'MMMM yyyy');
      
      if (monthMap.has(monthValue)) {
        monthMap.get(monthValue)!.count++;
      } else {
        monthMap.set(monthValue, { label: monthLabel, count: 1 });
      }
    });

    const months = Array.from(monthMap.entries())
      .map(([value, { label, count }]) => ({
        value,
        label,
        transactionCount: count
      }))
      .sort((a, b) => b.value.localeCompare(a.value)); // Sort descending (newest first)

    return months;
  }, [transactions]);

  const currentMonth = useMemo(() => {
    const now = new Date();
    const currentMonthValue = format(now, 'yyyy-MM');
    const currentMonthLabel = format(now, 'MMMM yyyy');
    
    // Check if current month has transactions
    const hasCurrentMonth = availableMonths.find(month => month.value === currentMonthValue);
    
    return hasCurrentMonth || { 
      value: currentMonthValue, 
      label: currentMonthLabel, 
      transactionCount: 0 
    };
  }, [availableMonths]);

  return {
    availableMonths,
    currentMonth,
    hasMonths: availableMonths.length > 0
  };
}