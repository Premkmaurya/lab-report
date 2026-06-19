import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { reportService } from "../../services/reportService";
import { doctorService } from "../../services/doctorService";
import { ArrowLeft, ShieldAlert, Printer, Download } from "lucide-react";

export const ViewReport = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [matchingDoctor, setMatchingDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const reportData = await reportService.getReportById(id);
        const fetchedReport = reportData.patientTest;
        setReport(fetchedReport);

        // Fetch doctors to find a matching referred doctor signature
        try {
          const doctorData = await doctorService.getAllDoctors();
          const docMatch = (doctorData.doctors || []).find(
            (d) => d.name.toLowerCase() === fetchedReport.patientId?.referredDoctor?.toLowerCase()
          );
          if (docMatch) {
            setMatchingDoctor(docMatch);
          }
        } catch (e) {
          console.warn("Could not find matching signature for referring doctor", e);
        }
      } catch (err) {
        setErrorMsg(
          err.response?.data?.message || "Failed to load laboratory report."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px] print:hidden">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Link - Hidden during Print */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          to="/reports"
          className="inline-flex items-center space-x-2 text-sm text-stone hover:text-charcoal transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Reports</span>
        </Link>

        <button
          onClick={handlePrint}
          className="inline-flex items-center space-x-2 bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          <span>Print / PDF</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-cards flex items-center space-x-2 print:hidden">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {report && (
        <div className="bg-paper-white border border-cream-border rounded-cards p-8 md:p-12 shadow-sm print:border-none print:shadow-none print:p-0">
          {/* Diagnostic Center Header */}
          <div className="flex justify-between items-start pb-8 border-b-2 border-ink-navy/20">
            <div>
              <h2 className="font-martinaplantijn text-3xl font-bold text-ink-navy">
                Balaji <span className="italic font-light text-electric-cobalt">Diagnostics</span>
              </h2>
              <p className="text-xs text-stone mt-1">
                Plot 12, Medical Square, Sector 4, Nagpur - 440012
              </p>
              <p className="text-xs text-stone">
                Phone: +91 712 255 1200 | support@balajidiagnostics.com
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-lavender-mist text-ink-navy font-abcfavoritvariable text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                Official Lab Report
              </span>
              <p className="text-xs text-stone mt-2 font-mono">
                Report ID: {report._id}
              </p>
            </div>
          </div>

          {/* Patient Details Header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-b border-cream-border text-sm">
            <div>
              <span className="block text-[10px] font-bold text-stone uppercase tracking-wider mb-1">
                Patient Name
              </span>
              <span className="font-semibold text-charcoal">
                {report.patientId?.name || "N/A"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-stone uppercase tracking-wider mb-1">
                Age / Gender
              </span>
              <span className="font-semibold text-charcoal capitalize">
                {report.patientId ? `${report.patientId.age} yrs / ${report.patientId.gender}` : "N/A"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-stone uppercase tracking-wider mb-1">
                Referred By
              </span>
              <span className="font-semibold text-charcoal">
                {report.patientId?.referredDoctor || "Self Referral"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-stone uppercase tracking-wider mb-1">
                Reported Date
              </span>
              <span className="font-semibold text-charcoal font-mono">
                {new Date(report.createdAt || report.date).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Test Results */}
          <div className="py-8 space-y-10">
            {report.tests?.map((testItem, testIndex) => (
              <div key={testItem.testId || testIndex} className="space-y-4">
                <h3 className="font-abcfavoritvariable text-base font-bold text-ink-navy uppercase tracking-wider border-b border-cream-border pb-2">
                  {testItem.testName}
                </h3>

                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-bold text-stone uppercase tracking-wider border-b border-cream-border">
                      <th className="py-2 w-1/3">Parameter</th>
                      <th className="py-2 w-1/4">Observed Value</th>
                      <th className="py-2 w-1/6">Unit</th>
                      <th className="py-2 w-1/4">Normal Reference Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-border text-sm">
                    {testItem.result?.map((res, resIndex) => (
                      <tr key={resIndex} className="hover:bg-warm-canvas/20">
                        <td className="py-3.5 font-medium text-charcoal">
                          {res.parameter || "Diagnostic Value"}
                        </td>
                        <td className="py-3.5 font-semibold text-ink-navy">
                          {res.value}
                        </td>
                        <td className="py-3.5 text-stone font-mono">
                          {res.unit || "-"}
                        </td>
                        <td className="py-3.5 text-stone font-mono">
                          {res.normalRange || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Signatures */}
          <div className="pt-12 border-t-2 border-cream-border flex justify-between items-end mt-12">
            <div>
              <p className="text-xs text-stone font-medium">
                Reported by: <span className="text-charcoal font-semibold">{report.createdBy?.username || "Lab Technician"}</span>
              </p>
              <p className="text-[10px] text-stone mt-0.5 uppercase tracking-wider font-bold">
                Balaji Diagnostics Center
              </p>
            </div>

            <div className="text-right">
              {matchingDoctor ? (
                <div className="inline-block text-center space-y-2">
                  <div className="h-16 w-36 bg-warm-canvas/30 border border-cream-border p-1 rounded-2xl flex items-center justify-center mx-auto">
                    <img
                      src={matchingDoctor.signUrl}
                      alt={`Signature of Dr. ${matchingDoctor.name}`}
                      className="max-h-14 object-contain"
                    />
                  </div>
                  <p className="text-xs font-semibold text-charcoal">
                    Dr. {matchingDoctor.name}
                  </p>
                  <p className="text-[10px] text-stone uppercase tracking-wider font-bold">
                    {matchingDoctor.qualification} (Referred Doctor)
                  </p>
                </div>
              ) : (
                <div className="inline-block text-center pt-8 border-t border-dashed border-stone w-48">
                  <p className="text-xs font-semibold text-charcoal">
                    {report.patientId?.referredDoctor || "Medical Specialist"}
                  </p>
                  <p className="text-[10px] text-stone uppercase tracking-wider font-bold">
                    Authorized Signatory
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ViewReport;
