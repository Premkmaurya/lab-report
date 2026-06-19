import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-canvas">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt mx-auto"></div>
          <p className="font-abcfavoritvariable text-xl font-medium text-ink-navy">
            Accessing the <span className="italic font-martinaplantijn">laboratory</span>...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user && user.isAuthorized === false) {
    return <Navigate to="/pending" replace />;
  }

  return <Outlet />;
};
