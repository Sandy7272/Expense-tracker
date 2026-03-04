import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-6 border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <Skeleton className="w-8 h-8 rounded" />
            </div>
            <Skeleton className="w-16 h-6 rounded-lg" />
          </div>
          <Skeleton className="w-24 h-4 mb-2" />
          <Skeleton className="w-32 h-8" />
        </Card>
      ))}
    </div>
  );
}

export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Card className="border-border/50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="w-40 h-5 mb-2" />
            <Skeleton className="w-28 h-4" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-20 h-8 rounded-md" />
            <Skeleton className="w-24 h-8 rounded-md" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/30">
              <div className="flex items-center gap-4 flex-1">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-16 h-5 rounded-full" />
                  </div>
                  <Skeleton className="w-24 h-3" />
                </div>
              </div>
              <Skeleton className="w-20 h-6" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <Card className="border-border/50">
      <div className="p-6">
        <div className="mb-6">
          <Skeleton className="w-40 h-5 mb-2" />
          <Skeleton className="w-56 h-4" />
        </div>
        <Skeleton className="w-full h-80 rounded-xl" />
        <div className="grid grid-cols-2 gap-3 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-3 h-3 rounded-full" />
              <div>
                <Skeleton className="w-16 h-3 mb-1" />
                <Skeleton className="w-12 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
