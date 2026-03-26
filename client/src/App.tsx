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
import VacantUnits from "./pages/VacantUnits";
import ArchivedContracts from "./pages/ArchivedContracts";
import FalCompliance from "./pages/FalCompliance";
import Approvals from "./pages/Approvals";
import YearlyComparison from "./pages/YearlyComparison";
import GeoStats from "./pages/GeoStats";
import OwnerDashboard from "./pages/OwnerDashboard";
import Invoices from "./pages/Invoices";
import TenantAnalytics from "./pages/TenantAnalytics";
import PropertyTax from "./pages/PropertyTax";
import EmailNotifications from "./pages/EmailNotifications";
import Reservations from "./pages/Reservations";
import SwaggerDocs from "./pages/SwaggerDocs";
import UserManagement from "./pages/UserManagement";
import Vouchers from "./pages/Vouchers";
import Onboarding from "./pages/Onboarding";
import Subscription from "./pages/Subscription";
import Pricing from "./pages/Pricing";
import SuperAdmin from "./pages/SuperAdmin";

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
      <Route path={"/vacant-units"} component={VacantUnits} />
      <Route path={"/archived-contracts"} component={ArchivedContracts} />
      <Route path={"/fal-compliance"} component={FalCompliance} />
      <Route path={"/approvals"} component={Approvals} />
      <Route path={"/yearly-comparison"} component={YearlyComparison} />
      <Route path={"/geo-stats"} component={GeoStats} />
      <Route path={"/owner-dashboard"} component={OwnerDashboard} />
      <Route path={"/invoices"} component={Invoices} />
      <Route path={"/tenant-analytics"} component={TenantAnalytics} />
      <Route path={"/property-tax"} component={PropertyTax} />
      <Route path={"/email-notifications"} component={EmailNotifications} />
      <Route path={"/reservations"} component={Reservations} />
      <Route path={"/api-docs"} component={SwaggerDocs} />
      <Route path={"/user-management"} component={UserManagement} />
      <Route path={"/vouchers"} component={Vouchers} />
      <Route path={"/onboarding"} component={Onboarding} />
      <Route path={"/subscription"} component={Subscription} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/super-admin"} component={SuperAdmin} />
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
