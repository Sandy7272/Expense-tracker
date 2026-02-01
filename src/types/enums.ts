/**
 * Shared enums for consistent type usage across frontend, backend, and database
 * These enums ensure type safety and consistency throughout the application
 */

// Transaction types matching database enum 'transaction_type'
export enum TransactionType {
  EXPENSE = 'expense',
  INCOME = 'income',
  LEND = 'lend',
  BORROW = 'borrow',
  INVESTMENT = 'investment',
  EMI = 'emi'
}

// Transaction status matching database enum 'transaction_status'
export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  RECEIVED = 'received'
}

// Lending transaction types
export enum LendingType {
  LENT = 'lent',
  BORROWED = 'borrowed',
  REPAID_BY_THEM = 'repaid_by_them',
  REPAID_BY_ME = 'repaid_by_me'
}

// Lending transaction status
export enum LendingStatus {
  ACTIVE = 'active',
  SETTLED = 'settled',
  PARTIAL = 'partial'
}

// Investment types
export enum InvestmentType {
  MUTUAL_FUNDS = 'Mutual Funds',
  STOCKS = 'Stocks',
  INSURANCE = 'Insurance',
  CHIT_FUNDS = 'Chit Funds',
  GOLD = 'Gold',
  CRYPTO = 'Crypto',
  POLICY = 'Policy',
  GENERAL = 'Investment'
}

// Loan types
export enum LoanType {
  PERSONAL = 'personal',
  HOME = 'home',
  CAR = 'car',
  EDUCATION = 'education',
  BUSINESS = 'business',
  GOLD = 'gold',
  OTHER = 'other'
}

// Loan status
export enum LoanStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  DEFAULTED = 'defaulted'
}

// Recurring frequency for payments
export enum RecurringFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

// Recurring payment status
export enum RecurringStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled'
}

// Budget alert thresholds
export enum BudgetAlertThreshold {
  WARNING = 80,  // 80% utilization
  CRITICAL = 100 // 100% utilization
}

// Sync status for Google Sheets
export enum SyncStatus {
  NEVER_SYNCED = 'never_synced',
  SYNCING = 'syncing',
  SYNCED = 'synced',
  ERROR = 'error'
}

// Auth status for Google
export enum GoogleAuthStatus {
  NOT_CONNECTED = 'not_connected',
  CONNECTED = 'connected',
  EXPIRED = 'expired',
  ERROR = 'error'
}

// Risk levels for investments
export enum RiskLevel {
  VERY_LOW = 'Very Low',
  LOW = 'Low',
  MODERATE = 'Moderate',
  HIGH = 'High',
  VERY_HIGH = 'Very High'
}

// Category colors for visualization
export const CATEGORY_COLORS = [
  'hsl(150, 40%, 75%)', // Mint green
  'hsl(210, 50%, 88%)', // Soft blue
  'hsl(330, 40%, 85%)', // Gentle pink
  'hsl(45, 85%, 75%)',  // Warm yellow
  'hsl(280, 40%, 80%)', // Lavender
  'hsl(15, 60%, 80%)',  // Peach
  'hsl(190, 50%, 80%)', // Sky blue
  'hsl(120, 30%, 75%)', // Sage green
] as const;

// Investment category mappings
export const INVESTMENT_CATEGORY_MAP: Record<string, string> = {
  'Mutual Funds': 'mutualFunds',
  'Stocks': 'stocks',
  'Insurance': 'insurancePolicy',
  'Chit Funds': 'chitFunds',
  'Gold': 'gold',
  'Crypto': 'crypto',
  'Policy': 'policy',
  'Investment': 'generalInvestment',
} as const;

// Default risk levels for investment types
export const INVESTMENT_RISK_MAP: Record<string, RiskLevel> = {
  'Mutual Funds': RiskLevel.MODERATE,
  'Stocks': RiskLevel.HIGH,
  'Insurance': RiskLevel.LOW,
  'Chit Funds': RiskLevel.VERY_LOW,
  'Gold': RiskLevel.LOW,
  'Crypto': RiskLevel.VERY_HIGH,
  'Policy': RiskLevel.LOW,
  'Investment': RiskLevel.MODERATE,
} as const;

// Currency symbols
export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
} as const;

// Supported currencies
export enum Currency {
  INR = 'INR',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY'
}
