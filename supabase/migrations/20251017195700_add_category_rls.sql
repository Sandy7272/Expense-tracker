-- Enable RLS for the categories table if it's not already enabled
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop the existing SELECT policy to replace it with a more specific one
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;

-- 1. Policy for SELECT: Users can select any category
CREATE POLICY "Allow all users to read categories"
ON public.categories
FOR SELECT
USING (true);

-- 2. Policy for INSERT: Authenticated users can insert categories
CREATE POLICY "Allow authenticated users to insert categories"
ON public.categories
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 3. Policy for UPDATE: Authenticated users can update any category
-- Note: This is a permissive policy. For stricter control, you might want to add ownership.
CREATE POLICY "Allow authenticated users to update categories"
ON public.categories
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 4. Policy for DELETE: Authenticated users can delete any category
-- Note: This is also permissive. Consider if you want to restrict deletion.
CREATE POLICY "Allow authenticated users to delete categories"
ON public.categories
FOR DELETE
USING (auth.role() = 'authenticated');