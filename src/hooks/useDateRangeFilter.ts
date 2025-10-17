import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { useGlobalDateRange } from '@/contexts/DateRangeContext';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface DateRangePreset {
  label: string;
  range: DateRange;
}

export function useDateRangeFilter() {
  const { dateRange, setDateRange } = useGlobalDateRange();

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
    formatDateRange
  };
}