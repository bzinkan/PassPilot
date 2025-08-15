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
  GraduationCap,
  Shield
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import PassManagement from "@/components/PassManagement";
import RosterManagement from "@/components/RosterManagement";
import MyClassView from "@/components/MyClassView";
import ProfileSettings from "@/components/ProfileSettings";

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
    <div className="min-h-screen bg-pilot-background">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-pilot-blue-100 shadow-pilot">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-pilot-gradient p-3 rounded-xl shadow-pilot">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-pilot-blue-dark">
                  PassPilot
                </h1>
                <p className="text-sm text-pilot-blue/70">
                  Welcome back, {user?.email || 'User'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge className="bg-pilot-blue-100 text-pilot-blue-dark border-pilot-blue-200 capitalize px-3 py-1">
                {user?.role || 'Teacher'}
              </Badge>
              <Button
                className="bg-pilot-blue-100 text-pilot-blue-dark hover:bg-pilot-blue-200 border-pilot-blue-200"
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
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-pilot-blue-100 shadow-pilot hover:shadow-pilot-xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pilot-blue-dark">Total Students</CardTitle>
              <div className="bg-pilot-blue-100 p-2 rounded-lg">
                <Users className="h-4 w-4 text-pilot-blue" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pilot-blue-dark" data-testid="text-total-students">
                {stats?.totalStudents ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-pilot-blue-100 shadow-pilot hover:shadow-pilot-xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pilot-blue-dark">Students Out</CardTitle>
              <div className="bg-pilot-warning/10 p-2 rounded-lg">
                <Clock className="h-4 w-4 text-pilot-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pilot-warning" data-testid="text-students-out">
                {stats?.studentsOut ?? 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-pilot-blue-100 shadow-pilot hover:shadow-pilot-xl transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pilot-blue-dark">Available</CardTitle>
              <div className="bg-pilot-success/10 p-2 rounded-lg">
                <UserCheck className="h-4 w-4 text-pilot-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pilot-success" data-testid="text-available-students">
                {stats?.availableStudents ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border-pilot-blue-100 shadow-pilot p-1">
            <TabsTrigger value="myclass" data-testid="tab-myclass" className="data-[state=active]:bg-pilot-gradient data-[state=active]:text-white">
              <UserCheck className="h-4 w-4 mr-2" />
              My Class
            </TabsTrigger>
            <TabsTrigger value="passes" data-testid="tab-passes" className="data-[state=active]:bg-pilot-gradient data-[state=active]:text-white">
              <ClipboardList className="h-4 w-4 mr-2" />
              All Passes
            </TabsTrigger>
            <TabsTrigger value="roster" data-testid="tab-roster" className="data-[state=active]:bg-pilot-gradient data-[state=active]:text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              Roster
            </TabsTrigger>
            <TabsTrigger value="profile" data-testid="tab-profile" className="data-[state=active]:bg-pilot-gradient data-[state=active]:text-white">
              <Settings className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            {user?.role === 'admin' || user?.role === 'superadmin' ? (
              <TabsTrigger value="admin" data-testid="tab-admin" className="data-[state=active]:bg-pilot-gradient data-[state=active]:text-white">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </TabsTrigger>
            ) : null}
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

          <TabsContent value="profile" className="space-y-6">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-pilot-blue-100 shadow-pilot">
              <CardHeader>
                <CardTitle className="text-pilot-blue-dark">Administrative Functions</CardTitle>
                <CardDescription className="text-pilot-blue/70">
                  School administration and system settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user?.role === 'superadmin' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-semibold text-red-800 mb-2">Super Admin Access</h3>
                    <p className="text-red-700 mb-3">
                      You have Super Admin privileges. Access the full administrative dashboard for cross-tenant management.
                    </p>
                    <Button
                      onClick={() => window.location.href = '/super-admin/dashboard'}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Open Super Admin Dashboard
                    </Button>
                  </div>
                )}
                <p className="text-pilot-blue/60">
                  School-level administrative features coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}