import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { reportService } from "../../services/reportService";
import { Plus, Search, Eye, FileText, Trash2, ShieldAlert } from "lucide-react";

export const ReportList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchReports = async () => {
    try {
      const data = await reportService.getAllReports();
      setReports(data.patientTests || []);
    } catch (err) {
      setErrorMsg("Failed to load completed report list.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report?")) {
      return;
    }
    try {
      setErrorMsg("");
      await reportService.deleteReport(id);
      setReports((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message || "Failed to delete the report."
      );
    }
  };

  const filteredReports = reports.filter((report) =>
    report.patientId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-2">
            DIAGNOSTICS
          </span>
          <h1 className="font-martinaplantijn text-4xl text-ink-navy">
            Laboratory <span className="italic font-light">Reports</span>
          </h1>
          <p className="font-inter text-stone text-sm mt-1">
            Browse, edit, print, or remove patient diagnostics reports.
          </p>
        </div>
        <div>
          <Link
            to="/reports/create"
            className="inline-flex items-center space-x-2 bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create Report</span>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-cards flex items-center space-x-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex items-center bg-paper-white border border-cream-border rounded-cards px-4 py-1 max-w-md">
        <Search className="h-5 w-5 text-stone shrink-0 mr-2" />
        <input
          type="text"
          placeholder="Search by patient name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border-none bg-transparent p-3 text-sm text-charcoal outline-none focus:ring-0"
        />
      </div>

      {/* Reports Table */}
      <div className="bg-paper-white border border-cream-border rounded-cards overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-warm-canvas border-b border-cream-border">
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                  Test Profiles
                </th>
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                  Completed On
                </th>
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-stone text-sm">
                    No reports found.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report._id} className="hover:bg-warm-canvas/30 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-charcoal">
                      {report.patientId?.name || "Unknown Patient"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone max-w-xs truncate">
                      {report.tests?.map((t) => t.testName).join(", ")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone font-mono">
                      {new Date(report.createdAt || report.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                      {report.createdBy?.username || "System"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/reports/${report._id}`}
                          className="inline-flex items-center space-x-1 border border-cream-border text-graphite bg-paper-white hover:bg-warm-canvas px-3 py-1.5 rounded-buttons text-xs transition duration-200 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View / Print</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(report._id)}
                          className="inline-flex items-center space-x-1 border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-50 px-3 py-1.5 rounded-buttons text-xs transition duration-200 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default ReportList;
