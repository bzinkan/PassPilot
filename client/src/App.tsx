import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import KioskLogin from "@/pages/KioskLogin";
import KioskDashboard from "@/pages/KioskDashboard";
import SuperAdminBootstrap from "@/pages/SuperAdminBootstrap";
import SuperAdminDashboard from "@/pages/SuperAdminDashboard";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Kiosk routes - no authentication needed */}
      <Route path="/kiosk/login" component={KioskLogin} />
      <Route path="/kiosk/dashboard" component={KioskDashboard} />
      
      {/* Super Admin routes */}
      <Route path="/super-admin/bootstrap" component={SuperAdminBootstrap} />
      <Route path="/super-admin/dashboard" component={SuperAdminDashboard} />
      
      {/* Main app routes */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
