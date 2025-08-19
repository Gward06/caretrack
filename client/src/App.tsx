import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import MobileLayout from "@/components/layout/mobile-layout";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Notes from "@/pages/notes";
import Reports from "@/pages/reports";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <i className="fas fa-heart text-2xl text-white"></i>
          </div>
          <div className="text-lg font-semibold text-primary">CareTrack</div>
          <div className="text-sm text-gray-500 mt-2">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <MobileLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/clients" component={Clients} />
        <Route path="/notes" component={Notes} />
        <Route path="/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
    </MobileLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AuthenticatedApp />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
