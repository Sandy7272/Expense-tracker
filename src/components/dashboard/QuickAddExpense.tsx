import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { format } from "date-fns";

export function QuickAddExpense() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const { createTransaction } = useTransactions();
  const { data: categories = [] } = useCategories();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;

    createTransaction.mutate({
      amount: parseFloat(amount),
      category,
      type,
      description: note || undefined,
      date: format(new Date(), "yyyy-MM-dd"),
    });

    setAmount("");
    setCategory("");
    setNote("");
  };

  return (
    <Card className="kpi-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider">Quick Add</h3>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-1">
          <Select value={type} onValueChange={(v) => setType(v as "expense" | "income")}>
            <SelectTrigger className="w-[110px] input-professional">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 input-professional"
            min="0"
            step="0.01"
            required
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-[160px] input-professional">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="sm:w-[160px] input-professional"
        />
        <Button
          type="submit"
          disabled={!amount || !category || createTransaction.isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
        >
          {createTransaction.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span className="ml-1.5">Add</span>
        </Button>
      </form>
    </Card>
  );
}
