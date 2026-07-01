import React, { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  HeartPulse,
  Stethoscope,
  FlaskConical,
  Settings,
  LogOut,
  User,
  Menu,
  X
} from "lucide-react";

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
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
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsSidebarOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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
      name: "Settings",
      path: "/settings",
      icon: Settings,
      roles: ["admin"],
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role)
  );

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
        className={`fixed inset-y-0 left-0 z-50 w-[256px] bg-paper-white border-r border-cream-border flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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
      <main className="flex-1 flex flex-col overflow-hidden w-full h-full">
        {/* Mobile Header */}
        <header className="lg:hidden bg-paper-white border-b border-cream-border px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1 -ml-1 text-charcoal hover:bg-warm-canvas rounded-md"
            >
              <Menu className="h-6 w-6" />
            </button>
            <span className="font-martinaplantijn text-lg font-bold text-ink-navy">
              Balaji <span className="italic font-light text-electric-cobalt">Labs</span>
            </span>
          </div>
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
