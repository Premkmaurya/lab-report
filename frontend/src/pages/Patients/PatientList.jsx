import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { reportService } from "../../services/reportService";
import { Plus, Search, FileText, Calendar, Filter } from "lucide-react";

export const PatientList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeFilter, setActiveFilter] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const tzOffset = new Date().getTimezoneOffset();
        const params = {
          date: activeFilter,
          timezoneOffset: tzOffset,
        };

        if (activeFilter === "custom") {
          if (!customStartDate || !customEndDate) {
            setLoading(false);
            return;
          }
          params.startDate = customStartDate;
          params.endDate = customEndDate;
        }

        const data = await reportService.getAllReports(params);
        setReports(data.patientTests || []);
      } catch (err) {
        setErrorMsg("Failed to load laboratory reports.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
    
    // Set up auto-refresh every minute to handle day rolling over without manual refresh
    const interval = setInterval(fetchReports, 60000);
    return () => clearInterval(interval);
  }, [activeFilter, customStartDate, customEndDate]);

  const filteredReports = reports.filter((report) => {
    const patientName = report.patientId?.name || "";
    return patientName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filters = [
    { id: "today", label: "Today" },
    { id: "yesterday", label: "Yesterday" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
    { id: "custom", label: "Custom Range" },
  ];

  return (
    <div className="space-y-6">
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
          <Link
            to="/patients/create"
            className="inline-flex items-center space-x-2 bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Patient & Report</span>
          </Link>
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
              placeholder="Search by patient name..."
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
                    Age / Gender
                  </th>
                  <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                    Report Date
                  </th>
                  <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-border">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-16 text-center">
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
                        onClick={() => navigate(`/patients/${patient._id || report.patientId}`)}
                        key={report._id} 
                        className="hover:bg-warm-canvas/30 transition cursor-pointer duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-charcoal">
                          {patient.name || "Unknown Patient"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                          {patient.age ? `${patient.age} yrs • ` : ''}<span className="capitalize">{patient.gender || '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone font-mono">
                          {new Date(report.date || report.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <div className="flex items-center justify-end space-x-2">
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
  );
};
export default PatientList;
