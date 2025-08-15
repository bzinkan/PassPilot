import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, formatDistance } from "date-fns";
import { 
  Users, 
  Clock, 
  TrendingUp, 
  Plus,
  Activity,
  CheckCircle,
  XCircle,
  BarChart3
} from "lucide-react";

const createPassSchema = z.object({
  studentName: z.string().min(1, "Student name is required"),
  reason: z.string().min(1, "Reason is required"),
});

type CreatePassForm = z.infer<typeof createPassSchema>;

// Types for API responses
interface Pass {
  id: string;
  studentName: string;
  reason: string;
  status: 'active' | 'returned' | 'expired';
  startsAt: string;
  endsAt?: string;
  issuedByUserId: string;
  schoolId: string;
}

interface PassStatistics {
  totalPasses: number;
  avgDuration: number;
  activeCount: number;
  reasonBreakdown: Array<{ reason: string; count: number }>;
}

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreatePassOpen, setIsCreatePassOpen] = useState(false);

  const form = useForm<CreatePassForm>({
    resolver: zodResolver(createPassSchema),
    defaultValues: {
      studentName: "",
      reason: "",
    },
  });

  // Fetch active passes
  const { data: activePasses = [], isLoading: activePassesLoading } = useQuery<Pass[]>({
    queryKey: ["/api/passes/active"],
    enabled: !!user,
  });

  // Fetch recent passes
  const { data: recentPasses = [], isLoading: recentPassesLoading } = useQuery<Pass[]>({
    queryKey: ["/api/passes"],
    enabled: !!user,
  });

  // Fetch statistics
  const { data: statistics, isLoading: statisticsLoading } = useQuery<PassStatistics>({
    queryKey: ["/api/statistics"],
    enabled: !!user,
  });

  // Create pass mutation
  const createPassMutation = useMutation({
    mutationFn: async (data: CreatePassForm) => {
      await apiRequest("POST", "/api/passes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/passes/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/passes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      setIsCreatePassOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Pass created successfully",
      });
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
      toast({
        title: "Error",
        description: "Failed to create pass",
        variant: "destructive",
      });
    },
  });

  // Return pass mutation
  const returnPassMutation = useMutation({
    mutationFn: async (passId: string) => {
      await apiRequest("PUT", `/api/passes/${passId}/return`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/passes/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/passes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/statistics"] });
      toast({
        title: "Success",
        description: "Pass returned successfully",
      });
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
      toast({
        title: "Error",
        description: "Failed to return pass",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreatePassForm) => {
    createPassMutation.mutate(data);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation activeTab="dashboard" onTabChange={() => {}} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              PassPilot Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage student passes and monitor activity
            </p>
          </div>
          
          <Dialog open={isCreatePassOpen} onOpenChange={setIsCreatePassOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-pass" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Pass
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Pass</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="studentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Name</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-student-name"
                            placeholder="Enter student name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger data-testid="select-reason">
                              <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Bathroom">Bathroom</SelectItem>
                              <SelectItem value="Nurse">Nurse</SelectItem>
                              <SelectItem value="Office">Office</SelectItem>
                              <SelectItem value="Water">Water</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreatePassOpen(false)}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPassMutation.isPending}
                      data-testid="button-submit"
                    >
                      {createPassMutation.isPending ? "Creating..." : "Create Pass"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Passes</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-passes">
                {activePassesLoading ? "..." : activePasses.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Passes Today</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-passes">
                {statisticsLoading ? "..." : statistics?.totalPasses || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-avg-duration">
                {statisticsLoading ? "..." : `${statistics?.avgDuration || 0}min`}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Count</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-count">
                {statisticsLoading ? "..." : statistics?.activeCount || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="passes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="passes" data-testid="tab-passes">Active Passes</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">Pass History</TabsTrigger>
            <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="passes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Passes</CardTitle>
              </CardHeader>
              <CardContent>
                {activePassesLoading ? (
                  <div>Loading active passes...</div>
                ) : activePasses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No active passes
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activePasses.map((pass) => (
                      <div key={pass.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`card-pass-${pass.id}`}>
                        <div>
                          <div className="font-semibold">{pass.studentName}</div>
                          <div className="text-sm text-gray-600">{pass.reason}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(pass.startsAt), "h:mm a")} - {formatDistance(new Date(pass.startsAt), new Date(), { addSuffix: true })}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={pass.status === "active" ? "default" : "secondary"}>
                            {pass.status}
                          </Badge>
                          {pass.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => returnPassMutation.mutate(pass.id)}
                              disabled={returnPassMutation.isPending}
                              data-testid={`button-return-${pass.id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Return
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Pass History</CardTitle>
              </CardHeader>
              <CardContent>
                {recentPassesLoading ? (
                  <div>Loading pass history...</div>
                ) : recentPasses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No pass history
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentPasses.slice(0, 20).map((pass) => (
                      <div key={pass.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`history-pass-${pass.id}`}>
                        <div>
                          <div className="font-semibold">{pass.studentName}</div>
                          <div className="text-sm text-gray-600">{pass.reason}</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(pass.startsAt), "MMM d, h:mm a")}
                            {pass.endsAt && ` - ${format(new Date(pass.endsAt), "h:mm a")}`}
                          </div>
                        </div>
                        <Badge variant={pass.status === "active" ? "default" : pass.status === "returned" ? "secondary" : "destructive"}>
                          {pass.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pass Reasons Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {statisticsLoading ? (
                    <div>Loading statistics...</div>
                  ) : statistics?.reasonBreakdown?.length ? (
                    <div className="space-y-3">
                      {statistics.reasonBreakdown.map((item, index) => (
                        <div key={index} className="flex justify-between items-center" data-testid={`breakdown-${index}`}>
                          <span className="font-medium">{item.reason}</span>
                          <Badge variant="outline">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Summary Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  {statisticsLoading ? (
                    <div>Loading statistics...</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Passes:</span>
                        <span className="font-semibold" data-testid="stat-total">{statistics?.totalPasses || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Duration:</span>
                        <span className="font-semibold" data-testid="stat-duration">{statistics?.avgDuration || 0} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Currently Active:</span>
                        <span className="font-semibold" data-testid="stat-active">{statistics?.activeCount || 0}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}