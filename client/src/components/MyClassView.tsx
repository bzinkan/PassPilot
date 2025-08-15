import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCheck, Clock, MapPin } from "lucide-react";

export default function MyClassView() {
  const { data: classData, isLoading } = useQuery({
    queryKey: ["/myclass"],
  });

  const { data: activePasses } = useQuery({
    queryKey: ["/passes", "mine"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const stats = classData?.stats || {};
  const grades = classData?.gradesActive || [];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center space-x-4 p-6">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-students">
                {stats.totalStudents || 0}
              </p>
              <p className="text-sm text-gray-600">Total Students</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center space-x-4 p-6">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold" data-testid="text-students-present">
                {stats.availableStudents || 0}
              </p>
              <p className="text-sm text-gray-600">Students Present</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center space-x-4 p-6">
            <Clock className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold" data-testid="text-students-out">
                {stats.studentsOut || 0}
              </p>
              <p className="text-sm text-gray-600">Students Out</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grade Tabs */}
      {grades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
            <CardDescription>
              Students organized by grade level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={grades[0]?.id?.toString()} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                {grades.slice(0, 4).map((grade: any) => (
                  <TabsTrigger 
                    key={grade.id} 
                    value={grade.id.toString()}
                    data-testid={`tab-grade-${grade.id}`}
                  >
                    {grade.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {grades.map((grade: any) => (
                <TabsContent key={grade.id} value={grade.id.toString()} className="mt-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-lg">
                      {grade.name} - {grade.students?.length || 0} Students
                    </h4>
                    
                    {grade.students?.length ? (
                      <div className="grid gap-2">
                        {grade.students.map((student: any) => {
                          const hasActivePass = activePasses?.some((pass: any) => 
                            pass.studentName === student.name && pass.status === 'active'
                          );
                          
                          return (
                            <div
                              key={student.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                hasActivePass 
                                  ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20" 
                                  : "bg-green-50 border-green-200 dark:bg-green-900/20"
                              }`}
                              data-testid={`student-row-${student.id}`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  hasActivePass ? "bg-orange-500" : "bg-green-500"
                                }`} />
                                <div>
                                  <span className="font-medium" data-testid={`text-student-name-${student.id}`}>
                                    {student.name}
                                  </span>
                                  {student.studentCode && (
                                    <span className="ml-2 text-sm text-gray-600">
                                      ({student.studentCode})
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <Badge 
                                variant={hasActivePass ? "destructive" : "default"}
                                data-testid={`badge-status-${student.id}`}
                              >
                                {hasActivePass ? "Out" : "Present"}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No students in this grade
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Active Passes from My Classes */}
      {activePasses?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Active Passes</CardTitle>
            <CardDescription>
              Students from your classes currently out
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activePasses.map((pass: any) => (
                <div
                  key={pass.id}
                  className="flex items-center space-x-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200"
                  data-testid={`active-pass-${pass.id}`}
                >
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium" data-testid={`text-pass-student-${pass.id}`}>
                        {pass.studentName}
                      </span>
                      <span className="text-sm text-gray-600" data-testid={`text-pass-time-${pass.id}`}>
                        {new Date(pass.startsAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-3 w-3" />
                      <span data-testid={`text-pass-reason-${pass.id}`}>
                        {pass.reason}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}