import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
}

interface ExpenseFormData {
  date: Date;
  category: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  name: string;
}

const categories = [
  'Food', 'Transport', 'Entertainment', 'Shopping', 
  'Bills', 'Health', 'Education', 'Travel', 
  'Salary', 'Freelance', 'Investment', 'Other'
];

export function AddExpenseModal({ open, onOpenChange, onSubmit }: AddExpenseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    name: 'Sandy'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data: ExpenseFormData = {
        date,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        type: formData.type,
        name: formData.name
      };

      await onSubmit(data);
      
      // Reset form
      setFormData({
        category: '',
        description: '',
        amount: '',
        type: 'expense',
        name: 'Sandy'
      });
      setDate(new Date());
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add transaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-card via-card to-background border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-semibold text-foreground">
            ➕ Add New Transaction
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-200 text-left",
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
                "p-4 rounded-xl border-2 transition-all duration-200 text-left",
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

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What was this transaction for?"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
              className="resize-none"
            />
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
              required
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Your name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? (
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