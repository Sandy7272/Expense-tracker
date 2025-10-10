// Multi-currency formatting utilities

// Get currency symbol
export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
  };
  return symbols[currency] || currency;
};

// Get locale for currency
const getLocaleForCurrency = (currency: string): string => {
  const locales: Record<string, string> = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
  };
  return locales[currency] || 'en-US';
};

// Main currency formatting function
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);
  
  const formatter = new Intl.NumberFormat(getLocaleForCurrency(currency), {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  const formatted = formatter.format(absoluteAmount);
  return isNegative ? `-${formatted}` : formatted;
};

// Compact currency formatting with locale-specific abbreviations
export const formatCurrencyCompact = (amount: number, currency: string = 'INR'): string => {
  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);
  const symbol = getCurrencySymbol(currency);
  
  let formatted: string;
  
  if (currency === 'INR') {
    // Indian number system: Crores, Lakhs, Thousands
    if (absoluteAmount >= 10000000) {
      formatted = `${symbol} ${(absoluteAmount / 10000000).toFixed(1)}Cr`;
    } else if (absoluteAmount >= 100000) {
      formatted = `${symbol} ${(absoluteAmount / 100000).toFixed(1)}L`;
    } else if (absoluteAmount >= 1000) {
      formatted = `${symbol} ${(absoluteAmount / 1000).toFixed(1)}K`;
    } else {
      formatted = `${symbol} ${absoluteAmount.toLocaleString(getLocaleForCurrency(currency))}`;
    }
  } else {
    // International system: Millions, Thousands
    if (absoluteAmount >= 1000000) {
      formatted = `${symbol}${(absoluteAmount / 1000000).toFixed(1)}M`;
    } else if (absoluteAmount >= 1000) {
      formatted = `${symbol}${(absoluteAmount / 1000).toFixed(1)}K`;
    } else {
      formatted = `${symbol}${absoluteAmount.toLocaleString(getLocaleForCurrency(currency))}`;
    }
  }
  
  return isNegative ? `-${formatted}` : formatted;
};

// Backward compatibility aliases for INR
export const formatINR = (amount: number): string => formatCurrency(amount, 'INR');
export const formatINRCompact = (amount: number): string => formatCurrencyCompact(amount, 'INR');

// Parse amount from formatted string
export const parseAmount = (amountString: string): number => {
  const cleaned = amountString.replace(/[₹$€£¥,\s]/g, '');
  return parseFloat(cleaned) || 0;
};

// Legacy alias
export const parseINRAmount = parseAmount;