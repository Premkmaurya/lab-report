import React from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const Pending = () => {
  const { logout, checkAuth } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-warm-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="font-martinaplantijn text-4xl text-ink-navy tracking-tight">
          Balaji <span className="italic font-light text-electric-cobalt">Labs</span>
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-paper-white py-8 px-6 border border-cream-border rounded-cards text-center shadow-sm">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-lavender-mist mb-4">
            <svg
              className="h-6 w-6 text-electric-cobalt"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h2 className="font-abcfavoritvariable text-2xl font-medium text-charcoal mb-3">
            Authorization <span className="font-martinaplantijn italic text-ink-navy">pending</span>
          </h2>

          <p className="text-sm text-stone mb-6 leading-relaxed">
            Your account is created but has not been authorized by the administrator yet.
            Please reach out to the lab manager to authorize your account.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => checkAuth()}
              className="w-full bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm"
            >
              Check Status
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-paper-white border border-cream-border text-graphite font-medium py-2.5 px-6 rounded-buttons hover:bg-warm-canvas transition duration-200 text-sm"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Pending;
