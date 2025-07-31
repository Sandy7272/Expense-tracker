import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: string[];
}

export function MonthSelector({ selectedMonth, onMonthChange, availableMonths }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/20">
        <Calendar className="h-5 w-5 text-primary" />
      </div>
      
      <div className="flex flex-col">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          View Month
        </label>
        <Select value={selectedMonth} onValueChange={onMonthChange}>
          <SelectTrigger className={cn(
            "w-48 glass-card border-white/20 hover:glass-card cyber-button",
            "focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
          )}>
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent className="glass-card border-white/20 backdrop-blur-xl">
            {availableMonths.map((month) => (
              <SelectItem 
                key={month} 
                value={month}
                className="hover:bg-white/10 focus:bg-white/10 text-foreground"
              >
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}