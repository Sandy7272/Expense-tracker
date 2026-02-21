import { create } from 'zustand';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeState {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}

export const useDateRangeStore = create<DateRangeState>((set) => ({
  dateRange: {
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  },
  setDateRange: (range) => set({ dateRange: range }),
}));
