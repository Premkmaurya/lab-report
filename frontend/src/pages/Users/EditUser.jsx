import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { userService } from "../../services/userService";
import { ArrowLeft, ShieldAlert, CheckCircle, XCircle } from "lucide-react";

export const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userItem, setUserItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await userService.getUserById(id);
        setUserItem(data.user);
      } catch (err) {
        setErrorMsg(
          err.response?.data?.message || "Failed to load user information."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await userService.updateUserStatus(id, newStatus);
      setUserItem((prev) => ({ ...prev, isAuthorized: newStatus }));
      setSuccessMsg(
        `User status has been successfully updated to ${
          newStatus ? "Authorized" : "Suspended"
        }.`
      );
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Failed to update user authorization status."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back Link */}
      <div>
        <Link
          to="/users"
          className="inline-flex items-center space-x-2 text-sm text-stone hover:text-charcoal transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Users</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-2">
          USER DETAILS
        </span>
        <h1 className="font-martinaplantijn text-4xl text-ink-navy">
          Edit User <span className="italic font-light">Status</span>
        </h1>
        <p className="font-inter text-stone text-sm mt-1">
          Review details and alter active authorization.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-cards flex items-center space-x-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-cards flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {userItem && (
        <div className="bg-paper-white border border-cream-border rounded-cards p-6 md:p-8 space-y-6">
          {/* Metadata Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-cream-border">
            <div>
              <p className="text-xs font-bold text-stone uppercase tracking-wider mb-1">
                Username
              </p>
              <p className="text-base font-semibold text-charcoal">
                {userItem.username}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-stone uppercase tracking-wider mb-1">
                Email Address
              </p>
              <p className="text-base font-semibold text-charcoal">
                {userItem.email}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-stone uppercase tracking-wider mb-1">
                System Role
              </p>
              <p className="text-base font-semibold text-charcoal capitalize">
                {userItem.role === "admin" ? "Administrator" : "Lab Technician"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-stone uppercase tracking-wider mb-1">
                Authorization Status
              </p>
              <div className="flex items-center space-x-2 mt-1">
                {userItem.isAuthorized ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-semibold text-green-700">
                      Authorized
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-semibold text-orange-700">
                      Pending Authorization
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Trigger Card */}
          <div className="space-y-4">
            <h3 className="font-abcfavoritvariable text-base font-medium text-charcoal">
              Administrative actions
            </h3>
            <p className="text-sm text-stone leading-relaxed">
              Toggling authorization controls access. Unauthorized technicians cannot log
              in or fetch backend API resources.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              {userItem.isAuthorized ? (
                <button
                  onClick={() => handleStatusChange(false)}
                  disabled={isSaving}
                  className="bg-red-600 text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-red-700 transition duration-200 disabled:opacity-50 text-sm cursor-pointer"
                >
                  {isSaving ? "Updating..." : "Suspend Authorization"}
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange(true)}
                  disabled={isSaving}
                  className="bg-green-600 text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-green-700 transition duration-200 disabled:opacity-50 text-sm cursor-pointer"
                >
                  {isSaving ? "Updating..." : "Approve & Authorize User"}
                </button>
              )}
              <button
                onClick={() => navigate("/users")}
                className="bg-paper-white border border-cream-border text-graphite font-medium py-2.5 px-6 rounded-buttons hover:bg-warm-canvas transition duration-200 text-sm cursor-pointer"
              >
                Back to List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default EditUser;
