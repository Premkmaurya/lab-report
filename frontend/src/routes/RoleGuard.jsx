import React from "react";
import { Navigate, Outlet, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ShieldAlert } from "lucide-react";

export const RoleGuard = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAllowed = allowedRoles.includes(user.role);

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center px-4">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <ShieldAlert className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-martinaplantijn text-ink-navy mb-2">403 - Access Denied</h2>
        <p className="text-slate-600 mb-6 max-w-md">
          You do not have the required role to view this page. If you believe this is an error, please contact your administrator.
        </p>
        <Link 
          to="/"
          className="bg-electric-cobalt text-white px-6 py-2.5 rounded-buttons hover:bg-opacity-90 transition-colors text-sm font-medium"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return <Outlet />;
};
