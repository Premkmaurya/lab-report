import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  HeartPulse,
  Stethoscope,
  FlaskConical,
  FileSpreadsheet,
  Settings,
  LogOut,
  User,
} from "lucide-react";

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Define navigation items based on role
  const isAdmin = user?.role === "admin";

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
      roles: ["admin", "user"],
    },
    {
      name: "Users",
      path: "/users",
      icon: Users,
      roles: ["admin"],
    },
    {
      name: "Patients",
      path: "/patients",
      icon: HeartPulse,
      roles: ["admin", "user"],
    },
    {
      name: "Doctors",
      path: "/doctors",
      icon: Stethoscope,
      roles: ["admin"],
    },
    {
      name: "Tests",
      path: "/tests",
      icon: FlaskConical,
      roles: ["admin", "user"],
    },
    {
      name: "Reports",
      path: "/reports",
      icon: FileSpreadsheet,
      roles: ["admin", "user"],
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
      roles: ["admin"], // Settings is only for ADMIN as per Phase 4 requirements
    },
  ];

  // Filter routes based on user role
  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <div className="flex h-screen overflow-hidden bg-warm-canvas">
      {/* Sidebar */}
      <aside className="w-[256px] bg-paper-white border-r border-cream-border flex flex-col shrink-0 relative z-10">
        {/* Brand Logo / Name */}
        <div className="p-6 border-b border-cream-border flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="h-9 w-9 bg-ink-navy text-paper-white rounded-2xl flex items-center justify-center font-bold text-lg shrink-0">
              B
            </div>
            <span className="font-martinaplantijn text-xl font-bold text-ink-navy truncate">
              Balaji <span className="italic font-light text-electric-cobalt">Labs</span>
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-3 rounded-2xl transition-all duration-200 group text-sm font-medium ${
                    isActive
                      ? "bg-lavender-mist text-electric-cobalt"
                      : "text-graphite hover:bg-warm-canvas hover:text-charcoal"
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User profile footer info in Sidebar */}
        <div className="p-4 border-t border-cream-border bg-warm-canvas/40 flex flex-col gap-2">
          <div className="flex items-center space-x-3 overflow-hidden px-2 py-1">
            <div className="h-9 w-9 rounded-full bg-cream-border flex items-center justify-center text-charcoal shrink-0 font-medium text-xs">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-charcoal truncate">
                {user?.username}
              </p>
              <p className="text-[10px] text-stone truncate uppercase tracking-wider font-bold">
                {user?.role === "admin" ? "Administrator" : "Lab Technician"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-buttons text-stone hover:bg-red-50 hover:text-red-600 transition-all duration-200 cursor-pointer text-xs font-medium"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Main scrollable viewport */}
        <div className="flex-1 overflow-y-auto px-8 py-8 md:px-12 md:py-10 max-w-[1200px] w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
export default DashboardLayout;
