import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useGlobalDateRange } from '@/contexts/DateRangeContext';
import { format } from 'date-fns';

export interface InvestmentTransaction {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  type: 'income' | 'expense';
}

export interface InvestmentData {
  mutualFunds: number;
  stocks: number;
  insurancePolicy: number;
  chitFunds: number;
  gold: number;
  crypto: number;
  policy: number;
  generalInvestment: number; // Added for the generic 'Investment' category
  totalInvestment: number;
}

export interface InvestmentSummary {
  category: string;
  totalAmount: number;
  transactionCount: number;
  lastInvestment?: string;
  transactions: InvestmentTransaction[];
}

// Investment category mappings
const INVESTMENT_CATEGORIES = {
  'Mutual Funds': 'mutualFunds',
  'Stocks': 'stocks',
  'Insurance': 'insurancePolicy',
  'Chit Funds': 'chitFunds',
  'Gold': 'gold',
  'Crypto': 'crypto',
  'Policy': 'policy',
  'Investment': 'generalInvestment', // Mapped to the new generalInvestment field
} as const;

export function useInvestmentData() {
  const { user } = useAuth();
  const { dateRange } = useGlobalDateRange();

  const {
    data: investmentTransactions = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['investment-transactions', user?.id, dateRange],
    queryFn: async () => {
      if (!user) return [];
      
      const investmentCategories = Object.keys(INVESTMENT_CATEGORIES);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .in('category', investmentCategories)
        .in('type', ['expense', 'investment']) // Count both 'expense' and 'investment' types for investment categories
        .eq('status', 'completed')
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (error) throw error;
      return data as InvestmentTransaction[];
    },
    enabled: !!user
  });

  // Process investment data
  const processedData = React.useMemo(() => {
    const categoryTotals: Record<string, number> = {
      mutualFunds: 0,
      stocks: 0,
      insurancePolicy: 0,
      chitFunds: 0,
      gold: 0,
      crypto: 0,
      policy: 0,
      generalInvestment: 0, // Initialize new field
    };

    const categorySummaries: Record<string, InvestmentSummary> = {};

    investmentTransactions.forEach((transaction) => {
      const mappedCategory = INVESTMENT_CATEGORIES[transaction.category as keyof typeof INVESTMENT_CATEGORIES];
      
      if (mappedCategory) {
        categoryTotals[mappedCategory] += Number(transaction.amount);
        
        if (!categorySummaries[transaction.category]) {
          categorySummaries[transaction.category] = {
            category: transaction.category,
            totalAmount: 0,
            transactionCount: 0,
            transactions: []
          };
        }
        
        categorySummaries[transaction.category].totalAmount += Number(transaction.amount);
        categorySummaries[transaction.category].transactionCount += 1;
        categorySummaries[transaction.category].transactions.push(transaction);
        
        if (!categorySummaries[transaction.category].lastInvestment || 
            transaction.date > categorySummaries[transaction.category].lastInvestment!) {
          categorySummaries[transaction.category].lastInvestment = transaction.date;
        }
      }
    });

    const totalInvestment = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    const investmentData: InvestmentData = {
      mutualFunds: categoryTotals.mutualFunds,
      stocks: categoryTotals.stocks,
      insurancePolicy: categoryTotals.insurancePolicy,
      chitFunds: categoryTotals.chitFunds,
      gold: categoryTotals.gold,
      crypto: categoryTotals.crypto,
      policy: categoryTotals.policy,
      generalInvestment: categoryTotals.generalInvestment, // Include new field
      totalInvestment
    };

    return {
      investmentData,
      categorySummaries: Object.values(categorySummaries),
      totalTransactions: investmentTransactions.length
    };
  }, [investmentTransactions]);

  // Calculate investment holdings for display
  const investmentHoldings = React.useMemo(() => {
    return processedData.categorySummaries.map((summary) => ({
      id: summary.category,
      name: `${summary.category} Portfolio`,
      type: summary.category,
      amount: summary.totalAmount,
      currentValue: summary.totalAmount, // Since we don't track current values, show invested amount
      returns: 0, // No return data available from transactions
      risk: getDefaultRiskLevel(summary.category),
      transactionCount: summary.transactionCount,
      lastInvestment: summary.lastInvestment
    }));
  }, [processedData.categorySummaries]);

  return {
    investmentData: processedData.investmentData,
    investmentHoldings,
    categorySummaries: processedData.categorySummaries,
    totalTransactions: processedData.totalTransactions,
    isLoading,
    error
  };
}

function getDefaultRiskLevel(category: string): string {
  switch (category) {
    case 'Mutual Funds':
      return 'Moderate';
    case 'Investment':
      return 'High';
    case 'Insurance':
      return 'Low';
    case 'Chit Funds':
      return 'Very Low';
    case 'Gold':
      return 'Low';
    case 'Crypto':
      return 'High';
    case 'Policy':
      return 'Low';
    default:
      return 'Moderate';
  }
}