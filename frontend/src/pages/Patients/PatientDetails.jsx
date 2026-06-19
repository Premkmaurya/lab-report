import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { patientService } from "../../services/patientService";
import { reportService } from "../../services/reportService";
import { ArrowLeft, ShieldAlert, Plus, FileText, ChevronRight } from "lucide-react";

export const PatientDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const canCreateReport = user?.role === "admin" || user?.role === "user";

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const patientData = await patientService.getPatientById(id);
        setPatient(patientData.patient);

        try {
          const reportsData = await reportService.getReportsByPatientId(id);
          setReports(reportsData.patientTests || []);
        } catch (e) {
          console.warn("Error fetching patient test history", e);
        }
      } catch (err) {
        setErrorMsg(
          err.response?.data?.message || "Failed to load patient details."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          to="/patients"
          className="inline-flex items-center space-x-2 text-sm text-stone hover:text-charcoal transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Directory</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-cards flex items-center space-x-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {patient && (
        <div className="space-y-8">
          {/* Patient Card Detail Display */}
          <div className="bg-paper-white border border-cream-border rounded-cards p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-cream-border pb-6">
              <div>
                <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-1">
                  PATIENT FILE
                </span>
                <h1 className="font-martinaplantijn text-4xl text-ink-navy">
                  {patient.name}
                </h1>
                <p className="font-inter text-stone text-sm mt-1">
                  Created by: {patient.createdBy?.username || "System"} ({patient.createdBy?.email})
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/patients/edit/${patient._id}`}
                  className="bg-paper-white border border-cream-border text-graphite font-medium py-2.5 px-6 rounded-buttons hover:bg-warm-canvas transition duration-200 text-sm text-center"
                >
                  Edit Profile
                </Link>
                {canCreateReport && (
                  <Link
                    to={`/reports/create?patientId=${patient._id}`}
                    className="bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm inline-flex items-center space-x-2 text-center"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Report</span>
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
              <div>
                <p className="text-xs font-bold text-stone uppercase tracking-wider mb-1">
                  Age
                </p>
                <p className="text-base font-semibold text-charcoal">
                  {patient.age} years
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone uppercase tracking-wider mb-1">
                  Gender
                </p>
                <p className="text-base font-semibold text-charcoal capitalize">
                  {patient.gender}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone uppercase tracking-wider mb-1">
                  Referred Doctor
                </p>
                <p className="text-base font-semibold text-charcoal">
                  {patient.referredDoctor}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone uppercase tracking-wider mb-1">
                  Registered Date
                </p>
                <p className="text-base font-semibold text-charcoal font-mono">
                  {new Date(patient.createdAt || patient.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Test Reports List */}
          <div className="space-y-4">
            <h2 className="font-abcfavoritvariable text-xl font-medium text-charcoal">
              Laboratory <span className="font-martinaplantijn italic text-ink-navy">Reports</span>
            </h2>

            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="bg-paper-white border border-cream-border rounded-cards p-8 text-center">
                  <FileText className="h-10 w-10 text-stone mx-auto mb-3" />
                  <p className="text-sm font-medium text-charcoal">
                    No reports recorded for this patient.
                  </p>
                  <p className="text-xs text-stone mt-1 mb-4">
                    Assigned reports and values will be shown here.
                  </p>
                  {canCreateReport && (
                    <Link
                      to={`/reports/create?patientId=${patient._id}`}
                      className="inline-flex items-center space-x-2 bg-electric-cobalt text-paper-white font-medium py-2 px-5 rounded-buttons hover:bg-opacity-95 transition duration-200 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create Report</span>
                    </Link>
                  )}
                </div>
              ) : (
                reports.map((report) => (
                  <div
                    key={report._id}
                    className="bg-paper-white border border-cream-border rounded-cards p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-smoke transition-all duration-200"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-charcoal">
                          Report #{report._id.substring(18)}
                        </span>
                        <span className="text-xs text-stone font-mono">
                          • {new Date(report.createdAt || report.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-stone mt-1.5 leading-relaxed">
                        Tests: {report.tests?.map((t) => t.testName).join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Link
                        to={`/reports/${report._id}`}
                        className="text-xs font-semibold text-electric-cobalt hover:underline flex items-center space-x-1"
                      >
                        <span>Open Report</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>


        </div>
      )}
    </div>
  );
};
export default PatientDetails;
