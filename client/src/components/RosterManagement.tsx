import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Upload, Plus, Check, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function RosterManagement() {
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentCode, setNewStudentCode] = useState("");
  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: grades } = useQuery({
    queryKey: ["/grades"],
  });

  const { data: students } = useQuery({
    queryKey: ["/students"],
  });

  const { data: teacherGrades } = useQuery({
    queryKey: ["/roster/teacher-grades"],
  });

  const addStudentMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/students", {
      name: newStudentName,
      studentCode: newStudentCode,
      gradeId: selectedGradeId
    }),
    onSuccess: () => {
      setNewStudentName("");
      setNewStudentCode("");
      setSelectedGradeId(null);
      queryClient.invalidateQueries({ queryKey: ["/students"] });
      toast({
        title: "Student Added",
        description: "Student has been added to the roster",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive",
      });
    },
  });

  const toggleGradeMutation = useMutation({
    mutationFn: ({ gradeId, selected }: { gradeId: number; selected: boolean }) =>
      apiRequest("POST", "/roster/toggle", { gradeId, selected }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/roster/teacher-grades"] });
      toast({
        title: "Grade Updated",
        description: "Grade selection has been updated",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update grade",
        variant: "destructive",
      });
    },
  });

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !selectedGradeId) {
      toast({
        title: "Missing Information",
        description: "Please enter student name and select a grade",
        variant: "destructive",
      });
      return;
    }
    addStudentMutation.mutate();
  };

  const isGradeSelected = (gradeId: number) => {
    return teacherGrades?.some((tg: any) => tg.gradeId === gradeId) || false;
  };

  const handleToggleGrade = (gradeId: number) => {
    const selected = !isGradeSelected(gradeId);
    toggleGradeMutation.mutate({ gradeId, selected });
  };

  const getStudentsForGrade = (gradeId: number) => {
    return students?.filter((student: any) => student.gradeId === gradeId) || [];
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="grades" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="grades">Manage Grades</TabsTrigger>
          <TabsTrigger value="students">Add Students</TabsTrigger>
        </TabsList>

        <TabsContent value="grades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grade Selection</CardTitle>
              <CardDescription>
                Select which grades you want to manage in your classroom
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {grades?.map((grade: any) => {
                  const isSelected = isGradeSelected(grade.id);
                  const studentCount = getStudentsForGrade(grade.id).length;
                  
                  return (
                    <div
                      key={grade.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        isSelected 
                          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" 
                          : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                      }`}
                      data-testid={`grade-card-${grade.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          isSelected 
                            ? "bg-green-500 border-green-500" 
                            : "border-gray-300"
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <h4 className="font-medium" data-testid={`text-grade-name-${grade.id}`}>
                            {grade.name}
                          </h4>
                          <p className="text-sm text-gray-600" data-testid={`text-student-count-${grade.id}`}>
                            {studentCount} students
                          </p>
                        </div>
                      </div>

                      <Button
                        variant={isSelected ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleToggleGrade(grade.id)}
                        disabled={toggleGradeMutation.isPending}
                        data-testid={`button-toggle-${grade.id}`}
                      >
                        {isSelected ? "Remove" : "Select"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Student</CardTitle>
              <CardDescription>
                Add a new student to your roster
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">Student Name *</Label>
                    <Input
                      id="studentName"
                      placeholder="Enter student name"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      data-testid="input-student-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="studentCode">Student Code</Label>
                    <Input
                      id="studentCode"
                      placeholder="Enter student ID/code"
                      value={newStudentCode}
                      onChange={(e) => setNewStudentCode(e.target.value)}
                      data-testid="input-student-code"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Grade *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {grades?.map((grade: any) => (
                      <Button
                        key={grade.id}
                        type="button"
                        variant={selectedGradeId === grade.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedGradeId(grade.id)}
                        data-testid={`button-grade-${grade.id}`}
                      >
                        {grade.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={addStudentMutation.isPending}
                  data-testid="button-add-student"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {addStudentMutation.isPending ? "Adding..." : "Add Student"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Student List */}
          <Card>
            <CardHeader>
              <CardTitle>Current Students</CardTitle>
              <CardDescription>
                Students in your selected grades
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students?.length ? (
                <div className="space-y-4">
                  {grades
                    ?.filter((grade: any) => isGradeSelected(grade.id))
                    ?.map((grade: any) => {
                      const gradeStudents = getStudentsForGrade(grade.id);
                      if (!gradeStudents.length) return null;

                      return (
                        <div key={grade.id} className="space-y-2">
                          <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400">
                            {grade.name} ({gradeStudents.length} students)
                          </h4>
                          <div className="grid gap-2">
                            {gradeStudents.map((student: any) => (
                              <div
                                key={student.id}
                                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                                data-testid={`student-card-${student.id}`}
                              >
                                <div>
                                  <span className="font-medium" data-testid={`text-student-name-${student.id}`}>
                                    {student.name}
                                  </span>
                                  {student.studentCode && (
                                    <span className="ml-2 text-sm text-gray-600" data-testid={`text-student-code-${student.id}`}>
                                      ({student.studentCode})
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No students found. Add some students or select grades to manage.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}