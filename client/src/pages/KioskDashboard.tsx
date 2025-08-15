import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";
import { Monitor, UserPlus, Clock, RotateCcw, LogOut } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Pass {
  id: number;
  studentName: string;
  reason: string;
  type: string;
  startsAt: string;
  status: string;
}

export default function KioskDashboard() {
  const [studentName, setStudentName] = useState("");
  const [reason, setReason] = useState("");
  const [issuedByUserId] = useState(1); // Kiosk user ID
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active passes
  const { data: activePasses = [], isLoading } = useQuery<Pass[]>({
    queryKey: ["/kiosk/passes/active"],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Create pass mutation
  const createPassMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/kiosk/passes", {
      studentName,
      reason,
      issuedByUserId,
    }),
    onSuccess: () => {
      setStudentName("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["/kiosk/passes/active"] });
      toast({
        title: "Pass Created",
        description: `Pass issued for ${studentName}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error Creating Pass",
        description: error.message || "Failed to create pass",
        variant: "destructive",
      });
    },
  });

  // Return pass mutation
  const returnPassMutation = useMutation({
    mutationFn: (passId: number) => apiRequest("PATCH", `/kiosk/passes/${passId}/return`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/kiosk/passes/active"] });
      toast({
        title: "Pass Returned",
        description: "Student has returned successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error Returning Pass",
        description: error.message || "Failed to return pass",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/kiosk/logout"),
    onSuccess: () => {
      window.location.href = "/kiosk/login";
    },
  });

  const handleCreatePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter student name and reason",
        variant: "destructive",
      });
      return;
    }
    createPassMutation.mutate();
  };

  const handleReturnPass = (passId: number) => {
    returnPassMutation.mutate(passId);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-600 p-2 rounded-lg">
              <Monitor className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Kiosk Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Student Pass Management</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Pass Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>Create Pass</span>
              </CardTitle>
              <CardDescription>Issue a new pass for a student</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePass} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName">Student Name</Label>
                  <Input
                    id="studentName"
                    placeholder="Enter student name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    data-testid="input-student-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    placeholder="e.g., Bathroom, Nurse, Office"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    data-testid="input-reason"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createPassMutation.isPending}
                  data-testid="button-create-pass"
                >
                  {createPassMutation.isPending ? "Creating..." : "Create Pass"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active Passes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Active Passes ({activePasses.length})</span>
              </CardTitle>
              <CardDescription>Students currently out of class</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="text-center py-4">Loading passes...</div>
              ) : activePasses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active passes
                </div>
              ) : (
                activePasses.map((pass: Pass) => (
                  <div
                    key={pass.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border"
                    data-testid={`pass-${pass.id}`}
                  >
                    <div className="flex-1">
                      <div className="font-medium" data-testid={`text-student-name-${pass.id}`}>
                        {pass.studentName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {pass.reason} • {formatTime(pass.startsAt)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" data-testid={`badge-type-${pass.id}`}>
                        {pass.type}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReturnPass(pass.id)}
                        disabled={returnPassMutation.isPending}
                        data-testid={`button-return-${pass.id}`}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Return
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}