import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import PetsList from "@/pages/PetsList";
import PetDetail from "@/pages/PetDetail";
import AddAnimal from "@/pages/AddAnimal";
import HealthMetrics from "@/pages/HealthMetrics";
import AddHealthMetric from "@/pages/AddHealthMetric";
import LabTests from "@/pages/LabTests";
import LabTestDetail from "@/pages/LabTestDetail";
import AddLabTest from "@/pages/AddLabTest";
import OCRScan from "@/pages/OCRScan";
import AIChat from "@/pages/AIChat";
import Settings from "@/pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/pets" component={PetsList} />
      <Route path="/pets/add" component={AddAnimal} />
      <Route path="/pets/:id" component={PetDetail} />
      <Route path="/health-metrics" component={HealthMetrics} />
      <Route path="/health-metrics/add" component={AddHealthMetric} />
      <Route path="/lab-tests" component={LabTests} />
      <Route path="/lab-tests/add" component={AddLabTest} />
      <Route path="/lab-tests/:id" component={LabTestDetail} />
      <Route path="/ocr" component={OCRScan} />
      <Route path="/ai-chat" component={AIChat} />
      <Route path="/ai-chat/:animalId" component={AIChat} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <SidebarProvider style={style as React.CSSProperties}>
              <Switch>
                <Route path="/login" component={Login} />
                <Route>
                  {() => (
                    <div className="flex h-screen w-full">
                      <AppSidebar />
                      <div className="flex flex-col flex-1">
                        <header className="flex items-center justify-between p-4 border-b">
                          <SidebarTrigger data-testid="button-sidebar-toggle" />
                          <ThemeToggle />
                        </header>
                        <main className="flex-1 overflow-auto p-6">
                          <Router />
                        </main>
                      </div>
                    </div>
                  )}
                </Route>
              </Switch>
            </SidebarProvider>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
