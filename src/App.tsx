import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "@/hooks/use-theme";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import Dashboard from "@/pages/Dashboard";
import NotFound from "./pages/NotFound";

// Lazy load heavy pages
const PipelinesPage = lazy(() => import("@/pages/PipelinesPage"));
const ArchivedLeadsPage = lazy(() => import("@/pages/ArchivedLeadsPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const IntegrationsPage = lazy(() => import("@/pages/IntegrationsPage"));
const AnalyticsPage = lazy(() => import("@/pages/AnalyticsPage"));
const CapturePage = lazy(() => import("@/pages/CapturePage"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <LoadingSpinner size="lg" text="Carregando..." />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public capture page - no layout */}
            <Route
              path="/captura/:pipelineId"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CapturePage />
                </Suspense>
              }
            />
            
            {/* Main app routes with layout */}
            <Route
              path="/*"
              element={
                <MainLayout>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/pipelines" element={<PipelinesPage />} />
                      <Route path="/archived" element={<ArchivedLeadsPage />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/integrations" element={<IntegrationsPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </MainLayout>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
