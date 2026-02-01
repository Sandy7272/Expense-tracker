/**
 * Supabase Database Service Layer
 * Centralized database operations with proper error handling and typing
 */

import { supabase } from '@/integrations/supabase/client';
import { APIError, AuthError } from './api';
import { TransactionType, TransactionStatus, LoanStatus, RecurringStatus } from '@/types/enums';

// Types
export interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  status?: string;
  loan_id?: string;
  person?: string;
  source?: string;
  created_at: string;
  updated_at: string;
}

// Use proper types matching database enums
type TransactionTypeEnum = 'expense' | 'income' | 'lend' | 'borrow' | 'investment' | 'emi';
type TransactionStatusEnum = 'pending' | 'completed' | 'received';

export interface CreateTransactionInput {
  type: TransactionTypeEnum;
  amount: number;
  category: string;
  description?: string;
  date?: string;
  status?: TransactionStatusEnum;
  loan_id?: string;
  person?: string;
  source?: string;
}

export interface UpdateTransactionInput {
  type?: TransactionTypeEnum;
  amount?: number;
  category?: string;
  description?: string;
  date?: string;
  status?: TransactionStatusEnum;
  loan_id?: string;
  person?: string;
  source?: string;
}

export interface Loan {
  id: string;
  user_id: string;
  loan_name: string;
  lender_name?: string;
  loan_type?: string;
  principal_amount: number;
  interest_rate: number;
  tenure_months: number;
  monthly_emi: number;
  start_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLoanInput {
  loan_name: string;
  lender_name?: string;
  loan_type?: string;
  principal_amount: number;
  interest_rate: number;
  tenure_months: number;
  monthly_emi: number;
  start_date: string;
  status?: string;
}

export interface LendingTransaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  person_name: string;
  description?: string;
  date: string;
  due_date?: string;
  status: string;
  related_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLendingInput {
  type: string;
  amount: number;
  person_name: string;
  description?: string;
  date?: string;
  due_date?: string;
  status?: string;
  related_transaction_id?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBudgetInput {
  category: string;
  monthly_limit: number;
}

export interface RecurringPayment {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  frequency: string;
  next_due_date: string;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringPaymentInput {
  title: string;
  amount: number;
  category: string;
  frequency: string;
  next_due_date: string;
  status?: string;
  description?: string;
}

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new AuthError('Please sign in to continue');
  }
  return user.id;
}

// Handle Supabase errors
function handleSupabaseError(error: unknown, context: string): never {
  console.error(`Supabase error in ${context}:`, error);
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes('row-level security')) {
    throw new AuthError('You do not have permission to perform this action');
  }
  
  if (errorMessage.includes('duplicate key')) {
    throw new APIError('This record already exists', 'DUPLICATE_ERROR', 409);
  }
  
  if (errorMessage.includes('foreign key')) {
    throw new APIError('Referenced record not found', 'FOREIGN_KEY_ERROR', 400);
  }
  
  throw new APIError(
    `Failed to ${context}. Please try again.`,
    'DATABASE_ERROR',
    500,
    error
  );
}

// ============= TRANSACTIONS =============

export async function getTransactions(options?: {
  startDate?: string;
  endDate?: string;
  type?: TransactionTypeEnum;
  category?: string;
  limit?: number;
}): Promise<Transaction[]> {
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (options?.startDate) {
      query = query.gte('date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('date', options.endDate);
    }
    if (options?.type) {
      query = query.eq('type', options.type);
    }
    if (options?.category) {
      query = query.eq('category', options.category);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) handleSupabaseError(error, 'fetch transactions');
    return data || [];
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'fetch transactions');
  }
}

export async function createTransaction(input: CreateTransactionInput): Promise<Transaction> {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...input,
        user_id: userId,
        status: input.status || 'completed'
      })
      .select()
      .single();

    if (error) handleSupabaseError(error, 'create transaction');
    return data!;
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'create transaction');
  }
}

export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput
): Promise<Transaction> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update transaction');
    return data!;
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'update transaction');
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error, 'delete transaction');
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'delete transaction');
  }
}

export async function bulkDeleteTransactions(ids: string[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', ids);

    if (error) handleSupabaseError(error, 'bulk delete transactions');
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'bulk delete transactions');
  }
}

export async function bulkUpdateTransactionCategory(
  ids: string[],
  category: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('transactions')
      .update({ category })
      .in('id', ids);

    if (error) handleSupabaseError(error, 'bulk update transactions');
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'bulk update transactions');
  }
}

export async function createBulkTransactions(
  transactions: CreateTransactionInput[]
): Promise<Transaction[]> {
  try {
    const userId = await getCurrentUserId();
    
    const transactionsWithUserId = transactions.map(t => ({
      ...t,
      user_id: userId,
      status: t.status || 'completed'
    }));

    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionsWithUserId)
      .select();

    if (error) handleSupabaseError(error, 'create bulk transactions');
    return data || [];
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'create bulk transactions');
  }
}

// ============= LOANS =============

export async function getLoans(): Promise<Loan[]> {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error, 'fetch loans');
    return data || [];
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'fetch loans');
  }
}

export async function createLoan(input: CreateLoanInput): Promise<Loan> {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('loans')
      .insert({
        ...input,
        user_id: userId,
        status: input.status || 'active'
      })
      .select()
      .single();

    if (error) handleSupabaseError(error, 'create loan');
    return data!;
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'create loan');
  }
}

export async function updateLoan(id: string, input: Partial<CreateLoanInput>): Promise<Loan> {
  try {
    const { data, error } = await supabase
      .from('loans')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update loan');
    return data!;
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'update loan');
  }
}

export async function deleteLoan(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('loans')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error, 'delete loan');
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'delete loan');
  }
}

// ============= LENDING TRANSACTIONS =============

export async function getLendingTransactions(): Promise<LendingTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('lending_transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) handleSupabaseError(error, 'fetch lending transactions');
    return data || [];
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'fetch lending transactions');
  }
}

export async function createLendingTransaction(
  input: CreateLendingInput
): Promise<LendingTransaction> {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('lending_transactions')
      .insert({
        ...input,
        user_id: userId,
        status: input.status || 'active'
      })
      .select()
      .single();

    if (error) handleSupabaseError(error, 'create lending transaction');
    return data!;
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'create lending transaction');
  }
}

export async function updateLendingTransaction(
  id: string,
  input: Partial<CreateLendingInput>
): Promise<LendingTransaction> {
  try {
    const { data, error } = await supabase
      .from('lending_transactions')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update lending transaction');
    return data!;
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'update lending transaction');
  }
}

export async function deleteLendingTransaction(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('lending_transactions')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error, 'delete lending transaction');
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'delete lending transaction');
  }
}

// ============= CATEGORIES =============

export async function getCategories(): Promise<Array<{ id: string; name: string; icon?: string; color?: string }>> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) handleSupabaseError(error, 'fetch categories');
    return data || [];
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'fetch categories');
  }
}

// ============= USER SETTINGS =============

export async function getUserSettings(): Promise<Record<string, unknown> | null> {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
      handleSupabaseError(error, 'fetch user settings');
    }
    return data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'fetch user settings');
  }
}

export async function updateUserSettings(
  settings: Record<string, unknown>
): Promise<Record<string, unknown>> {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        ...settings
      })
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update user settings');
    return data!;
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'update user settings');
  }
}

// ============= PROFILES =============

export async function getProfile(): Promise<Record<string, unknown> | null> {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      handleSupabaseError(error, 'fetch profile');
    }
    return data;
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'fetch profile');
  }
}

export async function updateProfile(
  profile: Record<string, unknown>
): Promise<Record<string, unknown>> {
  try {
    const userId = await getCurrentUserId();
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        ...profile
      })
      .select()
      .single();

    if (error) handleSupabaseError(error, 'update profile');
    return data!;
  } catch (error) {
    if (error instanceof APIError) throw error;
    handleSupabaseError(error, 'update profile');
  }
}
