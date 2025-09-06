import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDateRangeFilter, DateRange } from "@/hooks/useDateRangeFilter";
import { useAvailableMonths } from "@/hooks/useAvailableMonths";
import { Badge } from "@/components/ui/badge";

interface DateRangeSelectorProps {
  onDateRangeChange: (range: DateRange) => void;
}

export function DateRangeSelector({ onDateRangeChange }: DateRangeSelectorProps) {
  const { dateRange, setDateRange, presets, formatDateRange } = useDateRangeFilter();
  const { availableMonths, currentMonth } = useAvailableMonths();
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>(dateRange);

  const handlePresetSelect = (presetLabel: string) => {
    const preset = presets.find(p => p.label === presetLabel);
    if (preset) {
      setDateRange(preset.range);
      onDateRangeChange(preset.range);
      setShowCustomRange(false);
    }
  };

  const handleMonthSelect = (monthValue: string) => {
    const [year, month] = monthValue.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    
    const newRange = { from: startDate, to: endDate };
    setDateRange(newRange);
    onDateRangeChange(newRange);
    setShowCustomRange(false);
  };

  const handleCustomRangeApply = () => {
    if (tempRange.from && tempRange.to) {
      setDateRange(tempRange);
      onDateRangeChange(tempRange);
      setShowCustomRange(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/20">
        <Calendar className="h-5 w-5 text-primary" />
      </div>
      
      <div className="flex flex-col">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Date Range
        </label>
        
        <div className="flex items-center gap-2">
          {/* Quick presets */}
          <Select onValueChange={handlePresetSelect}>
            <SelectTrigger className={cn(
              "w-40 glass-card border-white/20 hover:glass-card cyber-button",
              "focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
            )}>
              <SelectValue placeholder="Quick select" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-md z-[60]">
              {presets.map((preset) => (
                <SelectItem 
                  key={preset.label} 
                  value={preset.label}
                  className="hover:bg-white/10 focus:bg-white/10 text-foreground"
                >
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Available months */}
          {availableMonths.length > 0 && (
            <Select onValueChange={handleMonthSelect}>
              <SelectTrigger className={cn(
                "w-44 glass-card border-white/20 hover:glass-card cyber-button",
                "focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              )}>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-md z-[60]">
                {availableMonths.map((month) => (
                  <SelectItem 
                    key={month.value} 
                    value={month.value}
                    className="hover:bg-white/10 focus:bg-white/10 text-foreground flex items-center justify-between"
                  >
                    <span>{month.label}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {month.transactionCount}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Custom range popover */}
          <Popover open={showCustomRange} onOpenChange={setShowCustomRange}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "glass-card border-white/20 hover:glass-card cyber-button",
                  "focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                )}
              >
                Custom <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <div className="text-sm font-medium">Custom Date Range</div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">From</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left font-normal"
                        >
                          {tempRange.from ? format(tempRange.from, "MMM d, yyyy") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={tempRange.from}
                          onSelect={(date) => date && setTempRange(prev => ({ ...prev, from: date }))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground">To</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left font-normal"
                        >
                          {tempRange.to ? format(tempRange.to, "MMM d, yyyy") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={tempRange.to}
                          onSelect={(date) => date && setTempRange(prev => ({ ...prev, to: date }))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <Button 
                  onClick={handleCustomRangeApply}
                  disabled={!tempRange.from || !tempRange.to}
                  className="w-full"
                  size="sm"
                >
                  Apply Range
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="text-xs text-muted-foreground mt-1">
          {formatDateRange(dateRange)}
        </div>
      </div>
    </div>
  );
}