import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import OwnerPortal from "./pages/OwnerPortal";
import BrokerPortal from "./pages/BrokerPortal";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import Contractors from "./pages/Contractors";
import OwnerTransfers from "./pages/OwnerTransfers";
import BrokerReferrals from "./pages/BrokerReferrals";
import SystemSettings from "./pages/SystemSettings";
import SmartAlerts from "./pages/SmartAlerts";
import DataExport from "./pages/DataExport";
import TenantPortal from "./pages/TenantPortal";
import MarketComparison from "./pages/MarketComparison";
import AnnualReport from "./pages/AnnualReport";
import ClientNotes from "./pages/ClientNotes";
import TenantRatings from "./pages/TenantRatings";
import TenantPortalFull from "./pages/TenantPortalFull";
import PropertyListings from "./pages/PropertyListings";
import OpenAPI from "./pages/OpenAPI";
import AccountingIntegration from "./pages/AccountingIntegration";
import StaffManagement from "./pages/StaffManagement";
import InternalMessages from "./pages/InternalMessages";
import SecurityLog from "./pages/SecurityLog";
import RenewalRequests from "./pages/RenewalRequests";
import ApiStats from "./pages/ApiStats";
import PublicListings from "./pages/PublicListings";
import ArrearsHeatmap from "./pages/ArrearsHeatmap";
import CashflowForecast from "./pages/CashflowForecast";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/dashboard/:tab"} component={Dashboard} />
      <Route path={"/owner"} component={OwnerPortal} />
      <Route path={"/owner/:tab"} component={OwnerPortal} />
      <Route path={"/broker"} component={BrokerPortal} />
      <Route path={"/broker/:tab"} component={BrokerPortal} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/reports/:tab"} component={Reports} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/contractors"} component={Contractors} />
      <Route path={"/owner-transfers"} component={OwnerTransfers} />
      <Route path={"/broker-referrals"} component={BrokerReferrals} />
      <Route path={"/settings"} component={SystemSettings} />
      <Route path={"/smart-alerts"} component={SmartAlerts} />
      <Route path={"/data-export"} component={DataExport} />
      <Route path={"/tenant-portal"} component={TenantPortal} />
      <Route path={"/market-comparison"} component={MarketComparison} />
      <Route path={"/annual-report"} component={AnnualReport} />
      <Route path={"/client-notes"} component={ClientNotes} />
      <Route path={"/tenant-ratings"} component={TenantRatings} />
      <Route path={"/tenant-portal-v2"} component={TenantPortalFull} />
      <Route path={"/listings"} component={PropertyListings} />
      <Route path={"/open-api"} component={OpenAPI} />
      <Route path={"/accounting"} component={AccountingIntegration} />
      <Route path={"/staff"} component={StaffManagement} />
      <Route path={"/messages"} component={InternalMessages} />
      <Route path={"/security"} component={SecurityLog} />
      <Route path={"/renewal-requests"} component={RenewalRequests} />
      <Route path={"/api-stats"} component={ApiStats} />
      <Route path={"/listings/public"} component={PublicListings} />
      <Route path={"/arrears-heatmap"} component={ArrearsHeatmap} />
      <Route path={"/cashflow-forecast"} component={CashflowForecast} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
