import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Shield, Settings as SettingsIcon, User, Save, CheckCircle } from "lucide-react";

export const Settings = () => {
  const { user } = useAuth();
  const [successMsg, setSuccessMsg] = useState("");
  const [labSettings, setLabSettings] = useState({
    labName: "Balaji Diagnostics",
    labAddress: "Plot 12, Medical Square, Sector 4, Nagpur - 440012",
    labPhone: "+91 712 255 1200",
    labEmail: "support@balajidiagnostics.com",
  });

  useEffect(() => {
    const saved = localStorage.getItem("balaji_lab_settings");
    if (saved) {
      try {
        setLabSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved lab settings", e);
      }
    }
  }, []);

  const handleSaveLabSettings = (e) => {
    e.preventDefault();
    setSuccessMsg("");
    localStorage.setItem("balaji_lab_settings", JSON.stringify(labSettings));
    setSuccessMsg("Laboratory settings updated successfully.");
    // Dispatch a storage event to alert other tabs/components
    window.dispatchEvent(new Event("storage"));
  };

  const handleFieldChange = (field, value) => {
    setLabSettings((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-2">
          CONFIGURATION
        </span>
        <h1 className="font-martinaplantijn text-4xl text-ink-navy">
          Portal <span className="italic font-light">Settings</span>
        </h1>
        <p className="font-inter text-stone text-sm mt-1">
          Review your credentials and manage official laboratory profile configurations.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-cards flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* User Profile Card */}
        <div className="md:col-span-1 bg-paper-white border border-cream-border rounded-cards p-6 space-y-6">
          <div className="flex items-center space-x-3 border-b border-cream-border pb-4">
            <User className="h-5 w-5 text-electric-cobalt shrink-0" />
            <h3 className="font-abcfavoritvariable text-sm font-semibold text-charcoal">
              User Profile
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-stone uppercase tracking-wider mb-1">
                Username
              </p>
              <p className="text-sm font-semibold text-charcoal">{user?.username}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-stone uppercase tracking-wider mb-1">
                Email
              </p>
              <p className="text-sm font-semibold text-charcoal truncate">{user?.email}</p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-stone uppercase tracking-wider mb-1">
                System Role
              </p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lavender-mist text-electric-cobalt capitalize mt-0.5">
                {user?.role === "admin" ? "Admin" : "Lab Tech"}
              </span>
            </div>

            <div>
              <p className="text-[10px] font-bold text-stone uppercase tracking-wider mb-1">
                Account Status
              </p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 mt-0.5">
                Authorized
              </span>
            </div>
          </div>
        </div>

        {/* Lab Profile Form */}
        <div className="md:col-span-2 bg-paper-white border border-cream-border rounded-cards p-6 md:p-8 space-y-6">
          <div className="flex items-center space-x-3 border-b border-cream-border pb-4">
            <SettingsIcon className="h-5 w-5 text-electric-cobalt shrink-0" />
            <h3 className="font-abcfavoritvariable text-sm font-semibold text-charcoal">
              Lab Details & Letterhead Settings
            </h3>
          </div>

          <form onSubmit={handleSaveLabSettings} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                Laboratory Display Name
              </label>
              <input
                type="text"
                className="w-full"
                value={labSettings.labName}
                onChange={(e) => handleFieldChange("labName", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                Letterhead Address Line
              </label>
              <textarea
                rows="2"
                className="w-full"
                value={labSettings.labAddress}
                onChange={(e) => handleFieldChange("labAddress", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                  Contact Phone
                </label>
                <input
                  type="text"
                  className="w-full"
                  value={labSettings.labPhone}
                  onChange={(e) => handleFieldChange("labPhone", e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  className="w-full"
                  value={labSettings.labEmail}
                  onChange={(e) => handleFieldChange("labEmail", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-cream-border">
              <button
                type="submit"
                className="inline-flex items-center space-x-2 bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Settings;
