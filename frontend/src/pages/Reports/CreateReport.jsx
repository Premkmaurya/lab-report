import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { patientService } from "../../services/patientService";
import { testService } from "../../services/testService";
import { reportService } from "../../services/reportService";
import { ArrowLeft, ShieldAlert, Plus, Trash2, CheckCircle2 } from "lucide-react";

export const CreateReport = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPatientId = searchParams.get("patientId") || "";

  const [patients, setPatients] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [selectedTests, setSelectedTests] = useState([]);

  useEffect(() => {
    const loadFormInfo = async () => {
      try {
        const patientsData = await patientService.getAllPatients();
        setPatients(patientsData.patients || []);

        const testsData = await testService.getAllTests();
        setTests(testsData.tests || []);
      } catch (err) {
        setSubmitError("Failed to load patient or test catalog records.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadFormInfo();
  }, []);

  const handleAddTestChange = (e) => {
    const testId = e.target.value;
    if (!testId) return;

    const matchedTest = tests.find((t) => t._id === testId);
    if (!matchedTest) return;

    // Check if already added
    if (selectedTests.some((t) => t.testId === testId)) {
      e.target.value = "";
      return;
    }

    setSelectedTests((prev) => [
      ...prev,
      {
        testId: matchedTest._id,
        testName: matchedTest.name,
        result: [
          { parameter: "", value: "", unit: "", normalRange: "" },
        ],
      },
    ]);

    e.target.value = "";
  };

  const handleRemoveTest = (testId) => {
    setSelectedTests((prev) => prev.filter((t) => t.testId !== testId));
  };

  const handleAddParameterRow = (testIndex) => {
    setSelectedTests((prev) => {
      const updated = [...prev];
      updated[testIndex] = {
        ...updated[testIndex],
        result: [
          ...updated[testIndex].result,
          { parameter: "", value: "", unit: "", normalRange: "" },
        ],
      };
      return updated;
    });
  };

  const handleRemoveParameterRow = (testIndex, paramIndex) => {
    setSelectedTests((prev) => {
      const updated = [...prev];
      const newResult = [...updated[testIndex].result];
      newResult.splice(paramIndex, 1);
      updated[testIndex] = {
        ...updated[testIndex],
        result: newResult,
      };
      return updated;
    });
  };

  const handleParameterChange = (testIndex, paramIndex, field, value) => {
    setSelectedTests((prev) => {
      const updated = [...prev];
      const newResult = [...updated[testIndex].result];
      newResult[paramIndex] = {
        ...newResult[paramIndex],
        [field]: value,
      };
      updated[testIndex] = {
        ...updated[testIndex],
        result: newResult,
      };
      return updated;
    });
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!selectedPatientId) {
      setSubmitError("Please select a patient.");
      return;
    }

    if (selectedTests.length === 0) {
      setSubmitError("Please assign at least one test profile to this report.");
      return;
    }

    // Validate that values are filled (required by backend)
    for (const test of selectedTests) {
      for (const res of test.result) {
        if (!res.value?.trim()) {
          setSubmitError(
            `Please input a result value for test: "${test.testName}" -> parameter: "${res.parameter || 'Default'}"`
          );
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patientId: selectedPatientId,
        date: new Date(date).toISOString(),
        tests: selectedTests,
      };
      await reportService.createReport(payload);
      navigate("/reports");
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Failed to submit report. Please try again."
      );
    } finally {
      setIsSubmitting(false);
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
    <div className="space-y-6 max-w-4xl">
      {/* Back Link */}
      <div>
        <Link
          to="/reports"
          className="inline-flex items-center space-x-2 text-sm text-stone hover:text-charcoal transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Reports</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-2">
          NEW DIAGNOSTICS FILE
        </span>
        <h1 className="font-martinaplantijn text-4xl text-ink-navy">
          Create Laboratory <span className="italic font-light">Report</span>
        </h1>
        <p className="font-inter text-stone text-sm mt-1">
          Select patient, add test procedures, and record technical metric values.
        </p>
      </div>

      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-cards flex items-center space-x-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmitReport} className="space-y-6">
        <div className="bg-paper-white border border-cream-border rounded-cards p-6 md:p-8 space-y-6">
          {/* Metadata section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                Select Patient
              </label>
              <select
                className="w-full bg-paper-white border border-cream-border rounded-inputs px-4 py-3 outline-none"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                disabled={!!initialPatientId} // lock selection if navigated from details page
              >
                <option value="">-- Choose Patient --</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.age} yrs • {p.gender})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                Report Date
              </label>
              <input
                type="date"
                className="w-full"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Test Addition section */}
          <div className="border-t border-cream-border pt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                Add Test Profile to Report
              </label>
              <select
                className="w-full bg-paper-white border border-cream-border rounded-inputs px-4 py-3 outline-none"
                onChange={handleAddTestChange}
                value=""
              >
                <option value="">-- Select Test from Catalog --</option>
                {tests.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} (₹{t.price})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic tests rendering */}
        <div className="space-y-6">
          {selectedTests.length === 0 ? (
            <div className="bg-paper-white/50 border border-cream-border border-dashed rounded-cards p-10 text-center text-stone text-sm">
              No tests added to report. Select a test above to fill diagnostic values.
            </div>
          ) : (
            selectedTests.map((testItem, testIndex) => (
              <div
                key={testItem.testId}
                className="bg-paper-white border border-cream-border rounded-cards p-6 space-y-4"
              >
                {/* Test Card Header */}
                <div className="flex items-center justify-between border-b border-cream-border pb-4">
                  <h3 className="font-abcfavoritvariable text-base font-semibold text-charcoal">
                    {testItem.testName}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleRemoveTest(testItem.testId)}
                    className="inline-flex items-center space-x-1 text-red-600 hover:text-red-700 text-xs font-medium cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Remove Test</span>
                  </button>
                </div>

                {/* Parameters inputs */}
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-3 text-[10px] font-bold text-stone uppercase tracking-wider hidden md:grid px-2">
                    <div className="col-span-3">Parameter</div>
                    <div className="col-span-3">Result Value *</div>
                    <div className="col-span-2">Unit</div>
                    <div className="col-span-3">Normal Range</div>
                    <div className="col-span-1 text-right">Delete</div>
                  </div>

                  <div className="space-y-3">
                    {testItem.result.map((res, paramIndex) => (
                      <div
                        key={paramIndex}
                        className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center border border-cream-border md:border-none p-3 md:p-0 rounded-cards bg-warm-canvas/20 md:bg-transparent"
                      >
                        <div className="col-span-1 md:col-span-3">
                          <span className="block text-[10px] font-bold text-stone uppercase tracking-wider md:hidden mb-1">
                            Parameter
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. Hemoglobin"
                            className="w-full text-xs py-2 px-3"
                            value={res.parameter}
                            onChange={(e) =>
                              handleParameterChange(
                                testIndex,
                                paramIndex,
                                "parameter",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="col-span-1 md:col-span-3">
                          <span className="block text-[10px] font-bold text-stone uppercase tracking-wider md:hidden mb-1">
                            Result Value *
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. 14.5"
                            className="w-full text-xs py-2 px-3"
                            value={res.value}
                            onChange={(e) =>
                              handleParameterChange(
                                testIndex,
                                paramIndex,
                                "value",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="col-span-1 md:col-span-2">
                          <span className="block text-[10px] font-bold text-stone uppercase tracking-wider md:hidden mb-1">
                            Unit
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. g/dL"
                            className="w-full text-xs py-2 px-3"
                            value={res.unit}
                            onChange={(e) =>
                              handleParameterChange(
                                testIndex,
                                paramIndex,
                                "unit",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="col-span-1 md:col-span-3">
                          <span className="block text-[10px] font-bold text-stone uppercase tracking-wider md:hidden mb-1">
                            Normal Range
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. 13.0 - 17.0"
                            className="w-full text-xs py-2 px-3"
                            value={res.normalRange}
                            onChange={(e) =>
                              handleParameterChange(
                                testIndex,
                                paramIndex,
                                "normalRange",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="col-span-1 md:col-span-1 text-right">
                          <button
                            type="button"
                            disabled={testItem.result.length === 1}
                            onClick={() =>
                              handleRemoveParameterRow(testIndex, paramIndex)
                            }
                            className="text-red-500 hover:text-red-700 disabled:opacity-30 p-1 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 md:mx-auto" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddParameterRow(testIndex)}
                    className="inline-flex items-center space-x-1.5 text-xs text-electric-cobalt hover:underline mt-2 font-medium cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Parameter Row</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center space-x-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center space-x-2 bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 disabled:opacity-50 text-sm cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isSubmitting ? "Submitting..." : "Submit Report"}</span>
          </button>
          <Link
            to="/reports"
            className="bg-paper-white border border-cream-border text-graphite font-medium py-2.5 px-6 rounded-buttons hover:bg-warm-canvas transition duration-200 text-sm"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};
export default CreateReport;
