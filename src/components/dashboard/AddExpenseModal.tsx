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
import { useTransactions, CreateTransactionData } from "@/hooks/useTransactions";
import { CategorySelector } from "./CategorySelector";

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddExpenseModal({ open, onOpenChange }: AddExpenseModalProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    person: ''
  });

  const { createTransaction } = useTransactions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.amount) {
      return;
    }

    const data: CreateTransactionData = {
      date: format(date, 'yyyy-MM-dd'),
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      type: formData.type,
      person: formData.person
    };

    createTransaction.mutate(data, {
      onSuccess: () => {
        // Reset form
        setFormData({
          category: '',
          description: '',
          amount: '',
          type: 'expense',
          person: ''
        });
        setDate(new Date());
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Add New Transaction
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200 text-left btn-professional",
                formData.type === 'expense'
                  ? "border-expense bg-expense/10 text-expense"
                  : "border-border hover:border-expense/50 text-muted-foreground"
              )}
            >
              <div className="text-2xl mb-2">💸</div>
              <div className="font-medium">Expense</div>
              <div className="text-sm opacity-70">Money going out</div>
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200 text-left btn-professional",
                formData.type === 'income'
                  ? "border-income bg-income/10 text-income"
                  : "border-border hover:border-income/50 text-muted-foreground"
              )}
            >
              <div className="text-2xl mb-2">💰</div>
              <div className="font-medium">Income</div>
              <div className="text-sm opacity-70">Money coming in</div>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-6">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
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
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What was this transaction for?"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-professional resize-none"
                  rows={3}
                />
              </div>

              {/* Person */}
              <div className="space-y-2">
                <Label htmlFor="person">Person/Business (Optional)</Label>
                <Input
                  id="person"
                  placeholder="Who was involved in this transaction?"
                  value={formData.person}
                  onChange={(e) => setFormData(prev => ({ ...prev, person: e.target.value }))}
                  className="input-professional"
                />
              </div>
            </div>

            {/* Right Column - Category Selection */}
            <div>
              <CategorySelector
                selectedCategory={formData.category}
                onCategoryChange={(category) => setFormData(prev => ({ ...prev, category }))}
                transactionType={formData.type}
              />
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
              disabled={createTransaction.isPending || !formData.category || !formData.amount}
              className="flex-1 btn-professional bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {createTransaction.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                `Add ${formData.type === 'income' ? 'Income' : 'Expense'}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}