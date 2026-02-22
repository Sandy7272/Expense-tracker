import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useGlobalDateRange } from '@/contexts/DateRangeContext';
import { format } from 'date-fns';
import { fetchInvestmentTransactions } from '@/services/supabaseService';

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
  generalInvestment: number;
  totalInvestment: number;
}

export interface InvestmentSummary {
  category: string;
  totalAmount: number;
  transactionCount: number;
  lastInvestment?: string;
  transactions: InvestmentTransaction[];
}

const INVESTMENT_CATEGORIES = {
  'Mutual Funds': 'mutualFunds',
  'Stocks': 'stocks',
  'Insurance': 'insurancePolicy',
  'Chit Funds': 'chitFunds',
  'Gold': 'gold',
  'Crypto': 'crypto',
  'Policy': 'policy',
  'Investment': 'generalInvestment',
} as const;

export function useInvestmentData() {
  const { user } = useAuth();
  const { dateRange } = useGlobalDateRange();

  const { data: investmentTransactions = [], isLoading, error } = useQuery({
    queryKey: ['investment-transactions', user?.id, dateRange],
    queryFn: () =>
      fetchInvestmentTransactions(
        format(dateRange.from, 'yyyy-MM-dd'),
        format(dateRange.to, 'yyyy-MM-dd'),
        Object.keys(INVESTMENT_CATEGORIES)
      ),
    enabled: !!user,
  });

  const processedData = React.useMemo(() => {
    const categoryTotals: Record<string, number> = {
      mutualFunds: 0, stocks: 0, insurancePolicy: 0, chitFunds: 0,
      gold: 0, crypto: 0, policy: 0, generalInvestment: 0,
    };
    const categorySummaries: Record<string, InvestmentSummary> = {};

    investmentTransactions.forEach((tx) => {
      const mapped = INVESTMENT_CATEGORIES[tx.category as keyof typeof INVESTMENT_CATEGORIES];
      if (mapped) {
        categoryTotals[mapped] += Number(tx.amount);
        if (!categorySummaries[tx.category]) {
          categorySummaries[tx.category] = { category: tx.category, totalAmount: 0, transactionCount: 0, transactions: [] };
        }
        const s = categorySummaries[tx.category];
        s.totalAmount += Number(tx.amount);
        s.transactionCount += 1;
        s.transactions.push(tx as InvestmentTransaction);
        if (!s.lastInvestment || tx.date > s.lastInvestment) s.lastInvestment = tx.date;
      }
    });

    const totalInvestment = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    const investmentData: InvestmentData = { ...categoryTotals, totalInvestment } as InvestmentData;

    return { investmentData, categorySummaries: Object.values(categorySummaries), totalTransactions: investmentTransactions.length };
  }, [investmentTransactions]);

  const investmentHoldings = React.useMemo(() =>
    processedData.categorySummaries.map(s => ({
      id: s.category,
      name: `${s.category} Portfolio`,
      type: s.category,
      amount: s.totalAmount,
      currentValue: s.totalAmount,
      returns: 0,
      risk: getDefaultRiskLevel(s.category),
      transactionCount: s.transactionCount,
      lastInvestment: s.lastInvestment,
    })),
  [processedData.categorySummaries]);

  return {
    investmentData: processedData.investmentData,
    investmentHoldings,
    categorySummaries: processedData.categorySummaries,
    totalTransactions: processedData.totalTransactions,
    isLoading,
    error,
  };
}

function getDefaultRiskLevel(category: string): string {
  const map: Record<string, string> = {
    'Mutual Funds': 'Moderate', 'Investment': 'High', 'Insurance': 'Low',
    'Chit Funds': 'Very Low', 'Gold': 'Low', 'Crypto': 'High', 'Policy': 'Low',
  };
  return map[category] || 'Moderate';
}
