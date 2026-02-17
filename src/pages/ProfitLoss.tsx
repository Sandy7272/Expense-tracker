import { useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PremiumGate } from "@/components/PremiumGate";
import { useTransactions } from "@/hooks/useTransactions";
import { useCurrency } from "@/contexts/CurrencyContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, FileText, Download } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

export default function ProfitLoss() {
  const { transactions } = useTransactions();
  const { formatAmount, getCurrencySymbol } = useCurrency();
  const currencySymbol = getCurrencySymbol();

  const plData = useMemo(() => {
    const now = new Date();
    const months: { month: string; revenue: number; expenses: number; net: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const monthLabel = format(d, "MMM yyyy");

      const monthTxs = transactions.filter(t => {
        const td = new Date(t.date);
        return td >= start && td <= end;
      });

      const revenue = monthTxs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const expenses = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
      months.push({ month: monthLabel, revenue, expenses, net: revenue - expenses });
    }
    return months;
  }, [transactions]);

  const current = plData[plData.length - 1] || { revenue: 0, expenses: 0, net: 0 };
  const taxEstimate = Math.max(0, current.net * 0.3); // 30% estimate
  const profitMargin = current.revenue > 0 ? (current.net / current.revenue) * 100 : 0;

  const handleDownloadCSV = () => {
    const csv = [
      ["Month", "Revenue", "Expenses", "Net Profit"],
      ...plData.map(d => [d.month, d.revenue, d.expenses, d.net]),
    ].map(r => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profit-loss-${format(new Date(), "yyyy-MM")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <PremiumGate feature="Profit & Loss">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Profit & Loss</h1>
              <p className="text-muted-foreground text-sm">Business-grade financial overview</p>
            </div>
            <Button variant="outline" onClick={handleDownloadCSV}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="kpi-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-income" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Revenue</p>
              </div>
              <p className="text-xl font-bold text-income">{formatAmount(current.revenue)}</p>
            </Card>
            <Card className="kpi-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-expense" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Expenses</p>
              </div>
              <p className="text-xl font-bold text-expense">{formatAmount(current.expenses)}</p>
            </Card>
            <Card className="kpi-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Net Profit</p>
              </div>
              <p className={cn("text-xl font-bold", current.net >= 0 ? "text-success" : "text-expense")}>
                {formatAmount(current.net)}
              </p>
            </Card>
            <Card className="kpi-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-warning" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Tax Estimate</p>
              </div>
              <p className="text-xl font-bold text-warning">{formatAmount(taxEstimate)}</p>
              <p className="text-xs text-muted-foreground mt-1">~30% of net profit</p>
            </Card>
          </div>

          {/* Profit Margin */}
          <Card className="kpi-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                <p className={cn("text-3xl font-bold", profitMargin >= 0 ? "text-success" : "text-expense")}>
                  {profitMargin.toFixed(1)}%
                </p>
              </div>
              <div className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium",
                profitMargin >= 20 ? "bg-success/15 text-success" :
                profitMargin >= 0 ? "bg-warning/15 text-warning" :
                "bg-expense/15 text-expense"
              )}>
                {profitMargin >= 20 ? "Healthy" : profitMargin >= 0 ? "Moderate" : "Loss"}
              </div>
            </div>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="kpi-card p-6">
              <h3 className="text-lg font-semibold mb-4">Revenue vs Expenses</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={plData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} tickFormatter={v => `${currencySymbol}${v.toLocaleString()}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                      }}
                      formatter={(value: number) => [formatAmount(value)]}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="kpi-card p-6">
              <h3 className="text-lg font-semibold mb-4">Net Profit Trend</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={plData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} tickFormatter={v => `${currencySymbol}${v.toLocaleString()}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.75rem",
                      }}
                      formatter={(value: number) => [formatAmount(value)]}
                    />
                    <Line type="monotone" dataKey="net" name="Net Profit" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 5, fill: "hsl(var(--primary))" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Monthly Breakdown Table */}
          <Card className="kpi-card p-6">
            <h3 className="text-lg font-semibold mb-4">Monthly Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Month</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Revenue</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Expenses</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Net Profit</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {plData.map((row) => {
                    const margin = row.revenue > 0 ? (row.net / row.revenue) * 100 : 0;
                    return (
                      <tr key={row.month} className="border-b border-border/30 hover:bg-secondary/20">
                        <td className="py-3 px-2 font-medium">{row.month}</td>
                        <td className="py-3 px-2 text-right text-income">{formatAmount(row.revenue)}</td>
                        <td className="py-3 px-2 text-right text-expense">{formatAmount(row.expenses)}</td>
                        <td className={cn("py-3 px-2 text-right font-semibold", row.net >= 0 ? "text-success" : "text-expense")}>
                          {formatAmount(row.net)}
                        </td>
                        <td className={cn("py-3 px-2 text-right", margin >= 0 ? "text-success" : "text-expense")}>
                          {margin.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </PremiumGate>
    </DashboardLayout>
  );
}
