import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorView } from "@/components/ui/error-view";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";

// Example type - would come from shared schema
type Student = {
  id: string;
  name: string;
  grade?: string;
  active: boolean;
};

interface StudentsListProps {
  students?: Student[];
  schoolId?: string | undefined;
  className?: string;
}

// Defensive component that never renders until data exists
export function DefensiveStudentsList({ 
  students = [],
  schoolId,
  className = ""
}: StudentsListProps) {
  // For static data (passed as props), use defensive patterns
  if (!students.length) {
    return (
      <EmptyState
        icon={<Users className="h-12 w-12" />}
        title="No students yet"
        description="Add students to your roster to get started"
        className={className}
        data-testid="empty-students"
      />
    );
  }

  return (
    <div className={`space-y-2 ${className}`} data-testid="students-list">
      {students.map((student) => (
        <div
          key={student.id}
          className="flex items-center justify-between p-3 border rounded-lg"
          data-testid={`student-item-${student.id}`}
        >
          <div>
            <div className="font-medium" data-testid={`student-name-${student.id}`}>
              {student.name}
            </div>
            {student.grade && (
              <div className="text-sm text-muted-foreground" data-testid={`student-grade-${student.id}`}>
                Grade {student.grade}
              </div>
            )}
          </div>
          <div
            className={`px-2 py-1 rounded text-xs ${
              student.active 
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
            }`}
            data-testid={`student-status-${student.id}`}
          >
            {student.active ? "Active" : "Inactive"}
          </div>
        </div>
      ))}
    </div>
  );
}

// Defensive component with async data fetching
export function AsyncStudentsList({ 
  schoolId,
  className = ""
}: { 
  schoolId?: string;
  className?: string;
}) {
  const { data: students, isLoading, error } = useQuery<Student[]>({
    queryKey: ["/api/students", schoolId],
    enabled: !!schoolId, // Only run query if schoolId exists
  });

  // Always check loading first
  if (isLoading) {
    return (
      <div className={className} data-testid="students-loading">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center p-3 border rounded">
              <Skeleton className="h-10 w-10 rounded-full mr-3" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Then check for errors
  if (error) {
    return (
      <ErrorView
        title="Failed to load students"
        message="Could not retrieve student list. Please try again."
        className={className}
      />
    );
  }

  // Guard against null/undefined data
  if (!students) {
    return null;
  }

  // Use the defensive static component
  return (
    <DefensiveStudentsList 
      students={students} 
      schoolId={schoolId}
      className={className}
    />
  );
}