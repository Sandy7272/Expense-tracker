import { useState } from "react";
import { 
  Home, 
  CreditCard, 
  BarChart3, 
  PiggyBank, 
  Settings,
  Menu,
  X,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const navigation = [
  { name: "Home", href: "/", icon: Home, current: true },
  { name: "Transactions", href: "/transactions", icon: CreditCard, current: false },
  { name: "Reports", href: "/reports", icon: BarChart3, current: false },
  { name: "Budgets", href: "/budgets", icon: PiggyBank, current: false },
  { name: "Settings", href: "/settings", icon: Settings, current: false },
];

export function DashboardLayout({ children, onRefresh, isLoading }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-secondary/10">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card/95 backdrop-blur-md border-r border-border/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-border/50">
          <h1 className="text-xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            💰 ExpenseTracker
          </h1>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                  item.current
                    ? "bg-primary/10 text-primary shadow-sm border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className={cn(
                  "mr-3 h-5 w-5 transition-colors",
                  item.current ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )} />
                {item.name}
              </a>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-4 right-4">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20">
            <p className="text-xs text-muted-foreground font-medium">
              ✨ Synced with Google Sheets
            </p>
            <p className="text-xs text-foreground/60 mt-1">
              Real-time updates every 5 minutes
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-3"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-lg font-heading font-semibold text-foreground">
                  Dashboard
                </h2>
                <p className="text-sm text-muted-foreground">
                  Track your expenses in real-time
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}