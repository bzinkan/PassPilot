import { Skeleton } from "@/components/ui/skeleton";

// Loading skeleton for pass cards
export function PassCardSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-3" data-testid="pass-card-skeleton">
      <div className="flex justify-between items-start">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-16" />
      </div>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

// Loading skeleton for student list
export function StudentListSkeleton() {
  return (
    <div className="space-y-2" data-testid="student-list-skeleton">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center p-3 border rounded">
          <Skeleton className="h-10 w-10 rounded-full mr-3" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

// Loading skeleton for dashboard stats
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-testid="dashboard-stats-skeleton">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-6 border rounded-lg">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}