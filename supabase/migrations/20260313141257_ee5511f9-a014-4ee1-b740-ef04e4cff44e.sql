-- Add soft delete column to transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Index for filtering out soft-deleted records efficiently
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON public.transactions (deleted_at) WHERE deleted_at IS NULL;

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  changes jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Only the system (via triggers/service role) can insert audit logs
-- No INSERT/UPDATE/DELETE policies for regular users

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, changes)
    VALUES (NEW.user_id, 'create', TG_TABLE_NAME, NEW.id::text, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, changes)
    VALUES (NEW.user_id, 'update', TG_TABLE_NAME, NEW.id::text, jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, changes)
    VALUES (OLD.user_id, 'delete', TG_TABLE_NAME, OLD.id::text, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Attach audit triggers to key tables
CREATE TRIGGER audit_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_budgets
  AFTER INSERT OR UPDATE OR DELETE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_loans
  AFTER INSERT OR UPDATE OR DELETE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_lending_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.lending_transactions
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();