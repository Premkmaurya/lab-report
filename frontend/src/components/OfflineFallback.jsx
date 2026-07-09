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
    <div
      className="fixed bottom-4 left-4 right-4 z-50 max-w-[26rem] rounded-2xl border border-red-300/40 bg-slate-950/95 p-4 shadow-2xl shadow-black/30 backdrop-blur-sm transition-all duration-300 md:left-auto md:right-4 md:w-[24rem]"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/20">
          <ShieldAlert className="h-5 w-5 text-red-300" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white">You are offline</h3>
          <p className="mt-1 text-sm leading-5 text-slate-200">
            Some features may be unavailable until your connection is restored.
          </p>
        </div>
      </div>
    </div>
  );
};
