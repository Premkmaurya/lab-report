import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { reportService } from "../../services/reportService";
import { formatDateTime } from "../../utils/dateFormatter";
import {
  Plus,
  Search,
  FileText,
  Calendar,
  Filter,
  Printer,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { canManagePatients, canPrintReports } from "../../config/permissions";
import { openPrintWindow } from "../../utils/printWindow";
import { PrintOrchestrator } from "../../components/print/PrintOrchestrator";
import { PrintWarningModal } from "../../components/report/PrintWarningModal";
import { toast } from "../../lib/toast";

import { useQuery } from "@tanstack/react-query";

export const PatientList = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [reportToPrint, setReportToPrint] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedReportForPrint, setSelectedReportForPrint] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Holds the dedicated print window opened synchronously in executePrint().
  const printWindowRef = useRef(null);

  const triggerPrintRequest = (e, report) => {
    e.stopPropagation(); // prevent row click navigation
    const hideWarning = localStorage.getItem("hidePrintWarning");
    if (hideWarning === "true") {
      executePrint(report);
    } else {
      setSelectedReportForPrint(report);
      setShowWarningModal(true);
    }
  };

  const executePrint = (report) => {
    setShowWarningModal(false);
    setSelectedReportForPrint(null);

    // Must be called synchronously (user-gesture chain) to avoid popup blocking.
    const win = openPrintWindow();
    if (!win) {
      toast.error('Popup was blocked. Please allow popups for this site and try again.');
      return;
    }
    printWindowRef.current = win;
    setReportToPrint(report);
  };

  const handlePrintComplete = () => {
    setReportToPrint(null);
    printWindowRef.current = null;
  };

  const tzOffset = new Date().getTimezoneOffset();
  const queryParams = {
    date: activeFilter,
    timezoneOffset: tzOffset,
    ...(activeFilter === "custom" && customStartDate && customEndDate
      ? { startDate: customStartDate, endDate: customEndDate }
      : {}),
  };

  const isCustomValid = !!(
    activeFilter !== "custom" ||
    (customStartDate && customEndDate)
  );

  const {
    data,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["reports", queryParams],
    queryFn: () => reportService.getAllReports(queryParams),
    enabled: isCustomValid,
    refetchInterval: 60000,
  });

  const reports = data?.patientTests || [];
  const errorMsg = error ? "Failed to load laboratory reports." : "";

  const filteredReports = reports.filter((report) => {
    const patientName = report.patientId?.name || "";
    const patientVisitId = report.patientId?.visitId || "";
    const normalizedQuery = searchQuery.toLowerCase();

    return (
      patientName.toLowerCase().includes(normalizedQuery) ||
      patientVisitId.toLowerCase().includes(normalizedQuery)
    );
  });

  const filters = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "custom", label: "Custom Range" },
  ];

  return (
    <>
      <div
        className={`space-y-6 ${reportToPrint ? "hidden print:hidden" : "print:hidden"}`}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-2">
              DAILY FEED
            </span>
            <h1 className="font-martinaplantijn text-4xl text-ink-navy">
              Laboratory <span className="italic font-light">Work Queue</span>
            </h1>
            <p className="font-inter text-stone text-sm mt-1">
              Monitor and manage patient test reports.
            </p>
          </div>
          <div>
            {canManagePatients(user) && (
              <Link
                to="/patients/create"
                className="inline-flex items-center space-x-2 bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Add Patient & Report</span>
              </Link>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-cards">
            {errorMsg}
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-paper-white border border-cream-border rounded-cards p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center flex-wrap gap-2">
              <Filter className="h-4 w-4 text-stone mr-2 shrink-0" />
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    activeFilter === f.id
                      ? "bg-electric-cobalt text-white border-electric-cobalt"
                      : "bg-warm-canvas text-stone border border-cream-border hover:bg-gray-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center bg-warm-canvas border border-cream-border rounded-full px-4 py-1 w-full md:w-auto max-w-sm">
              <Search className="h-4 w-4 text-stone shrink-0 mr-2" />
              <input
                type="text"
                placeholder="Search by patient name or visit ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-none bg-transparent p-1.5 text-sm text-charcoal outline-none focus:ring-0"
              />
            </div>
          </div>

          {activeFilter === "custom" && (
            <div className="flex items-center flex-wrap gap-3 pt-3 border-t border-cream-border mt-3">
              <Calendar className="h-4 w-4 text-stone shrink-0" />
              <span className="text-xs font-medium text-stone">Range:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="border border-cream-border rounded-inputs px-2 py-1 text-xs text-charcoal focus:outline-none focus:border-electric-cobalt"
              />
              <span className="text-xs text-stone">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="border border-cream-border rounded-inputs px-2 py-1 text-xs text-charcoal focus:outline-none focus:border-electric-cobalt"
              />
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-paper-white border border-cream-border rounded-cards overflow-hidden min-h-[400px]">
          {loading && reports.length === 0 ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
            </div>
          ) : (
            <div className="overflow-x-auto w-full block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-warm-canvas border-b border-cream-border">
                    <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                      Visit ID
                    </th>
                    <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                      Age / Gender
                    </th>
                    <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                      Report Date
                    </th>
                    <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                      Total Price
                    </th>
                    <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-border">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center">
                          <div className="bg-warm-canvas p-4 rounded-full mb-3">
                            <FileText className="h-8 w-8 text-stone/50" />
                          </div>
                          <p className="text-sm font-semibold text-charcoal">
                            No reports found for the selected date.
                          </p>
                          <p className="text-xs text-stone mt-1">
                            Try adjusting your filters or date range.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => {
                      const patient = report.patientId || {};
                      return (
                        <tr
                          onClick={() =>
                            navigate(
                              `/patients/${patient._id || report.patientId}`,
                            )
                          }
                          key={report._id}
                          className="hover:bg-warm-canvas/30 transition cursor-pointer duration-150"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-charcoal">
                            {patient.name || "Unknown Patient"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                            {patient.visitId || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                            {patient.age ? `${patient.age} yrs • ` : ""}
                            <span className="capitalize">
                              {patient.gender || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone font-mono">
                            {formatDateTime(report.date || report.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal font-semibold">
                            ₹{report.totalPrice || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {canPrintReports(user) && (
                                <button
                                  onClick={(e) =>
                                    triggerPrintRequest(e, report)
                                  }
                                  className="inline-flex items-center space-x-1 border border-electric-cobalt text-electric-cobalt bg-paper-white hover:bg-lavender-mist/40 px-3 py-1.5 rounded-buttons text-xs transition duration-200 cursor-pointer"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                  <span>Print</span>
                                </button>
                              )}
                              <Link
                                to={`/patients/${patient._id || report.patientId}`}
                                className="inline-flex items-center space-x-1 border border-cream-border text-electric-cobalt bg-paper-white hover:bg-lavender-mist/40 px-3 py-1.5 rounded-buttons text-xs transition duration-200 cursor-pointer"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>View / Edit</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {reportToPrint && reportToPrint.patientId && (
        <PrintOrchestrator
          patient={reportToPrint.patientId}
          report={reportToPrint}
          printWindowRef={printWindowRef}
          onComplete={handlePrintComplete}
        />
      )}

      {showWarningModal && selectedReportForPrint && (
        <PrintWarningModal
          onContinue={() => executePrint(selectedReportForPrint)}
          onCancel={() => {
            setShowWarningModal(false);
            setSelectedReportForPrint(null);
          }}
        />
      )}
    </>
  );
};
export default PatientList;
