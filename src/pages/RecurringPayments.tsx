import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PremiumGate } from "@/components/PremiumGate";
import { useRecurringPayments, CreateRecurringPaymentData } from "@/hooks/useRecurringPayments";
import { useCategories } from "@/hooks/useCategories";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Plus, Trash2, Edit, CalendarClock, Pause, Play } from "lucide-react";
import { format, isPast, isToday, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function RecurringPayments() {
  const { payments, isLoading, createPayment, updatePayment, deletePayment } = useRecurringPayments();
  const { data: categories = [] } = useCategories();
  const { formatAmount } = useCurrency();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateRecurringPaymentData>({
    title: "", amount: 0, category: "", frequency: "monthly", next_due_date: format(new Date(), "yyyy-MM-dd"),
  });

  const handleSubmit = () => {
    if (!form.title || !form.amount || !form.category) return;
    createPayment.mutate(form);
    setAddOpen(false);
    setForm({ title: "", amount: 0, category: "", frequency: "monthly", next_due_date: format(new Date(), "yyyy-MM-dd") });
  };

  const upcoming = payments.filter(p => p.is_active && !isPast(new Date(p.next_due_date)));
  const overdue = payments.filter(p => p.is_active && isPast(new Date(p.next_due_date)) && !isToday(new Date(p.next_due_date)));
  const totalMonthly = payments.filter(p => p.is_active).reduce((s, p) => s + Number(p.amount), 0);

  return (
    <DashboardLayout>
      <PremiumGate feature="Recurring Payments">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Recurring Payments</h1>
              <p className="text-muted-foreground text-sm">Manage subscriptions and recurring bills</p>
            </div>
            <Button onClick={() => setAddOpen(true)} className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" /> Add Payment
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="kpi-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Monthly Total</p>
              <p className="text-2xl font-bold text-foreground">{formatAmount(totalMonthly)}</p>
            </Card>
            <Card className="kpi-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active</p>
              <p className="text-2xl font-bold text-success">{payments.filter(p => p.is_active).length}</p>
            </Card>
            <Card className="kpi-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Overdue</p>
              <p className="text-2xl font-bold text-expense">{overdue.length}</p>
            </Card>
          </div>

          {/* Overdue Alert */}
          {overdue.length > 0 && (
            <Card className="border-expense/30 bg-expense/5 p-4">
              <div className="flex items-center gap-2 text-expense font-medium text-sm">
                <CalendarClock className="h-4 w-4" />
                {overdue.length} payment{overdue.length > 1 ? "s" : ""} overdue
              </div>
            </Card>
          )}

          {/* Payments List */}
          <Card className="kpi-card">
            <CardHeader>
              <CardTitle className="text-lg">All Recurring Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-muted/20 rounded-lg animate-pulse" />)}
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarClock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No recurring payments yet</p>
                  <Button variant="outline" className="mt-3" onClick={() => setAddOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add your first recurring payment
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => {
                    const isOverdue = p.is_active && isPast(new Date(p.next_due_date)) && !isToday(new Date(p.next_due_date));
                    return (
                      <div key={p.id} className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-colors group",
                        isOverdue ? "border-expense/30 bg-expense/5" : "border-border/50 hover:bg-secondary/30",
                        !p.is_active && "opacity-50"
                      )}>
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium text-foreground">{p.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{p.category}</Badge>
                              <Badge variant="outline" className="text-xs">{p.frequency}</Badge>
                              {isOverdue && <Badge className="bg-expense/15 text-expense text-xs">Overdue</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-bold text-foreground">{formatAmount(Number(p.amount))}</p>
                            <p className="text-xs text-muted-foreground">
                              Due: {format(new Date(p.next_due_date), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm" variant="ghost" className="h-8 w-8 p-0"
                              onClick={() => updatePayment.mutate({
                                id: p.id, data: { is_active: !p.is_active }
                              })}
                            >
                              {p.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                              size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive"
                              onClick={() => setDeleteId(p.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Recurring Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="e.g. Netflix, Rent" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" placeholder="0.00" value={form.amount || ""} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.type === "expense" || c.type === "both").map(c => (
                      <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Next Due Date</Label>
                <Input type="date" value={form.next_due_date} onChange={e => setForm({ ...form, next_due_date: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={createPayment.isPending} className="bg-primary text-primary-foreground">
                {createPayment.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this recurring payment?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (deleteId) { deletePayment.mutate(deleteId); setDeleteId(null); } }}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PremiumGate>
    </DashboardLayout>
  );
}
