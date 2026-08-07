import { useState, useEffect } from "react";
import axios from "axios";

export const usePublicReport = (token) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

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

  return {
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
  };
};
