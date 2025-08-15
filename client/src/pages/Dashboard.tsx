import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  UserCheck, 
  Clock, 
  LogOut, 
  Settings, 
  ClipboardList,
  UserPlus,
  GraduationCap
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import PassManagement from "@/components/PassManagement";
import RosterManagement from "@/components/RosterManagement";
import MyClassView from "@/components/MyClassView";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("myclass");

  const { data: stats } = useQuery({
    queryKey: ["/myclass/stats"],
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/logout"),
    onSuccess: () => {
      window.location.reload();
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  PassPilot
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Welcome back, User
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="capitalize">
                Teacher
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-students">
                {stats?.totalStudents ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students Out</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600" data-testid="text-students-out">
                {stats?.studentsOut ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="text-available-students">
                {stats?.availableStudents ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="myclass" data-testid="tab-myclass">
              <UserCheck className="h-4 w-4 mr-2" />
              My Class
            </TabsTrigger>
            <TabsTrigger value="passes" data-testid="tab-passes">
              <ClipboardList className="h-4 w-4 mr-2" />
              All Passes
            </TabsTrigger>
            <TabsTrigger value="roster" data-testid="tab-roster">
              <UserPlus className="h-4 w-4 mr-2" />
              Roster
            </TabsTrigger>
            <TabsTrigger value="admin" data-testid="tab-admin">
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="myclass" className="space-y-6">
            <MyClassView />
          </TabsContent>

          <TabsContent value="passes" className="space-y-6">
            <PassManagement />
          </TabsContent>

          <TabsContent value="roster" className="space-y-6">
            <RosterManagement />
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Administrative Functions</CardTitle>
                <CardDescription>
                  School administration and system settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Administrative features coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}