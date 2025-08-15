import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, School } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function KioskLogin() {
  const [schoolId, setSchoolId] = useState("");
  const [room, setRoom] = useState("");
  const [pin, setPin] = useState("");
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/kiosk/login", { 
      schoolId: Number(schoolId), 
      room, 
      pin 
    }),
    onSuccess: () => {
      window.location.href = "/kiosk/dashboard";
    },
    onError: (error) => {
      toast({
        title: "Kiosk Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId || !room || !pin) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-slate-600 p-3 rounded-xl">
              <Monitor className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Kiosk Login</CardTitle>
          <CardDescription>
            Enter kiosk credentials to access the pass system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schoolId">
                <School className="w-4 h-4 inline mr-2" />
                School ID
              </Label>
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
              <Label htmlFor="room">Room</Label>
              <Input
                id="room"
                placeholder="Enter room number/name"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                data-testid="input-room"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter kiosk PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                data-testid="input-pin"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In to Kiosk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}