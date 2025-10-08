import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useTransactions, CreateTransactionData } from "@/hooks/useTransactions";
import type { Transaction } from "@/hooks/useTransactions";
import { CategorySelector } from "./CategorySelector";
import { useLoans } from "@/hooks/useLoans";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction;
}

const formSchema = z.object({
  type: z.enum(["income", "expense"]),
  date: z.date({ required_error: "Date is required" }),
  category: z.string().min(1, "Category is required"),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
    .refine((v) => parseFloat(v) > 0, "Amount must be greater than 0"),
  description: z.string().optional(),
  person: z.string().optional(),
  loan_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddExpenseModal({ open, onOpenChange, transaction }: AddExpenseModalProps) {
  const { createTransaction, updateTransaction } = useTransactions();
  const { loans } = useLoans();
  const [dateOpen, setDateOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      type: "expense",
      date: new Date(),
      category: "",
      amount: "",
      description: "",
      person: "",
      loan_id: "",
    },
  });

useEffect(() => {
  if (open) {
    if (transaction) {
      form.reset({
        type: transaction.type,
        date: new Date(transaction.date),
        category: transaction.category || "",
        amount: String(transaction.amount ?? ""),
        description: transaction.description || "",
        person: transaction.person || "",
        loan_id: transaction.loan_id || "",
      });
    } else {
      form.reset({ type: "expense", date: new Date(), category: "", amount: "", description: "", person: "", loan_id: "" });
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [open, transaction]);

const onSubmit = (values: FormValues) => {
  const data: CreateTransactionData = {
    date: format(values.date, "yyyy-MM-dd"),
    category: values.category,
    description: values.description || "",
    amount: parseFloat(values.amount),
    type: values.type,
    person: values.person || "",
    loan_id: values.loan_id || undefined,
  };

  if (transaction) {
    updateTransaction.mutate(
      { id: transaction.id, data },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  } else {
    createTransaction.mutate(data, {
      onSuccess: () => {
        form.reset({ type: "expense", date: new Date(), category: "", amount: "", description: "", person: "", loan_id: "" });
        onOpenChange(false);
      },
    });
  }
};

const selectedType = form.watch("type");
const selectedDate = form.watch("date");
const selectedCategory = form.watch("category");
const selectedLoanId = form.watch("loan_id");
const isSubmitting = transaction ? updateTransaction.isPending : createTransaction.isPending;
const spinnerText = transaction ? "Saving..." : "Adding...";
const submitLabel = transaction ? "Save changes" : `Add ${selectedType === "income" ? "Income" : "Expense"}`;

// Auto-fill EMI amount when loan is selected
useEffect(() => {
  if (selectedLoanId && !transaction) {
    const selectedLoan = loans.find(l => l.id === selectedLoanId);
    if (selectedLoan) {
      form.setValue("amount", String(selectedLoan.monthly_emi));
    }
  }
}, [selectedLoanId, loans, form, transaction]);

// Show EMI-related categories
const showLoanSelector = selectedType === "expense" && (
  selectedCategory.toLowerCase().includes("emi") || 
  selectedCategory.toLowerCase().includes("loan")
);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
<DialogHeader>
  <DialogTitle className="text-xl font-semibold text-foreground">
    {transaction ? "Edit Transaction" : "Add New Transaction"}
  </DialogTitle>
</DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Type Selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => form.setValue("type", "expense", { shouldValidate: true })}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all duration-200 text-left btn-professional",
                  selectedType === "expense"
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
                onClick={() => form.setValue("type", "income", { shouldValidate: true })}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all duration-200 text-left btn-professional",
                  selectedType === "income"
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
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Date</FormLabel>
                      <Popover open={dateOpen} onOpenChange={setDateOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal input-professional",
                                !selectedDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[60]">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(d) => {
                              if (d) {
                                field.onChange(d);
                                setDateOpen(false);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Amount (₹)</FormLabel>
                      <FormControl>
                        <Input
                          id="amount"
                          type="text"
                          inputMode="decimal"
                          pattern="^[0-9]*\.?[0-9]*$"
                          placeholder="0.00"
                          value={field.value}
                          onChange={field.onChange}
                          className="input-professional text-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          id="description"
                          placeholder="What was this transaction for?"
                          className="input-professional resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription />
                    </FormItem>
                  )}
                />

                {/* Person */}
                <FormField
                  control={form.control}
                  name="person"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Person/Business (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          id="person"
                          placeholder="Who was involved in this transaction?"
                          className="input-professional"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription />
                    </FormItem>
                  )}
                />

                {/* Loan Selector - shown when EMI/Loan category selected */}
                {showLoanSelector && (
                  <FormField
                    control={form.control}
                    name="loan_id"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>Link to Loan (Optional)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value === "none" ? "" : value)} value={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger className="input-professional">
                              <SelectValue placeholder="Select a loan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No loan</SelectItem>
                            {loans.filter(l => l.status === 'active').map((loan) => (
                              <SelectItem key={loan.id} value={loan.id}>
                                {loan.loan_name} - EMI: ₹{loan.monthly_emi}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Link this payment to track EMI progress automatically
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Right Column - Category Selection */}
              <div>
                <FormField
                  control={form.control}
                  name="category"
                  render={() => (
                    <FormItem>
                      <FormLabel className="sr-only">Category</FormLabel>
                      <CategorySelector
                        selectedCategory={form.watch("category")}
                        onCategoryChange={(category) => form.setValue("category", category, { shouldValidate: true })}
                        transactionType={selectedType}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
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
                disabled={isSubmitting || !form.formState.isValid}
                className="flex-1 btn-professional bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {spinnerText}
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
