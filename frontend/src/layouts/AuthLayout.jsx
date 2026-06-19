import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const AuthLayout = () => {
  const { user } = useAuth();

  // If already authenticated and authorized, go to dashboard
  if (user && user.isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-warm-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="font-martinaplantijn text-4xl text-ink-navy tracking-tight">
          Balaji <span className="italic font-light text-electric-cobalt">Labs</span>
        </h1>
        <p className="mt-2 font-abcfavoritvariable text-sm text-graphite tracking-tight uppercase tracking-widest">
          Laboratory Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-paper-white py-8 px-4 border border-cream-border rounded-cards sm:rounded-cards sm:px-10 transition-shadow duration-300">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
export default AuthLayout;
