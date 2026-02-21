import { createContext, useContext, useState, useMemo, ReactNode, useCallback, useEffect } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useDateRangeStore } from '@/store/useDateRangeStore';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeContextType {
  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { dateRange, setDateRange: setStoreRange } = useDateRangeStore();

  const setDateRange = useCallback((range: DateRange) => {
    setStoreRange(range);
    queryClient.invalidateQueries({ queryKey: ['investment-data'] });
    queryClient.invalidateQueries({ queryKey: ['lending-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['loans'] });
    queryClient.invalidateQueries({ queryKey: ['all-emi-data'] });
  }, [queryClient, setStoreRange]);

  const value = useMemo(() => ({ dateRange, setDateRange }), [dateRange, setDateRange]);

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useGlobalDateRange() {
  const context = useContext(DateRangeContext);
  if (context === undefined) {
    throw new Error('useGlobalDateRange must be used within a DateRangeProvider');
  }
  return context;
}
