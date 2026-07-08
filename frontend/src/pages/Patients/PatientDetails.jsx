import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { canManagePatients, canManageReports, canPrintReports } from "../../config/permissions";
import { patientService } from "../../services/patientService";
import { reportService } from "../../services/reportService";
import { testService } from "../../services/testService";
import { handlePrint } from "../../utils/printUtils";
import { ArrowLeft, ShieldAlert, Plus, FileText, ChevronRight, Edit, X, Printer } from "lucide-react";
import { ReportLayout } from "../../components/report/ReportLayout";
import { PrintWarningModal } from "../../components/report/PrintWarningModal";
import { InlineTestEditor } from "../../components/report/InlineTestEditor";
import SearchableTestSelector from "../../components/SearchableTestSelector";
import { toast } from "../../lib/toast";

export const PatientDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportToPrint, setReportToPrint] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedReportForPrint, setSelectedReportForPrint] = useState(null);
  const [addTestModalOpen, setAddTestModalOpen] = useState(false);
  const [selectedReportForAdd, setSelectedReportForAdd] = useState(null);
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTestIdToAdd, setSelectedTestIdToAdd] = useState("");
  const [isAddingTest, setIsAddingTest] = useState(false);
  const [expandedTestId, setExpandedTestId] = useState(null);
  const [editingTestId, setEditingTestId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAfterPrint = () => {
      setReportToPrint(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const triggerPrintRequest = (report) => {
    const hideWarning = localStorage.getItem('hidePrintWarning');
    if (hideWarning === 'true') {
      executePrint(report);
    } else {
      setSelectedReportForPrint(report);
      setShowWarningModal(true);
    }
  };

  const executePrint = (report) => {
    setShowWarningModal(false);
    setSelectedReportForPrint(null);
    
    handlePrint(
      () => setReportToPrint(report),
      null
    );
  };

  const openAddTestModal = async (report) => {
    setSelectedReportForAdd(report);
    setAddTestModalOpen(true);
    setSelectedTestIdToAdd("");
    
    try {
      const testsData = await testService.getAllTests();
      const existingTestIds = report.tests.map(t => {
        const id = t.testId?._id || t.testId;
        return id?.toString() || "";
      });
      const filtered = testsData.tests.filter(t => !existingTestIds.includes(t._id?.toString()));
      setAvailableTests(filtered);
    } catch (err) {
      console.error("Failed to fetch available tests", err);
    }
  };

  const closeAddTestModal = () => {
    setAddTestModalOpen(false);
    setSelectedReportForAdd(null);
    setAvailableTests([]);
    setSelectedTestIdToAdd("");
  };

  const handleAddTest = async () => {
    if (!selectedTestIdToAdd) return;
    setIsAddingTest(true);
    
    const selectedTest = availableTests.find(t => t._id === selectedTestIdToAdd);
    
    toast.promise(
      reportService.addTestToReport(selectedReportForAdd._id, {
        testId: selectedTest._id,
        testName: selectedTest.name
      }),
      {
        loading: "Adding test to report...",
        success: (res) => {
          const updatedReport = res.patientTest;
          setReports(reports.map(r => r._id === selectedReportForAdd._id ? updatedReport : r));
          setSelectedReportForAdd(updatedReport);
          setAvailableTests(current => current.filter(t => t._id !== selectedTest._id));
          setSelectedTestIdToAdd("");
          return "Test added successfully";
        },
        error: "Failed to add test",
        finally: () => setIsAddingTest(false)
      }
    );
  };

  const _canManagePatients = canManagePatients(user);
  const _canManageReports = canManageReports(user);
  const _canPrintReports = canPrintReports(user);

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
        toast.error(err.response?.data?.message || "Failed to load patient details.");
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-125">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-6 ${reportToPrint ? 'hidden print:hidden' : 'print:hidden'}`}>
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
                {_canManagePatients && (
                  <Link
                    to={`/patients/edit/${patient._id}`}
                    className="bg-electric-cobalt border border-cream-border text-white font-medium py-2.5 px-6 rounded-buttons transition duration-200 text-sm text-center"
                  >
                    Edit Profile
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 pt-6">
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
              <div>
                <p className="text-xs font-bold text-stone uppercase tracking-wider mb-1">
                  Visit ID
                </p>
                <p className="text-base font-semibold text-charcoal font-mono">
                  {patient.visitId || 'N/A'}
                </p>
              </div>
            </div>

            {patient.tests && patient.tests.length > 0 && (
              <div className="mt-8 pt-6 border-t border-cream-border">
                <h3 className="text-xs font-bold text-stone uppercase tracking-wider mb-3">Assigned Tests</h3>
                <div className="flex flex-wrap gap-2">
                  {patient.tests.map(test => (
                    <span key={test._id || test} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-electric-cobalt/10 text-electric-cobalt border border-electric-cobalt/20">
                      {test.name || 'Unknown Test'}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
                  {_canManageReports && (
                    <Link
                      to={`/reports/create/${patient._id}`}
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
                    className="bg-paper-white border border-cream-border rounded-cards p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-cream-border">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-charcoal">
                            Report #{report._id.substring(18)}
                          </span>
                          <span className="text-xs text-stone font-mono">
                            • {new Date(report.createdAt || report.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {_canManageReports && (
                          <button
                            onClick={() => openAddTestModal(report)}
                            className="text-xs font-semibold text-charcoal hover:underline flex items-center space-x-1"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add Test</span>
                          </button>
                        )}
                        {_canPrintReports && (
                          <button
                            onClick={() => triggerPrintRequest(report)}
                            className="text-xs font-semibold text-electric-cobalt hover:underline flex items-center space-x-1"
                          >
                            <span>Print Report</span>
                            <Printer className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tests List */}
                    <div className="space-y-0 border border-cream-border rounded-md overflow-hidden bg-warm-canvas">
                      {report.tests && report.tests.length > 0 ? (
                        report.tests.map((test) => {
                          const testIdStr = (test.testId?._id || test.testId).toString();
                          const reportTestIdStr = `${report._id}-${testIdStr}`;
                          return (
                            <InlineTestEditor
                              key={testIdStr}
                              reportId={report._id}
                              test={test}
                              isExpanded={expandedTestId === reportTestIdStr}
                              isEditing={editingTestId === reportTestIdStr}
                              onToggleExpand={() => {
                                setExpandedTestId(expandedTestId === reportTestIdStr ? null : reportTestIdStr);
                                if (editingTestId === reportTestIdStr) setEditingTestId(null);
                              }}
                              onSetEditing={() => {
                                setExpandedTestId(reportTestIdStr);
                                setEditingTestId(reportTestIdStr);
                              }}
                              onCancelEditing={() => {
                                setEditingTestId(null);
                              }}
                              onSaveSuccess={(updatedReport) => {
                                setReports(reports.map(r => r._id === updatedReport._id ? updatedReport : r));
                              }}
                            />
                          );
                        })
                      ) : (
                        <p className="text-xs text-stone py-3 px-4 bg-paper-white">No tests assigned</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>


        </div>
      )}
    </div>

    {/* Add Test Modal */}
    {addTestModalOpen && selectedReportForAdd && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-paper-white rounded-cards max-w-md w-full">
          <div className="border-b border-cream-border p-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-charcoal">Add Test to Report</h2>
              <p className="text-xs text-stone mt-1">Select a test to append to this report.</p>
            </div>
            <button onClick={closeAddTestModal} className="text-stone hover:text-charcoal transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <label className="text-xs font-bold text-charcoal uppercase tracking-wider mb-2 block">
              Available Tests
            </label>
            {availableTests.length === 0 ? (
              <p className="text-sm text-stone italic">All available laboratory tests have already been added to this report.</p>
            ) : (
              <SearchableTestSelector
                tests={availableTests}
                selectedTests={selectedTestIdToAdd ? [{ testId: selectedTestIdToAdd }] : []}
                onChange={(selected) => setSelectedTestIdToAdd(selected.length > 0 ? selected[0].testId : "")}
                multi={false}
                placeholder="Search tests..."
                autoFocus={true}
              />
            )}
          </div>
          <div className="bg-warm-canvas border-t border-cream-border p-6 flex justify-end space-x-3">
            <button onClick={closeAddTestModal} className="bg-paper-white border border-cream-border text-graphite font-medium py-2 px-4 rounded-buttons text-sm">
              Cancel
            </button>
            <button 
              onClick={handleAddTest} 
              disabled={!selectedTestIdToAdd || isAddingTest || availableTests.length === 0}
              className="bg-electric-cobalt text-paper-white font-medium py-2 px-4 rounded-buttons text-sm disabled:opacity-50"
            >
              {isAddingTest ? "Adding..." : "Add Test"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Print Warning Modal */}
    {showWarningModal && selectedReportForPrint && (
      <PrintWarningModal 
        onContinue={() => executePrint(selectedReportForPrint)}
        onCancel={() => {
          setShowWarningModal(false);
          setSelectedReportForPrint(null);
        }}
      />
    )}

    {reportToPrint && (
      <div className="hidden print:block fixed inset-0 bg-white z-50 overflow-visible">
        <ReportLayout patient={patient} report={reportToPrint} />
      </div>
    )}
    </>
  );
};
export default PatientDetails;