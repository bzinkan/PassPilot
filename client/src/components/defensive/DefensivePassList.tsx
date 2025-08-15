import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorView } from "@/components/ui/error-view";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText } from "lucide-react";
import { PassCardSkeleton } from "@/components/ui/loading-states";

// Types would come from shared schema
type Pass = {
  id: string;
  studentName: string;
  reason: string;
  status: "active" | "completed" | "expired";
  startsAt: string;
  endsAt?: string;
  issuedByUserId: string;
};

interface PassListProps {
  passes?: Pass[];
  isLoading?: boolean;
  className?: string;
}

// Defensive static component that never renders until data exists
export function DefensivePassList({ 
  passes = [],
  isLoading = false,
  className = ""
}: PassListProps) {
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`} data-testid="pass-list-loading">
        {Array.from({ length: 3 }).map((_, i) => (
          <PassCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!passes.length) {
    return (
      <EmptyState
        icon={<FileText className="h-12 w-12" />}
        title="No passes issued"
        description="Student passes will appear here when they are created"
        className={className}
        data-testid="empty-passes"
      />
    );
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid="pass-list">
      {passes.map((pass) => (
        <div
          key={pass.id}
          className="p-4 border rounded-lg"
          data-testid={`pass-card-${pass.id}`}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium" data-testid={`pass-student-${pass.id}`}>
                {pass.studentName}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid={`pass-reason-${pass.id}`}>
                {pass.reason}
              </p>
            </div>
            <Badge 
              variant={pass.status === "active" ? "default" : "secondary"}
              data-testid={`pass-status-${pass.id}`}
            >
              {pass.status}
            </Badge>
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            <span data-testid={`pass-time-${pass.id}`}>
              Started: {new Date(pass.startsAt).toLocaleTimeString()}
              {pass.endsAt && ` • Ended: ${new Date(pass.endsAt).toLocaleTimeString()}`}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Defensive async component with proper loading states
export function AsyncPassList({ 
  schoolId,
  userId,
  className = ""
}: { 
  schoolId?: string;
  userId?: string;
  className?: string;
}) {
  const { data: passes, isLoading, error } = useQuery<Pass[]>({
    queryKey: ["/api/passes", schoolId, userId],
    enabled: !!(schoolId && userId), // Only run if both IDs exist
  });

  if (isLoading) {
    return <DefensivePassList isLoading={true} className={className} />;
  }

  if (error) {
    return (
      <ErrorView
        title="Failed to load passes"
        message="Could not retrieve pass history. Please try again."
        className={className}
      />
    );
  }

  // Guard against null/undefined data
  if (!passes) {
    return null;
  }

  return <DefensivePassList passes={passes} className={className} />;
}