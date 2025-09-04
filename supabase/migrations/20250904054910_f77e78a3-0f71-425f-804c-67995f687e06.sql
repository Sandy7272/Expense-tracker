-- Create loans table for structured loan tracking
CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  loan_name TEXT NOT NULL,
  principal_amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  tenure_months INTEGER NOT NULL,
  monthly_emi NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  lender_name TEXT,
  loan_type TEXT DEFAULT 'personal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loan_payments table for EMI payment history
CREATE TABLE public.loan_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount_paid NUMERIC NOT NULL,
  principal_component NUMERIC,
  interest_component NUMERIC,
  outstanding_balance NUMERIC,
  status TEXT NOT NULL DEFAULT 'paid',
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on loans table
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for loans
CREATE POLICY "Users can view their own loans" 
ON public.loans 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own loans" 
ON public.loans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loans" 
ON public.loans 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loans" 
ON public.loans 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable RLS on loan_payments table
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for loan_payments
CREATE POLICY "Users can view their own loan payments" 
ON public.loan_payments 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM public.loans WHERE id = loan_payments.loan_id));

CREATE POLICY "Users can create their own loan payments" 
ON public.loan_payments 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM public.loans WHERE id = loan_payments.loan_id));

CREATE POLICY "Users can update their own loan payments" 
ON public.loan_payments 
FOR UPDATE 
USING (auth.uid() = (SELECT user_id FROM public.loans WHERE id = loan_payments.loan_id));

CREATE POLICY "Users can delete their own loan payments" 
ON public.loan_payments 
FOR DELETE 
USING (auth.uid() = (SELECT user_id FROM public.loans WHERE id = loan_payments.loan_id));

-- Create trigger for updating loans updated_at timestamp
CREATE TRIGGER update_loans_updated_at
BEFORE UPDATE ON public.loans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_loans_user_id ON public.loans(user_id);
CREATE INDEX idx_loans_status ON public.loans(status);
CREATE INDEX idx_loan_payments_loan_id ON public.loan_payments(loan_id);
CREATE INDEX idx_loan_payments_payment_date ON public.loan_payments(payment_date);