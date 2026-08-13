import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./lib/AppContext";
import LoginScreen from "./components/LoginScreen";
import UploadScreen from "./components/UploadScreen";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import CustomerDetailPage from "./pages/CustomerDetailPage";

import OwnerDashboardPage from "./pages/owner/DashboardPage";
import CustomersAtRiskPage from "./pages/owner/CustomersAtRiskPage";
import RevenueImpactPage from "./pages/owner/RevenueImpactPage";
import RetentionAnalyticsPage from "./pages/owner/RetentionAnalyticsPage";
import TeamOverviewPage from "./pages/owner/TeamOverviewPage";
import ReportsPage from "./pages/owner/ReportsPage";

import ManagerDashboardPage from "./pages/manager/DashboardPage";
import AtRiskCustomersPage from "./pages/manager/AtRiskCustomersPage";
import MyTeamPage from "./pages/manager/MyTeamPage";
import AssignmentsPage from "./pages/manager/AssignmentsPage";
import RetentionCasesPage from "./pages/manager/RetentionCasesPage";
import SupportEscalationsPage from "./pages/manager/SupportEscalationsPage";
import ManagerAnalyticsPage from "./pages/manager/AnalyticsPage";

import TeamDashboardPage from "./pages/team/DashboardPage";
import MyCustomersPage from "./pages/team/MyCustomersPage";
import MyTasksPage from "./pages/team/MyTasksPage";
import SupportRequestsPage from "./pages/team/SupportRequestsPage";
import TeamActivityHistoryPage from "./pages/team/ActivityHistoryPage";

import SupportDashboardPage from "./pages/support/DashboardPage";
import MyTicketsPage from "./pages/support/MyTicketsPage";
import HighPriorityPage from "./pages/support/HighPriorityPage";
import ResolvedCasesPage from "./pages/support/ResolvedCasesPage";
import SupportHistoryPage from "./pages/support/SupportHistoryPage";

function AppRoutes() {
  const { auth } = useApp();

  return (
    <Routes>
      <Route path="/login" element={auth ? <Navigate to="/upload" replace /> : <LoginScreen />} />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <UploadScreen />
          </ProtectedRoute>
        }
      />

      <Route
        path="/business-owner"
        element={
          <ProtectedRoute allowedRoles={["business_owner"]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<OwnerDashboardPage />} />
        <Route path="customers-at-risk" element={<CustomersAtRiskPage />} />
        <Route path="revenue-impact" element={<RevenueImpactPage />} />
        <Route path="retention-analytics" element={<RetentionAnalyticsPage />} />
        <Route path="team-overview" element={<TeamOverviewPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      <Route
        path="/retention-manager"
        element={
          <ProtectedRoute allowedRoles={["retention_manager"]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<ManagerDashboardPage />} />
        <Route path="at-risk" element={<AtRiskCustomersPage />} />
        <Route path="my-team" element={<MyTeamPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="cases" element={<RetentionCasesPage />} />
        <Route path="support-escalations" element={<SupportEscalationsPage />} />
        <Route path="analytics" element={<ManagerAnalyticsPage />} />
      </Route>

      <Route
        path="/retention-team"
        element={
          <ProtectedRoute allowedRoles={["retention_team"]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<TeamDashboardPage />} />
        <Route path="my-customers" element={<MyCustomersPage />} />
        <Route path="my-tasks" element={<MyTasksPage />} />
        <Route path="support-requests" element={<SupportRequestsPage />} />
        <Route path="activity" element={<TeamActivityHistoryPage />} />
      </Route>

      <Route
        path="/customer-support"
        element={
          <ProtectedRoute allowedRoles={["customer_support"]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<SupportDashboardPage />} />
        <Route path="tickets" element={<MyTicketsPage />} />
        <Route path="high-priority" element={<HighPriorityPage />} />
        <Route path="resolved" element={<ResolvedCasesPage />} />
        <Route path="history" element={<SupportHistoryPage />} />
      </Route>

      <Route
        path="/customer"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path=":id" element={<CustomerDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to={auth ? "/upload" : "/login"} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
