import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCategories, Category } from "@/hooks/useCategories";
import { 
  CreditCard, Shield, TrendingUp, LineChart, Gift, ArrowUpRight,
  ShoppingCart, Heart, Coffee, ShoppingBag, Car, Plane, Smartphone, Wrench,
  FileText, MoreHorizontal, Film, Laptop, Scissors, ArrowDownRight,
  ArrowDownLeft, Wallet, Briefcase, Building, Plus, Utensils, Home, Droplet,
  Wifi, Receipt, Bus, Stethoscope, Dumbbell, BookOpen, Zap, PiggyBank,
  GraduationCap, Handshake, BriefcaseBusiness, Landmark, WalletMinimal,
  Ticket, Shirt, Soup, Sprout, Lightbulb, Package, Bath,
  Dna, Microscope, Palette, Puzzle, Rocket, ScrollText,
  Sparkles, Sun, Tent, TreePine, Umbrella, Users,
  Vegan, Volume2, Waves, Wheat, Wine, X,
  ZapOff, ZoomIn, ZoomOut,
 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategorySelectorProps {
  selectedCategory?: string;
  onCategoryChange: (category: string) => void;
  transactionType: 'income' | 'expense' | 'investment';
}

const iconMap: Record<string, any> = {
  CreditCard, Shield, TrendingUp, LineChart, Gift, ArrowUpRight,
  ShoppingCart, Heart, Coffee, ShoppingBag, Car, Plane, Smartphone, Wrench,
  FileText, MoreHorizontal, Film, Laptop, Scissors, ArrowDownRight,
  ArrowDownLeft, Wallet, Briefcase, Building, Plus, Utensils, Home, Droplet,
  Wifi, Receipt, Bus, Stethoscope, Dumbbell, BookOpen, Zap, PiggyBank,
  GraduationCap, Handshake, BriefcaseBusiness, Landmark, WalletMinimal,
  Ticket, Shirt, Soup, Sprout, Lightbulb, Package, Bath,
  Dna, Microscope, Palette, Puzzle, Rocket, ScrollText,
  Sparkles, Sun, Tent, TreePine, Umbrella, Users,
  Vegan, Volume2, Waves, Wheat, Wine, X,
  ZapOff, ZoomIn, ZoomOut,
  // Direct mappings for category icons
  Fuel: Car,
  Bag: ShoppingBag,
  Electricity: Zap,
  Water: Droplet,
  Internet: Wifi,
  Phone: Smartphone,
  Gas: Lightbulb,
  Subscriptions: Receipt,
  PublicTransport: Bus,
  VehicleMaintenance: Wrench,
  DoctorPharmacy: Stethoscope,
  Gym: Dumbbell,
  Wellness: Heart,
  MoviesEvents: Film,
  Travel: Plane,
  Shopping: ShoppingBag,
  Donations: Gift,
  Education: BookOpen,
  Other: MoreHorizontal,
  Groceries: ShoppingCart,
  Restaurants: Utensils,
  HouseholdSupplies: Home,
  PersonalCare: Bath,
  Clothing: Shirt,
  RentMortgage: Building,
  LoansEMIs: CreditCard,
  Insurance: Shield,
  HealthWellness: Heart,
  EntertainmentLeisure: Film,
  Miscellaneous: MoreHorizontal,
  EMI: CreditCard,
  MutualFunds: TrendingUp,
  Stocks: LineChart,
  UsneDile: ArrowUpRight,
  UsneGhetle: ArrowDownRight,
  UsnePrtDile: ArrowDownLeft,
  ChitFunds: PiggyBank,
  Policy: Shield,
  Fees: FileText,
  Recharges: Smartphone,
  BikesMaintense: Wrench,
  ElectronicsDevices: Laptop,
  GroomingExpense: Scissors,
  FoodDrinks: Coffee,
  HealthWellbeing: Heart,
  Gold: PiggyBank,
  Crypto: WalletMinimal,
  Salary: BriefcaseBusiness,
  Freelance: Briefcase,
  InvestmentsIncome: Landmark,
  GiftIncome: Gift,
  OtherIncome: MoreHorizontal,
};

export function CategorySelector({ selectedCategory, onCategoryChange, transactionType }: CategorySelectorProps) {
  const { data: categories = [], isLoading } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter categories by type and search term
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      category.type === 'both' ||
      category.type === transactionType;
    return matchesSearch && matchesType;
  });

  // Group categories by common types
  const incomeCategories = filteredCategories.filter(cat =>
    ['Salary', 'Freelance', 'Investments Income', 'Gift Income', 'Other Income'].some(name =>
      cat.name.toLowerCase().includes(name.toLowerCase())
    )
  );

  const dailyLivingCategories = filteredCategories.filter(cat =>
    ['Groceries', 'Restaurants', 'Household Supplies', 'Personal Care', 'Clothing'].some(name =>
      cat.name.toLowerCase().includes(name.toLowerCase())
    )
  );

  const billsUtilitiesCategories = filteredCategories.filter(cat =>
    ['Rent/Mortgage', 'Electricity', 'Water', 'Internet', 'Phone', 'Gas', 'Subscriptions'].some(name =>
      cat.name.toLowerCase().includes(name.toLowerCase())
    )
  );

  const transportationCategories = filteredCategories.filter(cat =>
    ['Fuel', 'Public Transport', 'Vehicle Maintenance'].some(name =>
      cat.name.toLowerCase().includes(name.toLowerCase())
    )
  );

  const loansEMIsCategories = filteredCategories.filter(cat =>
    ['Loans & EMIs', 'EMI Payment'].some(name =>
      cat.name.toLowerCase().includes(name.toLowerCase())
    )
  );

  const insuranceCategories = filteredCategories.filter(cat =>
    ['Insurance'].some(name =>
      cat.name.toLowerCase().includes(name.toLowerCase())
    )
  );

  const healthWellnessCategories = filteredCategories.filter(cat =>
    ['Doctor/Pharmacy', 'Gym', 'Wellness', 'Health & Wellbeing'].some(name =>
      cat.name.toLowerCase().includes(name.toLowerCase())
    )
  );

  const entertainmentLeisureCategories = filteredCategories.filter(cat =>
    ['Movies/Events', 'Travel', 'Shopping', 'Entertainment', 'Food & Drinks'].some(name =>
      cat.name.toLowerCase().includes(name.toLowerCase())
    )
  );

  const investmentCategories = filteredCategories.filter(cat =>
    ['Mutual Funds', 'Stocks', 'Crypto', 'Gold', 'Chit Funds', 'Policy', 'Investment'].some(name =>
      cat.name.toLowerCase().includes(name.toLowerCase())
    )
  );

  const lendingBorrowingCategories = filteredCategories.filter(cat =>
    ['Usne Dile', 'Usne Ghetle', 'Usne Prt Dile'].some(name =>
      cat.name.toLowerCase().includes(name.toLowerCase())
    )
  );

  const miscellaneousCategories = filteredCategories.filter(cat =>
    ['Gifts', 'Donations', 'Education', 'Other', 'Fees', 'Recharges', 'Bikes Maintense', 'Electronics Devices', 'Grooming Expense'].some(name =>
      cat.name.toLowerCase().includes(name.toLowerCase())
    )
  );

  const allGroupedCategories = [
    ...incomeCategories,
    ...dailyLivingCategories,
    ...billsUtilitiesCategories,
    ...transportationCategories,
    ...loansEMIsCategories,
    ...insuranceCategories,
    ...healthWellnessCategories,
    ...entertainmentLeisureCategories,
    ...investmentCategories,
    ...lendingBorrowingCategories,
    ...miscellaneousCategories,
  ];

  const otherCategories = filteredCategories.filter(cat =>
    !allGroupedCategories.includes(cat)
  );

  const renderCategoryButton = (category: Category) => {
    const IconComponent = iconMap[category.icon || 'MoreHorizontal'] || MoreHorizontal;
    const isSelected = selectedCategory === category.name;

    return (
      <Button
        key={category.id}
        type="button"
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
            {category.name.includes('/') ? (
              <>
                {category.name.split('/')[0]}
                <br />
                {category.name.split('/').slice(1).join('/')}
              </>
            ) : category.name.includes(' ') ? (
              <>
                {category.name.split(' ')[0]}
                <br />
                {category.name.split(' ').slice(1).join(' ')}
              </>
            ) : (
              category.name
            )}
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
        <div>
          {(() => {
            const groups =
              transactionType === 'expense'
                ? [
                    { title: "Daily Living", categories: dailyLivingCategories },
                    { title: "Bills & Utilities", categories: billsUtilitiesCategories },
                    { title: "Transportation", categories: transportationCategories },
                    { title: "Loans & EMIs", categories: loansEMIsCategories },
                    { title: "Insurance", categories: insuranceCategories },
                    { title: "Health & Wellness", categories: healthWellnessCategories },
                    { title: "Entertainment & Leisure", categories: entertainmentLeisureCategories },
                    { title: "Investments", categories: investmentCategories },
                    { title: "Lending & Borrowing", categories: lendingBorrowingCategories },
                    { title: "Miscellaneous", categories: miscellaneousCategories },
                  ]
              : transactionType === 'investment'
              ? [
                  { title: "Investments", categories: investmentCategories },
                ]
              : [{ title: "Income", categories: incomeCategories }];

            if (otherCategories.length > 0) {
              groups.push({ title: "Uncategorized", categories: otherCategories });
            }

            const visibleGroups = groups.filter(g => g.categories.length > 0);

            return visibleGroups.map((group, index) => (
              <div key={group.title}>
                {renderCategoryGroup(group.title, group.categories)}
                {index < visibleGroups.length - 1 && <Separator className="my-6" />}
              </div>
            ));
          })()}
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