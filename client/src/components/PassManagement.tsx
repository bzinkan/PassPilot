import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, UserCheck, MapPin } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PassManagement() {
  const [studentName, setStudentName] = useState("");
  const [reason, setReason] = useState("");
  const [passType, setPassType] = useState("general");
  const { toast } = useToast();

  const { data: activePasses, isLoading } = useQuery({
    queryKey: ["/passes", "active"],
  });

  const createPassMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/passes", { 
      studentName, 
      reason: reason || getReasonByType(passType),
      type: passType 
    }),
    onSuccess: () => {
      setStudentName("");
      setReason("");
      setPassType("general");
      queryClient.invalidateQueries({ queryKey: ["/passes"] });
      toast({
        title: "Pass Created",
        description: "Student pass has been issued successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create pass",
        variant: "destructive",
      });
    },
  });

  const returnPassMutation = useMutation({
    mutationFn: (passId: number) => apiRequest("PATCH", `/passes/${passId}/return`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/passes"] });
      toast({
        title: "Pass Returned",
        description: "Student has been marked as returned",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to return pass",
        variant: "destructive",
      });
    },
  });

  const getReasonByType = (type: string) => {
    switch (type) {
      case "bathroom": return "Bathroom";
      case "nurse": return "Nurse";
      case "office": return "Office";
      case "discipline": return "Discipline";
      default: return "";
    }
  };

  const getPassTypeColor = (type: string) => {
    switch (type) {
      case "bathroom": return "bg-blue-100 text-blue-800";
      case "nurse": return "bg-red-100 text-red-800";
      case "office": return "bg-green-100 text-green-800";
      case "discipline": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleCreatePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter student name",
        variant: "destructive",
      });
      return;
    }
    createPassMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Create Pass Form */}
      <Card>
        <CardHeader>
          <CardTitle>Issue New Pass</CardTitle>
          <CardDescription>
            Create a new pass for a student
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePass} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
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
                <Label htmlFor="passType">Pass Type</Label>
                <Select value={passType} onValueChange={setPassType}>
                  <SelectTrigger data-testid="select-pass-type">
                    <SelectValue placeholder="Select pass type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="bathroom">Bathroom</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="discipline">Discipline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {passType === "general" && (
              <div className="space-y-2">
                <Label htmlFor="reason">Custom Reason</Label>
                <Input
                  id="reason"
                  placeholder="Enter reason for pass"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  data-testid="input-reason"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={createPassMutation.isPending}
              data-testid="button-create-pass"
            >
              {createPassMutation.isPending ? "Creating..." : "Issue Pass"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Active Passes */}
      <Card>
        <CardHeader>
          <CardTitle>Active Passes</CardTitle>
          <CardDescription>
            Students currently out of class
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : activePasses?.length ? (
            <div className="space-y-3">
              {activePasses.map((pass: any) => (
                <div
                  key={pass.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`pass-card-${pass.id}`}
                >
                  <div className="flex items-center space-x-4">
                    <UserCheck className="h-5 w-5 text-gray-500" />
                    <div>
                      <h4 className="font-medium" data-testid={`text-student-${pass.id}`}>
                        {pass.studentName}
                      </h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span data-testid={`text-reason-${pass.id}`}>
                          {pass.reason}
                        </span>
                        <Clock className="h-3 w-3 ml-2" />
                        <span data-testid={`text-time-${pass.id}`}>
                          {new Date(pass.startsAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge 
                      className={getPassTypeColor(pass.type || "general")}
                      data-testid={`badge-type-${pass.id}`}
                    >
                      {pass.type || "general"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => returnPassMutation.mutate(pass.id)}
                      disabled={returnPassMutation.isPending}
                      data-testid={`button-return-${pass.id}`}
                    >
                      Return
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No active passes
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}