import { useState } from "react";
import { 
  Home, CreditCard, BarChart3, PiggyBank, Settings, Menu, X, RefreshCw, Users, LogOut
} from "lucide-react";
import { DateRangeSelector } from "@/components/dashboard/DateRangeSelector";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Transactions", href: "/transactions", icon: CreditCard },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Investments", href: "/investments", icon: PiggyBank },
  { name: "Lending", href: "/lending", icon: Users },
  { name: "Loans", href: "/loans", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DashboardLayout({ children, onRefresh, isLoading }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();

  const showDateFilterAndRefresh = !['/loans', '/settings'].includes(location.pathname);

  const currentPage = navigation.find(n => n.href === location.pathname)?.name || "Dashboard";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-60 bg-card border-r border-border transform transition-transform duration-200 ease-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-14 px-5 border-b border-border">
          <h1 className="text-lg font-bold text-foreground">
            💸 FinTrack
          </h1>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="mt-4 px-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className={cn("mr-3 h-4 w-4", isActive && "text-primary")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-3 right-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {user?.email}
              </p>
            </div>
            <Button onClick={signOut} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 w-8 p-0">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-60">
        {/* Top header */}
        <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center justify-between gap-4 px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="lg:hidden h-8 w-8 p-0" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>
              <h2 className="text-base font-semibold text-foreground">{currentPage}</h2>
            </div>
            
            <div className="flex items-center gap-2">
              {showDateFilterAndRefresh && <DateRangeSelector />}
              {showDateFilterAndRefresh && onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="h-8">
                  <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 max-w-[1400px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
