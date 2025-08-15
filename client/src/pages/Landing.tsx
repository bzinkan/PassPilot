import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, Shield, BarChart3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/auth/login", { email, password, schoolId: Number(schoolId) }),
    onSuccess: () => {
      window.location.reload();
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !schoolId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-xl">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            PassPilot
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Modern school pass management system
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          {/* Features */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Streamline Student Movement
            </h2>
            
            <div className="grid gap-4">
              <div className="flex items-start space-x-3">
                <Users className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Digital Pass Management</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Issue and track student passes digitally with real-time status updates.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Enhanced Safety</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Know where students are at all times with comprehensive tracking.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <BarChart3 className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Detailed Reports</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Generate insights on student movement patterns and pass usage.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access PassPilot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolId">School ID</Label>
                  <Input
                    id="schoolId"
                    type="number"
                    placeholder="Enter school ID"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    data-testid="input-school-id"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}