import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface BudgetSuggestion {
  category: string;
  avg_spending: number;
  suggested_budget: number;
  rationale: string;
  trend: "increasing" | "decreasing" | "stable";
}

interface AiBudgetSuggestionsProps {
  transactions: any[];
  existingBudgetCategories: Set<string>;
  onAccept: (category: string, limit: number) => void;
}

export function AiBudgetSuggestions({ transactions, existingBudgetCategories, onAccept }: AiBudgetSuggestionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<BudgetSuggestion[]>([]);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);
  const { formatAmount } = useCurrency();
  const { toast } = useToast();

  const analyze = async () => {
    if (transactions.length === 0) {
      toast({ title: "No transactions found", description: "Add some transactions first to get AI suggestions.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setSuggestions([]);

    // Build last 3 months summary
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentExpenses = transactions.filter(t =>
      t.type === "expense" && new Date(t.date) >= threeMonthsAgo
    );

    // Group by category per month
    const categoryData: Record<string, number[]> = {};
    recentExpenses.forEach(t => {
      if (!categoryData[t.category]) categoryData[t.category] = [];
      categoryData[t.category].push(Number(t.amount));
    });

    const summary = Object.entries(categoryData).map(([cat, amounts]) => ({
      category: cat,
      total: amounts.reduce((a, b) => a + b, 0),
      count: amounts.length,
      avg: amounts.reduce((a, b) => a + b, 0) / 3, // average per month over 3 months
    }));

    try {
      const { data, error } = await supabase.functions.invoke("ai-finance-assistant", {
        body: {
          mode: "budget_suggestions",
          messages: [{ role: "user", content: JSON.stringify(summary) }],
        },
      });
      if (error) throw error;

      const parsed: BudgetSuggestion[] = JSON.parse(data.result);
      // Filter out categories that already have budgets
      const filtered = parsed.filter(s => !existingBudgetCategories.has(s.category));
      setSuggestions(filtered);
      setExpanded(true);

      if (filtered.length === 0) {
        toast({ title: "All categories budgeted!", description: "You already have budgets set for your spending categories." });
      }
    } catch (e) {
      console.error("Budget suggestion error:", e);
      toast({ title: "Could not generate suggestions", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = (s: BudgetSuggestion) => {
    onAccept(s.category, s.suggested_budget);
    setAccepted(prev => new Set([...prev, s.category]));
    toast({ title: `✅ Budget set!`, description: `${s.category}: ${formatAmount(s.suggested_budget)}/month` });
  };

  const handleAcceptAll = () => {
    suggestions.filter(s => !accepted.has(s.category)).forEach(s => handleAccept(s));
  };

  return (
    <Card className="kpi-card p-5 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">AI Budget Suggestions</p>
            <p className="text-xs text-muted-foreground">Based on your last 3 months spending</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {suggestions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-muted-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
          <Button
            size="sm"
            className="h-8 bg-primary text-primary-foreground text-xs px-3"
            onClick={analyze}
            disabled={isLoading}
          >
            {isLoading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Analyzing...</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5 mr-1.5" />
                {suggestions.length > 0 ? "Re-analyze" : "Analyze Spending"}</>
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3">
              {/* Accept All */}
              {suggestions.some(s => !accepted.has(s.category)) && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-primary/30 text-primary"
                    onClick={handleAcceptAll}
                  >
                    Accept All Suggestions
                  </Button>
                </div>
              )}

              {suggestions.map(s => (
                <motion.div
                  key={s.category}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "rounded-xl border p-3.5 transition-all",
                    accepted.has(s.category)
                      ? "border-income/30 bg-income/5 opacity-60"
                      : "border-border/50 bg-card/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground truncate">{s.category}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] h-4 px-1.5 border-0",
                            s.trend === "increasing" ? "bg-expense/10 text-expense" :
                            s.trend === "decreasing" ? "bg-income/10 text-income" :
                            "bg-muted text-muted-foreground"
                          )}
                        >
                          {s.trend === "increasing" ? "↑ Rising" : s.trend === "decreasing" ? "↓ Falling" : "→ Stable"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 leading-relaxed">{s.rationale}</p>
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">3-Month Avg</p>
                          <p className="text-sm font-medium text-foreground">{formatAmount(s.avg_spending)}</p>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Suggested Budget</p>
                          <p className="text-sm font-bold text-primary">{formatAmount(s.suggested_budget)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {accepted.has(s.category) ? (
                        <div className="flex items-center gap-1.5 text-income">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs font-medium">Accepted</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="h-8 px-3 bg-primary text-primary-foreground text-xs"
                          onClick={() => handleAccept(s)}
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Accept
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
