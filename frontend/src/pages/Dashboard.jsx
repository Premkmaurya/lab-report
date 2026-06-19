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
} from "lucide-react";
import { Link } from "react-router-dom";

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    tests: 0,
    reports: 0,
  });
  const [recentPatients, setRecentPatients] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

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
        setRecentPatients((patientsData.patients || []).slice(0, 5));
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Editorial Header */}
      <div>
        <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-2">
          OVERVIEW
        </span>
        <h1 className="font-martinaplantijn text-4xl md:text-5xl text-ink-navy leading-none">
          Welcome back, <span className="italic font-light">{user?.username}</span>
        </h1>
        <p className="font-inter text-stone text-sm mt-2">
          Here is what's happening at Balaji Labs today.
        </p>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Patients Card */}
        <div className="bg-paper-white border border-cream-border p-6 rounded-cards transition-all duration-300 hover:border-smoke hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-abcfavoritvariable text-xs font-semibold text-graphite uppercase tracking-wider">
              Total Patients
            </span>
            <div className="p-2 bg-lavender-mist rounded-2xl">
              <HeartPulse className="h-5 w-5 text-electric-cobalt" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold font-abcfavoritvariable text-charcoal">
              {stats.patients}
            </span>
          </div>
          <p className="text-xs text-stone mt-2">Registered in database</p>
        </div>

        {/* Reports Card */}
        <div className="bg-paper-white border border-cream-border p-6 rounded-cards transition-all duration-300 hover:border-smoke hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-abcfavoritvariable text-xs font-semibold text-graphite uppercase tracking-wider">
              Generated Reports
            </span>
            <div className="p-2 bg-lavender-mist rounded-2xl">
              <FileSpreadsheet className="h-5 w-5 text-electric-cobalt" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold font-abcfavoritvariable text-charcoal">
              {stats.reports}
            </span>
          </div>
          <p className="text-xs text-stone mt-2">Laboratory reports completed</p>
        </div>

        {/* Tests Card */}
        <div className="bg-paper-white border border-cream-border p-6 rounded-cards transition-all duration-300 hover:border-smoke hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-abcfavoritvariable text-xs font-semibold text-graphite uppercase tracking-wider">
              Available Tests
            </span>
            <div className="p-2 bg-lavender-mist rounded-2xl">
              <FlaskConical className="h-5 w-5 text-electric-cobalt" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold font-abcfavoritvariable text-charcoal">
              {stats.tests}
            </span>
          </div>
          <p className="text-xs text-stone mt-2">Services in catalog</p>
        </div>

        {/* Doctors Card */}
        <div className="bg-paper-white border border-cream-border p-6 rounded-cards transition-all duration-300 hover:border-smoke hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-abcfavoritvariable text-xs font-semibold text-graphite uppercase tracking-wider">
              Active Doctors
            </span>
            <div className="p-2 bg-lavender-mist rounded-2xl">
              <Users className="h-5 w-5 text-electric-cobalt" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-bold font-abcfavoritvariable text-charcoal">
              {stats.doctors}
            </span>
          </div>
          <p className="text-xs text-stone mt-2">Referred specialists</p>
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

      {/* Two-Column split of lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Patients */}
        <div className="bg-paper-white border border-cream-border rounded-cards p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-abcfavoritvariable text-lg font-medium text-charcoal">
              Recent <span className="font-martinaplantijn italic text-ink-navy">Patients</span>
            </h2>
            <Link
              to="/patients"
              className="text-xs font-medium text-electric-cobalt hover:underline flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentPatients.length === 0 ? (
              <p className="text-sm text-stone py-4 text-center">No patients found.</p>
            ) : (
              recentPatients.map((patient) => (
                <div
                  key={patient._id}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-warm-canvas/50 border border-transparent hover:border-cream-border transition-all duration-200"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-charcoal">
                      {patient.name}
                    </h4>
                    <p className="text-xs text-stone mt-0.5">
                      {patient.age} years • {patient.gender} • Ref: {patient.referredDoctor}
                    </p>
                  </div>
                  <span className="text-xs text-stone font-mono">
                    {new Date(patient.createdAt || patient.date).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-paper-white border border-cream-border rounded-cards p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-abcfavoritvariable text-lg font-medium text-charcoal">
              Completed <span className="font-martinaplantijn italic text-ink-navy">Reports</span>
            </h2>
            <Link
              to="/reports"
              className="text-xs font-medium text-electric-cobalt hover:underline flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentReports.length === 0 ? (
              <p className="text-sm text-stone py-4 text-center">No reports found.</p>
            ) : (
              recentReports.map((report) => (
                <div
                  key={report._id}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-warm-canvas/50 border border-transparent hover:border-cream-border transition-all duration-200"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-charcoal">
                      {report.patientId?.name || "Unknown Patient"}
                    </h4>
                    <p className="text-xs text-stone mt-0.5">
                      Tests: {report.tests?.map((t) => t.testName).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-stone font-mono block">
                      {new Date(report.createdAt || report.date).toLocaleDateString()}
                    </span>
                    <Link
                      to={`/reports/${report._id}`}
                      className="text-xs font-medium text-electric-cobalt hover:underline"
                    >
                      View Report
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
