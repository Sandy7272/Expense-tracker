import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrency } from "@/contexts/CurrencyContext";
import { User, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PersonLending {
  name: string;
  amount: number;
  totalRemaining: number;
}

interface PersonLendingTableProps {
  data: PersonLending[];
}

export function PersonLendingTable({ data }: PersonLendingTableProps) {
  const { formatAmount } = useCurrency();
  
  return (
    <Card className="glass-card hover:glass-card glow-primary">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-lending/20 to-primary/20 border border-white/20">
            <User className="h-5 w-5 text-lending" />
          </div>
          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground">
              Person-wise Lending
            </h3>
            <p className="text-sm text-muted-foreground">
              Track individual lending balances
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl glass-card">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/10 hover:bg-transparent">
                <TableHead className="text-muted-foreground font-medium">Name</TableHead>
                <TableHead className="text-muted-foreground font-medium">Amount</TableHead>
                <TableHead className="text-muted-foreground font-medium">Total Remaining</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((person, index) => {
                const isPositive = person.totalRemaining > 0;
                const isNegative = person.totalRemaining < 0;
                
                return (
                  <TableRow 
                    key={person.name}
                    className={cn(
                      "border-b border-white/5 hover:bg-white/5 transition-all duration-300 group cursor-pointer",
                      isPositive && "hover:glow-success",
                      isNegative && "hover:glow-expense"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-white/20">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {person.name}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <span className="font-mono text-foreground">
                        {formatAmount(person.amount)}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <span className={cn(
                        "font-mono font-bold",
                        isPositive && "text-success",
                        isNegative && "text-expense",
                        person.totalRemaining === 0 && "text-muted-foreground"
                      )}>
                        {formatAmount(person.totalRemaining)}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isPositive && (
                          <>
                            <TrendingUp className="h-4 w-4 text-success" />
                            <span className="text-xs px-2 py-1 rounded-lg bg-success/20 text-success border border-success/30">
                              Owes Me
                            </span>
                          </>
                        )}
                        {isNegative && (
                          <>
                            <TrendingDown className="h-4 w-4 text-expense" />
                            <span className="text-xs px-2 py-1 rounded-lg bg-expense/20 text-expense border border-expense/30">
                              I Owe
                            </span>
                          </>
                        )}
                        {person.totalRemaining === 0 && (
                          <span className="text-xs px-2 py-1 rounded-lg bg-muted/20 text-muted-foreground border border-muted/30">
                            Settled
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {data.length === 0 && (
            <div className="p-8 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No lending data available</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}