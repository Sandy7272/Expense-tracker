import { useState } from "react";
import { 
  Home, CreditCard, BarChart3, PiggyBank, Settings, Menu, X, RefreshCw, Users, LogOut,
  CalendarClock, Target, TrendingUp, Crown, Sun, Moon
} from "lucide-react";
import { DateRangeSelector } from "@/components/dashboard/DateRangeSelector";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { FloatingAddButton } from "@/components/dashboard/FloatingAddButton";
import { AIAssistantChat } from "@/components/ai/AIAssistantChat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useTheme } from "next-themes";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const primaryNav = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Transactions", href: "/transactions", icon: CreditCard },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Budgets", href: "/budgets", icon: Target },
];

const secondaryNav = [
  { name: "Recurring", href: "/recurring", icon: CalendarClock },
  { name: "P&L", href: "/profit-loss", icon: TrendingUp },
  { name: "Investments", href: "/investments", icon: PiggyBank },
  { name: "Lending", href: "/lending", icon: Users },
  { name: "Loans", href: "/loans", icon: CreditCard },
];

const navigation = [...primaryNav, ...secondaryNav, { name: "Settings", href: "/settings", icon: Settings }];

export function DashboardLayout({ children, onRefresh, isLoading }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isPremium, trialDaysLeft } = useSubscription();
  const { theme, setTheme } = useTheme();

  const showDateFilterAndRefresh = !['/loans', '/settings'].includes(location.pathname);
  const currentPage = navigation.find(n => n.href === location.pathname)?.name || "Dashboard";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-60 bg-card border-r border-border flex flex-col transition-transform duration-200 ease-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-5 border-b border-border shrink-0">
          <span className="text-base font-semibold text-foreground tracking-tight">FinTrack</span>
          <Button variant="ghost" size="sm" className="lg:hidden h-8 w-8 p-0" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5" aria-label="Primary navigation">
          {primaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}

          <div className="pt-5 pb-1.5 px-3">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">More</p>
          </div>

          {secondaryNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}

          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors mt-2",
              location.pathname === "/settings"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
            onClick={() => setSidebarOpen(false)}
          >
            <Settings className="h-4 w-4 shrink-0" />
            Settings
          </Link>
        </nav>

        {/* Bottom section */}
        <div className="p-3 space-y-2 border-t border-border shrink-0">
          {/* Premium upsell */}
          {!isPremium && (
            <Link
              to="/subscription"
              className="flex items-center gap-2.5 p-2.5 rounded-md bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <Crown className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary">Upgrade to Pro</p>
                <p className="text-[10px] text-muted-foreground">7-day free trial</p>
              </div>
            </Link>
          )}
          {isPremium && trialDaysLeft !== null && (
            <Link
              to="/subscription"
              className="flex items-center gap-2 p-2.5 rounded-md bg-warning/5 border border-warning/10 hover:bg-warning/10 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <Crown className="h-3.5 w-3.5 text-warning shrink-0" />
              <p className="text-[10px] text-warning font-medium">{trialDaysLeft}d trial left</p>
            </Link>
          )}

          {/* User + Theme */}
          <div className="flex items-center gap-2 p-2 rounded-md bg-accent/50">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-primary">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.email}</p>
              {isPremium && trialDaysLeft === null && (
                <Badge className="text-[9px] h-3.5 px-1 bg-primary/10 text-primary border-0">Pro</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </Button>
            <Button
              onClick={signOut}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-60">
        {/* Top header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between gap-4 px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="lg:hidden h-8 w-8 p-0" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>
              <h2 className="text-sm font-semibold text-foreground">{currentPage}</h2>
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
        <main className="p-4 sm:p-6 pb-24 md:pb-6 max-w-[1400px] mx-auto">
          {children}
        </main>
      </div>

      <MobileBottomNav />
      <FloatingAddButton />
      <AIAssistantChat />
    </div>
  );
}
