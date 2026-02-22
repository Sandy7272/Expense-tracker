/**
 * Supabase Database Service Layer
 * Centralized database operations — NO Supabase calls should exist outside this file.
 * All hooks delegate to these functions for clean architecture.
 */

import { supabase } from '@/integrations/supabase/client';
import { APIError, AuthError } from './api';

// ============= SHARED TYPES =============

type TransactionTypeEnum = 'expense' | 'income' | 'lend' | 'borrow' | 'investment' | 'emi';
type TransactionStatusEnum = 'pending' | 'completed' | 'received';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionTypeEnum;
  amount: number;
  category: string;
  description?: string;
  date: string;
  status?: TransactionStatusEnum;
  loan_id?: string;
  person?: string;
  source?: string;
  created_at: string;
  updated_at: string;
}

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
  is_active: boolean;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringPaymentInput {
  title: string;
  amount: number;
  category: string;
  frequency: string;
  next_due_date: string;
  is_active?: boolean;
  description?: string;
}

export interface LoanPayment {
  id: string;
  loan_id: string;
  payment_date: string;
  amount_paid: number;
  principal_component?: number;
  interest_component?: number;
  outstanding_balance?: number;
  status: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
}

export interface CreateLoanPaymentInput {
  loan_id: string;
  payment_date: string;
  amount_paid: number;
  payment_method?: string;
  notes?: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  currency: string;
  theme: string;
  language: string;
  notifications_email: boolean;
  notifications_budget_alerts: boolean;
  notifications_loan_reminders: boolean;
  auto_sync: boolean;
  sheet_url?: string;
  google_token_vault_id?: string;
  google_auth_status?: string;
  google_token_expires_at?: string;
  last_synced?: string;
  sync_status?: string;
  sync_errors?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsInput {
  currency?: string;
  theme?: string;
  language?: string;
  notifications_email?: boolean;
  notifications_budget_alerts?: boolean;
  notifications_loan_reminders?: boolean;
  auto_sync?: boolean;
  sheet_url?: string;
  google_auth_status?: string;
}

// ============= ERROR HANDLING =============

function handleSupabaseError(error: unknown, context: string): never {
  console.error(`Supabase error in ${context}:`, error);
  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes('row-level security'))
    throw new AuthError('You do not have permission to perform this action');
  if (msg.includes('duplicate key'))
    throw new APIError('This record already exists', 'DUPLICATE_ERROR', 409);
  if (msg.includes('foreign key'))
    throw new APIError('Referenced record not found', 'FOREIGN_KEY_ERROR', 400);

  throw new APIError(`Failed to ${context}. Please try again.`, 'DATABASE_ERROR', 500, error);
}

function rethrowOrHandle(error: unknown, context: string): never {
  if (error instanceof APIError) throw error;
  handleSupabaseError(error, context);
}

// ============= TRANSACTIONS =============

export async function fetchTransactions(
  userId: string,
  opts?: { startDate?: string; endDate?: string; type?: TransactionTypeEnum; category?: string; limit?: number }
): Promise<Transaction[]> {
  try {
    let q = supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (opts?.startDate) q = q.gte('date', opts.startDate);
    if (opts?.endDate) q = q.lte('date', opts.endDate);
    if (opts?.type) q = q.eq('type', opts.type);
    if (opts?.category) q = q.eq('category', opts.category);
    if (opts?.limit) q = q.limit(opts.limit);
    const { data, error } = await q;
    if (error) handleSupabaseError(error, 'fetch transactions');
    return (data ?? []) as Transaction[];
  } catch (e) { rethrowOrHandle(e, 'fetch transactions'); }
}

export async function createTransaction(userId: string, input: CreateTransactionInput): Promise<Transaction> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...input, user_id: userId, status: input.status || 'completed' })
      .select().single();
    if (error) handleSupabaseError(error, 'create transaction');
    return data!;
  } catch (e) { rethrowOrHandle(e, 'create transaction'); }
}

export async function updateTransaction(userId: string, id: string, input: UpdateTransactionInput): Promise<Transaction> {
  try {
    const { data, error } = await supabase
      .from('transactions').update(input).eq('id', id).eq('user_id', userId).select().single();
    if (error) handleSupabaseError(error, 'update transaction');
    return data!;
  } catch (e) { rethrowOrHandle(e, 'update transaction'); }
}

export async function deleteTransaction(userId: string, id: string): Promise<void> {
  try {
    const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', userId);
    if (error) handleSupabaseError(error, 'delete transaction');
  } catch (e) { rethrowOrHandle(e, 'delete transaction'); }
}

export async function bulkDeleteTransactions(userId: string, ids: string[]): Promise<void> {
  try {
    const { error } = await supabase.from('transactions').delete().in('id', ids).eq('user_id', userId);
    if (error) handleSupabaseError(error, 'bulk delete transactions');
  } catch (e) { rethrowOrHandle(e, 'bulk delete transactions'); }
}

export async function createBulkTransactions(userId: string, txs: CreateTransactionInput[]): Promise<Transaction[]> {
  try {
    const rows = txs.map(t => ({ ...t, user_id: userId, status: t.status || 'completed' }));
    const { data, error } = await supabase.from('transactions').insert(rows).select();
    if (error) handleSupabaseError(error, 'create bulk transactions');
    return (data ?? []) as Transaction[];
  } catch (e) { rethrowOrHandle(e, 'create bulk transactions'); }
}

// Investment-specific query
export async function fetchInvestmentTransactions(
  startDate: string,
  endDate: string,
  categories: string[]
): Promise<Transaction[]> {
  try {
    const { data, error } = await supabase
      .from('transactions').select('*')
      .in('category', categories)
      .in('type', ['expense', 'investment'])
      .eq('status', 'completed')
      .gte('date', startDate).lte('date', endDate)
      .order('date', { ascending: false });
    if (error) handleSupabaseError(error, 'fetch investment transactions');
    return (data ?? []) as Transaction[];
  } catch (e) { rethrowOrHandle(e, 'fetch investment transactions'); }
}

// ============= LOANS =============

export async function fetchLoans(userId: string): Promise<Loan[]> {
  try {
    const { data, error } = await supabase
      .from('loans').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) handleSupabaseError(error, 'fetch loans');
    return (data ?? []) as Loan[];
  } catch (e) { rethrowOrHandle(e, 'fetch loans'); }
}

export async function createLoan(userId: string, input: CreateLoanInput): Promise<Loan> {
  try {
    const { data, error } = await supabase
      .from('loans').insert({ ...input, user_id: userId, status: input.status || 'active' }).select().single();
    if (error) handleSupabaseError(error, 'create loan');
    return data!;
  } catch (e) { rethrowOrHandle(e, 'create loan'); }
}

export async function updateLoan(userId: string, id: string, input: Partial<Loan>): Promise<Loan> {
  try {
    const { data, error } = await supabase
      .from('loans').update(input).eq('id', id).eq('user_id', userId).select().single();
    if (error) handleSupabaseError(error, 'update loan');
    return data!;
  } catch (e) { rethrowOrHandle(e, 'update loan'); }
}

export async function deleteLoan(userId: string, id: string): Promise<void> {
  try {
    const { error } = await supabase.from('loans').delete().eq('id', id).eq('user_id', userId);
    if (error) handleSupabaseError(error, 'delete loan');
  } catch (e) { rethrowOrHandle(e, 'delete loan'); }
}

// ============= LOAN PAYMENTS =============

export async function fetchLoanPayments(loanId: string): Promise<LoanPayment[]> {
  try {
    const { data, error } = await supabase
      .from('loan_payments').select('*').eq('loan_id', loanId).order('payment_date', { ascending: false });
    if (error) handleSupabaseError(error, 'fetch loan payments');
    return (data ?? []) as LoanPayment[];
  } catch (e) { rethrowOrHandle(e, 'fetch loan payments'); }
}

export async function createLoanPayment(input: CreateLoanPaymentInput): Promise<LoanPayment> {
  try {
    const { data, error } = await supabase
      .from('loan_payments').insert(input).select().single();
    if (error) handleSupabaseError(error, 'create loan payment');
    return data!;
  } catch (e) { rethrowOrHandle(e, 'create loan payment'); }
}

export async function updateLoanPayment(id: string, input: Partial<LoanPayment>): Promise<LoanPayment> {
  try {
    const { data, error } = await supabase
      .from('loan_payments').update(input).eq('id', id).select().single();
    if (error) handleSupabaseError(error, 'update loan payment');
    return data!;
  } catch (e) { rethrowOrHandle(e, 'update loan payment'); }
}

export async function deleteLoanPayment(id: string): Promise<void> {
  try {
    const { error } = await supabase.from('loan_payments').delete().eq('id', id);
    if (error) handleSupabaseError(error, 'delete loan payment');
  } catch (e) { rethrowOrHandle(e, 'delete loan payment'); }
}

// ============= LENDING TRANSACTIONS =============

export async function fetchLendingTransactions(
  userId: string,
  opts?: { startDate?: string; endDate?: string; personFilter?: string }
): Promise<LendingTransaction[]> {
  try {
    let q = supabase.from('lending_transactions').select('*').eq('user_id', userId);
    if (opts?.startDate) q = q.gte('date', opts.startDate);
    if (opts?.endDate) q = q.lte('date', opts.endDate);
    if (opts?.personFilter) q = q.eq('person_name', opts.personFilter);
    const { data, error } = await q.order('date', { ascending: false });
    if (error) handleSupabaseError(error, 'fetch lending transactions');
    return (data ?? []) as LendingTransaction[];
  } catch (e) { rethrowOrHandle(e, 'fetch lending transactions'); }
}

export async function fetchUniqueLendingPersons(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('lending_transactions').select('person_name').eq('user_id', userId);
    if (error) handleSupabaseError(error, 'fetch unique lending persons');
    const persons = (data ?? []).map(r => r.person_name);
    return Array.from(new Set(persons));
  } catch (e) { rethrowOrHandle(e, 'fetch unique lending persons'); }
}

export async function createLendingTransaction(userId: string, input: CreateLendingInput): Promise<LendingTransaction> {
  try {
    const { data, error } = await supabase
      .from('lending_transactions').insert({ ...input, user_id: userId }).select().single();
    if (error) handleSupabaseError(error, 'create lending transaction');
    return data!;
  } catch (e) { rethrowOrHandle(e, 'create lending transaction'); }
}

export async function updateLendingTransaction(userId: string, id: string, input: Partial<LendingTransaction>): Promise<LendingTransaction> {
  try {
    const { data, error } = await supabase
      .from('lending_transactions').update(input).eq('id', id).eq('user_id', userId).select().single();
    if (error) handleSupabaseError(error, 'update lending transaction');
    return data!;
  } catch (e) { rethrowOrHandle(e, 'update lending transaction'); }
}

export async function deleteLendingTransaction(userId: string, id: string): Promise<void> {
  try {
    const { error } = await supabase.from('lending_transactions').delete().eq('id', id).eq('user_id', userId);
    if (error) handleSupabaseError(error, 'delete lending transaction');
  } catch (e) { rethrowOrHandle(e, 'delete lending transaction'); }
}

// ============= BUDGETS =============

export async function fetchBudgets(userId: string): Promise<Budget[]> {
  try {
    const { data, error } = await supabase
      .from('budgets').select('*').eq('user_id', userId).order('category');
    if (error) handleSupabaseError(error, 'fetch budgets');
    return (data ?? []) as Budget[];
  } catch (e) { rethrowOrHandle(e, 'fetch budgets'); }
}

export async function createBudget(userId: string, input: CreateBudgetInput): Promise<Budget> {
  try {
    const { data, error } = await supabase
      .from('budgets').insert({ ...input, user_id: userId }).select().single();
    if (error) handleSupabaseError(error, 'create budget');
    return data!;
  } catch (e) { rethrowOrHandle(e, 'create budget'); }
}

export async function updateBudget(userId: string, id: string, monthly_limit: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('budgets').update({ monthly_limit }).eq('id', id).eq('user_id', userId);
    if (error) handleSupabaseError(error, 'update budget');
  } catch (e) { rethrowOrHandle(e, 'update budget'); }
}

export async function deleteBudget(userId: string, id: string): Promise<void> {
  try {
    const { error } = await supabase.from('budgets').delete().eq('id', id).eq('user_id', userId);
    if (error) handleSupabaseError(error, 'delete budget');
  } catch (e) { rethrowOrHandle(e, 'delete budget'); }
}

// ============= RECURRING PAYMENTS =============

export async function fetchRecurringPayments(userId: string): Promise<RecurringPayment[]> {
  try {
    const { data, error } = await supabase
      .from('recurring_payments').select('*').eq('user_id', userId).order('next_due_date', { ascending: true });
    if (error) handleSupabaseError(error, 'fetch recurring payments');
    return (data ?? []) as RecurringPayment[];
  } catch (e) { rethrowOrHandle(e, 'fetch recurring payments'); }
}

export async function createRecurringPayment(userId: string, input: CreateRecurringPaymentInput): Promise<RecurringPayment> {
  try {
    const { data, error } = await supabase
      .from('recurring_payments').insert({ ...input, user_id: userId }).select().single();
    if (error) handleSupabaseError(error, 'create recurring payment');
    return data!;
  } catch (e) { rethrowOrHandle(e, 'create recurring payment'); }
}

export async function updateRecurringPayment(userId: string, id: string, input: Partial<CreateRecurringPaymentInput>): Promise<void> {
  try {
    const { error } = await supabase
      .from('recurring_payments').update(input).eq('id', id).eq('user_id', userId);
    if (error) handleSupabaseError(error, 'update recurring payment');
  } catch (e) { rethrowOrHandle(e, 'update recurring payment'); }
}

export async function deleteRecurringPayment(userId: string, id: string): Promise<void> {
  try {
    const { error } = await supabase.from('recurring_payments').delete().eq('id', id).eq('user_id', userId);
    if (error) handleSupabaseError(error, 'delete recurring payment');
  } catch (e) { rethrowOrHandle(e, 'delete recurring payment'); }
}

// ============= USER SETTINGS =============

export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase
      .from('user_settings').select('*').eq('user_id', userId).maybeSingle();
    if (error) handleSupabaseError(error, 'fetch user settings');
    return data as UserSettings | null;
  } catch (e) { rethrowOrHandle(e, 'fetch user settings'); }
}

export async function createDefaultSettings(userId: string): Promise<UserSettings> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        currency: 'INR',
        theme: 'system',
        language: 'en',
        notifications_email: true,
        notifications_budget_alerts: true,
        notifications_loan_reminders: true,
        auto_sync: true,
      })
      .select().single();
    if (error) handleSupabaseError(error, 'create default settings');
    return data! as UserSettings;
  } catch (e) { rethrowOrHandle(e, 'create default settings'); }
}

export async function updateUserSettings(userId: string, updates: UpdateSettingsInput): Promise<UserSettings> {
  try {
    const { data, error } = await supabase
      .from('user_settings').update(updates).eq('user_id', userId).select().single();
    if (error) handleSupabaseError(error, 'update user settings');
    return data! as UserSettings;
  } catch (e) { rethrowOrHandle(e, 'update user settings'); }
}

// ============= CATEGORIES =============

export async function fetchCategories(): Promise<Array<{ id: string; name: string; icon?: string; color?: string }>> {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) handleSupabaseError(error, 'fetch categories');
    return data ?? [];
  } catch (e) { rethrowOrHandle(e, 'fetch categories'); }
}

// ============= PROFILES =============

export async function fetchProfile(userId: string): Promise<Record<string, unknown> | null> {
  try {
    const { data, error } = await supabase
      .from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (error) handleSupabaseError(error, 'fetch profile');
    return data;
  } catch (e) { rethrowOrHandle(e, 'fetch profile'); }
}

export async function updateProfile(userId: string, profile: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const { data, error } = await supabase
      .from('profiles').upsert({ user_id: userId, ...profile }).select().single();
    if (error) handleSupabaseError(error, 'update profile');
    return data!;
  } catch (e) { rethrowOrHandle(e, 'update profile'); }
}

// ============= REALTIME =============

export function subscribeToTransactions(userId: string, onUpdate: () => void) {
  const channel = supabase
    .channel('transactions-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'transactions',
      filter: `user_id=eq.${userId}`,
    }, onUpdate)
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
