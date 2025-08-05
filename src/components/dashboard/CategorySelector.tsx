import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCategories, Category } from "@/hooks/useCategories";
import { 
  CreditCard, Shield, TrendingUp, LineChart, Gift, ArrowUpRight,
  ShoppingCart, Heart, Coffee, ShoppingBag, Car, Plane, Smartphone, Wrench,
  FileText, MoreHorizontal, Film, Laptop, Scissors, ArrowDownRight,
  ArrowDownLeft, Wallet, Briefcase, Building, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CategorySelectorProps {
  selectedCategory?: string;
  onCategoryChange: (category: string) => void;
  transactionType: 'income' | 'expense';
}

const iconMap: Record<string, any> = {
  CreditCard, Shield, TrendingUp, LineChart, Gift, ArrowUpRight,
  ShoppingCart, Heart, Coffee, ShoppingBag, Car, Plane, Smartphone, Wrench,
  FileText, MoreHorizontal, Film, Laptop, Scissors, ArrowDownRight,
  ArrowDownLeft, Wallet, Briefcase, Building, Plus, Fuel: Car, Bag: ShoppingBag
};

export function CategorySelector({ selectedCategory, onCategoryChange, transactionType }: CategorySelectorProps) {
  const { data: categories = [], isLoading } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter categories by type and search term
  const filteredCategories = categories.filter(category => {
    // For now, show all categories regardless of type since the existing data doesn't have type
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Group categories by common types
  const expenseCategories = filteredCategories.filter(cat => 
    ['EMI', 'Insurance', 'Mutual Funds', 'Petrol', 'Groceries', 'Shopping', 'Travel', 'Food & Drinks', 'Health & Wellbeing', 'Entertainment', 'Electronics Devices', 'Grooming Expense', 'Fees', 'Others', 'Recharges', 'Bikes Maintense'].some(expense => 
      cat.name.toLowerCase().includes(expense.toLowerCase())
    )
  );

  const lendingCategories = filteredCategories.filter(cat =>
    ['Usne Dile', 'Usne Ghetle', 'Usne Prt Dile'].some(lending =>
      cat.name.toLowerCase().includes(lending.toLowerCase())
    )
  );

  const investmentCategories = filteredCategories.filter(cat =>
    ['Stocks', 'Bhishi'].some(investment =>
      cat.name.toLowerCase().includes(investment.toLowerCase())
    )
  );

  const otherCategories = filteredCategories.filter(cat =>
    !expenseCategories.includes(cat) && 
    !lendingCategories.includes(cat) && 
    !investmentCategories.includes(cat)
  );

  const renderCategoryButton = (category: Category) => {
    const IconComponent = iconMap[category.icon || 'MoreHorizontal'] || MoreHorizontal;
    const isSelected = selectedCategory === category.name;

    return (
      <Button
        key={category.id}
        variant="outline"
        className={cn(
          "category-button btn-professional h-auto",
          isSelected && "selected"
        )}
        onClick={() => onCategoryChange(category.name)}
      >
        <div className="flex flex-col items-center space-y-2">
          <div 
            className="p-2 rounded-lg"
            style={{ 
              backgroundColor: isSelected ? 'currentColor' : (category.color || 'hsl(var(--muted))'),
              color: isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))'
            }}
          >
            <IconComponent className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-center leading-tight">
            {category.name}
          </span>
        </div>
      </Button>
    );
  };

  const renderCategoryGroup = (title: string, categories: Category[]) => {
    if (categories.length === 0) return null;

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        <div className="category-grid">
          {categories.map(renderCategoryButton)}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="category-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="category-button loading-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">
          Select Category
        </label>
        <p className="text-xs text-muted-foreground">
          Choose a category for your {transactionType}
        </p>
      </div>

      <ScrollArea className="h-96 pr-4">
        <div className="space-y-6">
          {renderCategoryGroup("Daily Expenses", expenseCategories)}
          
          {lendingCategories.length > 0 && (
            <>
              <Separator />
              {renderCategoryGroup("Lending & Borrowing", lendingCategories)}
            </>
          )}
          
          {investmentCategories.length > 0 && (
            <>
              <Separator />
              {renderCategoryGroup("Investments", investmentCategories)}
            </>
          )}
          
          {otherCategories.length > 0 && (
            <>
              <Separator />
              {renderCategoryGroup("Other", otherCategories)}
            </>
          )}
        </div>
      </ScrollArea>

      {selectedCategory && (
        <div className="p-3 rounded-lg bg-accent/20 border border-accent/30">
          <p className="text-sm text-accent-foreground">
            <span className="font-medium">Selected:</span> {selectedCategory}
          </p>
        </div>
      )}
    </div>
  );
}