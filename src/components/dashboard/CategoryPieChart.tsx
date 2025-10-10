import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";

interface CategoryData {
  category: string;
  amount: number;
  color: string;
}

interface CategoryPieChartProps {
  data: CategoryData[];
}

const PASTEL_COLORS = [
  "hsl(150, 40%, 75%)", // Mint green
  "hsl(210, 50%, 88%)", // Soft blue
  "hsl(330, 40%, 85%)", // Gentle pink
  "hsl(45, 85%, 75%)",  // Warm yellow
  "hsl(280, 40%, 80%)", // Lavender
  "hsl(15, 60%, 80%)",  // Peach
  "hsl(190, 50%, 80%)", // Sky blue
  "hsl(120, 30%, 75%)", // Sage green
];

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const { formatAmount } = useCurrency();
  
  const CustomTooltipInternal = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / data.payload.total) * 100).toFixed(1);
      
      return (
        <div className="bg-card/95 backdrop-blur-md border border-border/50 rounded-xl p-3 shadow-soft">
          <p className="font-medium text-foreground">{data.payload.category}</p>
          <p className="text-sm text-muted-foreground">
            {formatAmount(data.value)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Add total to each data point for percentage calculation
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const chartData = data.map((item, index) => ({
    ...item,
    total,
    fill: PASTEL_COLORS[index % PASTEL_COLORS.length]
  }));

  return (
    <Card className="bg-gradient-to-br from-card via-card to-background border-border/50 shadow-card hover:shadow-hover transition-all duration-300">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground">
              Spending by Category
            </h3>
            <p className="text-sm text-muted-foreground">
              Your expense breakdown this month
            </p>
          </div>
          <div className="text-2xl">🥧</div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="amount"
                animationBegin={0}
                animationDuration={1000}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill}
                    stroke={entry.fill}
                    strokeWidth={2}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltipInternal />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {chartData.slice(0, 6).map((item, index) => (
            <div key={item.category} className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.fill }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.category}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatAmount(item.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}