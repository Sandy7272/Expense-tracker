-- Fix: Remove permissive INSERT/UPDATE/DELETE policies on shared categories table
-- Categories are system-managed data, only SELECT should be allowed for authenticated users

DROP POLICY IF EXISTS "Allow authenticated users to insert categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated users to update categories" ON public.categories;
DROP POLICY IF EXISTS "Allow authenticated users to delete categories" ON public.categories;