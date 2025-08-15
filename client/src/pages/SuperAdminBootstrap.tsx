import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SuperAdminBootstrap() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bootstrapSecret, setBootstrapSecret] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const bootstrapMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/sa/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-bootstrap-secret": bootstrapSecret,
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Bootstrap failed");
      }

      return response.json();
    },
    onSuccess: () => {
      setIsComplete(true);
      toast({
        title: "Super Admin Created",
        description: "Bootstrap successful! You can now login with your credentials.",
      });
    },
    onError: (error) => {
      toast({
        title: "Bootstrap Failed",
        description: error.message || "Failed to create Super Admin",
        variant: "destructive",
      });
    },
  });

  const handleBootstrap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !bootstrapSecret) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    bootstrapMutation.mutate();
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-pilot-gradient flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass border-white/30 shadow-pilot-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-500/90 p-3 rounded-xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">Bootstrap Complete!</CardTitle>
            <CardDescription className="text-white/70">
              Super Admin account has been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-white/90 text-center">
                You can now login using the regular login form with your Super Admin credentials.
              </p>
              <Button
                onClick={() => window.location.href = "/"}
                className="w-full bg-pilot-gradient hover:bg-pilot-blue-dark text-white font-semibold py-3 shadow-pilot"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pilot-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass border-white/30 shadow-pilot-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-500/90 p-3 rounded-xl shadow-lg">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Super Admin Bootstrap</CardTitle>
          <CardDescription className="text-white/70">
            Create the first Super Admin account (one-time setup)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBootstrap} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bootstrapSecret" className="text-white font-medium">Bootstrap Secret</Label>
              <Input
                id="bootstrapSecret"
                type="password"
                placeholder="Enter bootstrap secret key"
                value={bootstrapSecret}
                onChange={(e) => setBootstrapSecret(e.target.value)}
                data-testid="input-bootstrap-secret"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium">Super Admin Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter super admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-sa-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-medium">Super Admin Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="input-sa-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-pilot-gradient hover:bg-pilot-blue-dark text-white font-semibold py-3 shadow-pilot transition-all duration-200"
              disabled={bootstrapMutation.isPending}
              data-testid="button-bootstrap"
            >
              {bootstrapMutation.isPending ? "Creating Super Admin..." : "Bootstrap Super Admin"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-white/80 text-sm">
              <strong>Note:</strong> This is a one-time setup. Once a Super Admin exists, this bootstrap will no longer work for security reasons.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}