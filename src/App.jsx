import React, { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

const LoginPage = lazy(() => import("./pages/Login.jsx"));
const SignupPage = lazy(() => import("./pages/Signup.jsx"));
const RoleSelectionPage = lazy(() => import("./pages/RoleSelection.jsx"));
const DashboardPage = lazy(() => import("./pages/Dashboard.jsx"));
const NewTestPage = lazy(() => import("./pages/NewTest.jsx"));
const HistoryPage = lazy(() => import("./pages/History.jsx"));
const ResultsPage = lazy(() => import("./pages/Results.jsx"));
const ProModePage = lazy(() => import("./pages/ProMode.jsx"));
const ProfilePage = lazy(() => import("./pages/Profile.jsx"));
const AIConfigPage = lazy(() => import("./pages/AIConfig.jsx"));
const DebateLogsPage = lazy(() => import("./pages/DebateLogs.jsx"));
const ReportsPage = lazy(() => import("./pages/Reports.jsx"));
const AnalyticsPage = lazy(() => import("./pages/Analytics.jsx"));
const LandingPage = lazy(() => import("./pages/Landing.jsx"));
const ScenarioPlaygroundPage = lazy(() => import("./pages/ScenarioPlayground.jsx"));

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-10 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/30 border-t-cyan-300" />
        <p className="text-sm text-slate-300 font-medium tracking-wide">Initializing BiasGuard X...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/role-select" element={<RoleSelectionPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/new-test" element={<NewTestPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/results/:caseId" element={<ResultsPage />} />
            <Route path="/pro-mode" element={<ProModePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/models" element={<AIConfigPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/scenario-playground" element={<ScenarioPlaygroundPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["engineer", "admin"]} />}>
            <Route path="/ai-config" element={<AIConfigPage />} />
            <Route path="/debate-logs" element={<DebateLogsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
