/**
 * Zod validation schemas for all service layer inputs.
 * Every mutation in supabaseService.ts validates through these schemas.
 */

import { z } from 'zod';

// ============= SHARED =============

const transactionTypeEnum = z.enum(['expense', 'income', 'lend', 'borrow', 'investment', 'emi']);
const transactionStatusEnum = z.enum(['pending', 'completed', 'received']);
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format');
const uuid = z.string().uuid('Invalid ID format');
const positiveNumber = z.number().positive('Amount must be positive');
const safeString = (max: number) =>
  z.string().trim().max(max, `Must be less than ${max} characters`);

// ============= TRANSACTIONS =============

export const createTransactionSchema = z.object({
  type: transactionTypeEnum,
  amount: positiveNumber,
  category: safeString(100).min(1, 'Category is required'),
  description: safeString(500).optional(),
  date: dateString.optional(),
  status: transactionStatusEnum.optional(),
  loan_id: uuid.optional().nullable(),
  person: safeString(200).optional().nullable(),
  source: safeString(50).optional().nullable(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

// ============= LOANS =============

export const createLoanSchema = z.object({
  loan_name: safeString(200).min(1, 'Loan name is required'),
  lender_name: safeString(200).optional().nullable(),
  loan_type: safeString(50).optional().nullable(),
  principal_amount: positiveNumber,
  interest_rate: z.number().min(0, 'Interest rate cannot be negative').max(100, 'Interest rate too high'),
  tenure_months: z.number().int().positive('Tenure must be positive'),
  monthly_emi: positiveNumber,
  start_date: dateString,
  status: safeString(20).optional(),
});

// ============= LOAN PAYMENTS =============

export const createLoanPaymentSchema = z.object({
  loan_id: uuid,
  payment_date: dateString,
  amount_paid: positiveNumber,
  payment_method: safeString(50).optional().nullable(),
  notes: safeString(500).optional().nullable(),
});

// ============= LENDING =============

export const createLendingSchema = z.object({
  type: z.enum(['lend', 'borrow']),
  amount: positiveNumber,
  person_name: safeString(200).min(1, 'Person name is required'),
  description: safeString(500).optional().nullable(),
  date: dateString.optional(),
  due_date: dateString.optional().nullable(),
  status: safeString(20).optional(),
  related_transaction_id: uuid.optional().nullable(),
});

// ============= BUDGETS =============

export const createBudgetSchema = z.object({
  category: safeString(100).min(1, 'Category is required'),
  monthly_limit: positiveNumber,
});

// ============= RECURRING PAYMENTS =============

export const createRecurringPaymentSchema = z.object({
  title: safeString(200).min(1, 'Title is required'),
  amount: positiveNumber,
  category: safeString(100).min(1, 'Category is required'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  next_due_date: dateString,
  is_active: z.boolean().optional(),
  description: safeString(500).optional().nullable(),
});

// ============= SETTINGS =============

export const updateSettingsSchema = z.object({
  currency: safeString(10).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: safeString(10).optional(),
  notifications_email: z.boolean().optional(),
  notifications_budget_alerts: z.boolean().optional(),
  notifications_loan_reminders: z.boolean().optional(),
  auto_sync: z.boolean().optional(),
  sheet_url: z.string().url('Invalid URL').optional().or(z.literal('')).nullable(),
  google_auth_status: safeString(30).optional(),
});

// ============= HELPER =============

/**
 * Validate input against a Zod schema. Throws APIError with details on failure.
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new ValidationError(messages);
  }
  return result.data;
}

export class ValidationError extends Error {
  public code = 'VALIDATION_ERROR';
  public statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
