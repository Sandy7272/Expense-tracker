import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Check, X, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useTransactions } from '@/hooks/useTransactions';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  confidence: number;
}

interface TransactionPreviewProps {
  transactions: Transaction[];
  onApprove: () => void;
  onCancel: () => void;
  onUpdate: (transactions: Transaction[]) => void;
}

const CATEGORIES = [
  'Food', 'Travel', 'EMI', 'Rent', 'Shopping', 'Salary', 
  'Investment', 'Entertainment', 'Bills', 'Healthcare', 
  'Education', 'Other'
];

export function TransactionPreview({ 
  transactions, 
  onApprove, 
  onCancel,
  onUpdate 
}: TransactionPreviewProps) {
  const [editedTransactions, setEditedTransactions] = useState(transactions);
  const { createTransaction } = useTransactions();
  const [isImporting, setIsImporting] = useState(false);

  const updateCategory = (index: number, category: string) => {
    const updated = [...editedTransactions];
    updated[index] = { ...updated[index], category, confidence: 1 };
    setEditedTransactions(updated);
    onUpdate(updated);
  };

  const handleImport = async () => {
    setIsImporting(true);
    
    try {
      for (const transaction of editedTransactions) {
        await createTransaction.mutateAsync({
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date,
          source: 'bank_statement',
          status: 'completed'
        });
      }
      onApprove();
    } catch (error) {
      console.error('Failed to import transactions:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const totalIncome = editedTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = editedTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const lowConfidence = editedTransactions.filter(t => t.confidence < 0.7).length;

  return (
    <Card className="glass-card p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Review Transactions</h3>
          <p className="text-sm text-muted-foreground">
            Review AI categorization and make adjustments before importing
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{editedTransactions.length}</p>
              </div>
              <Check className="h-8 w-8 text-primary opacity-50" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-success/10 to-success/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Income</p>
                <p className="text-2xl font-bold">₹{totalIncome.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success opacity-50" />
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-destructive/10 to-destructive/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-destructive opacity-50" />
            </div>
          </Card>
        </div>

        {lowConfidence > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-medium">
              {lowConfidence} transaction{lowConfidence !== 1 ? 's' : ''} with low confidence - please review
            </span>
          </div>
        )}

        {/* Transaction List */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {editedTransactions.map((transaction, index) => (
              <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {transaction.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </span>
                      {transaction.confidence < 0.7 && (
                        <Badge variant="outline" className="text-warning border-warning">
                          Low Confidence
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium truncate">{transaction.description}</p>
                    <p className="text-2xl font-bold mt-1">
                      ₹{transaction.amount.toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Select
                      value={transaction.category}
                      onValueChange={(value) => updateCategory(index, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${transaction.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(transaction.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            onClick={handleImport} 
            className="flex-1"
            disabled={isImporting}
          >
            {isImporting ? (
              <>Importing...</>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Import {editedTransactions.length} Transactions
              </>
            )}
          </Button>
          <Button onClick={onCancel} variant="outline" disabled={isImporting}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}
