// Indian Rupee currency formatting utilities

export const formatINR = (amount: number): string => {
  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);
  
  // Format with Indian number system (lakhs, crores)
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  let formatted = formatter.format(absoluteAmount);
  
  // Replace ₹ with custom formatting
  formatted = formatted.replace('₹', '₹ ');
  
  return isNegative ? `-${formatted}` : formatted;
};

export const formatINRCompact = (amount: number): string => {
  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);
  
  let formatted: string;
  
  if (absoluteAmount >= 10000000) { // 1 crore
    formatted = `₹ ${(absoluteAmount / 10000000).toFixed(1)}Cr`;
  } else if (absoluteAmount >= 100000) { // 1 lakh
    formatted = `₹ ${(absoluteAmount / 100000).toFixed(1)}L`;
  } else if (absoluteAmount >= 1000) { // 1 thousand
    formatted = `₹ ${(absoluteAmount / 1000).toFixed(1)}K`;
  } else {
    formatted = `₹ ${absoluteAmount.toLocaleString('en-IN')}`;
  }
  
  return isNegative ? `-${formatted}` : formatted;
};

export const parseINRAmount = (amountString: string): number => {
  // Remove currency symbols and parse
  const cleaned = amountString.replace(/[₹,\s]/g, '');
  return parseFloat(cleaned) || 0;
};