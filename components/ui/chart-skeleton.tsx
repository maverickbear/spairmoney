import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartSkeletonProps {
  className?: string;
  height?: number;
}

export function ChartSkeleton({ className, height = 240 }: ChartSkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="mb-4 border-b pb-3">
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="w-full" style={{ height: `${height}px` }} />
      </CardContent>
    </Card>
  );
}

export function BudgetExecutionSkeleton({ className }: ChartSkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="mb-6 border-b pb-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32 mt-2" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CategoryExpensesSkeleton({ className }: ChartSkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-2 w-24 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

