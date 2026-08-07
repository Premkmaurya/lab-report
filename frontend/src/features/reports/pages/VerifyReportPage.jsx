import React from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, Lock, UserCheck } from "lucide-react";
import { usePublicReport } from "../hooks/usePublicReport";
import { ReportPaper } from "../components/ReportPaper";

export const VerifyReportPage = () => {
  const { token } = useParams();
  const {
    loading,
    error,
    report,
    requireVerification,
    verificationInput,
    setVerificationInput,
    verifying,
    verificationError,
    handlePatientVerify,
    formatReportDate,
  } = usePublicReport(token);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-4 font-inter">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#D9DEE7] text-center max-w-sm w-full">
          <div className="h-10 w-10 border-3 border-[#1E40AF]/30 border-t-[#1E40AF] rounded-full animate-spin mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-[#111827]">Verifying Report Authenticity...</h2>
          <p className="text-xs text-[#6B7280] mt-1">Checking secure cryptographic verification token</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-4 font-inter">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200 text-center max-w-sm w-full">
          <div className="h-12 w-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-[#111827] mb-1">Verification Failed</h2>
          <p className="text-xs text-[#6B7280] mb-4">{error}</p>
          <div className="text-[11px] text-[#9CA3AF] border-t border-[#F3F4F6] pt-3">
            If you believe this is an error, please contact the issuing laboratory.
          </div>
        </div>
      </div>
    );
  }

  if (requireVerification) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-4 font-inter">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#D9DEE7] max-w-sm w-full">
          <div className="h-12 w-12 bg-blue-50 text-[#1E40AF] rounded-full flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-base font-bold text-[#111827] text-center mb-1">
            Patient Verification Required
          </h2>
          <p className="text-xs text-[#6B7280] text-center mb-5">
            For security purposes, please verify your identity before accessing this laboratory report.
          </p>

          <form onSubmit={handlePatientVerify} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#374151] uppercase tracking-wider mb-1">
                Enter Mobile No / Date of Birth / Visit ID
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 text-xs border border-[#D9DEE7] rounded-lg focus:ring-1 focus:ring-[#1E40AF] focus:border-[#1E40AF] focus:outline-none"
                placeholder="e.g. 9876543210 or 1990-05-15 or V1002"
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value)}
                required
              />
            </div>

            {verificationError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{verificationError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full py-2.5 bg-[#1E40AF] text-white font-semibold rounded-lg hover:bg-blue-800 transition cursor-pointer disabled:opacity-50 text-xs flex items-center justify-center space-x-2 shadow-sm"
            >
              {verifying ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  <span>Access Verified Report</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111827] py-6 px-3 sm:px-6 font-inter">
      <div className="max-w-[850px] mx-auto">
        <ReportPaper
          report={report}
          formatReportDate={formatReportDate}
        />
      </div>
    </div>
  );
};
