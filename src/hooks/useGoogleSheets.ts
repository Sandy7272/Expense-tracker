import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  name: string;
}

interface SheetData {
  transactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  categoryData: Array<{ category: string; amount: number; color: string }>;
  monthlyData: Array<{ month: string; income: number; expenses: number }>;
  lastUpdated: string;
}

// Mock data for demonstration (replace with actual Google Sheets API integration)
const generateMockData = (): SheetData => {
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      date: '2024-01-15',
      category: 'Salary',
      description: 'Monthly Salary',
      amount: 5000,
      type: 'income',
      name: 'Sandy'
    },
    {
      id: '2',
      date: '2024-01-10',
      category: 'Food',
      description: 'Grocery Shopping',
      amount: 150,
      type: 'expense',
      name: 'Sandy'
    },
    {
      id: '3',
      date: '2024-01-08',
      category: 'Transport',
      description: 'Gas for car',
      amount: 80,
      type: 'expense',
      name: 'Sandy'
    },
    {
      id: '4',
      date: '2024-01-05',
      category: 'Entertainment',
      description: 'Movie tickets',
      amount: 25,
      type: 'expense',
      name: 'Sandy'
    },
    {
      id: '5',
      date: '2024-01-03',
      category: 'Bills',
      description: 'Electricity bill',
      amount: 120,
      type: 'expense',
      name: 'Sandy'
    },
    {
      id: '6',
      date: '2024-01-01',
      category: 'Freelance',
      description: 'Design project',
      amount: 800,
      type: 'income',
      name: 'Sandy'
    }
  ];

  const totalIncome = mockTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = mockTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Group expenses by category
  const categoryMap = new Map<string, number>();
  mockTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
    });

  const categoryData = Array.from(categoryMap.entries()).map(([category, amount]) => ({
    category,
    amount,
    color: `hsl(${Math.random() * 360}, 70%, 80%)`
  }));

  // Generate monthly data
  const monthlyData = [
    { month: 'Oct', income: 4800, expenses: 3200 },
    { month: 'Nov', income: 5200, expenses: 3800 },
    { month: 'Dec', income: 5500, expenses: 4100 },
    { month: 'Jan', income: totalIncome, expenses: totalExpenses }
  ];

  return {
    transactions: mockTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    totalIncome,
    totalExpenses,
    categoryData,
    monthlyData,
    lastUpdated: new Date().toLocaleString()
  };
};

export function useGoogleSheets() {
  const [data, setData] = useState<SheetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would fetch from Google Sheets API
      const sheetData = generateMockData();
      setData(sheetData);
      
      toast({
        title: "Data synchronized",
        description: "Successfully synced with Google Sheets",
      });
    } catch (err) {
      const errorMessage = 'Failed to fetch data from Google Sheets';
      setError(errorMessage);
      toast({
        title: "Sync failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'> & { date: Date }) => {
    try {
      // In a real implementation, this would add to Google Sheets
      const newTransaction: Transaction = {
        ...transaction,
        id: Date.now().toString(),
        date: transaction.date.toISOString().split('T')[0]
      };

      if (data) {
        const updatedTransactions = [newTransaction, ...data.transactions];
        const newTotalIncome = updatedTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const newTotalExpenses = updatedTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        // Update category data
        const categoryMap = new Map<string, number>();
        updatedTransactions
          .filter(t => t.type === 'expense')
          .forEach(t => {
            categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
          });

        const newCategoryData = Array.from(categoryMap.entries()).map(([category, amount]) => ({
          category,
          amount,
          color: `hsl(${Math.random() * 360}, 70%, 80%)`
        }));

        setData({
          ...data,
          transactions: updatedTransactions,
          totalIncome: newTotalIncome,
          totalExpenses: newTotalExpenses,
          categoryData: newCategoryData,
          lastUpdated: new Date().toLocaleString()
        });

        toast({
          title: "Transaction added",
          description: "Successfully added to Google Sheets",
        });
      }
    } catch (err) {
      toast({
        title: "Failed to add transaction",
        description: "Could not sync with Google Sheets",
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchData();
    
    // Simulate real-time updates - in production this would use Google Sheets API
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing data from Google Sheets...");
      fetchData();
    }, 300000); // Check every 5 minutes for real-time sync
    
    return () => clearInterval(interval);
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    addTransaction
  };
}