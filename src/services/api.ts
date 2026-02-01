/**
 * Centralized API Service Layer
 * All external API and Supabase Edge Function calls go through this layer
 * Includes error handling, retry logic, and meaningful error messages
 */

import { supabase } from '@/integrations/supabase/client';

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const AI_TIMEOUT_MS = 30000;

// Error types
export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends APIError {
  constructor(message: string = 'Network connection failed') {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends APIError {
  constructor(message: string = 'Request timed out') {
    super(message, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
  }
}

export class AuthError extends APIError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

// Response types
export interface APIResponse<T> {
  data: T | null;
  error: APIError | null;
  success: boolean;
}

export interface CategorizeTransactionsRequest {
  transactions: Array<{
    description: string;
    amount: number;
    date: string;
    type?: string;
  }>;
}

export interface CategorizedTransaction {
  description: string;
  amount: number;
  date: string;
  category: string;
  confidence: number;
  type: 'income' | 'expense';
}

export interface BankStatementUploadResponse {
  transactions: CategorizedTransaction[];
  totalTransactions: number;
  successCount: number;
  errorCount: number;
}

export interface AnalyticsData {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    transactionCount: number;
  };
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
}

// Utility functions
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new TimeoutError()), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry auth errors or client errors
      if (error instanceof AuthError) throw error;
      if (error instanceof APIError && error.statusCode && error.statusCode < 500) throw error;
      
      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`API call failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

function handleEdgeFunctionError(error: unknown): APIError {
  if (error instanceof APIError) return error;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    return new NetworkError('Unable to connect to server. Please check your internet connection.');
  }
  
  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    return new TimeoutError('The request took too long. Please try again.');
  }
  
  if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
    return new AuthError('Please sign in to continue.');
  }
  
  return new APIError(
    'An unexpected error occurred. Please try again.',
    'UNKNOWN_ERROR',
    undefined,
    error
  );
}

// API methods

/**
 * Categorize transactions using AI
 */
export async function categorizeTransactionsAI(
  request: CategorizeTransactionsRequest
): Promise<APIResponse<CategorizedTransaction[]>> {
  try {
    const result = await withRetry(
      () => withTimeout(
        supabase.functions.invoke('categorize-transactions', {
          body: request
        }),
        AI_TIMEOUT_MS
      ),
      2 // Fewer retries for AI to avoid long waits
    );

    if (result.error) {
      throw new APIError(
        result.error.message || 'AI categorization failed',
        'AI_ERROR',
        result.error.status
      );
    }

    return {
      data: result.data?.transactions || [],
      error: null,
      success: true
    };
  } catch (error) {
    const apiError = handleEdgeFunctionError(error);
    return {
      data: null,
      error: apiError,
      success: false
    };
  }
}

/**
 * Upload and process bank statement
 */
export async function uploadBankStatement(
  fileData: string,
  fileType: 'csv' | 'pdf' | 'xlsx'
): Promise<APIResponse<BankStatementUploadResponse>> {
  try {
    const result = await withRetry(
      () => withTimeout(
        supabase.functions.invoke('process-bank-statement', {
          body: { fileData, fileType }
        }),
        60000 // Longer timeout for file processing
      )
    );

    if (result.error) {
      throw new APIError(
        'Failed to process bank statement',
        'PROCESSING_ERROR',
        result.error.status
      );
    }

    return {
      data: result.data,
      error: null,
      success: true
    };
  } catch (error) {
    const apiError = handleEdgeFunctionError(error);
    return {
      data: null,
      error: apiError,
      success: false
    };
  }
}

/**
 * Sync with Google Sheets
 */
export async function syncGoogleSheets(
  action: 'import' | 'export' | 'auth' | 'oauth_callback',
  params?: Record<string, unknown>
): Promise<APIResponse<unknown>> {
  try {
    const result = await withRetry(
      () => supabase.functions.invoke('google-sheets-sync', {
        body: { action, ...params }
      })
    );

    if (result.error) {
      throw new APIError(
        result.error.message || 'Google Sheets sync failed',
        'SYNC_ERROR',
        result.error.status
      );
    }

    return {
      data: result.data,
      error: null,
      success: true
    };
  } catch (error) {
    const apiError = handleEdgeFunctionError(error);
    return {
      data: null,
      error: apiError,
      success: false
    };
  }
}

/**
 * Fetch analytics data
 */
export async function fetchAnalytics(
  startDate: string,
  endDate: string
): Promise<APIResponse<AnalyticsData>> {
  try {
    const result = await withRetry(
      () => supabase.functions.invoke('get-analytics', {
        body: { startDate, endDate }
      })
    );

    if (result.error) {
      throw new APIError(
        'Failed to fetch analytics',
        'ANALYTICS_ERROR',
        result.error.status
      );
    }

    return {
      data: result.data,
      error: null,
      success: true
    };
  } catch (error) {
    const apiError = handleEdgeFunctionError(error);
    return {
      data: null,
      error: apiError,
      success: false
    };
  }
}

/**
 * Generate PDF report
 */
export async function generatePDFReport(
  reportType: 'monthly' | 'yearly' | 'custom',
  options: {
    startDate?: string;
    endDate?: string;
    includeCharts?: boolean;
    includeTransactions?: boolean;
  }
): Promise<APIResponse<Blob>> {
  try {
    const result = await withRetry(
      () => withTimeout(
        supabase.functions.invoke('generate-report', {
          body: { reportType, ...options }
        }),
        60000 // Longer timeout for report generation
      )
    );

    if (result.error) {
      throw new APIError(
        'Failed to generate report',
        'REPORT_ERROR',
        result.error.status
      );
    }

    // Convert base64 to Blob if needed
    if (typeof result.data === 'string') {
      const byteCharacters = atob(result.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return {
        data: new Blob([byteArray], { type: 'application/pdf' }),
        error: null,
        success: true
      };
    }

    return {
      data: result.data,
      error: null,
      success: true
    };
  } catch (error) {
    const apiError = handleEdgeFunctionError(error);
    return {
      data: null,
      error: apiError,
      success: false
    };
  }
}

/**
 * Detect recurring transactions
 */
export async function detectRecurringTransactions(): Promise<APIResponse<Array<{
  description: string;
  amount: number;
  frequency: string;
  confidence: number;
  lastOccurrence: string;
}>>> {
  try {
    const result = await withRetry(
      () => supabase.functions.invoke('detect-recurring', {})
    );

    if (result.error) {
      throw new APIError(
        'Failed to detect recurring transactions',
        'DETECTION_ERROR',
        result.error.status
      );
    }

    return {
      data: result.data?.recurring || [],
      error: null,
      success: true
    };
  } catch (error) {
    const apiError = handleEdgeFunctionError(error);
    return {
      data: null,
      error: apiError,
      success: false
    };
  }
}

// Export error handling utility for use in components
export function getErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export function isAuthError(error: unknown): boolean {
  return error instanceof AuthError;
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError;
}

export function isTimeoutError(error: unknown): boolean {
  return error instanceof TimeoutError;
}
