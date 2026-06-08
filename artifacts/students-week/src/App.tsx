import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StarfieldBackground } from "@/components/layout/StarfieldBackground";
import { useEffect } from "react";

import Landing from "@/pages/Landing";
import Vendors from "@/pages/Vendors";
import Menu from "@/pages/Menu";
import OrderComplete from "@/pages/OrderComplete";
import NotFound from "@/pages/not-found";

import AdminLayout from "@/pages/admin/AdminLayout";
import LiveOrders from "@/pages/admin/LiveOrders";
import AdminVendors from "@/pages/admin/AdminVendors";
import AdminTables from "@/pages/admin/AdminTables";
import AdminMenuItems from "@/pages/admin/AdminMenuItems";
import OrderHistory from "@/pages/admin/OrderHistory";
import AdminConfig from "@/pages/admin/AdminConfig";
import AdminLogin from "@/pages/AdminLogin";

import UsherLogin from "@/pages/UsherLogin";
import UsherLayout from "@/pages/usher/UsherLayout";
import UsherLiveOrders from "@/pages/usher/UsherLiveOrders";
import UsherTables from "@/pages/usher/UsherTables";

import VendorLogin from "@/pages/VendorLogin";
import VendorDashboard from "@/pages/vendor/VendorDashboard";

import { ROUTES } from "@/constants/routes";

const queryClient = new QueryClient();

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const isAuthenticated = 
    localStorage.getItem("adminAuthenticated") === "true" && 
    localStorage.getItem("adminToken");
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.ADMIN_LOGIN);
    }
  }, [isAuthenticated, navigate]);
  
  if (!isAuthenticated) {
    return null;
  }
  
  return <>{children}</>;
}

function ProtectedUsherRoute({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const isAuthenticated = 
    localStorage.getItem("usherAuthenticated") === "true" && 
    localStorage.getItem("usherToken");
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.USHER_LOGIN);
    }
  }, [isAuthenticated, navigate]);
  
  if (!isAuthenticated) {
    return null;
  }
  
  return <>{children}</>;
}

function ProtectedVendorRoute({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const isAuthenticated = 
    localStorage.getItem("vendorAuthenticated") === "true" && 
    localStorage.getItem("vendorToken");
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.VENDOR_LOGIN);
    }
  }, [isAuthenticated, navigate]);
  
  if (!isAuthenticated) {
    return null;
  }
  
  return <>{children}</>;
}

function AdminLoginPage() {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    const isAuthenticated = 
      localStorage.getItem("adminAuthenticated") === "true" && 
      localStorage.getItem("adminToken");
    if (isAuthenticated) {
      navigate(ROUTES.ADMIN_DASHBOARD);
    }
  }, [navigate]);
  
  return <AdminLogin />;
}

function UsherLoginPage() {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    const isAuthenticated = 
      localStorage.getItem("usherAuthenticated") === "true" && 
      localStorage.getItem("usherToken");
    if (isAuthenticated) {
      navigate(ROUTES.USHER_DASHBOARD);
    }
  }, [navigate]);
  
  return <UsherLogin />;
}

function VendorLoginPage() {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    const isAuthenticated = 
      localStorage.getItem("vendorAuthenticated") === "true" && 
      localStorage.getItem("vendorToken");
    if (isAuthenticated) {
      navigate(ROUTES.VENDOR_DASHBOARD);
    }
  }, [navigate]);
  
  return <VendorLogin />;
}

function AdminRoutes() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout>
        <Switch>
          <Route path={ROUTES.ADMIN_DASHBOARD} component={LiveOrders} />
          <Route path={ROUTES.ADMIN_VENDORS} component={AdminVendors} />
          <Route path={ROUTES.ADMIN_TABLES} component={AdminTables} />
          <Route path={ROUTES.ADMIN_MENU} component={AdminMenuItems} />
          <Route path={ROUTES.ADMIN_HISTORY} component={OrderHistory} />
          <Route path={ROUTES.ADMIN_CONFIG} component={AdminConfig} />
        </Switch>
      </AdminLayout>
    </ProtectedAdminRoute>
  );
}

function UsherRoutes() {
  return (
    <ProtectedUsherRoute>
      <UsherLayout>
        <Switch>
          <Route path={ROUTES.USHER_DASHBOARD} component={UsherLiveOrders} />
          <Route path={ROUTES.USHER_TABLES} component={UsherTables} />
        </Switch>
      </UsherLayout>
    </ProtectedUsherRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={ROUTES.HOME} component={Landing} />
      <Route path={ROUTES.VENDORS} component={Vendors} />
      <Route path={ROUTES.MENU} component={Menu} />
      <Route path={ROUTES.ORDER_COMPLETE} component={OrderComplete} />

      {/* Admin routes */}
      <Route path={ROUTES.ADMIN_LOGIN} component={AdminLoginPage} />
      <Route path={ROUTES.ADMIN_DASHBOARD} component={AdminRoutes} />
      <Route path={ROUTES.ADMIN_VENDORS} component={AdminRoutes} />
      <Route path={ROUTES.ADMIN_TABLES} component={AdminRoutes} />
      <Route path={ROUTES.ADMIN_MENU} component={AdminRoutes} />
      <Route path={ROUTES.ADMIN_HISTORY} component={AdminRoutes} />
      <Route path={ROUTES.ADMIN_CONFIG} component={AdminRoutes} />

      {/* Usher routes */}
      <Route path={ROUTES.USHER_LOGIN} component={UsherLoginPage} />
      <Route path={ROUTES.USHER_DASHBOARD} component={UsherRoutes} />
      <Route path={ROUTES.USHER_TABLES} component={UsherRoutes} />

      {/* Vendor routes */}
      <Route path={ROUTES.VENDOR_LOGIN} component={VendorLoginPage} />
      <Route path={ROUTES.VENDOR_DASHBOARD}>
        {() => (
          <ProtectedVendorRoute>
            <VendorDashboard />
          </ProtectedVendorRoute>
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StarfieldBackground />
        <div className="relative z-10">
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
