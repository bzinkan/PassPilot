import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorView } from "@/components/ui/error-view";
import { DashboardStatsSkeleton } from "@/components/ui/loading-states";
import { Users, FileText, Clock, CheckCircle } from "lucide-react";

// Types would come from shared schema
type DashboardStats = {
  totalStudents: number;
  activePasses: number;
  todayPasses: number;
  completedPasses: number;
};

interface DashboardStatsProps {
  stats?: DashboardStats | undefined;
  isLoading?: boolean;
  className?: string;
}

// Defensive component that provides default values and never renders partial data
export function DefensiveDashboardStats({ 
  stats,
  isLoading = false,
  className = ""
}: DashboardStatsProps) {
  if (isLoading) {
    return <DashboardStatsSkeleton />;
  }

  // Guard against null/undefined stats - provide safe defaults
  const safeStats: DashboardStats = {
    totalStudents: stats?.totalStudents ?? 0,
    activePasses: stats?.activePasses ?? 0,
    todayPasses: stats?.todayPasses ?? 0,
    completedPasses: stats?.completedPasses ?? 0,
  };

  const statCards = [
    {
      title: "Total Students",
      value: safeStats.totalStudents,
      icon: Users,
      description: "registered students",
      testId: "stat-total-students"
    },
    {
      title: "Active Passes",
      value: safeStats.activePasses,
      icon: Clock,
      description: "currently out",
      testId: "stat-active-passes"
    },
    {
      title: "Today's Passes",
      value: safeStats.todayPasses,
      icon: FileText,
      description: "issued today",
      testId: "stat-today-passes"
    },
    {
      title: "Completed",
      value: safeStats.completedPasses,
      icon: CheckCircle,
      description: "returned safely",
      testId: "stat-completed-passes"
    },
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`} data-testid="dashboard-stats">
      {statCards.map((card) => (
        <Card key={card.testId} data-testid={card.testId}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium" data-testid={`${card.testId}-title`}>
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid={`${card.testId}-value`}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground" data-testid={`${card.testId}-description`}>
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Async version with proper error handling
export function AsyncDashboardStats({ 
  schoolId,
  className = ""
}: { 
  schoolId?: string;
  className?: string;
}) {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", schoolId],
    enabled: !!schoolId,
  });

  if (isLoading) {
    return <DefensiveDashboardStats isLoading={true} className={className} />;
  }

  if (error) {
    return (
      <ErrorView
        title="Failed to load statistics"
        message="Could not retrieve dashboard data. Please refresh the page."
        className={className}
      />
    );
  }

  // Even if data is null/undefined, component handles it safely
  return <DefensiveDashboardStats stats={stats} className={className} />;
}