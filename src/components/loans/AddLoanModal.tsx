import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/currency";
import { useLoans, type Loan } from "@/hooks/useLoans";

interface AddLoanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan?: Loan;
}

export function AddLoanModal({ open, onOpenChange, loan }: AddLoanModalProps) {
  const { createLoan, updateLoan, calculateEMI } = useLoans();
  const [formData, setFormData] = useState({
    loan_name: "",
    principal_amount: "",
    interest_rate: "",
    tenure_months: "",
    start_date: "",
    lender_name: "",
    loan_type: "personal",
  });
  const [calculatedEMI, setCalculatedEMI] = useState<number>(0);

  useEffect(() => {
    if (loan && open) {
      setFormData({
        loan_name: loan.loan_name,
        principal_amount: loan.principal_amount.toString(),
        interest_rate: loan.interest_rate.toString(),
        tenure_months: loan.tenure_months.toString(),
        start_date: loan.start_date,
        lender_name: loan.lender_name || "",
        loan_type: loan.loan_type,
      });
    } else if (!loan && open) {
      setFormData({
        loan_name: "",
        principal_amount: "",
        interest_rate: "",
        tenure_months: "",
        start_date: new Date().toISOString().split('T')[0],
        lender_name: "",
        loan_type: "personal",
      });
    }
  }, [loan, open]);

  useEffect(() => {
    const principal = parseFloat(formData.principal_amount);
    const rate = parseFloat(formData.interest_rate);
    const tenure = parseInt(formData.tenure_months);

    if (principal > 0 && rate > 0 && tenure > 0) {
      const emi = calculateEMI(principal, rate, tenure);
      setCalculatedEMI(emi);
    } else {
      setCalculatedEMI(0);
    }
  }, [formData.principal_amount, formData.interest_rate, formData.tenure_months, calculateEMI]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const loanData = {
      loan_name: formData.loan_name,
      principal_amount: parseFloat(formData.principal_amount),
      interest_rate: parseFloat(formData.interest_rate),
      tenure_months: parseInt(formData.tenure_months),
      start_date: formData.start_date,
      lender_name: formData.lender_name || undefined,
      loan_type: formData.loan_type,
    };

    if (loan) {
      await updateLoan.mutateAsync({ id: loan.id, ...loanData });
    } else {
      await createLoan.mutateAsync(loanData);
    }
    
    onOpenChange(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{loan ? "Edit Loan" : "Add New Loan"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="loan_name">Loan Name *</Label>
            <Input
              id="loan_name"
              value={formData.loan_name}
              onChange={(e) => handleChange("loan_name", e.target.value)}
              placeholder="Home Loan, Car Loan, etc."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="principal_amount">Principal Amount *</Label>
              <Input
                id="principal_amount"
                type="number"
                step="0.01"
                value={formData.principal_amount}
                onChange={(e) => handleChange("principal_amount", e.target.value)}
                placeholder="100000"
                required
              />
            </div>
            <div>
              <Label htmlFor="interest_rate">Interest Rate (%) *</Label>
              <Input
                id="interest_rate"
                type="number"
                step="0.1"
                value={formData.interest_rate}
                onChange={(e) => handleChange("interest_rate", e.target.value)}
                placeholder="8.5"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tenure_months">Tenure (Months) *</Label>
              <Input
                id="tenure_months"
                type="number"
                value={formData.tenure_months}
                onChange={(e) => handleChange("tenure_months", e.target.value)}
                placeholder="60"
                required
              />
            </div>
            <div>
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="lender_name">Lender Name</Label>
            <Input
              id="lender_name"
              value={formData.lender_name}
              onChange={(e) => handleChange("lender_name", e.target.value)}
              placeholder="Bank name or lender"
            />
          </div>

          <div>
            <Label htmlFor="loan_type">Loan Type</Label>
            <Select value={formData.loan_type} onValueChange={(value) => handleChange("loan_type", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal Loan</SelectItem>
                <SelectItem value="home">Home Loan</SelectItem>
                <SelectItem value="car">Car Loan</SelectItem>
                <SelectItem value="education">Education Loan</SelectItem>
                <SelectItem value="business">Business Loan</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {calculatedEMI > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Calculated EMI</div>
              <div className="text-2xl font-bold text-primary">{formatCurrency(calculatedEMI)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Total repayment: {formatCurrency(calculatedEMI * parseInt(formData.tenure_months || "0"))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createLoan.isPending || updateLoan.isPending}
            >
              {createLoan.isPending || updateLoan.isPending ? "Saving..." : (loan ? "Update" : "Add Loan")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}