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
          <MainLayout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pipelines" element={<PipelinesPage />} />
                <Route path="/archived" element={<ArchivedLeadsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </MainLayout>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
