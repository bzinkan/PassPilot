import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DemoSetup() {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createDemoData = async () => {
    setIsCreating(true);
    try {
      // Create demo school and admin user directly via API
      const response = await fetch("/api/sa/demo-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        toast({
          title: "Demo Ready!",
          description: "Demo school and admin created. Redirecting to dashboard...",
        });
        
        // Redirect to main dashboard
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else {
        throw new Error("Failed to create demo");
      }
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "Could not create demo setup",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-pilot-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass border-white/30 shadow-pilot-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-pilot-500/90 p-3 rounded-xl shadow-lg">
              <Rocket className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">PassPilot Demo</CardTitle>
          <CardDescription className="text-white/70">
            Quick setup for exploring the full system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-white/80 text-sm space-y-2">
            <p>This will create:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Demo school "Riverside Elementary"</li>
              <li>Admin user with full access</li>
              <li>Sample grades and students</li>
              <li>Active pass examples</li>
            </ul>
          </div>
          
          <Button
            onClick={createDemoData}
            disabled={isCreating}
            className="w-full bg-pilot-gradient hover:bg-pilot-blue-dark text-white font-semibold py-3 shadow-pilot transition-all duration-200"
          >
            {isCreating ? "Creating Demo..." : "Setup Demo Environment"}
          </Button>
          
          <div className="text-center">
            <a href="/super-admin/bootstrap" className="text-white/60 text-sm hover:text-white">
              Or try Super Admin Bootstrap
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}