import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ScrollToTop } from "./components/util/ScrollToTop";

import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Security from "./pages/Security";
import Auth from "./pages/Auth";
import Tracking from "./pages/features/Tracking";
import Budgeting from "./pages/features/Budgeting";
import SubscriptionsFeature from "./pages/features/SubscriptionsFeature";

import Dashboard from "./pages/app/Dashboard";
import Transactions from "./pages/app/Transactions";
import Budgets from "./pages/app/Budgets";
import Subscriptions from "./pages/app/Subscriptions";
import Insights from "./pages/app/Insights";
import Settings from "./pages/app/Settings";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Marketing */}
        <Route path="/" element={<Landing />} />
        <Route path="/features/tracking" element={<Tracking />} />
        <Route path="/features/budgeting" element={<Budgeting />} />
        <Route path="/features/subscriptions" element={<SubscriptionsFeature />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/security" element={<Security />} />
        <Route path="/signin" element={<Auth mode="signin" />} />
        <Route path="/signup" element={<Auth mode="signup" />} />

        {/* App */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="budgets" element={<Budgets />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="insights" element={<Insights />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
