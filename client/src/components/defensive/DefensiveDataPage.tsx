import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { users } from "@shared/schema";
type User = typeof users.$inferSelect;
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorView } from "@/components/ui/error-view";
import { EmptyState } from "@/components/ui/empty-state";
import { AsyncDashboardStats } from "./DefensiveDashboardStats";
import { AsyncPassList } from "./DefensivePassList";
import { DefensivePassForm } from "./DefensivePassForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Settings } from "lucide-react";

// Types would come from shared schema
type School = {
  id: string;
  name: string;
  seatsAllowed: number;
  active: boolean;
};

// User type imported from shared schema

/**
 * Example of a fully defensive page component that demonstrates:
 * - Never rendering until all required data exists
 * - Proper loading state management
 * - Error boundaries for each data dependency
 * - Default props and safe fallbacks
 * - Graceful handling of missing or undefined data
 */
export function DefensiveDataPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  // First layer: Authentication check
  if (authLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="auth-loading">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="Authentication Required"
        description="Please log in to access the dashboard"
      />
    );
  }

  // Second layer: School data check (user is guaranteed to exist here)
  return <AuthenticatedContent user={user as User} />;
}

// Separate component for authenticated users with school data
function AuthenticatedContent({ user }: { user: User }) {
  const { data: school, isLoading: schoolLoading, error: schoolError } = useQuery<School>({
    queryKey: ["/api/schools", user.schoolId],
    enabled: !!user.schoolId,
  });

  if (schoolLoading) {
    return (
      <div className="p-6 space-y-6" data-testid="school-loading">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (schoolError) {
    return (
      <ErrorView
        title="Failed to load school data"
        message="Could not retrieve school information. Please contact support."
      />
    );
  }

  if (!school) {
    return (
      <EmptyState
        icon={<Settings className="h-12 w-12" />}
        title="School not found"
        description="Could not find school information for your account"
      />
    );
  }

  // Third layer: Render with guaranteed data
  return <SchoolDashboard user={user} school={school} />;
}

// Main dashboard component - all data dependencies are guaranteed to exist
function SchoolDashboard({ 
  user, 
  school 
}: { 
  user: User; 
  school: School; 
}) {
  // Safe to use user.id and school.id here - they're guaranteed to exist
  const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  return (
    <div className="p-6 space-y-6" data-testid="school-dashboard">
      {/* Header with guaranteed data */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="dashboard-title">
            {school.name} - PassPilot
          </h1>
          <p className="text-muted-foreground" data-testid="user-welcome">
            Welcome back, {userName}
          </p>
        </div>
        <div className="text-sm text-muted-foreground" data-testid="user-role">
          {user.role === "admin" ? "Administrator" : "Teacher"}
        </div>
      </div>

      {/* Dashboard stats - handles its own loading/error states */}
      <AsyncDashboardStats schoolId={school.id} />

      {/* Main content tabs */}
      <Tabs defaultValue="passes" className="space-y-4">
        <TabsList data-testid="dashboard-tabs">
          <TabsTrigger value="passes" data-testid="tab-passes">
            Active Passes
          </TabsTrigger>
          <TabsTrigger value="create" data-testid="tab-create">
            Create Pass
          </TabsTrigger>
          {user.role === "admin" && (
            <TabsTrigger value="reports" data-testid="tab-reports">
              Reports
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="passes" data-testid="tab-content-passes">
          <Card>
            <CardHeader>
              <CardTitle>Current Passes</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Pass list handles its own loading/error states */}
              <AsyncPassList 
                schoolId={school.id} 
                userId={user.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" data-testid="tab-content-create">
          <Card>
            <CardHeader>
              <CardTitle>Issue New Pass</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Form handles its own validation and submission states */}
              <DefensivePassForm 
                schoolId={school.id} 
                userId={user.id}
                onSuccess={(pass) => {
                  // Handle successful pass creation
                  console.log("Pass created:", pass);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {user.role === "admin" && (
          <TabsContent value="reports" data-testid="tab-content-reports">
            <Card>
              <CardHeader>
                <CardTitle>Administrative Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyState
                  title="Reports coming soon"
                  description="Administrative reporting features will be available here"
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}