import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { patientService } from "../services/patientService";
import { doctorService } from "../services/doctorService";
import { testService } from "../services/testService";
import { reportService } from "../services/reportService";
import {
  Users,
  HeartPulse,
  FlaskConical,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Download,
  ShieldAlert,
  CheckCircle,
  Plus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Filter, Calendar, Search, FileText } from "lucide-react";

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    tests: 0,
    reports: 0,
  });
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Feed state
  const [feedReports, setFeedReports] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Summary card state (admin only)
  const [summaryStats, setSummaryStats] = useState({ today: 0, week: 0, month: 0 });
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [downloadingPeriod, setDownloadingPeriod] = useState("");
  const [downloadSuccess, setDownloadSuccess] = useState("");

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const patientsData = await patientService.getAllPatients();
        const testsData = await testService.getAllTests();
        const reportsData = await reportService.getAllReports();

        let doctorsCount = 0;
        try {
          const doctorsData = await doctorService.getAllDoctors();
          doctorsCount = doctorsData.doctors?.length || 0;
        } catch (e) {
          console.warn("Could not load doctors count", e);
        }

        setStats({
          patients: patientsData.patients?.length || 0,
          doctors: doctorsCount,
          tests: testsData.tests?.length || 0,
          reports: reportsData.patientTests?.length || 0,
        });

        // Set recent logs
        setRecentReports((reportsData.patientTests || []).slice(0, 5));

        // Fetch patient summaries if admin
        if (user?.role === "admin") {
          setSummaryLoading(true);
          try {
            const timezoneOffset = new Date().getTimezoneOffset();
            const summaryData = await patientService.getSummary("today", timezoneOffset);
            if (summaryData.success && summaryData.summary) {
              setSummaryStats(summaryData.summary);
            }
          } catch (e) {
            console.error("Failed to load patient summaries", e);
          } finally {
            setSummaryLoading(false);
          }
        }
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Feed fetcher
  useEffect(() => {
    const fetchFeed = async () => {
      setFeedLoading(true);
      try {
        const tzOffset = new Date().getTimezoneOffset();
        const params = {
          date: activeFilter,
          timezoneOffset: tzOffset,
        };

        if (activeFilter === "custom") {
          if (!customStartDate || !customEndDate) {
            setFeedLoading(false);
            return;
          }
          params.startDate = customStartDate;
          params.endDate = customEndDate;
        }

        const data = await reportService.getAllReports(params);
        setFeedReports(data.patientTests || []);
      } catch (err) {
        console.error("Failed to load feed", err);
      } finally {
        setFeedLoading(false);
      }
    };
    fetchFeed();
    const interval = setInterval(fetchFeed, 60000);
    return () => clearInterval(interval);
  }, [activeFilter, customStartDate, customEndDate]);

  const filteredFeed = feedReports.filter((report) => {
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

  const handleDownload = async (period) => {
    setDownloadingPeriod(period);
    setSummaryError("");
    setDownloadSuccess("");
    try {
      const timezoneOffset = new Date().getTimezoneOffset();
      const blobData = await patientService.exportSummary(period, timezoneOffset);
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `patient_summary_${period}_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setDownloadSuccess(`Successfully downloaded ${period}'s patient summary.`);
      setTimeout(() => setDownloadSuccess(""), 4000);
    } catch (e) {
      setSummaryError(`Failed to download ${period}'s patient summary.`);
      console.error(e);
    } finally {
      setDownloadingPeriod("");
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
    <div className="space-y-10">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-2">
            OVERVIEW
          </span>
          <h1 className="font-martinaplantijn text-3xl sm:text-4xl md:text-5xl text-ink-navy leading-none">
            Welcome back, <span className="italic font-light">{user?.username}</span>
          </h1>
          <p className="font-inter text-stone text-sm mt-2">
            Here is what's happening at Balaji Labs today.
          </p>
        </div>
        <div>
          <Link
            to="/patients/create"
            className="inline-flex items-center space-x-2 bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>New Patient</span>
          </Link>
        </div>
      </div>

      {/* Patient Summary Card (Admin Only) */}
      {isAdmin && (
        <div className="bg-paper-white border border-cream-border rounded-cards p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-cream-border pb-4">
            <div>
              <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-1">
                ADMIN ACTIONS
              </span>
              <h2 className="font-martinaplantijn text-3xl font-bold text-ink-navy">
                Patient <span className="italic font-light text-electric-cobalt">Summary</span>
              </h2>
              <p className="font-inter text-stone text-xs mt-1">
                Export and review detailed reports for patient registration logs.
              </p>
            </div>
          </div>

          {summaryError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-cards flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{summaryError}</span>
            </div>
          )}

          {downloadSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-cards flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Today's patients column */}
            <div className="border border-cream-border rounded-2xl p-5 bg-warm-canvas/20 flex flex-col justify-between space-y-4">
              <div>
                <p className="font-abcfavoritvariable text-xs font-semibold text-graphite uppercase tracking-wider">
                  Today's Patients
                </p>
                <div className="mt-2 text-2xl font-bold font-abcfavoritvariable text-charcoal">
                  {summaryLoading ? (
                    <span className="text-sm font-normal text-stone">Loading...</span>
                  ) : (
                    summaryStats.today
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDownload("today")}
                disabled={downloadingPeriod !== ""}
                className="w-full bg-electric-cobalt text-paper-white font-medium py-2 rounded-buttons hover:bg-opacity-95 transition duration-200 disabled:opacity-50 text-xs shrink-0 cursor-pointer flex items-center justify-center space-x-2"
              >
                {downloadingPeriod === "today" ? (
                  <span>Downloading...</span>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Today</span>
                  </>
                )}
              </button>
            </div>

            {/* This week's column */}
            <div className="border border-cream-border rounded-2xl p-5 bg-warm-canvas/20 flex flex-col justify-between space-y-4">
              <div>
                <p className="font-abcfavoritvariable text-xs font-semibold text-graphite uppercase tracking-wider">
                  This Week
                </p>
                <div className="mt-2 text-2xl font-bold font-abcfavoritvariable text-charcoal">
                  {summaryLoading ? (
                    <span className="text-sm font-normal text-stone">Loading...</span>
                  ) : (
                    summaryStats.week
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDownload("week")}
                disabled={downloadingPeriod !== ""}
                className="w-full bg-electric-cobalt text-paper-white font-medium py-2 rounded-buttons hover:bg-opacity-95 transition duration-200 disabled:opacity-50 text-xs shrink-0 cursor-pointer flex items-center justify-center space-x-2"
              >
                {downloadingPeriod === "week" ? (
                  <span>Downloading...</span>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Week</span>
                  </>
                )}
              </button>
            </div>

            {/* This month's column */}
            <div className="border border-cream-border rounded-2xl p-5 bg-warm-canvas/20 flex flex-col justify-between space-y-4">
              <div>
                <p className="font-abcfavoritvariable text-xs font-semibold text-graphite uppercase tracking-wider">
                  This Month
                </p>
                <div className="mt-2 text-2xl font-bold font-abcfavoritvariable text-charcoal">
                  {summaryLoading ? (
                    <span className="text-sm font-normal text-stone">Loading...</span>
                  ) : (
                    summaryStats.month
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDownload("month")}
                disabled={downloadingPeriod !== ""}
                className="w-full bg-electric-cobalt text-paper-white font-medium py-2 rounded-buttons hover:bg-opacity-95 transition duration-200 disabled:opacity-50 text-xs shrink-0 cursor-pointer flex items-center justify-center space-x-2"
              >
                {downloadingPeriod === "month" ? (
                  <span>Downloading...</span>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Month</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full gap-8">
        <div className="bg-paper-white border border-cream-border rounded-cards p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-abcfavoritvariable text-lg font-medium text-charcoal">
              Daily <span className="font-martinaplantijn italic text-ink-navy">Work Queue</span>
            </h2>
            <div className="flex items-center space-x-3">
              <Link
                to="/patients"
                className="text-xs font-medium text-electric-cobalt hover:underline flex items-center space-x-1"
              >
                <span>View Full Directory</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="bg-warm-canvas/30 border border-cream-border rounded-2xl p-4 mb-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center flex-wrap gap-2">
                <Filter className="h-4 w-4 text-stone mr-2 shrink-0" />
                {filters.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                      activeFilter === f.id
                        ? "bg-electric-cobalt text-white border-electric-cobalt"
                        : "bg-paper-white text-stone border border-cream-border hover:bg-gray-100"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center bg-paper-white border border-cream-border rounded-full px-3 py-1 w-full md:w-auto max-w-sm">
                <Search className="h-3.5 w-3.5 text-stone shrink-0 mr-2" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-none bg-transparent p-1 text-xs text-charcoal outline-none focus:ring-0"
                />
              </div>
            </div>

            {activeFilter === "custom" && (
              <div className="flex items-center flex-wrap gap-3 pt-3 border-t border-cream-border mt-3">
                <Calendar className="h-4 w-4 text-stone shrink-0" />
                <span className="text-[11px] font-medium text-stone">Range:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="border border-cream-border rounded-inputs px-2 py-0.5 text-[11px] text-charcoal focus:outline-none focus:border-electric-cobalt"
                />
                <span className="text-[11px] text-stone">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="border border-cream-border rounded-inputs px-2 py-0.5 text-[11px] text-charcoal focus:outline-none focus:border-electric-cobalt"
                />
              </div>
            )}
          </div>

          <div className="border border-cream-border rounded-xl overflow-hidden min-h-[300px]">
            {feedLoading && feedReports.length === 0 ? (
              <div className="flex items-center justify-center min-h-[300px]">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
              </div>
            ) : (
              <div className="overflow-x-auto w-full block">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-warm-canvas border-b border-cream-border">
                      <th className="px-4 py-3 font-abcfavoritvariable text-[10px] font-bold text-graphite uppercase tracking-wider">
                        Patient Name
                      </th>
                      <th className="px-4 py-3 font-abcfavoritvariable text-[10px] font-bold text-graphite uppercase tracking-wider">
                        Age/Gender
                      </th>
                      <th className="px-4 py-3 font-abcfavoritvariable text-[10px] font-bold text-graphite uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-border">
                    {filteredFeed.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <FileText className="h-6 w-6 text-stone/40 mb-2" />
                            <p className="text-xs font-semibold text-charcoal">
                              No reports found for this date.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredFeed.map((report) => {
                        const patient = report.patientId || {};
                        return (
                          <tr
                            onClick={() => navigate(`/patients/${patient._id || report.patientId}`)}
                            key={report._id} 
                            className="hover:bg-warm-canvas/30 transition cursor-pointer duration-150"
                          >
                            <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-charcoal">
                              {patient.name || "Unknown Patient"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-[11px] text-stone">
                              {patient.age ? `${patient.age}y • ` : ''}<span className="capitalize">{patient.gender || '-'}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <Link
                                to={`/patients/${patient._id || report.patientId}`}
                                className="inline-flex items-center space-x-1 text-electric-cobalt hover:underline text-[11px] font-medium"
                              >
                                <span>Process</span>
                                <ArrowRight className="h-3 w-3" />
                              </Link>
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
      </div>
    </div>
  );
};
export default Dashboard;
