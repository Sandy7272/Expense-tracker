import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/currency";
import { Plus, Calendar, DollarSign, Trash2 } from "lucide-react";
import { type Loan } from "@/hooks/useLoans";
import { useLoanPayments } from "@/hooks/useLoanPayments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LoanDetailsModalProps {
  loan: Loan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoanDetailsModal({ loan, open, onOpenChange }: LoanDetailsModalProps) {
  const { payments, createPayment, deletePayment, loanStats } = useLoanPayments(loan.id);
  const [newPayment, setNewPayment] = useState({
    amount_paid: "",
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: "",
    notes: "",
  });
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPayment.mutateAsync({
      loan_id: loan.id,
      amount_paid: parseFloat(newPayment.amount_paid),
      payment_date: newPayment.payment_date,
      payment_method: newPayment.payment_method || undefined,
      notes: newPayment.notes || undefined,
    });
    setNewPayment({
      amount_paid: "",
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: "",
      notes: "",
    });
  };

  const totalExpectedPayment = loan.monthly_emi * loan.tenure_months;
  const remainingAmount = Math.max(0, loan.principal_amount - loanStats.totalPaid);
  const interestPaid = loanStats.totalPaid - Math.min(loanStats.totalPaid, loan.principal_amount);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {loan.loan_name}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Loan Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Loan Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Principal Amount:</span>
                      <span className="font-semibold">{formatCurrency(loan.principal_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interest Rate:</span>
                      <span className="font-semibold">{loan.interest_rate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tenure:</span>
                      <span className="font-semibold">{loan.tenure_months} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly EMI:</span>
                      <span className="font-semibold">{formatCurrency(loan.monthly_emi)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date:</span>
                      <span className="font-semibold">{new Date(loan.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={loan.status === 'active' ? 'bg-success' : 'bg-muted'}>
                        {loan.status}
                      </Badge>
                    </div>
                    {loan.lender_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lender:</span>
                        <span className="font-semibold">{loan.lender_name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Paid:</span>
                      <span className="font-semibold text-success">{formatCurrency(loanStats.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Remaining Amount:</span>
                      <span className="font-semibold text-destructive">{formatCurrency(remainingAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payments Made:</span>
                      <span className="font-semibold">{loanStats.paymentCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expected Total:</span>
                      <span className="font-semibold">{formatCurrency(totalExpectedPayment)}</span>
                    </div>
                    {loanStats.lastPaymentDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Payment:</span>
                        <span className="font-semibold">{new Date(loanStats.lastPaymentDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground">Progress:</span>
                      <span className="font-semibold">
                        {Math.round((loanStats.totalPaid / loan.principal_amount) * 100)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              {/* Add Payment Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Record New Payment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddPayment} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="amount">Amount Paid *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={newPayment.amount_paid}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, amount_paid: e.target.value }))}
                        placeholder={loan.monthly_emi.toString()}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">Payment Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newPayment.payment_date}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, payment_date: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="method">Payment Method</Label>
                      <Input
                        id="method"
                        value={newPayment.payment_method}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, payment_method: e.target.value }))}
                        placeholder="Bank transfer, Cash, etc."
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" disabled={createPayment.isPending}>
                        {createPayment.isPending ? "Adding..." : "Add Payment"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No payments recorded yet
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(payment.amount_paid)}</TableCell>
                            <TableCell>{payment.payment_method || '-'}</TableCell>
                            <TableCell>{payment.notes || '-'}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-destructive"
                                onClick={() => setDeletePaymentId(payment.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePaymentId} onOpenChange={() => setDeletePaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this payment record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletePaymentId) {
                  deletePayment.mutate(deletePaymentId, {
                    onSuccess: () => setDeletePaymentId(null)
                  });
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}