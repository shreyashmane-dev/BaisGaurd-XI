import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";

function FullScreenMessage({ title }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-10 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-300/30 border-t-cyan-300" />
        <p className="text-sm text-slate-300">{title}</p>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ allowedRoles = null }) {
  const { authLoading, profileLoading, currentUser, needsRoleSelection, role } = useApp();
  const location = useLocation();

  if (authLoading || profileLoading) {
    return <FullScreenMessage title="Loading BiasGuard X..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (needsRoleSelection && location.pathname !== "/role-select") {
    return <Navigate to="/role-select" replace />;
  }

  if (!needsRoleSelection && role && location.pathname === "/role-select") {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
