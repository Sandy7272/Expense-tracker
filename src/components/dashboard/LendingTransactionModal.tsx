import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useLendingTransactions, CreateLendingTransactionData } from "@/hooks/useLendingTransactions";
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

interface LendingTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  type: z.enum(["lent", "borrowed", "repaid_by_them", "repaid_by_me"]),
  person_name: z.string().min(1, "Name is required"),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
    .refine((v) => parseFloat(v) > 0, "Amount must be greater than 0"),
  description: z.string().optional(),
  date: z.date({ required_error: "Date is required" }),
  due_date: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function LendingTransactionModal({ open, onOpenChange }: LendingTransactionModalProps) {
  const { createTransaction } = useLendingTransactions();
  const [dateOpen, setDateOpen] = useState(false);
  const [dueOpen, setDueOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      type: "lent",
      person_name: "",
      amount: "",
      description: "",
      date: new Date(),
      due_date: undefined,
    },
  });

  const onSubmit = (values: FormValues) => {
    const data: CreateLendingTransactionData = {
      type: values.type,
      person_name: values.person_name,
      amount: parseFloat(values.amount),
      description: values.description || "",
      date: format(values.date, "yyyy-MM-dd"),
      due_date: values.due_date ? format(values.due_date, "yyyy-MM-dd") : undefined,
    };

    createTransaction.mutate(data, {
      onSuccess: () => {
        form.reset({
          type: "lent",
          person_name: "",
          amount: "",
          description: "",
          date: new Date(),
          due_date: undefined,
        });
        onOpenChange(false);
      },
    });
  };

  const selectedType = form.watch("type");
  const selectedDate = form.watch("date");
  const dueDate = form.watch("due_date");

  const typeOptions = [
    { value: "lent", label: "I Lent Money", emoji: "↗️", description: "Money I gave to someone" },
    { value: "borrowed", label: "I Borrowed Money", emoji: "↙️", description: "Money I received from someone" },
    { value: "repaid_by_them", label: "They Repaid Me", emoji: "✅", description: "They returned money to me" },
    { value: "repaid_by_me", label: "I Repaid Them", emoji: "💰", description: "I returned money to them" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Add Lending/Borrowing Transaction
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Transaction Type Selection */}
            <div className="space-y-3">
              <FormLabel>Transaction Type</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {typeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => form.setValue("type", option.value as any, { shouldValidate: true })}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all duration-200 text-left",
                      selectedType === option.value
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
                <FormField
                  control={form.control}
                  name="person_name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Person/Business Name</FormLabel>
                      <FormControl>
                        <Input
                          id="person_name"
                          placeholder="Enter name"
                          className="input-professional"
                          {...field}
                        />
                      </FormControl>
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
                          className="input-professional text-lg"
                          value={field.value}
                          onChange={field.onChange}
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
                      <FormLabel>Description (Optional)</FormLabel>
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
              </div>

              {/* Right Column - Dates */}
              <div className="space-y-4">
                {/* Transaction Date */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Transaction Date</FormLabel>
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
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Due Date (Optional) */}
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Due Date (Optional)</FormLabel>
                      <Popover open={dueOpen} onOpenChange={setDueOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal input-professional",
                                !dueDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dueDate ? format(dueDate, "PPP") : <span>Pick due date</span>}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[60]">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(d) => {
                              field.onChange(d);
                              setDueOpen(false);
                            }}
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
                          onClick={() => form.setValue("due_date", undefined, { shouldValidate: true })}
                          className="text-xs"
                        >
                          Clear due date
                        </Button>
                      )}
                      <FormDescription />
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
                disabled={createTransaction.isPending || !form.formState.isValid}
                className="flex-1 btn-professional bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {createTransaction.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Transaction"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
