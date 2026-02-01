/**
 * Centralized Financial Calculations Utility
 * All complex financial logic should go through this module
 */

import { format, differenceInMonths, addMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { TransactionType, InvestmentType, RiskLevel, INVESTMENT_RISK_MAP, BudgetAlertThreshold } from '@/types/enums';

// Type definitions
export interface Transaction {
  id: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  description?: string;
  loan_id?: string;
  status?: string;
}

export interface Loan {
  id: string;
  loan_name: string;
  principal_amount: number;
  interest_rate: number;
  tenure_months: number;
  monthly_emi: number;
  start_date: string;
  status: string;
}

export interface LendingTransaction {
  id: string;
  amount: number;
  type: string;
  person_name: string;
  date: string;
  status: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface EMIScheduleItem {
  month: number;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  outstandingBalance: number;
  paymentDate: Date;
}

export interface InvestmentSummary {
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

export interface BudgetUtilization {
  category: string;
  budgetLimit: number;
  spent: number;
  remaining: number;
  utilizationPercent: number;
  status: 'safe' | 'warning' | 'exceeded';
}

export interface MonthlyTotals {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  investments: number;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  totalEMI: number;
  netSavings: number;
  savingsRate: number;
}

// ============= EMI CALCULATIONS =============

/**
 * Calculate EMI amount using the standard EMI formula
 * EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
 */
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRate === 0) return principal / tenureMonths;
  
  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  
  return Math.round(emi * 100) / 100;
}

/**
 * Generate complete EMI schedule for a loan
 */
export function generateEMISchedule(loan: Loan): EMIScheduleItem[] {
  const schedule: EMIScheduleItem[] = [];
  const monthlyRate = loan.interest_rate / 12 / 100;
  let outstandingBalance = Number(loan.principal_amount);
  const emi = Number(loan.monthly_emi);
  const startDate = new Date(loan.start_date);

  for (let month = 1; month <= loan.tenure_months; month++) {
    const interestComponent = outstandingBalance * monthlyRate;
    const principalComponent = emi - interestComponent;
    outstandingBalance = Math.max(0, outstandingBalance - principalComponent);
    
    schedule.push({
      month,
      emiAmount: emi,
      principalComponent: Math.round(principalComponent * 100) / 100,
      interestComponent: Math.round(interestComponent * 100) / 100,
      outstandingBalance: Math.round(outstandingBalance * 100) / 100,
      paymentDate: addMonths(startDate, month - 1)
    });
  }

  return schedule;
}

/**
 * Calculate total interest payable over loan tenure
 */
export function calculateTotalInterest(principal: number, emi: number, tenureMonths: number): number {
  return (emi * tenureMonths) - principal;
}

/**
 * Get upcoming EMIs for the current month from multiple loans
 */
export function getUpcomingEMIs(
  loans: Loan[], 
  transactions: Transaction[], 
  dateRange: DateRange
): Array<{
  loanId: string;
  loanName: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
}> {
  const activeLoans = loans.filter(loan => loan.status === 'active');
  
  return activeLoans.map(loan => {
    const loanStartDate = new Date(loan.start_date);
    const loanStartDay = loanStartDate.getDate();
    
    let nextDueDate = new Date(
      dateRange.from.getFullYear(), 
      dateRange.from.getMonth(), 
      loanStartDay
    );
    
    if (nextDueDate < dateRange.from) {
      nextDueDate = addMonths(nextDueDate, 1);
    }
    
    const isPaid = transactions.some(
      t => t.loan_id === loan.id && 
           isWithinInterval(new Date(t.date), { start: dateRange.from, end: dateRange.to }) &&
           t.type === 'expense'
    );
    
    return {
      loanId: loan.id,
      loanName: loan.loan_name,
      amount: Number(loan.monthly_emi),
      dueDate: nextDueDate.toISOString(),
      isPaid
    };
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

// ============= INVESTMENT CALCULATIONS =============

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 * CAGR = (Ending Value / Beginning Value)^(1/years) - 1
 */
export function calculateCAGR(
  beginningValue: number, 
  endingValue: number, 
  years: number
): number {
  if (beginningValue <= 0 || years <= 0) return 0;
  const cagr = Math.pow(endingValue / beginningValue, 1 / years) - 1;
  return Math.round(cagr * 10000) / 100; // Return as percentage with 2 decimals
}

/**
 * Calculate absolute returns
 */
export function calculateAbsoluteReturns(invested: number, currentValue: number): number {
  if (invested === 0) return 0;
  return ((currentValue - invested) / invested) * 100;
}

/**
 * Calculate unrealized P/L
 */
export function calculateUnrealizedPL(invested: number, currentValue: number): number {
  return currentValue - invested;
}

/**
 * Aggregate investment data by category
 */
export function aggregateInvestmentsByCategory(
  transactions: Transaction[]
): InvestmentSummary {
  const summary: InvestmentSummary = {
    mutualFunds: 0,
    stocks: 0,
    insurancePolicy: 0,
    chitFunds: 0,
    gold: 0,
    crypto: 0,
    policy: 0,
    generalInvestment: 0,
    totalInvestment: 0
  };

  const categoryMap: Record<string, keyof InvestmentSummary> = {
    'Mutual Funds': 'mutualFunds',
    'Stocks': 'stocks',
    'Insurance': 'insurancePolicy',
    'Chit Funds': 'chitFunds',
    'Gold': 'gold',
    'Crypto': 'crypto',
    'Policy': 'policy',
    'Investment': 'generalInvestment'
  };

  transactions.forEach(t => {
    const key = categoryMap[t.category];
    if (key && key !== 'totalInvestment') {
      summary[key] += Number(t.amount);
    }
  });

  summary.totalInvestment = Object.entries(summary)
    .filter(([key]) => key !== 'totalInvestment')
    .reduce((sum, [, value]) => sum + value, 0);

  return summary;
}

/**
 * Get risk level for investment type
 */
export function getInvestmentRiskLevel(investmentType: string): RiskLevel {
  return INVESTMENT_RISK_MAP[investmentType] || RiskLevel.MODERATE;
}

// ============= BUDGET CALCULATIONS =============

/**
 * Calculate budget utilization for a category
 */
export function calculateBudgetUtilization(
  budgetLimit: number,
  spent: number
): BudgetUtilization {
  const remaining = Math.max(0, budgetLimit - spent);
  const utilizationPercent = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0;
  
  let status: 'safe' | 'warning' | 'exceeded' = 'safe';
  if (utilizationPercent >= BudgetAlertThreshold.CRITICAL) {
    status = 'exceeded';
  } else if (utilizationPercent >= BudgetAlertThreshold.WARNING) {
    status = 'warning';
  }

  return {
    category: '',
    budgetLimit,
    spent,
    remaining,
    utilizationPercent: Math.round(utilizationPercent * 100) / 100,
    status
  };
}

/**
 * Calculate budget utilization for all categories
 */
export function calculateAllBudgetUtilizations(
  budgets: Array<{ category: string; monthly_limit: number }>,
  transactions: Transaction[],
  dateRange: DateRange
): BudgetUtilization[] {
  const expensesByCategory = transactions
    .filter(t => 
      t.type === 'expense' && 
      isWithinInterval(new Date(t.date), { start: dateRange.from, end: dateRange.to })
    )
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  return budgets.map(budget => {
    const spent = expensesByCategory[budget.category] || 0;
    const utilization = calculateBudgetUtilization(budget.monthly_limit, spent);
    return { ...utilization, category: budget.category };
  });
}

// ============= TRANSACTION AGGREGATIONS =============

/**
 * Calculate financial summary from transactions
 */
export function calculateFinancialSummary(
  transactions: Transaction[],
  investmentTotal: number = 0
): FinancialSummary {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const emi = transactions
    .filter(t => t.type === 'expense' && t.category?.toLowerCase().includes('emi'))
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netSavings = income - expenses - investmentTotal;
  const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

  return {
    totalIncome: income,
    totalExpenses: expenses,
    totalInvestments: investmentTotal,
    totalEMI: emi,
    netSavings,
    savingsRate: Math.round(savingsRate * 100) / 100
  };
}

/**
 * Group transactions by category with totals
 */
export function groupTransactionsByCategory(
  transactions: Transaction[],
  type?: string
): Array<{ category: string; amount: number; count: number }> {
  const filtered = type ? transactions.filter(t => t.type === type) : transactions;
  
  const grouped = filtered.reduce((acc, t) => {
    if (!acc[t.category]) {
      acc[t.category] = { amount: 0, count: 0 };
    }
    acc[t.category].amount += Number(t.amount);
    acc[t.category].count += 1;
    return acc;
  }, {} as Record<string, { amount: number; count: number }>);

  return Object.entries(grouped)
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Calculate monthly totals for trend analysis
 */
export function calculateMonthlyTotals(transactions: Transaction[]): MonthlyTotals[] {
  const monthlyData = transactions.reduce((acc, t) => {
    const month = format(new Date(t.date), 'MMM yyyy');
    
    if (!acc[month]) {
      acc[month] = { month, income: 0, expenses: 0, savings: 0, investments: 0 };
    }
    
    const amount = Number(t.amount);
    
    switch (t.type) {
      case 'income':
        acc[month].income += amount;
        break;
      case 'expense':
        acc[month].expenses += amount;
        break;
      case 'investment':
        acc[month].investments += amount;
        break;
    }
    
    return acc;
  }, {} as Record<string, MonthlyTotals>);

  // Calculate savings for each month
  Object.values(monthlyData).forEach(data => {
    data.savings = data.income - data.expenses - data.investments;
  });

  return Object.values(monthlyData)
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
}

// ============= LENDING CALCULATIONS =============

/**
 * Aggregate lending data by person
 */
export function aggregateLendingByPerson(
  transactions: LendingTransaction[]
): Array<{
  name: string;
  totalLent: number;
  totalBorrowed: number;
  netBalance: number;
  transactions: number;
}> {
  const personMap = new Map<string, {
    lent: number;
    borrowed: number;
    repaidByThem: number;
    repaidByMe: number;
    count: number;
  }>();

  transactions.forEach(t => {
    if (!personMap.has(t.person_name)) {
      personMap.set(t.person_name, { lent: 0, borrowed: 0, repaidByThem: 0, repaidByMe: 0, count: 0 });
    }
    
    const person = personMap.get(t.person_name)!;
    person.count += 1;
    
    switch (t.type) {
      case 'lent':
        person.lent += Number(t.amount);
        break;
      case 'borrowed':
        person.borrowed += Number(t.amount);
        break;
      case 'repaid_by_them':
        person.repaidByThem += Number(t.amount);
        break;
      case 'repaid_by_me':
        person.repaidByMe += Number(t.amount);
        break;
    }
  });

  return Array.from(personMap.entries()).map(([name, data]) => ({
    name,
    totalLent: data.lent - data.repaidByThem,
    totalBorrowed: data.borrowed - data.repaidByMe,
    netBalance: (data.lent - data.repaidByThem) - (data.borrowed - data.repaidByMe),
    transactions: data.count
  })).filter(p => p.totalLent !== 0 || p.totalBorrowed !== 0);
}

/**
 * Calculate lending summary
 */
export function calculateLendingSummary(transactions: LendingTransaction[]): {
  totalLent: number;
  totalBorrowed: number;
  pendingRecovery: number;
  pendingRepayment: number;
} {
  const lent = transactions.filter(t => t.type === 'lent').reduce((sum, t) => sum + Number(t.amount), 0);
  const borrowed = transactions.filter(t => t.type === 'borrowed').reduce((sum, t) => sum + Number(t.amount), 0);
  const repaidByThem = transactions.filter(t => t.type === 'repaid_by_them').reduce((sum, t) => sum + Number(t.amount), 0);
  const repaidByMe = transactions.filter(t => t.type === 'repaid_by_me').reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    totalLent: lent,
    totalBorrowed: borrowed,
    pendingRecovery: lent - repaidByThem,
    pendingRepayment: borrowed - repaidByMe
  };
}

// ============= DATE RANGE UTILITIES =============

/**
 * Filter transactions by date range
 */
export function filterByDateRange<T extends { date: string }>(
  items: T[],
  dateRange: DateRange
): T[] {
  return items.filter(item => 
    isWithinInterval(new Date(item.date), { start: dateRange.from, end: dateRange.to })
  );
}

/**
 * Get date range for current month
 */
export function getCurrentMonthRange(): DateRange {
  const now = new Date();
  return {
    from: startOfMonth(now),
    to: endOfMonth(now)
  };
}

/**
 * Get date range for last N months
 */
export function getLastNMonthsRange(n: number): DateRange {
  const now = new Date();
  return {
    from: startOfMonth(addMonths(now, -(n - 1))),
    to: endOfMonth(now)
  };
}
