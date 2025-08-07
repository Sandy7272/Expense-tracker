import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useLendingTransactions, CreateLendingTransactionData } from "@/hooks/useLendingTransactions";

interface LendingTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LendingTransactionModal({ open, onOpenChange }: LendingTransactionModalProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [formData, setFormData] = useState({
    type: 'lent' as 'lent' | 'borrowed' | 'repaid_by_them' | 'repaid_by_me',
    person_name: '',
    amount: '',
    description: '',
  });

  const { createTransaction } = useLendingTransactions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.person_name || !formData.amount) {
      return;
    }

    const data: CreateLendingTransactionData = {
      type: formData.type,
      person_name: formData.person_name,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: format(date, 'yyyy-MM-dd'),
      due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
    };

    createTransaction.mutate(data, {
      onSuccess: () => {
        // Reset form
        setFormData({
          type: 'lent',
          person_name: '',
          amount: '',
          description: '',
        });
        setDate(new Date());
        setDueDate(undefined);
        onOpenChange(false);
      }
    });
  };

  const typeOptions = [
    { value: 'lent', label: 'I Lent Money', emoji: '↗️', description: 'Money I gave to someone' },
    { value: 'borrowed', label: 'I Borrowed Money', emoji: '↙️', description: 'Money I received from someone' },
    { value: 'repaid_by_them', label: 'They Repaid Me', emoji: '✅', description: 'They returned money to me' },
    { value: 'repaid_by_me', label: 'I Repaid Them', emoji: '💰', description: 'I returned money to them' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Add Lending/Borrowing Transaction
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type Selection */}
          <div className="space-y-3">
            <Label>Transaction Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: option.value as any }))}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                    formData.type === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  )}
                >
                  <div className="text-2xl mb-2">{option.emoji}</div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm opacity-70">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              {/* Person Name */}
              <div className="space-y-2">
                <Label htmlFor="person_name">Person/Business Name</Label>
                <Input
                  id="person_name"
                  placeholder="Enter name"
                  value={formData.person_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, person_name: e.target.value }))}
                  className="input-professional"
                  required
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="input-professional text-lg"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What was this transaction for?"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-professional resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Right Column - Dates */}
            <div className="space-y-4">
              {/* Transaction Date */}
              <div className="space-y-2">
                <Label>Transaction Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal input-professional",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass-card">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => newDate && setDate(newDate)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Due Date (Optional) */}
              <div className="space-y-2">
                <Label>Due Date (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal input-professional",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>Pick due date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 glass-card">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {dueDate && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDueDate(undefined)}
                    className="text-xs"
                  >
                    Clear due date
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-6 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              className="flex-1 btn-professional"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTransaction.isPending || !formData.person_name || !formData.amount}
              className="flex-1 btn-professional bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {createTransaction.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Transaction'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}