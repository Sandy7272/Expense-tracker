import { useState } from "react";
import { 
  Home, 
  CreditCard, 
  BarChart3, 
  PiggyBank, 
  Settings,
  Menu,
  X,
  RefreshCw,
  Users,
  LogOut
} from "lucide-react";
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
  { name: "Dashboard", href: "/", icon: Home },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-primary/5 relative">
      {/* Cyber Grid Background */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,255,255,0.3) 1px, transparent 0)',
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 glass-card border-r border-white/10 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <h1 className="text-xl font-heading font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
            ⚡ Expense Tracker
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
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 cyber-button",
                  isActive
                    ? "bg-primary/20 text-primary glow-primary border border-primary/30"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className={cn(
                  "mr-3 h-5 w-5 transition-all duration-300",
                  isActive ? "text-primary animate-pulse" : "text-muted-foreground group-hover:text-primary"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-4 right-4 space-y-4">
          <div className="flex items-center gap-3 p-3 glass-card border border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {user?.email}
              </p>
            </div>
            <Button
              onClick={signOut}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="glass-card glow-primary p-4 border border-primary/30">
            <p className="text-xs text-primary font-medium">
              🚀 Live Google Sheets Sync
            </p>
            <p className="text-xs text-foreground/60 mt-1">
              Real-time cyberpunk analytics
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
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
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
                >
                  <RefreshCw className={cn("h-4 w-4 sm:mr-2", isLoading && "animate-spin")} />
                  <span className="hidden sm:inline">Refresh Data</span>
                </Button>
              )}
            </div>
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