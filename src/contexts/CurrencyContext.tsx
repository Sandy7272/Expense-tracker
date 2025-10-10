import { createContext, useContext, ReactNode } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { formatCurrency, formatCurrencyCompact, getCurrencySymbol } from '@/lib/currency';

interface CurrencyContextType {
  currency: string;
  isLoading: boolean;
  formatAmount: (amount: number) => string;
  formatAmountCompact: (amount: number) => string;
  getCurrencySymbol: () => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const { settings, isLoading } = useSettings();
  const currency = settings?.currency || 'INR';

  const contextValue: CurrencyContextType = {
    currency,
    isLoading,
    formatAmount: (amount: number) => formatCurrency(amount, currency),
    formatAmountCompact: (amount: number) => formatCurrencyCompact(amount, currency),
    getCurrencySymbol: () => getCurrencySymbol(currency),
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}
