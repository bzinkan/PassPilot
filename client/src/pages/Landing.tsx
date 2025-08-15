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
    mutationFn: () => apiRequest("POST", "/api/auth/login", { email, password, schoolId: Number(schoolId) }),
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
    <div className="min-h-screen bg-pilot-gradient dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-pilot-gradient-light opacity-30"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-pilot-blue-50 rounded-full -translate-x-48 -translate-y-48 opacity-50"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pilot-blue-100 rounded-full translate-x-48 translate-y-48 opacity-30"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-pilot-gradient p-4 rounded-2xl shadow-pilot-xl">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            PassPilot
          </h1>
          <p className="text-xl text-white/90 font-medium">
            Modern school pass management system
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Features */}
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white mb-8">
              Streamline Student Movement
            </h2>
            
            <div className="grid gap-6">
              <div className="flex items-start space-x-4 p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-pilot">
                <div className="bg-emerald-500/90 p-3 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2 text-lg">Digital Pass Management</h3>
                  <p className="text-white/90 leading-relaxed">
                    Issue and track student passes digitally with real-time status updates.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-pilot">
                <div className="bg-orange-500/90 p-3 rounded-xl shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2 text-lg">Enhanced Safety</h3>
                  <p className="text-white/90 leading-relaxed">
                    Know where students are at all times with comprehensive tracking.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-pilot">
                <div className="bg-purple-500/90 p-3 rounded-xl shadow-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2 text-lg">Detailed Reports</h3>
                  <p className="text-white/90 leading-relaxed">
                    Generate insights on student movement patterns and pass usage.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <Card className="w-full max-w-md mx-auto glass border-white/30 shadow-pilot-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">Sign In</CardTitle>
              <CardDescription className="text-white/70">
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
                  className="w-full bg-pilot-gradient hover:bg-pilot-blue-dark text-white font-semibold py-3 shadow-pilot transition-all duration-200"
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