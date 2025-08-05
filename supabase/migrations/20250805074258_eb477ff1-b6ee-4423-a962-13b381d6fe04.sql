-- Create categories table with predefined categories
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  icon text,
  color text,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policy for categories to be viewable by everyone
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (true);

-- Insert predefined categories
INSERT INTO public.categories (name, icon, color, type) VALUES
-- Expense categories
('EMI', 'CreditCard', 'hsl(0, 70%, 60%)', 'expense'),
('Insurance Policy', 'Shield', 'hsl(220, 70%, 60%)', 'expense'),
('Mutual Fund', 'TrendingUp', 'hsl(140, 70%, 60%)', 'expense'),
('Stocks', 'LineChart', 'hsl(260, 70%, 60%)', 'expense'),
('Bhishi', 'Gift', 'hsl(300, 70%, 60%)', 'expense'),
('Usne Dile', 'ArrowUpRight', 'hsl(30, 70%, 60%)', 'expense'),
('Groceries', 'ShoppingCart', 'hsl(90, 70%, 60%)', 'expense'),
('Health & Wellbeing', 'Heart', 'hsl(350, 70%, 60%)', 'expense'),
('Food & Drinks', 'Coffee', 'hsl(40, 70%, 60%)', 'expense'),
('Shopping', 'Bag', 'hsl(280, 70%, 60%)', 'expense'),
('Petrol', 'Car', 'hsl(20, 70%, 60%)', 'expense'),
('Travel', 'Plane', 'hsl(200, 70%, 60%)', 'expense'),
('Recharges', 'Smartphone', 'hsl(180, 70%, 60%)', 'expense'),
('Bikes Maintenance', 'Wrench', 'hsl(60, 70%, 60%)', 'expense'),
('Fees', 'FileText', 'hsl(100, 70%, 60%)', 'expense'),
('Others', 'MoreHorizontal', 'hsl(240, 70%, 60%)', 'expense'),
('Entertainment', 'Film', 'hsl(320, 70%, 60%)', 'expense'),
('Electronics Devices', 'Laptop', 'hsl(160, 70%, 60%)', 'expense'),
('Grooming Expense', 'Scissors', 'hsl(80, 70%, 60%)', 'expense'),
('Usne Prt Dile', 'ArrowDownRight', 'hsl(340, 70%, 60%)', 'expense'),
('Usne Ghetle', 'ArrowDownLeft', 'hsl(120, 70%, 60%)', 'expense'),

-- Income categories
('Salary', 'Wallet', 'hsl(140, 70%, 60%)', 'income'),
('Freelance', 'Briefcase', 'hsl(160, 70%, 60%)', 'income'),
('Business', 'Building', 'hsl(180, 70%, 60%)', 'income'),
('Investment Returns', 'TrendingUp', 'hsl(200, 70%, 60%)', 'income'),
('Other Income', 'Plus', 'hsl(220, 70%, 60%)', 'income');