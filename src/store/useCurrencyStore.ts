import { create } from 'zustand';
import { formatCurrency, formatCurrencyCompact, getCurrencySymbol } from '@/lib/currency';

interface CurrencyState {
  currency: string;
  setCurrency: (c: string) => void;
  formatAmount: (amount: number) => string;
  formatAmountCompact: (amount: number) => string;
  getSymbol: () => string;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  currency: 'INR',
  setCurrency: (c) => set({ currency: c }),
  formatAmount: (amount) => formatCurrency(amount, get().currency),
  formatAmountCompact: (amount) => formatCurrencyCompact(amount, get().currency),
  getSymbol: () => getCurrencySymbol(get().currency),
}));
