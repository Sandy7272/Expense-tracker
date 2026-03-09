-- Fix: Remove the FOR ALL policy that allows users to self-grant premium subscriptions
-- Users should only be able to SELECT their own subscription
-- INSERT/UPDATE/DELETE should only happen via service role (webhook)

DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;

-- Keep the existing SELECT policy (already exists: "Users can view their own subscription")
-- No INSERT/UPDATE/DELETE policies for regular users - only service role via webhook