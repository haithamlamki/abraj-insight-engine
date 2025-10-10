import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Rig Financials */}
          <Route path="/rig-financials" element={<RigFinancials />} />
          <Route path="/rig-financials/utilization" element={<Utilization />} />
          <Route path="/rig-financials/ytd" element={<YTD />} />
          <Route path="/rig-financials/billing-npt" element={<BillingNPT />} />
          <Route path="/rig-financials/revenue" element={<Revenue />} />
          
          {/* Rig Consumption */}
          <Route path="/rig-consumption" element={<RigConsumption />} />
          <Route path="/rig-consumption/fuel" element={<Fuel />} />
          <Route path="/rig-consumption/material" element={<Material />} />
          <Route path="/rig-consumption/maintenance" element={<Maintenance />} />
          
          {/* Rig Performance */}
          <Route path="/rig-performance" element={<RigPerformance />} />
          <Route path="/rig-performance/rig-moves" element={<RigMoves />} />
          <Route path="/rig-performance/well-tracker" element={<WellTracker />} />
          
          {/* Rig Status */}
          <Route path="/rig-status" element={<RigStatus />} />
          <Route path="/rig-status/customer-satisfaction" element={<CustomerSatisfaction />} />
          <Route path="/rig-status/stock" element={<Stock />} />
          <Route path="/rig-status/work-orders" element={<WorkOrders />} />
          <Route path="/rig-status/dr-line" element={<DRLine />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
