import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import RigFinancials from "./pages/RigFinancials";
import RigConsumption from "./pages/RigConsumption";
import RigPerformance from "./pages/RigPerformance";
import RigStatus from "./pages/RigStatus";
import NotFound from "./pages/NotFound";

// Rig Financials sub-pages
import Utilization from "./pages/RigFinancials/Utilization";
import YTD from "./pages/RigFinancials/YTD";
import BillingNPT from "./pages/RigFinancials/BillingNPT";
import Revenue from "./pages/RigFinancials/Revenue";

// Rig Consumption sub-pages
import Fuel from "./pages/RigConsumption/Fuel";
import Material from "./pages/RigConsumption/Material";
import Maintenance from "./pages/RigConsumption/Maintenance";

// Rig Performance sub-pages
import RigMoves from "./pages/RigPerformance/RigMoves";
import WellTracker from "./pages/RigPerformance/WellTracker";

// Rig Status sub-pages
import CustomerSatisfaction from "./pages/RigStatus/CustomerSatisfaction";
import Stock from "./pages/RigStatus/Stock";
import WorkOrders from "./pages/RigStatus/WorkOrders";
import DRLine from "./pages/RigStatus/DRLine";

// Admin pages
import BudgetManagement from "./pages/Admin/BudgetManagement";
import UserManagement from "./pages/Admin/UserManagement";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            
              {/* Rig Financials */}
              <Route path="/rig-financials" element={<ProtectedRoute><RigFinancials /></ProtectedRoute>} />
              <Route path="/rig-financials/utilization" element={<ProtectedRoute><Utilization /></ProtectedRoute>} />
              <Route path="/rig-financials/ytd" element={<ProtectedRoute><YTD /></ProtectedRoute>} />
              <Route path="/rig-financials/billing-npt" element={<ProtectedRoute><BillingNPT /></ProtectedRoute>} />
              <Route path="/rig-financials/revenue" element={<ProtectedRoute><Revenue /></ProtectedRoute>} />
            
              {/* Rig Consumption */}
              <Route path="/rig-consumption" element={<ProtectedRoute><RigConsumption /></ProtectedRoute>} />
              <Route path="/rig-consumption/fuel" element={<ProtectedRoute><Fuel /></ProtectedRoute>} />
              <Route path="/rig-consumption/material" element={<ProtectedRoute><Material /></ProtectedRoute>} />
              <Route path="/rig-consumption/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
            
              {/* Rig Performance */}
              <Route path="/rig-performance" element={<ProtectedRoute><RigPerformance /></ProtectedRoute>} />
              <Route path="/rig-performance/rig-moves" element={<ProtectedRoute><RigMoves /></ProtectedRoute>} />
              <Route path="/rig-performance/well-tracker" element={<ProtectedRoute><WellTracker /></ProtectedRoute>} />
            
              {/* Rig Status */}
              <Route path="/rig-status" element={<ProtectedRoute><RigStatus /></ProtectedRoute>} />
              <Route path="/rig-status/customer-satisfaction" element={<ProtectedRoute><CustomerSatisfaction /></ProtectedRoute>} />
              <Route path="/rig-status/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
              <Route path="/rig-status/work-orders" element={<ProtectedRoute><WorkOrders /></ProtectedRoute>} />
              <Route path="/rig-status/dr-line" element={<ProtectedRoute><DRLine /></ProtectedRoute>} />
              
              {/* Admin routes */}
              <Route path="/admin/budgets" element={<ProtectedRoute role="admin"><BudgetManagement /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute role="admin"><UserManagement /></ProtectedRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
