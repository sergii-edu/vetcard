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
import VetRecords from "@/pages/VetRecords";
import AddVetRecord from "@/pages/AddVetRecord";
import Vaccinations from "@/pages/Vaccinations";
import AddVaccination from "@/pages/AddVaccination";
import HealthMetrics from "@/pages/HealthMetrics";
import AddHealthMetric from "@/pages/AddHealthMetric";
import OCRScan from "@/pages/OCRScan";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/pets" component={PetsList} />
      <Route path="/pets/add" component={AddAnimal} />
      <Route path="/pets/:id" component={PetDetail} />
      <Route path="/records" component={VetRecords} />
      <Route path="/records/add" component={AddVetRecord} />
      <Route path="/vaccinations" component={Vaccinations} />
      <Route path="/vaccinations/add" component={AddVaccination} />
      <Route path="/health-metrics" component={HealthMetrics} />
      <Route path="/health-metrics/add" component={AddHealthMetric} />
      <Route path="/ocr" component={OCRScan} />
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
              <div className="flex h-screen w-full">
              <Route path="/">
                {() => <AppSidebar />}
              </Route>
              <Route path="/dashboard">
                {() => <AppSidebar />}
              </Route>
              <Route path="/pets">
                {() => <AppSidebar />}
              </Route>
              <Route path="/pets/add">
                {() => <AppSidebar />}
              </Route>
              <Route path="/pets/:id">
                {() => <AppSidebar />}
              </Route>
              <Route path="/records">
                {() => <AppSidebar />}
              </Route>
              <Route path="/records/add">
                {() => <AppSidebar />}
              </Route>
              <Route path="/vaccinations">
                {() => <AppSidebar />}
              </Route>
              <Route path="/vaccinations/add">
                {() => <AppSidebar />}
              </Route>
              <Route path="/health-metrics">
                {() => <AppSidebar />}
              </Route>
              <Route path="/health-metrics/add">
                {() => <AppSidebar />}
              </Route>
              <Route path="/ocr">
                {() => <AppSidebar />}
              </Route>
              <div className="flex flex-col flex-1">
                <Route path="/">
                  {() => (
                    <header className="flex items-center justify-between p-4 border-b">
                      <SidebarTrigger data-testid="button-sidebar-toggle" />
                      <ThemeToggle />
                    </header>
                  )}
                </Route>
                <Route path="/dashboard">
                  {() => (
                    <header className="flex items-center justify-between p-4 border-b">
                      <SidebarTrigger data-testid="button-sidebar-toggle" />
                      <ThemeToggle />
                    </header>
                  )}
                </Route>
                <Route path="/pets">
                  {() => (
                    <header className="flex items-center justify-between p-4 border-b">
                      <SidebarTrigger data-testid="button-sidebar-toggle" />
                      <ThemeToggle />
                    </header>
                  )}
                </Route>
                <Route path="/pets/add">
                  {() => (
                    <header className="flex items-center justify-between p-4 border-b">
                      <SidebarTrigger data-testid="button-sidebar-toggle" />
                      <ThemeToggle />
                    </header>
                  )}
                </Route>
                <Route path="/pets/:id">
                  {() => (
                    <header className="flex items-center justify-between p-4 border-b">
                      <SidebarTrigger data-testid="button-sidebar-toggle" />
                      <ThemeToggle />
                    </header>
                  )}
                </Route>
                <Route path="/records">
                  {() => (
                    <header className="flex items-center justify-between p-4 border-b">
                      <SidebarTrigger data-testid="button-sidebar-toggle" />
                      <ThemeToggle />
                    </header>
                  )}
                </Route>
                <Route path="/records/add">
                  {() => (
                    <header className="flex items-center justify-between p-4 border-b">
                      <SidebarTrigger data-testid="button-sidebar-toggle" />
                      <ThemeToggle />
                    </header>
                  )}
                </Route>
                <Route path="/vaccinations">
                  {() => (
                    <header className="flex items-center justify-between p-4 border-b">
                      <SidebarTrigger data-testid="button-sidebar-toggle" />
                      <ThemeToggle />
                    </header>
                  )}
                </Route>
                <Route path="/vaccinations/add">
                  {() => (
                    <header className="flex items-center justify-between p-4 border-b">
                      <SidebarTrigger data-testid="button-sidebar-toggle" />
                      <ThemeToggle />
                    </header>
                  )}
                </Route>
                <Route path="/health-metrics">
                  {() => (
                    <header className="flex items-center justify-between p-4 border-b">
                      <SidebarTrigger data-testid="button-sidebar-toggle" />
                      <ThemeToggle />
                    </header>
                  )}
                </Route>
                <Route path="/health-metrics/add">
                  {() => (
                    <header className="flex items-center justify-between p-4 border-b">
                      <SidebarTrigger data-testid="button-sidebar-toggle" />
                      <ThemeToggle />
                    </header>
                  )}
                </Route>
                <Route path="/ocr">
                  {() => (
                    <header className="flex items-center justify-between p-4 border-b">
                      <SidebarTrigger data-testid="button-sidebar-toggle" />
                      <ThemeToggle />
                    </header>
                  )}
                </Route>
                <main className="flex-1 overflow-auto p-6">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);
}

export default App;
