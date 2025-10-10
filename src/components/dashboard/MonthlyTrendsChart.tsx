import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

interface MonthlyTrendsChartProps {
  data: MonthlyData[];
}

export function MonthlyTrendsChart({ data }: MonthlyTrendsChartProps) {
  const { formatAmount, getCurrencySymbol } = useCurrency();
  const currencySymbol = getCurrencySymbol();
  
  const CustomTooltipInternal = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-soft">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">
                {entry.dataKey === 'income' ? 'Income' : 'Expenses'}:
              </span>
              <span className="font-medium text-foreground">
                {formatAmount(entry.value)}
              </span>
            </div>
          ))}
          <div className="border-t border-border/50 mt-2 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Net:</span>
              <span className={`font-medium ${
                (payload[0].value - payload[1].value) >= 0 ? 'text-success' : 'text-expense'
              }`}>
                {formatAmount(payload[0].value - payload[1].value)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="bg-gradient-to-br from-card via-card to-background border-border/50 shadow-card hover:shadow-hover transition-all duration-300">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground">
              Monthly Trends
            </h3>
            <p className="text-sm text-muted-foreground">
              Income vs expenses over time
            </p>
          </div>
          <div className="text-2xl">📈</div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3}
              />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${currencySymbol}${value.toLocaleString()}`}
              />
              <Tooltip content={<CustomTooltipInternal />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Bar 
                dataKey="income" 
                name="Income"
                fill="hsl(var(--income))"
                radius={[4, 4, 0, 0]}
                className="hover:opacity-80 transition-opacity"
              />
              <Bar 
                dataKey="expenses" 
                name="Expenses"
                fill="hsl(var(--expense))"
                radius={[4, 4, 0, 0]}
                className="hover:opacity-80 transition-opacity"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Avg Income
            </p>
            <p className="text-lg font-semibold text-income">
              {formatAmount(data.length > 0 ? (data.reduce((sum, item) => sum + item.income, 0) / data.length) : 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Avg Expenses
            </p>
            <p className="text-lg font-semibold text-expense">
              {formatAmount(data.length > 0 ? (data.reduce((sum, item) => sum + item.expenses, 0) / data.length) : 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Best Month
            </p>
            <p className="text-lg font-semibold text-success">
              {data.length > 0 ? data.reduce((best, current) => 
                (current.income - current.expenses) > (best.income - best.expenses) ? current : best
              ).month : 'No data'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}