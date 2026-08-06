import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  AlertTriangle,
  Lock,
  UserCheck,
} from "lucide-react";
import BarcodeElement from "../../components/print/BarcodeElement";
import { getVerificationUrl, generateQrDataUrl } from "../../utils/qrCodeUtils";

/* ==========================================================================
   REPORT PAPER CONTAINER (A4 Pathology Report)
   ========================================================================== */
const ReportPaper = ({ report, qrDataUrl, formatReportDate }) => {
  return (
    <div className="bg-white border border-[#D9DEE7] rounded-lg shadow-sm p-6 sm:p-8 min-h-[900px] flex flex-col justify-between">
      <div className="space-y-6">
        {/* Patient Information Section */}
        <div className="relative">
          {/* Barcode positioned top-right above border box */}
          {report.visitId && (
            <div className="flex justify-end mb-1">
              <BarcodeElement
                value={report.visitId}
                settings={{ height: 35, displayValue: false, alignment: "right" }}
              />
            </div>
          )}

          {/* Patient Information Border Box */}
          <div className="border border-slate-400 p-3 text-xs text-black">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
              {/* Left Column */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold w-28 shrink-0">Patient Name:</span>
                  <span className="font-normal">{report.patientName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold w-28 shrink-0">Age/Gender:</span>
                  <span className="font-normal">
                    {report.age} Years / {report.gender}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold w-28 shrink-0">Ref. Doctor:</span>
                  <span className="font-normal">{report.doctor}</span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold w-28 shrink-0">Visit ID:</span>
                  <span className="font-normal">{report.visitId}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold w-28 shrink-0">Reg. Date:</span>
                  <span className="font-normal">{formatReportDate(report.registrationDate)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold w-28 shrink-0">Report Date:</span>
                  <span className="font-normal">{formatReportDate(report.reportDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Single Global Investigation Results Table */}
        <div className="pt-1 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#CCCCCC] text-black font-bold text-[11px] uppercase tracking-wider">
                <th className="py-2 px-2 w-[45%]">TEST NAME</th>
                <th className="py-2 px-2 w-[20%]">RESULT</th>
                <th className="py-2 px-2 w-[15%] text-center">UNIT</th>
                <th className="py-2 px-2 w-[20%]">REFERENCE RANGE</th>
              </tr>
            </thead>
            <tbody>
              {(report.tests || []).map((test, tIndex) => (
                <React.Fragment key={tIndex}>
                  {/* Department Heading */}
                  {test.department && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-3 px-2 text-center font-bold text-xs text-black uppercase tracking-wider underline decoration-1 underline-offset-2 bg-white"
                      >
                        {test.department}
                      </td>
                    </tr>
                  )}

                  {/* Test Heading */}
                  <tr>
                    <td
                      colSpan={4}
                      className="py-2 px-2 font-bold text-xs text-black uppercase tracking-wide bg-white underline underline-offset-2"
                    >
                      {test.testName}
                    </td>
                  </tr>

                  {/* Parameter Rows */}
                  {(test.result || []).map((res, rIndex) => {
                    if (res.type === "section") {
                      return (
                        <tr key={rIndex} className="bg-white">
                          <td
                            colSpan={4}
                            className="py-2 px-2 font-bold text-black uppercase text-[11px] tracking-wider"
                          >
                            {res.parameter}
                          </td>
                        </tr>
                      );
                    }

                    if (res.isTextBlock) {
                      return (
                        <tr key={rIndex}>
                          <td colSpan={4} className="py-2 px-2">
                            <span className="font-semibold text-black block mb-1">
                              {res.parameter || "Remarks"}
                            </span>
                            <div className="whitespace-pre-wrap text-black bg-white p-2 border border-slate-200 font-mono text-[11px]">
                              {res.textBlockValue || res.value || "-"}
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={rIndex} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2 font-normal text-black">
                          {res.parameter}
                        </td>
                        <td className="py-1.5 px-2 font-bold text-black font-mono">
                          {res.value || "-"}
                        </td>
                        <td className="py-1.5 px-2 text-center text-black font-normal">
                          {res.unit || "-"}
                        </td>
                        <td className="py-1.5 px-2 text-black font-normal">
                          {res.normalRange || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signatures & QR Code Section (Pinned to Bottom) */}
      <div className="grid grid-cols-3 items-end text-center pt-10 mt-auto gap-4">
        {/* Left: Technician Signature */}
        <div className="flex flex-col items-center justify-end">
          {report.technicianSignature && (
            <img
              src={report.technicianSignature}
              alt="Technician Signature"
              className="h-12 w-auto object-contain mb-1"
            />
          )}
          <p className="text-xs font-bold text-black">
            {report.technicianName || report.technician || "Abhishek"}
          </p>
          <p className="text-[11px] text-slate-700 font-normal">Lab Technician</p>
        </div>

        {/* Center: QR Code */}
        <div className="flex flex-col items-center justify-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Verification QR Code"
              className="h-14 w-14 mb-1"
            />
          ) : (
            <div className="h-14 w-14 bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-600 mb-1">
              QR Code
            </div>
          )}
          <p className="text-[10px] text-slate-800 text-center font-normal">
            Scan to Verify Report
          </p>
        </div>

        {/* Right: Pathologist Signature */}
        <div className="flex flex-col items-center justify-end">
          {report.pathologistSignature && (
            <img
              src={report.pathologistSignature}
              alt="Pathologist Signature"
              className="h-12 w-auto object-contain mb-1"
            />
          )}
          <p className="text-xs font-bold text-black">
            {report.pathologistName || report.pathologist || "Dr. A.Pandey"}
          </p>
          <p className="text-[11px] text-slate-700 font-normal">Pathologist</p>
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   MAIN PUBLIC REPORT VERIFICATION PAGE
   ========================================================================== */
export const VerifyReport = () => {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  // Patient Verification Challenge State
  const [requireVerification, setRequireVerification] = useState(false);
  const [verificationInput, setVerificationInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState("");

  const formatReportDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  };

  const fetchPublicReport = async (input = "") => {
    setLoading(true);
    setError(null);
    try {
      const url = input
        ? `/api/report/verify/${token}?verificationInput=${encodeURIComponent(input)}`
        : `/api/report/verify/${token}`;

      const res = await axios.get(url);

      if (res.data.requirePatientVerification) {
        setRequireVerification(true);
        setLoading(false);
        return;
      }

      if (res.data.success && res.data.report) {
        setReport(res.data.report);
        setRequireVerification(false);
      } else {
        setError(res.data.message || "Invalid or expired report.");
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.requirePatientVerification) {
        setRequireVerification(true);
      } else {
        setError(data?.message || "Invalid or expired report.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPublicReport();
      const verifyUrl = getVerificationUrl(token);
      generateQrDataUrl(verifyUrl, { size: 100, margin: 1 }).then((url) => {
        if (url) setQrDataUrl(url);
      });
    }
  }, [token]);

  const handlePatientVerify = async (e) => {
    e.preventDefault();
    if (!verificationInput.trim()) {
      setVerificationError("Please enter your Mobile Number, Date of Birth, or Visit ID.");
      return;
    }

    setVerifying(true);
    setVerificationError("");

    try {
      const res = await axios.post(`/api/report/verify/${token}/verify-patient`, {
        patientVerificationInput: verificationInput.trim(),
      });

      if (res.data.success && res.data.report) {
        setReport(res.data.report);
        setRequireVerification(false);
      } else {
        setVerificationError(res.data.message || "Patient verification failed.");
      }
    } catch (err) {
      setVerificationError(
        err.response?.data?.message || "Verification failed. Details do not match our records."
      );
    } finally {
      setVerifying(false);
    }
  };

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
          qrDataUrl={qrDataUrl}
          formatReportDate={formatReportDate}
        />
      </div>
    </div>
  );
};

export default VerifyReport;
