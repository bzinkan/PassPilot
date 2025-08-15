import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import StatsCard from "@/components/StatsCard";
import PassCard from "@/components/PassCard";
import StudentCard from "@/components/StudentCard";
import GradeCard from "@/components/GradeCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Grade, Student, PassWithDetails, PassType } from "@shared/schema";

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [kioskStudentInput, setKioskStudentInput] = useState("");
  const [kioskSelectedPassType, setKioskSelectedPassType] = useState("");

  // Initialize setup
  const setupMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/setup");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    }
  });

  // Fetch grades
  const { data: grades = [], isLoading: gradesLoading } = useQuery({
    queryKey: ["/api/grades"],
    enabled: !!user,
  });

  // Fetch pass types
  const { data: passTypes = [] } = useQuery({
    queryKey: ["/api/pass-types"],
    enabled: !!user,
  });

  // Fetch active passes
  const { data: activePasses = [] } = useQuery({
    queryKey: ["/api/passes/active"],
    enabled: !!user,
  });

  // Fetch recent passes
  const { data: recentPasses = [] } = useQuery({
    queryKey: ["/api/passes"],
    enabled: !!user,
  });

  // Fetch statistics
  const { data: statistics } = useQuery({
    queryKey: ["/api/statistics"],
    enabled: !!user,
  });

  // Initialize setup on mount
  useEffect(() => {
    if (user) {
      setupMutation.mutate();
    }
  }, [user]);

  // Create grade mutation
  const createGradeMutation = useMutation({
    mutationFn: async (gradeData: { name: string }) => {
      await apiRequest("POST", "/api/grades", gradeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      toast({ title: "Success", description: "Grade created successfully" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to create grade", variant: "destructive" });
    },
  });

  // Mark pass returned mutation
  const markReturnedMutation = useMutation({
    mutationFn: async (passId: string) => {
      await apiRequest("PUT", `/api/passes/${passId}/return`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/passes/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/passes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({ title: "Success", description: "Student marked as returned" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to mark student as returned", variant: "destructive" });
    },
  });

  // CSV upload mutation
  const uploadCsvMutation = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const students = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const student: any = {};
        
        headers.forEach((header, index) => {
          if (header === 'name') student.name = values[index];
          if (header === 'grade') student.gradeName = values[index];
          if (header === 'studentid') student.studentId = values[index];
        });
        
        return student;
      });

      // Group by grade and create students
      const gradeGroups = students.reduce((acc, student) => {
        if (!acc[student.gradeName]) acc[student.gradeName] = [];
        acc[student.gradeName].push(student);
        return acc;
      }, {} as Record<string, any[]>);

      for (const [gradeName, gradeStudents] of Object.entries(gradeGroups)) {
        // Find or create grade
        let grade = grades.find((g: Grade) => g.name === gradeName);
        if (!grade) {
          await apiRequest("POST", "/api/grades", { name: gradeName });
          const updatedGrades = await apiRequest("GET", "/api/grades");
          const gradesData = await updatedGrades.json();
          grade = gradesData.find((g: Grade) => g.name === gradeName);
        }

        if (grade) {
          const studentsToCreate = gradeStudents.map(s => ({
            name: s.name,
            studentId: s.studentId || null,
            gradeId: grade.id,
          }));

          await apiRequest("POST", "/api/students/bulk", { students: studentsToCreate });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      toast({ title: "Success", description: "Students uploaded successfully" });
      setCsvFile(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Error", description: "Failed to upload students", variant: "destructive" });
    },
  });

  // Kiosk pass request mutation
  const kioskPassMutation = useMutation({
    mutationFn: async ({ studentIdOrName, gradeId, passTypeId }: { 
      studentIdOrName: string; 
      gradeId: string; 
      passTypeId: string; 
    }) => {
      await apiRequest("POST", "/api/kiosk/pass", { studentIdOrName, gradeId, passTypeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/passes/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({ title: "Success", description: "Pass request submitted successfully" });
      setKioskStudentInput("");
      setKioskSelectedPassType("");
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to create pass request", variant: "destructive" });
    },
  });

  if (authLoading || gradesLoading) {
    return (
      <div className="min-h-screen bg-pilot-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-pilot-blue rounded-lg flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-passport text-white text-sm animate-pulse"></i>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const activeGrades = grades.filter((grade: Grade) => selectedGrades.includes(grade.id));
  const allStudents = activeGrades.flatMap((grade: any) => grade.students || []);
  const studentsOut = activePasses.length;
  const studentsAvailable = Math.max(0, allStudents.length - studentsOut);

  return (
    <div className="min-h-screen bg-pilot-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-pilot-blue rounded-lg flex items-center justify-center">
                <i className="fas fa-passport text-white text-sm"></i>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">PassPilot</h1>
                <p className="text-sm text-gray-500">School • Teacher</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700" data-testid="button-notifications">
                <i className="fas fa-bell text-lg"></i>
              </button>
              <div className="relative">
                <button 
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                  onClick={() => window.location.href = "/api/logout"}
                  data-testid="button-user-menu"
                >
                  <div className="w-8 h-8 bg-pilot-blue rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden sm:block font-medium">
                    {user?.firstName || user?.email || 'User'}
                  </span>
                  <i className="fas fa-chevron-down text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div data-testid="tab-dashboard">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Students"
                value={allStudents.length}
                icon="fas fa-users"
                color="blue"
                data-testid="stat-total-students"
              />
              <StatsCard
                title="Currently Out"
                value={studentsOut}
                icon="fas fa-door-open"
                color="red"
                data-testid="stat-currently-out"
              />
              <StatsCard
                title="Available"
                value={studentsAvailable}
                icon="fas fa-check-circle"
                color="green"
                data-testid="stat-available"
              />
              <StatsCard
                title="Today's Passes"
                value={statistics?.totalPasses || 0}
                icon="fas fa-clipboard-list"
                color="yellow"
                data-testid="stat-todays-passes"
              />
            </div>

            {/* Class Selector */}
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">My Classes</h2>
                <div className="flex flex-wrap gap-2">
                  {grades.map((grade: Grade) => (
                    <Badge
                      key={grade.id}
                      variant={selectedGrades.includes(grade.id) ? "default" : "secondary"}
                      className={`cursor-pointer ${
                        selectedGrades.includes(grade.id)
                          ? "bg-pilot-blue hover:bg-pilot-blue-dark"
                          : "hover:bg-gray-200"
                      }`}
                      onClick={() => {
                        if (selectedGrades.includes(grade.id)) {
                          setSelectedGrades(selectedGrades.filter(id => id !== grade.id));
                        } else {
                          setSelectedGrades([...selectedGrades, grade.id]);
                        }
                      }}
                      data-testid={`badge-grade-${grade.id}`}
                    >
                      {grade.name}
                      <span className="ml-2 bg-white/20 px-2 py-1 rounded text-xs">
                        {(grade as any).students?.length || 0}
                      </span>
                      {selectedGrades.includes(grade.id) && (
                        <i className="fas fa-times text-xs ml-2"></i>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Current Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Currently Out Students */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-exclamation-circle text-pilot-warning"></i>
                      <span>Currently Out</span>
                    </div>
                    <Badge variant="destructive" data-testid="badge-out-count">
                      {studentsOut} Students
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activePasses.length === 0 ? (
                    <p className="text-gray-500 text-center py-8" data-testid="text-no-active-passes">
                      No students currently out
                    </p>
                  ) : (
                    activePasses.map((pass: PassWithDetails) => (
                      <PassCard
                        key={pass.id}
                        pass={pass}
                        onMarkReturned={() => markReturnedMutation.mutate(pass.id)}
                        isLoading={markReturnedMutation.isPending}
                        data-testid={`pass-${pass.id}`}
                      />
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Available Students */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-check-circle text-pilot-success"></i>
                      <span>Available Students</span>
                    </div>
                    <Badge variant="secondary" data-testid="badge-available-count">
                      {studentsAvailable} Students
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {allStudents.length === 0 ? (
                      <p className="text-gray-500 text-center py-8" data-testid="text-no-students">
                        No students in selected classes
                      </p>
                    ) : (
                      allStudents.map((student: Student) => (
                        <StudentCard key={student.id} student={student} data-testid={`student-${student.id}`} />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Recent Pass Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPasses.length === 0 ? (
                    <p className="text-gray-500 text-center py-8" data-testid="text-no-recent-activity">
                      No recent activity
                    </p>
                  ) : (
                    recentPasses.slice(0, 10).map((pass: PassWithDetails) => (
                      <div
                        key={pass.id}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-lg"
                        data-testid={`recent-pass-${pass.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="font-medium text-gray-700 text-sm">
                              {pass.student.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900" data-testid={`text-student-name-${pass.id}`}>
                              {pass.student.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {pass.returnedAt ? 'Returned from' : 'Went to'}{' '}
                              <span className="font-medium">{pass.passType.name}</span>
                              {pass.duration && ` • ${pass.duration} minutes`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500" data-testid={`text-pass-time-${pass.id}`}>
                            {new Date(pass.issuedAt).toLocaleTimeString()}
                          </p>
                          <Badge
                            variant={pass.returnedAt ? "secondary" : pass.status === "overdue" ? "destructive" : "outline"}
                            data-testid={`badge-pass-status-${pass.id}`}
                          >
                            {pass.returnedAt ? "Returned" : pass.status === "overdue" ? "Overdue" : "Out"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div data-testid="tab-reports">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reports</h2>
              <p className="text-gray-600">View and export student pass usage data</p>
            </div>

            {/* Pass Type Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {statistics?.passTypeBreakdown.map((breakdown, index) => (
                <Card key={breakdown.type} className="text-center">
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      index === 0 ? 'bg-blue-100' :
                      index === 1 ? 'bg-red-100' :
                      index === 2 ? 'bg-orange-100' : 'bg-green-100'
                    }`}>
                      <i className={`text-2xl ${
                        breakdown.type === 'Bathroom' ? 'fas fa-restroom text-pilot-blue' :
                        breakdown.type === 'Nurse' ? 'fas fa-user-nurse text-red-500' :
                        breakdown.type === 'Office' ? 'fas fa-building text-orange-500' :
                        'fas fa-ellipsis-h text-green-500'
                      }`}></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{breakdown.type}</h3>
                    <p className={`text-3xl font-bold mb-2 ${
                      breakdown.type === 'Bathroom' ? 'text-pilot-blue' :
                      breakdown.type === 'Nurse' ? 'text-red-500' :
                      breakdown.type === 'Office' ? 'text-orange-500' :
                      'text-green-500'
                    }`} data-testid={`stat-${breakdown.type.toLowerCase()}-count`}>
                      {breakdown.count}
                    </p>
                    <p className="text-sm text-gray-500">Total Passes</p>
                  </CardContent>
                </Card>
              )) || []}
            </div>

            {/* Analytics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatsCard title="Total Passes" value={statistics?.totalPasses || 0} />
              <StatsCard title="Avg Duration" value={`${statistics?.avgDuration || 0}min`} />
              <StatsCard title="Peak Hour" value={`${statistics?.peakHour || 0}:00`} />
              <StatsCard title="Active Students" value={statistics?.activeStudents || 0} />
            </div>

            {/* Export Options */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline" data-testid="button-export-csv">
                    <i className="fas fa-file-csv mr-2"></i>
                    Export CSV
                  </Button>
                  <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" data-testid="button-export-pdf">
                    <i className="fas fa-file-pdf mr-2"></i>
                    Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Roster Tab */}
        {activeTab === "roster" && (
          <div data-testid="tab-roster">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Roster</h2>
                  <p className="text-gray-600">Manage grades and students. Click on grade cards to add them to My Class tab.</p>
                </div>
                <Button 
                  onClick={() => {
                    const gradeName = prompt("Enter grade name (e.g., 'Grade 6th'):");
                    if (gradeName) {
                      createGradeMutation.mutate({ name: gradeName });
                    }
                  }}
                  data-testid="button-add-grade"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Grade
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {grades.map((grade: any) => (
                <GradeCard
                  key={grade.id}
                  grade={grade}
                  isSelected={selectedGrades.includes(grade.id)}
                  onToggleSelect={() => {
                    if (selectedGrades.includes(grade.id)) {
                      setSelectedGrades(selectedGrades.filter(id => id !== grade.id));
                    } else {
                      setSelectedGrades([...selectedGrades, grade.id]);
                    }
                  }}
                  data-testid={`grade-card-${grade.id}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === "upload" && (
          <div data-testid="tab-upload">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Student Data</h2>
              <p className="text-gray-600">Import student rosters from multiple sources</p>
            </div>

            {/* CSV Upload */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>CSV File Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-pilot-blue transition-colors">
                    <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                    <p className="text-lg font-medium text-gray-900 mb-2">Drop your CSV file here or click to browse</p>
                    <p className="text-sm text-gray-500 mb-4">Maximum file size: 10MB</p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="csv-upload"
                      data-testid="input-csv-file"
                    />
                    <label htmlFor="csv-upload">
                      <Button asChild data-testid="button-choose-file">
                        <span className="cursor-pointer">Choose File</span>
                      </Button>
                    </label>
                  </div>
                  {csvFile && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Selected file: {csvFile.name}</p>
                      <Button 
                        onClick={() => uploadCsvMutation.mutate(csvFile)}
                        disabled={uploadCsvMutation.isPending}
                        data-testid="button-upload-csv"
                      >
                        {uploadCsvMutation.isPending ? "Uploading..." : "Upload CSV"}
                      </Button>
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <p className="mb-2">CSV file should contain the following columns:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>name (required)</li>
                    <li>grade (required)</li>
                    <li>studentid (optional)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Integration placeholders */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Clever Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Import student rosters directly from your Clever account. This will sync all students from your connected schools.</p>
                  <Button className="w-full" variant="outline" data-testid="button-clever-import">
                    Import from Clever
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Google Classroom Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Import student rosters from your Google Classroom courses. All enrolled students will be added to your roster.</p>
                  <Button className="w-full" variant="outline" data-testid="button-google-classroom-import">
                    Import from Google Classroom
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Kiosk Tab */}
        {activeTab === "kiosk" && (
          <div data-testid="tab-kiosk">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Kiosk Mode</h2>
              <p className="text-gray-600">Student self-service pass requests</p>
            </div>

            {/* Kiosk Interface */}
            <Card className="overflow-hidden mb-8">
              <div className="bg-gradient-to-r from-pilot-blue to-pilot-blue-dark p-12 text-center min-h-[600px] flex flex-col justify-center">
                <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8">
                  <div className="w-16 h-16 bg-pilot-blue rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-passport text-white text-2xl"></i>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">PassPilot</h1>
                  <p className="text-lg text-gray-600 mb-8">Student Pass Request</p>
                  
                  {/* Student ID Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Student ID or Name</label>
                    <Input
                      type="text"
                      placeholder="Enter your student ID or name"
                      value={kioskStudentInput}
                      onChange={(e) => setKioskStudentInput(e.target.value)}
                      className="text-lg"
                      data-testid="input-kiosk-student"
                    />
                  </div>

                  {/* Grade Selection */}
                  {grades.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Your Grade</label>
                      <Select data-testid="select-kiosk-grade">
                        <SelectTrigger>
                          <SelectValue placeholder="Choose your grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {grades.map((grade: Grade) => (
                            <SelectItem key={grade.id} value={grade.id}>
                              {grade.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Pass Type Selection */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {passTypes.map((passType: PassType) => (
                      <button
                        key={passType.id}
                        onClick={() => setKioskSelectedPassType(passType.id)}
                        className={`p-4 border-2 rounded-lg transition-colors ${
                          kioskSelectedPassType === passType.id
                            ? "border-pilot-blue bg-pilot-blue text-white"
                            : "border-gray-300 text-gray-700 hover:border-pilot-blue hover:text-pilot-blue"
                        }`}
                        data-testid={`button-kiosk-pass-${passType.name.toLowerCase()}`}
                      >
                        <i className={`${passType.icon} text-2xl mb-2`}></i>
                        <p className="font-medium">{passType.name}</p>
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={() => {
                      if (kioskStudentInput && kioskSelectedPassType && grades.length > 0) {
                        kioskPassMutation.mutate({
                          studentIdOrName: kioskStudentInput,
                          gradeId: grades[0].id, // For simplicity, using first grade
                          passTypeId: kioskSelectedPassType,
                        });
                      }
                    }}
                    disabled={!kioskStudentInput || !kioskSelectedPassType || kioskPassMutation.isPending}
                    className="w-full bg-pilot-success hover:bg-green-600 text-lg font-medium"
                    data-testid="button-kiosk-request-pass"
                  >
                    {kioskPassMutation.isPending ? "Processing..." : "Request Pass"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
