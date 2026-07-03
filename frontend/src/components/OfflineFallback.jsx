import React, { useState, useEffect } from "react";
import { ShieldAlert } from "lucide-react";

export const OfflineFallback = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-red-600 text-white p-4 rounded-lg shadow-xl z-50 flex items-start space-x-3 transition-all duration-300 transform translate-y-0 opacity-100">
      <ShieldAlert className="h-6 w-6 shrink-0 mt-0.5" />
      <div>
        <h3 className="font-bold text-sm">You are offline</h3>
        <p className="text-xs opacity-90 mt-1">
          Some features may be unavailable until your connection is restored.
        </p>
      </div>
    </div>
  );
};
