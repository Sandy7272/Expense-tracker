import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Plus, Calendar, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  name?: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  onAddNew?: () => void;
}

export function RecentTransactions({ transactions, onAddNew }: RecentTransactionsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: Record<string, string> = {
      'Food': '🍕',
      'Transport': '🚗',
      'Entertainment': '🎬',
      'Shopping': '🛍️',
      'Bills': '⚡',
      'Health': '🏥',
      'Education': '📚',
      'Travel': '✈️',
      'Salary': '💰',
      'Freelance': '💻',
      'Investment': '📈',
      'Other': '📝'
    };
    return emojiMap[category] || '📝';
  };

  return (
    <Card className="bg-gradient-to-br from-card via-card to-background border-border/50 shadow-card hover:shadow-hover transition-all duration-300">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground">
              Recent Transactions
            </h3>
            <p className="text-sm text-muted-foreground">
              Latest {transactions.length} entries from your sheet
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button 
              onClick={onAddNew}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div 
              key={transaction.id}
              className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-border/30 group"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                    transaction.type === 'income' 
                      ? "bg-income/10 border border-income/20" 
                      : "bg-expense/10 border border-expense/20"
                  )}>
                    {getCategoryEmoji(transaction.category)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground truncate">
                      {transaction.description}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        transaction.type === 'income' 
                          ? "border-income/30 text-income" 
                          : "border-expense/30 text-expense"
                      )}
                    >
                      {transaction.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(transaction.date)}
                    </span>
                    {transaction.name && (
                      <span>• {transaction.name}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={cn(
                    "font-semibold text-lg",
                    transaction.type === 'income' ? "text-income" : "text-expense"
                  )}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.type === 'income' ? 'Income' : 'Expense'}
                  </p>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h4 className="text-lg font-semibold text-foreground mb-2">
              No transactions yet
            </h4>
            <p className="text-muted-foreground mb-4">
              Start by adding your first transaction
            </p>
            <Button onClick={onAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}