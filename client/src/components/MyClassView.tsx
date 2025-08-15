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
import { Users, Clock, UserPlus, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MyClassView() {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [passType, setPassType] = useState("general");
  const [customReason, setCustomReason] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: students } = useQuery({
    queryKey: ["/myclass/students"],
  });

  const { data: activePasses } = useQuery({
    queryKey: ["/myclass/passes/active"],
  });

  const createPassMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/myclass/pass", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/myclass"] });
      setIsCreateDialogOpen(false);
      setSelectedStudentId("");
      setPassType("general");
      setCustomReason("");
      toast({
        title: "Pass Created",
        description: "Student pass has been issued successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create pass",
        variant: "destructive",
      });
    },
  });

  const returnPassMutation = useMutation({
    mutationFn: async (passId: number) => {
      return apiRequest("PATCH", `/myclass/pass/${passId}/return`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/myclass"] });
      toast({
        title: "Pass Returned",
        description: "Student has been marked as returned",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to return pass",
        variant: "destructive",
      });
    },
  });

  const handleCreatePass = () => {
    if (!selectedStudentId) {
      toast({
        title: "Missing Information",
        description: "Please select a student",
        variant: "destructive",
      });
      return;
    }

    if (passType === "custom" && !customReason.trim()) {
      toast({
        title: "Missing Information", 
        description: "Please enter a custom reason",
        variant: "destructive",
      });
      return;
    }

    createPassMutation.mutate({
      studentId: parseInt(selectedStudentId),
      type: passType,
      customReason: passType === "custom" ? customReason : undefined,
    });
  };

  const handleReturnPass = (passId: number) => {
    returnPassMutation.mutate(passId);
  };

  const getPassTypeLabel = (type: string, customReason?: string) => {
    if (type === "custom") return customReason || "Custom";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getPassTypeColor = (type: string) => {
    switch (type) {
      case "general": return "default";
      case "nurse": return "destructive";
      case "discipline": return "secondary";
      case "custom": return "outline";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Class</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage your current students and active passes
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-pass">
              <UserPlus className="h-4 w-4 mr-2" />
              Issue Pass
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Issue Student Pass</DialogTitle>
              <DialogDescription>
                Create a new pass for a student in your class
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student">Student</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger data-testid="select-student">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students && Array.isArray(students) ? students.filter((student: any) => !student.hasActivePass)?.map((student: any) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.name} ({student.grade})
                      </SelectItem>
                    )) : null}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Pass Type</Label>
                <Select value={passType} onValueChange={setPassType}>
                  <SelectTrigger data-testid="select-pass-type">
                    <SelectValue placeholder="Select pass type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="discipline">Discipline</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {passType === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customReason">Custom Reason</Label>
                  <Input
                    id="customReason"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter custom reason"
                    data-testid="input-custom-reason"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel-pass"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePass}
                  disabled={createPassMutation.isPending}
                  data-testid="button-submit-pass"
                >
                  {createPassMutation.isPending ? "Creating..." : "Create Pass"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Passes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Active Passes
          </CardTitle>
          <CardDescription>
            Students currently out of class
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activePasses && Array.isArray(activePasses) && activePasses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Pass Type</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activePasses.map((pass: any) => (
                  <TableRow key={pass.id}>
                    <TableCell className="font-medium" data-testid={`text-student-${pass.id}`}>
                      {pass.studentName || pass.student?.name}
                    </TableCell>
                    <TableCell data-testid={`text-grade-${pass.id}`}>
                      {pass.student?.grade || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPassTypeColor(pass.type || "general")}>
                        {getPassTypeLabel(pass.type || "general", pass.customReason)}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-time-${pass.id}`}>
                      {new Date(pass.startsAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReturnPass(pass.id)}
                        disabled={returnPassMutation.isPending}
                        data-testid={`button-return-${pass.id}`}
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Return
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                No students currently out of class
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Students Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Student Status
          </CardTitle>
          <CardDescription>
            Current status of all students in your selected grades
          </CardDescription>
        </CardHeader>
        <CardContent>
          {students && Array.isArray(students) && students.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Student Code</TableHead>
                  <TableHead>Status</TableHead>
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
                    <TableCell>
                      <Badge 
                        variant={student.hasActivePass ? "destructive" : "default"}
                        data-testid={`badge-status-${student.id}`}
                      >
                        {student.hasActivePass ? "Out" : "Available"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                No students in your selected grades. Go to the Roster tab to select grades to manage.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}