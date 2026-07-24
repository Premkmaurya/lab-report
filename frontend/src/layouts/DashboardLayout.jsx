import React, { useState, useEffect } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useLaboratory } from "../context/LaboratoryContext";
import {
  LayoutDashboard,
  Users,
  HeartPulse,
  Stethoscope,
  FlaskConical,
  Settings,
  FileText,
  LogOut,
  User,
  ChartNoAxesColumnIncreasing,
  X,
  Building2,
} from "lucide-react";

export const DashboardLayout = () => {
  const { user, logout, hasPermission } = useAuth();
  const { laboratories, selectedLabId, setSelectedLabId, isSystemAdmin } = useLaboratory();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Close sidebar on route change for mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsSidebarOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
      roles: ["admin", "system_admin", "user", "lab_technician", "receptionist"],
    },
    {
      name: "Laboratories",
      path: "/laboratories",
      icon: Building2,
      roles: ["system_admin"],
    },
    {
      name: "Users",
      path: "/users",
      icon: Users,
      roles: ["admin", "system_admin"],
    },
    {
      name: "Patients",
      path: "/patients",
      icon: HeartPulse,
      roles: ["admin", "system_admin", "user", "lab_technician", "receptionist"],
    },
    {
      name: "Doctors",
      path: "/doctors",
      icon: Stethoscope,
      roles: ["admin", "system_admin", "user", "lab_technician", "receptionist"],
      permission: "manage_doctors",
    },
    {
      name: "Tests",
      path: "/tests",
      icon: FlaskConical,
      roles: ["admin", "system_admin", "user", "lab_technician", "receptionist"],
      permission: "manage_tests",
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
      roles: ["admin", "system_admin", "user", "lab_technician", "receptionist"],
      permission: "manage_settings",
    },
  ];

  const visibleNavItems = navItems.filter((item) => {
    if (!item.roles.includes(user?.role)) return false;
    if (item.permission && !hasPermission(item.permission)) return false;
    return true;
  });

  const getUserRoleLabel = (role) => {
    switch (role) {
      case "system_admin":
        return "System Administrator";
      case "admin":
        return "Lab Administrator";
      case "receptionist":
        return "Receptionist";
      case "user":
      case "lab_technician":
      default:
        return "Lab Technician";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-warm-canvas">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-ink-navy/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-3xs bg-paper-white border-r border-cream-border flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Logo / Name */}
        <div className="border-b border-cream-border relative flex items-start mb-4 justify-start">
          <div className="flex place-items-start justify-center w-full h-30 px-4 flex-col">
            <img
              src="/logo.png"
              alt="UltraPath Logo"
              className="h-15 object-cover"
            />
            <div className="logo-header absolute -bottom-1 text-base whitespace-nowrap text-charcoal text-left">
              Laboratory information system
            </div>
          </div>
          {/* Mobile close button */}
          <button
            className="lg:hidden p-1 text-stone hover:text-charcoal"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
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
                {getUserRoleLabel(user?.role)}
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
      <main className="flex-1 flex flex-col overflow-hidden w-full h-full">
        {/* Top Bar for System Admin (Laboratory Selector) */}
        {isSystemAdmin && (
          <div className="bg-indigo-900 text-white px-6 py-2.5 flex items-center justify-between shadow-inner shrink-0 text-xs">
            <div className="flex items-center gap-2 font-medium">
              <Building2 className="w-4 h-4 text-indigo-300" />
              <span>System Admin Mode — Select Active Laboratory View:</span>
            </div>

            <select
              value={selectedLabId || ""}
              onChange={(e) => setSelectedLabId(e.target.value || null)}
              className="bg-indigo-800 border border-indigo-700 text-white text-xs rounded px-3 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 font-medium cursor-pointer"
            >
              <option value="">🌐 All Laboratories (Global View)</option>
              {laboratories.map((lab) => (
                <option key={lab._id} value={lab._id}>
                  🏥 {lab.name} ({lab.code})
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Mobile Header */}
        <header className="lg:hidden border-b border-cream-border px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex relative w-full flex-col items-start">
              <img
                src="/logo.png"
                alt="UltraPath Logo"
                className="h-14 object-cover"
              />
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-1 text-charcoal hover:bg-warm-canvas rounded-md"
          >
            <ChartNoAxesColumnIncreasing className="h-6 w-6 -rotate-90"/>
          </button>
        </header>

        {/* Main scrollable viewport */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 lg:px-12 lg:py-10 max-w-[1200px] w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
export default DashboardLayout;
