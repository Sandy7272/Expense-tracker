import { useState, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { useTransactions } from './useTransactions';
import { useQueryClient } from '@tanstack/react-query';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DateRangePreset {
  label: string;
  range: DateRange;
}

let globalDateRange: DateRange = {
  from: startOfMonth(new Date()),
  to: endOfMonth(new Date())
};

export function useDateRangeFilter() {
  const { transactions } = useTransactions();
  const [dateRange, setDateRangeState] = useState<DateRange>(globalDateRange);
  const queryClient = useQueryClient();

  const setDateRange = useCallback((range: DateRange) => {
    globalDateRange = range;
    setDateRangeState(range);
    // Force all queries to refetch when date range changes
    queryClient.invalidateQueries({ queryKey: ['investment-data'] });
    queryClient.invalidateQueries({ queryKey: ['lending-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  }, [queryClient]);

  const presets: DateRangePreset[] = useMemo(() => {
    const now = new Date();
    return [
      {
        label: 'This Month',
        range: {
          from: startOfMonth(now),
          to: endOfMonth(now)
        }
      },
      {
        label: 'Last Month',
        range: {
          from: startOfMonth(subMonths(now, 1)),
          to: endOfMonth(subMonths(now, 1))
        }
      },
      {
        label: 'Last 3 Months',
        range: {
          from: startOfMonth(subMonths(now, 2)),
          to: endOfMonth(now)
        }
      },
      {
        label: 'Last 6 Months',
        range: {
          from: startOfMonth(subMonths(now, 5)),
          to: endOfMonth(now)
        }
      },
      {
        label: 'This Year',
        range: {
          from: startOfYear(now),
          to: endOfYear(now)
        }
      }
    ];
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= dateRange.from && transactionDate <= dateRange.to;
    });
  }, [transactions, dateRange]);

  const formatDateRange = (range: DateRange) => {
    const isSameMonth = format(range.from, 'yyyy-MM') === format(range.to, 'yyyy-MM');
    
    if (isSameMonth) {
      return format(range.from, 'MMMM yyyy');
    }
    
    return `${format(range.from, 'MMM d, yyyy')} - ${format(range.to, 'MMM d, yyyy')}`;
  };

  return {
    dateRange,
    setDateRange,
    presets,
    filteredTransactions,
    formatDateRange
  };
}