
-- Composite index for the most common query pattern: user's transactions by date
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions (user_id, date DESC);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON public.transactions (user_id, category);

-- Index for type filtering
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON public.transactions (user_id, type);

-- Composite index for date range queries with user
CREATE INDEX IF NOT EXISTS idx_transactions_user_date_type ON public.transactions (user_id, date DESC, type);

-- Indexes on other high-query tables
CREATE INDEX IF NOT EXISTS idx_budgets_user ON public.budgets (user_id);
CREATE INDEX IF NOT EXISTS idx_lending_user ON public.lending_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_user ON public.recurring_payments (user_id);
CREATE INDEX IF NOT EXISTS idx_loans_user ON public.loans (user_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan ON public.loan_payments (loan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON public.user_settings (user_id);
