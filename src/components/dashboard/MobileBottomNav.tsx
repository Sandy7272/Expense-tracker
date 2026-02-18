import { Link, useLocation } from "react-router-dom";
import { Home, CreditCard, BarChart3, Target, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/transactions", icon: CreditCard, label: "Txns" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/budgets", icon: Target, label: "Budgets" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = location.pathname === href;
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[52px]",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className={cn("text-[10px] font-medium leading-none", isActive ? "text-primary" : "text-muted-foreground")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
