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
    <div className="min-h-screen flex w-full">
      {/* Left side - Background Image (fixed on desktop) */}
      <div
        className="hidden md:block md:fixed md:inset-y-0 md:left-0 md:w-1/2 bg-cover bg-center z-0"
        style={{ backgroundImage: 'url("/lab_bg.jpg")' }}
        aria-hidden="true"
      >
        {/* Optional slight dark overlay for better aesthetics */}
        <div className="absolute inset-0 bg-slate-900/10"></div>
      </div>

      {/* Right side - Form (scrolls independently) */}
      <div className="w-full md:w-1/2 md:ml-[50%] flex flex-col items-center justify-center bg-paper-white px-8 py-12 lg:px-16 border-l border-cream-border md:h-screen md:overflow-y-auto relative z-10">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center justify-center mb-5">
            <img src="/logo.png" alt="UltraPath Logo" className="h-22 object-cover" />
            <span className="logo-header text-xl ">
              Laboratory information system
            </span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};
export default AuthLayout;
