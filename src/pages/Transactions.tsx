import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/currency";
import { Search, Filter, Download, Plus, Eye, Edit, Trash2, RefreshCw, Database, Upload } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import type { Transaction } from "@/hooks/useTransactions";
import { AddExpenseModal } from "@/components/dashboard/AddExpenseModal";
import { useGoogleSheetsSync } from "@/hooks/useGoogleSheetsSync";
import { useSettings } from "@/hooks/useSettings";
import { CsvImporter } from "@/components/CsvImporter";
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

export default function Transactions() {
  const { transactions, isLoading, deleteTransaction, createTransaction, bulkDeleteTransactions } = useTransactions();
  const { syncData, isSyncing } = useGoogleSheetsSync();
  const { settings } = useSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const handleCsvImport = async (importedTransactions: any[]) => {
    const promises = importedTransactions.map(tx => 
      createTransaction.mutateAsync({
        ...tx,
        source: 'csv'
      })
    );
    await Promise.all(promises);
  };

  const handleSelectTransaction = (transactionId: string, checked: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (checked) {
      newSelected.add(transactionId);
    } else {
      newSelected.delete(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(new Set(filteredTransactions.map(tx => tx.id)));
    } else {
      setSelectedTransactions(new Set());
    }
  };

  const handleBulkDelete = async () => {
    const transactionIds = Array.from(selectedTransactions);
    await bulkDeleteTransactions.mutateAsync(transactionIds);
    setSelectedTransactions(new Set());
    setBulkDeleteOpen(false);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const desc = (transaction.description || "").toLowerCase();
    const cat = (transaction.category || "").toLowerCase();
    const type = (transaction.type || "").toLowerCase();
    const matchesSearch =
      desc.includes(searchTerm.toLowerCase()) ||
      cat.includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || transaction.category === categoryFilter;
    const matchesType = typeFilter === "all" || type === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  const categories = [...new Set(transactions.map(t => t.category))];

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'income': return 'bg-income text-income-foreground';
      case 'expense': return 'bg-expense text-expense-foreground';
      case 'investment': return 'bg-investment text-investment-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Transactions</h1>
            <p className="text-muted-foreground">Manage and track all your financial transactions</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => syncData.mutate(settings?.sheet_url)}
              disabled={!settings?.google_access_token || !settings?.sheet_url || isSyncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Sheets'}
            </Button>
            <Button
              onClick={() => setCsvImportOpen(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </Button>
            <Button className="add-transaction-btn" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="btn-professional">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  {filteredTransactions.length} of {transactions.length} transactions
                  {selectedTransactions.size > 0 && ` • ${selectedTransactions.size} selected`}
                </CardDescription>
              </div>
              {selectedTransactions.size > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setBulkDeleteOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedTransactions.size})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted/20 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Select All Header */}
                {filteredTransactions.length > 0 && (
                  <div className="flex items-center gap-4 p-2 border-b">
                    <Checkbox
                      checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">
                      Select All ({filteredTransactions.length})
                    </span>
                  </div>
                )}
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 rounded-lg border glass-card hover:glow-primary transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedTransactions.has(transaction.id)}
                          onCheckedChange={(checked) => handleSelectTransaction(transaction.id, checked as boolean)}
                        />
                        <div className="w-2 h-12 rounded-full bg-gradient-to-b from-primary to-accent"></div>
                        <div>
                          <h3 className="font-semibold text-foreground">{transaction.description}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getTypeColor(transaction.type)}>
                              {transaction.type}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{transaction.category}</span>
                            {(transaction.source === 'google_sheets' || transaction.source === 'csv') && (
                              <>
                                <span className="text-sm text-muted-foreground">•</span>
                                <Badge variant="outline" className="text-xs">
                                  {transaction.source === 'google_sheets' ? (
                                    <><Database className="h-3 w-3 mr-1" />Sheets</>
                                  ) : (
                                    <><Upload className="h-3 w-3 mr-1" />CSV</>
                                  )}
                                </Badge>
                              </>
                            )}
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">{transaction.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            transaction.type === 'income' ? 'text-income' : 'text-expense'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                          </div>
                          <div className="text-sm text-muted-foreground">{transaction.person || ""}</div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedTx(transaction);
                              setAddOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => {
                              setTxToDelete(transaction);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <AddExpenseModal
          open={addOpen}
          onOpenChange={(open) => {
            setAddOpen(open)
            if (!open) setSelectedTx(null)
          }}
          transaction={selectedTx ?? undefined}
        />

        <Dialog open={csvImportOpen} onOpenChange={setCsvImportOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import CSV Transactions</DialogTitle>
            </DialogHeader>
            <CsvImporter 
              onImport={handleCsvImport}
              onClose={() => setCsvImportOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the transaction
                {txToDelete?.description ? ` "${txToDelete.description}"` : ""} with amount {formatCurrency(Math.abs(txToDelete?.amount ?? 0))}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (txToDelete) {
                    deleteTransaction.mutate(txToDelete.id, {
                      onSuccess: () => {
                        setDeleteOpen(false)
                        setTxToDelete(null)
                      },
                    })
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete selected transactions?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete {selectedTransactions.size} transaction{selectedTransactions.size !== 1 ? 's' : ''}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkDelete}>
                Delete {selectedTransactions.size} Transaction{selectedTransactions.size !== 1 ? 's' : ''}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}