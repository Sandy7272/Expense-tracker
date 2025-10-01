import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { DateRange } from './useDateRangeFilter';

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
  bhishi: number;
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
  'Investment': 'stocks', // General investments mapped to stocks
  'Insurance': 'insurancePolicy',
  'Bhishi': 'bhishi'
} as const;

export function useInvestmentData(dateRange?: DateRange) {
  const { user } = useAuth();

  const {
    data: investmentTransactions = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['investment-transactions', user?.id, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      if (!user) return [];
      
      const investmentCategories = Object.keys(INVESTMENT_CATEGORIES);
      
      let query = supabase
        .from('transactions')
        .select('*')
        .in('category', investmentCategories)
        .eq('type', 'expense') // Only count money going out (investments)
        .eq('status', 'completed');

      // Apply date range filter if provided
      if (dateRange) {
        query = query
          .gte('date', dateRange.from.toISOString().split('T')[0])
          .lte('date', dateRange.to.toISOString().split('T')[0]);
      }

      const { data, error } = await query.order('date', { ascending: false });

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
      bhishi: 0
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
      bhishi: categoryTotals.bhishi,
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
    case 'Bhishi':
      return 'Very Low';
    default:
      return 'Moderate';
  }
}