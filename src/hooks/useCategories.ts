import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: 'income' | 'expense' | 'both' | 'investment' | 'lending'; // Added type property
  created_at: string;
}

const hardcodedCategories: Category[] = [
  // Daily Living
  { id: "cat-1", name: "Groceries", icon: "ShoppingCart", color: "#FF6384", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-2", name: "Restaurants", icon: "Utensils", color: "#36A2EB", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-3", name: "Household Supplies", icon: "Home", color: "#FFCE56", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-4", name: "Personal Care", icon: "Bath", color: "#4BC0C0", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-5", name: "Clothing", icon: "Shirt", color: "#9966FF", type: "expense", created_at: new Date().toISOString() },

  // Bills & Utilities
  { id: "cat-6", name: "Rent/Mortgage", icon: "Building", color: "#FF9F40", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-7", name: "Electricity", icon: "Zap", color: "#FF6384", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-8", name: "Water", icon: "Droplet", color: "#36A2EB", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-9", name: "Internet", icon: "Wifi", color: "#FFCE56", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-10", name: "Phone", icon: "Smartphone", color: "#4BC0C0", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-11", name: "Gas", icon: "Lightbulb", color: "#9966FF", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-12", name: "Subscriptions", icon: "Receipt", color: "#FF9F40", type: "expense", created_at: new Date().toISOString() },

  // Transportation
  { id: "cat-13", name: "Fuel", icon: "Car", color: "#FF6384", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-14", name: "Public Transport", icon: "Bus", color: "#36A2EB", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-15", name: "Vehicle Maintenance", icon: "Wrench", color: "#FFCE56", type: "expense", created_at: new Date().toISOString() },

  // Loans & EMIs
  { id: "cat-16", name: "Loans & EMIs", icon: "CreditCard", color: "#4BC0C0", type: "expense", created_at: new Date().toISOString() },

  // Insurance
  { id: "cat-17", name: "Insurance", icon: "Shield", color: "#9966FF", type: "expense", created_at: new Date().toISOString() },

  // Health & Wellness
  { id: "cat-18", name: "Doctor/Pharmacy", icon: "Stethoscope", color: "#FF9F40", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-19", name: "Gym", icon: "Dumbbell", color: "#FF6384", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-20", name: "Wellness", icon: "Heart", color: "#36A2EB", type: "expense", created_at: new Date().toISOString() },

  // Entertainment & Leisure
  { id: "cat-21", name: "Movies/Events", icon: "Film", color: "#FFCE56", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-22", name: "Travel", icon: "Plane", color: "#4BC0C0", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-23", name: "Shopping", icon: "ShoppingBag", color: "#9966FF", type: "expense", created_at: new Date().toISOString() },

  // Miscellaneous
  { id: "cat-24", name: "Gifts", icon: "Gift", color: "#FF9F40", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-25", name: "Donations", icon: "Handshake", color: "#FF6384", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-26", name: "Education", icon: "GraduationCap", color: "#36A2EB", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-27", name: "Other", icon: "MoreHorizontal", color: "#FFCE56", type: "both", created_at: new Date().toISOString() },
  { id: "cat-51", name: "Investment", icon: "LineChart", color: "#36A2EB", type: "investment", created_at: new Date().toISOString() },

  // Existing categories that might still be relevant or need to be merged
  { id: "cat-28", name: "EMI Payment", icon: "CreditCard", color: "#FF6384", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-29", name: "Mutual Funds", icon: "TrendingUp", color: "#36A2EB", type: "investment", created_at: new Date().toISOString() },
  { id: "cat-30", name: "Stocks", icon: "LineChart", color: "#FFCE56", type: "investment", created_at: new Date().toISOString() },
  { id: "cat-42", name: "Gold", icon: "PiggyBank", color: "#FFD700", type: "investment", created_at: new Date().toISOString() },
  { id: "cat-43", name: "Crypto", icon: "WalletMinimal", color: "#000000", type: "investment", created_at: new Date().toISOString() },
  { id: "cat-49", name: "Chit Funds", icon: "PiggyBank", color: "#FF8C00", type: "investment", created_at: new Date().toISOString() },
  { id: "cat-50", name: "Policy", icon: "Shield", color: "#1E90FF", type: "investment", created_at: new Date().toISOString() },
  { id: "cat-31", name: "Usne Dile", icon: "ArrowUpRight", color: "#4BC0C0", type: "lending", created_at: new Date().toISOString() },
  { id: "cat-32", name: "Usne Ghetle", icon: "ArrowDownRight", color: "#9966FF", type: "lending", created_at: new Date().toISOString() },
  { id: "cat-33", name: "Usne Prt Dile", icon: "ArrowDownLeft", color: "#FF9F40", type: "lending", created_at: new Date().toISOString() },
  { id: "cat-35", name: "Fees", icon: "FileText", color: "#36A2EB", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-36", name: "Recharges", icon: "Smartphone", color: "#FFCE56", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-37", name: "Bikes Maintense", icon: "Wrench", color: "#4BC0C0", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-38", name: "Electronics Devices", icon: "Laptop", color: "#9966FF", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-39", name: "Grooming Expense", icon: "Scissors", color: "#FF9F40", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-40", name: "Food & Drinks", icon: "Coffee", color: "#FF6384", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-41", name: "Health & Wellbeing", icon: "Heart", color: "#36A2EB", type: "expense", created_at: new Date().toISOString() },
  { id: "cat-44", name: "Salary", icon: "BriefcaseBusiness", color: "#00C853", type: "income", created_at: new Date().toISOString() },
  { id: "cat-45", name: "Freelance", icon: "Briefcase", color: "#FFD600", type: "income", created_at: new Date().toISOString() },
  { id: "cat-46", name: "Investments Income", icon: "Landmark", color: "#6200EA", type: "income", created_at: new Date().toISOString() },
  { id: "cat-47", name: "Gift Income", icon: "Gift", color: "#FF8A80", type: "income", created_at: new Date().toISOString() },
  { id: "cat-48", name: "Other Income", icon: "MoreHorizontal", color: "#757575", type: "income", created_at: new Date().toISOString() },
];

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // In a real application, you would fetch from Supabase or an API.
      // For this task, we are returning hardcoded categories.
      return hardcodedCategories;
    }
  });
}