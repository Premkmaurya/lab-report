import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { patientService } from "../../services/patientService";
import { reportService } from "../../services/reportService";
import { testService } from "../../services/testService";
import { handlePrint } from "../../utils/printUtils";
import { ArrowLeft, ShieldAlert, Plus, FileText, ChevronRight, Edit, X, Printer } from "lucide-react";
import { ReportLayout } from "../../components/report/ReportLayout";
import { PrintWarningModal } from "../../components/report/PrintWarningModal";

export const PatientDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingTest, setEditingTest] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [testParameters, setTestParameters] = useState([]);
  const [reportToPrint, setReportToPrint] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedReportForPrint, setSelectedReportForPrint] = useState(null);
  const [addTestModalOpen, setAddTestModalOpen] = useState(false);
  const [selectedReportForAdd, setSelectedReportForAdd] = useState(null);
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTestIdToAdd, setSelectedTestIdToAdd] = useState("");
  const [isAddingTest, setIsAddingTest] = useState(false);

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
      const existingTestIds = report.tests.map(t => t.testId.toString());
      const filtered = testsData.tests.filter(t => !existingTestIds.includes(t._id.toString()));
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
    try {
      const selectedTest = availableTests.find(t => t._id === selectedTestIdToAdd);
      const res = await reportService.addTestToReport(selectedReportForAdd._id, {
        testId: selectedTest._id,
        testName: selectedTest.name
      });
      
      setReports(reports.map(r => 
        r._id === selectedReportForAdd._id ? res.patientTest : r
      ));
      closeAddTestModal();
    } catch (err) {
      console.error("Failed to add test", err);
    } finally {
      setIsAddingTest(false);
    }
  };

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

  const openEditModal = (reportId, test) => {
    setEditingTest({ reportId, test });
    setTestParameters(test.result || []);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingTest(null);
    setTestParameters([]);
  };

  const updateTestParameter = (index, field, value) => {
    const updated = [...testParameters];
    updated[index] = { ...updated[index], [field]: value };
    setTestParameters(updated);
  };

  const addParameter = () => {
    setTestParameters([...testParameters, { parameter: "", value: "", unit: "", normalRange: "" }]);
  };

  const removeParameter = (index) => {
    setTestParameters(testParameters.filter((_, i) => i !== index));
  };

  const saveTestParameters = async () => {
    try {
      const updatedTests = reports.find(r => r._id === editingTest.reportId)?.tests.map(t => 
        t.testName === editingTest.test.testName ? { ...t, result: testParameters } : t
      );
      
      await reportService.updatePatientTest(editingTest.reportId, { tests: updatedTests });
      
      // Update local state
      setReports(reports.map(r => 
        r._id === editingTest.reportId ? { ...r, tests: updatedTests } : r
      ));
      
      closeEditModal();
    } catch (err) {
      console.error("Failed to update test parameters", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-125">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
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
                  className="bg-electric-cobalt border border-cream-border text-white font-medium py-2.5 px-6 rounded-buttons transition duration-200 text-sm text-center"
                >
                  Edit Profile
                </Link>
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
                  {canCreateReport && (
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
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-cream-border">
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
                        <button
                          onClick={() => openAddTestModal(report)}
                          className="text-xs font-semibold text-charcoal hover:underline flex items-center space-x-1"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add Test</span>
                        </button>
                        <button
                          onClick={() => triggerPrintRequest(report)}
                          className="text-xs font-semibold text-electric-cobalt hover:underline flex items-center space-x-1"
                        >
                          <span>Print Report</span>
                          <Printer className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Tests List */}
                    <div className="space-y-2">
                      {report.tests && report.tests.length > 0 ? (
                        report.tests.map((test, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between px-4 py-3 bg-warm-canvas rounded-lg hover:bg-opacity-80 transition-colors"
                          >
                            <span className="text-sm font-medium text-charcoal">
                              {test.testName}
                            </span>
                            <button
                              onClick={() => openEditModal(report._id, test)}
                              className="text-xs font-semibold text-electric-cobalt hover:text-opacity-80 transition-colors inline-flex items-center space-x-1"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-stone py-2">No tests assigned</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Edit Test Modal */}
          {editModalOpen && editingTest && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-paper-white rounded-cards max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-paper-white border-b border-cream-border p-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-charcoal">
                      Edit Test: {editingTest.test.testName}
                    </h2>
                    <p className="text-xs text-stone mt-1">Add or update test parameters and results</p>
                  </div>
                  <button
                    onClick={closeEditModal}
                    className="text-stone hover:text-charcoal transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  {testParameters.length === 0 ? (
                    <p className="text-sm text-stone py-4 text-center">
                      No parameters added yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {testParameters.map((param, idx) => (
                        <div key={idx} className="border border-cream-border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-charcoal uppercase">
                              Parameter {idx + 1}
                            </span>
                            <button
                              onClick={() => removeParameter(idx)}
                              className="text-red-500 hover:text-red-700 text-xs font-semibold"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-charcoal uppercase tracking-wider mb-1 block">
                                Parameter Name
                              </label>
                              <input
                                type="text"
                                placeholder="e.g., Hemoglobin"
                                className="w-full border border-cream-border rounded-inputs px-3 py-2 text-sm focus:outline-none"
                                value={param.parameter || ""}
                                onChange={(e) => updateTestParameter(idx, "parameter", e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-charcoal uppercase tracking-wider mb-1 block">
                                Value
                              </label>
                              <input
                                type="text"
                                placeholder="e.g., 13.5"
                                className="w-full border border-cream-border rounded-inputs px-3 py-2 text-sm focus:outline-none"
                                value={param.value || ""}
                                onChange={(e) => updateTestParameter(idx, "value", e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-charcoal uppercase tracking-wider mb-1 block">
                                Unit
                              </label>
                              <input
                                type="text"
                                placeholder="e.g., g/dL"
                                className="w-full border border-cream-border rounded-inputs px-3 py-2 text-sm focus:outline-none"
                                value={param.unit || ""}
                                onChange={(e) => updateTestParameter(idx, "unit", e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-charcoal uppercase tracking-wider mb-1 block">
                                Normal Range
                              </label>
                              <input
                                type="text"
                                placeholder="e.g., 12.0-15.5"
                                className="w-full border border-cream-border rounded-inputs px-3 py-2 text-sm focus:outline-none"
                                value={param.normalRange || ""}
                                onChange={(e) => updateTestParameter(idx, "normalRange", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={addParameter}
                    className="w-full border border-cream-border text-electric-cobalt font-medium py-2.5 px-4 rounded-buttons hover:bg-warm-canvas transition duration-200 text-sm flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Parameter</span>
                  </button>
                </div>

                <div className="sticky bottom-0 bg-warm-canvas border-t border-cream-border p-6 flex items-center space-x-3 justify-end">
                  <button
                    onClick={closeEditModal}
                    className="bg-paper-white border border-cream-border text-graphite font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveTestParameters}
                    className="bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm"
                  >
                    Save Parameters
                  </button>
                </div>
              </div>
            </div>
          )}
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
              <p className="text-sm text-stone italic">No additional tests available to add.</p>
            ) : (
              <select
                className="w-full border border-cream-border rounded-inputs px-3 py-2 text-sm focus:outline-none"
                value={selectedTestIdToAdd}
                onChange={(e) => setSelectedTestIdToAdd(e.target.value)}
              >
                <option value="">-- Select a Test --</option>
                {availableTests.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="bg-warm-canvas border-t border-cream-border p-6 flex justify-end space-x-3">
            <button onClick={closeAddTestModal} className="bg-paper-white border border-cream-border text-graphite font-medium py-2 px-4 rounded-buttons text-sm">
              Cancel
            </button>
            <button 
              onClick={handleAddTest} 
              disabled={!selectedTestIdToAdd || isAddingTest}
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
