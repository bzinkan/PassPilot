import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, UserPlus, Users, Settings } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function RosterManagement() {
  const [newGradeName, setNewGradeName] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentCode, setNewStudentCode] = useState("");
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [isCreateGradeDialogOpen, setIsCreateGradeDialogOpen] = useState(false);
  const [isCreateStudentDialogOpen, setIsCreateStudentDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: grades } = useQuery({
    queryKey: ["/roster/grades"],
  });

  const { data: selectedGrades } = useQuery({
    queryKey: ["/roster/selected"],
  });

  const { data: students } = useQuery({
    queryKey: ["/roster/students"],
  });

  const createGradeMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      return apiRequest("POST", "/roster/grades", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/roster"] });
      setIsCreateGradeDialogOpen(false);
      setNewGradeName("");
      toast({
        title: "Grade Created",
        description: "New grade has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create grade",
        variant: "destructive",
      });
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: { name: string; gradeId: number; studentCode?: string }) => {
      return apiRequest("POST", "/roster/students", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/roster"] });
      setIsCreateStudentDialogOpen(false);
      setNewStudentName("");
      setNewStudentCode("");
      setSelectedGradeId("");
      toast({
        title: "Student Added",
        description: "New student has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive",
      });
    },
  });

  const updateGradeSelectionMutation = useMutation({
    mutationFn: async (data: { gradeIds: number[] }) => {
      return apiRequest("POST", "/roster/select", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/roster"] });
      queryClient.invalidateQueries({ queryKey: ["/myclass"] });
      toast({
        title: "Grade Selection Updated",
        description: "Your class roster has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update grade selection",
        variant: "destructive",
      });
    },
  });

  const handleCreateGrade = () => {
    if (!newGradeName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a grade name",
        variant: "destructive",
      });
      return;
    }

    createGradeMutation.mutate({ name: newGradeName.trim() });
  };

  const handleCreateStudent = () => {
    if (!newStudentName.trim() || !selectedGradeId) {
      toast({
        title: "Missing Information",
        description: "Please enter student name and select a grade",
        variant: "destructive",
      });
      return;
    }

    createStudentMutation.mutate({
      name: newStudentName.trim(),
      gradeId: parseInt(selectedGradeId),
      ...(newStudentCode.trim() && { studentCode: newStudentCode.trim() }),
    });
  };

  const handleGradeSelectionChange = (gradeId: number, checked: boolean) => {
    const currentIds = selectedGrades && Array.isArray(selectedGrades) ? selectedGrades.map((g: any) => g.gradeId) : [];
    const newIds = checked 
      ? [...currentIds, gradeId]
      : currentIds.filter((id: number) => id !== gradeId);
    
    updateGradeSelectionMutation.mutate({ gradeIds: newIds });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Roster Management</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage grades, students, and your class selections
          </p>
        </div>
      </div>

      <Tabs defaultValue="grades" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="grades" data-testid="tab-grades">
            <GraduationCap className="h-4 w-4 mr-2" />
            Grades
          </TabsTrigger>
          <TabsTrigger value="students" data-testid="tab-students">
            <Users className="h-4 w-4 mr-2" />
            Students
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Settings className="h-4 w-4 mr-2" />
            My Classes
          </TabsTrigger>
        </TabsList>

        {/* Grades Tab */}
        <TabsContent value="grades" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>School Grades</CardTitle>
                  <CardDescription>
                    Manage grade levels in your school
                  </CardDescription>
                </div>
                
                <Dialog open={isCreateGradeDialogOpen} onOpenChange={setIsCreateGradeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-grade">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Add Grade
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Grade</DialogTitle>
                      <DialogDescription>
                        Create a new grade level for your school
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="gradeName">Grade Name</Label>
                        <Input
                          id="gradeName"
                          value={newGradeName}
                          onChange={(e) => setNewGradeName(e.target.value)}
                          placeholder="e.g., Grade 6, 7th Grade, Kindergarten"
                          data-testid="input-grade-name"
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsCreateGradeDialogOpen(false)}
                          data-testid="button-cancel-grade"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateGrade}
                          disabled={createGradeMutation.isPending}
                          data-testid="button-submit-grade"
                        >
                          {createGradeMutation.isPending ? "Creating..." : "Create Grade"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {grades && Array.isArray(grades) && grades.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grade Name</TableHead>
                      <TableHead>Student Count</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map((grade: any) => (
                      <TableRow key={grade.id}>
                        <TableCell className="font-medium" data-testid={`text-grade-name-${grade.id}`}>
                          {grade.name}
                        </TableCell>
                        <TableCell data-testid={`text-grade-count-${grade.id}`}>
                          {grade.studentCount || 0}
                        </TableCell>
                        <TableCell data-testid={`text-grade-created-${grade.id}`}>
                          {new Date(grade.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">
                    No grades created yet. Add your first grade to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Students</CardTitle>
                  <CardDescription>
                    Manage students in all grades
                  </CardDescription>
                </div>
                
                <Dialog open={isCreateStudentDialogOpen} onOpenChange={setIsCreateStudentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-student">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Student</DialogTitle>
                      <DialogDescription>
                        Add a new student to your school roster
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="studentName">Student Name</Label>
                        <Input
                          id="studentName"
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          placeholder="Enter student's full name"
                          data-testid="input-student-name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gradeSelect">Grade</Label>
                        <Select value={selectedGradeId} onValueChange={setSelectedGradeId}>
                          <SelectTrigger data-testid="select-student-grade">
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {grades?.map((grade: any) => (
                              <SelectItem key={grade.id} value={grade.id.toString()}>
                                {grade.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="studentCode">Student Code (Optional)</Label>
                        <Input
                          id="studentCode"
                          value={newStudentCode}
                          onChange={(e) => setNewStudentCode(e.target.value)}
                          placeholder="e.g., student ID or external code"
                          data-testid="input-student-code"
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsCreateStudentDialogOpen(false)}
                          data-testid="button-cancel-student"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateStudent}
                          disabled={createStudentMutation.isPending}
                          data-testid="button-submit-student"
                        >
                          {createStudentMutation.isPending ? "Adding..." : "Add Student"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {students && students.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Student Code</TableHead>
                      <TableHead>Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student: any) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium" data-testid={`text-student-name-${student.id}`}>
                          {student.name}
                        </TableCell>
                        <TableCell data-testid={`text-student-grade-${student.id}`}>
                          {student.grade}
                        </TableCell>
                        <TableCell data-testid={`text-student-code-${student.id}`}>
                          {student.studentCode || "-"}
                        </TableCell>
                        <TableCell data-testid={`text-student-added-${student.id}`}>
                          {new Date(student.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">
                    No students added yet. Add students to get started.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Class Configuration</CardTitle>
              <CardDescription>
                Select which grades you want to manage in your class dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              {grades && grades.length > 0 ? (
                <div className="space-y-4">
                  {grades.map((grade: any) => {
                    const isSelected = selectedGrades?.some((sg: any) => sg.gradeId === grade.id);
                    return (
                      <div key={grade.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`grade-${grade.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleGradeSelectionChange(grade.id, checked as boolean)}
                          data-testid={`checkbox-grade-${grade.id}`}
                        />
                        <Label htmlFor={`grade-${grade.id}`} className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{grade.name}</span>
                            <Badge variant="secondary">
                              {grade.studentCount || 0} students
                            </Badge>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                  
                  {selectedGrades && selectedGrades.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        You have selected {selectedGrades.length} grade(s) for your class dashboard.
                        These students will appear in your "My Class" tab.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">
                    No grades available. Create grades first to configure your classes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}