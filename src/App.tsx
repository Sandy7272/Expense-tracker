import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { DateRangeProvider } from "./contexts/DateRangeContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { lazy, Suspense } from "react";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";

// Lazy load all route pages
const Index = lazy(() => import("./pages/Index"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Investments = lazy(() => import("./pages/Investments"));
const Lending = lazy(() => import("./pages/Lending"));
const Loans = lazy(() => import("./pages/Loans"));
const Settings = lazy(() => import("./pages/Settings"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Landing = lazy(() => import("./pages/Landing"));
const RecurringPayments = lazy(() => import("./pages/RecurringPayments"));
const Budgets = lazy(() => import("./pages/Budgets"));
const ProfitLoss = lazy(() => import("./pages/ProfitLoss"));
const Subscription = lazy(() => import("./pages/Subscription"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <PageLoader />;
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />;
};

const Home = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DateRangeProvider>
      <CurrencyProvider>
        <SubscriptionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                    <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
                    <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                    <Route path="/investments" element={<ProtectedRoute><Investments /></ProtectedRoute>} />
                    <Route path="/lending" element={<ProtectedRoute><Lending /></ProtectedRoute>} />
                    <Route path="/loans" element={<ProtectedRoute><Loans /></ProtectedRoute>} />
                    <Route path="/recurring" element={<ProtectedRoute><RecurringPayments /></ProtectedRoute>} />
                    <Route path="/budgets" element={<ProtectedRoute><Budgets /></ProtectedRoute>} />
                    <Route path="/profit-loss" element={<ProtectedRoute><ProfitLoss /></ProtectedRoute>} />
                    <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </SubscriptionProvider>
      </CurrencyProvider>
    </DateRangeProvider>
  </QueryClientProvider>
);

export default App;
