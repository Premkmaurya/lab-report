import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const PermissionGuard = ({ requiredPermission }) => {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAllowed = user.role === "admin" || hasPermission(requiredPermission);

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
