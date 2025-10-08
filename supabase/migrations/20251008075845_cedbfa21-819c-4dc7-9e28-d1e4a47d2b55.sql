-- Add loan_id to transactions table
ALTER TABLE transactions ADD COLUMN loan_id uuid REFERENCES loans(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_transactions_loan_id ON transactions(loan_id);

-- Create function to auto-sync loan payments from transactions
CREATE OR REPLACE FUNCTION sync_loan_payment_from_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.loan_id IS NOT NULL AND NEW.type = 'expense' THEN
    INSERT INTO loan_payments (
      loan_id, 
      payment_date, 
      amount_paid, 
      notes,
      status
    )
    VALUES (
      NEW.loan_id,
      NEW.date,
      NEW.amount,
      COALESCE(NEW.description, 'EMI Payment'),
      'paid'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create loan payments
CREATE TRIGGER after_transaction_insert_loan_payment
AFTER INSERT ON transactions
FOR EACH ROW
WHEN (NEW.loan_id IS NOT NULL)
EXECUTE FUNCTION sync_loan_payment_from_transaction();

-- Create trigger to sync updates
CREATE OR REPLACE FUNCTION sync_loan_payment_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.loan_id IS NOT NULL THEN
    UPDATE loan_payments 
    SET 
      amount_paid = NEW.amount,
      payment_date = NEW.date,
      notes = COALESCE(NEW.description, 'EMI Payment')
    WHERE loan_id = NEW.loan_id 
      AND payment_date = OLD.date
      AND amount_paid = OLD.amount;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_transaction_update_loan_payment
AFTER UPDATE ON transactions
FOR EACH ROW
WHEN (NEW.loan_id IS NOT NULL)
EXECUTE FUNCTION sync_loan_payment_update();