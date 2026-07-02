import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { reportService } from "../../services/reportService";
import { ArrowLeft, Save, ShieldAlert, FlaskConical } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";

export const EditTestResult = () => {
  const { reportId, testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [report, setReport] = useState(null);
  const [testTemplate, setTestTemplate] = useState(null);
  const [saving, setSaving] = useState(false);

  // Keyboard Navigation Refs
  const inputRefs = useRef([]);
  const saveButtonRef = useRef(null);

  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: {
      results: [],
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "results",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await reportService.getReportAndTestTemplate(reportId, testId);
        setReport(res.patientTest);
        setTestTemplate(res.testTemplate);

        // Find the specific test in the report
        const reportTest = res.patientTest.tests.find((t) => t.testId.toString() === testId);

        if (!reportTest) {
          setErrorMsg("Test not found in this report.");
          setLoading(false);
          return;
        }

        // Merge template parameters with existing results
        const mergedResults = res.testTemplate.subTests.map((sub) => {
          const existingResult = reportTest.result?.find(
            (r) => r.parameter.toLowerCase() === sub.name.toLowerCase()
          );

          return {
            parameter: sub.name,
            value: existingResult ? existingResult.value : "",
            unit: sub.unit,
            normalRange: sub.normalRange,
          };
        });

        reset({ results: mergedResults });
        setLoading(false);
      } catch (err) {
        setErrorMsg(err.response?.data?.message || "Failed to load test data.");
        setLoading(false);
      }
    };
    fetchData();
  }, [reportId, testId, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    setErrorMsg("");

    try {
      // Create a copy of the tests array
      const updatedTests = report.tests.map((t) => {
        if (t.testId.toString() === testId) {
          // Update the result array for this specific test
          return {
            ...t,
            result: data.results.map(r => ({
              parameter: r.parameter,
              value: r.value,
              unit: r.unit,
              normalRange: r.normalRange
            }))
          };
        }
        return t;
      });

      await reportService.updatePatientTest(reportId, { tests: updatedTests });
      navigate(`/patients/${report.patientId._id || report.patientId}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save test results.");
      setSaving(false);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (index < fields.length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else {
        saveButtonRef.current?.focus();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (index < fields.length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else {
        saveButtonRef.current?.focus();
      }
    } else if ((e.key === "Enter" && e.shiftKey) || e.key === "ArrowUp") {
      e.preventDefault();
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-125">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={report?.patientId ? `/patients/${report.patientId._id || report.patientId}` : "/patients"}
          className="inline-flex items-center space-x-2 text-sm text-stone hover:text-charcoal transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Patient File</span>
        </Link>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-cards flex items-center space-x-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {report && testTemplate && (
        <div className="bg-paper-white border border-cream-border rounded-cards p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-cream-border pb-6 mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-warm-canvas p-2 rounded-lg border border-cream-border">
                  <FlaskConical className="h-5 w-5 text-electric-cobalt" />
                </div>
                <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block">
                  TEST RESULT ENTRY
                </span>
              </div>
              <h1 className="font-martinaplantijn text-3xl text-ink-navy">
                {testTemplate.name}
              </h1>
              <p className="font-inter text-stone text-sm mt-1">
                Patient: <span className="font-medium text-charcoal">{report.patientId?.name || 'Unknown'}</span> &nbsp;|&nbsp; 
                Report Date: {new Date(report.date || report.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-cream-border">
                    <th className="py-3 px-4 font-abcfavoritvariable text-xs font-bold text-stone uppercase tracking-wider bg-warm-canvas rounded-tl-lg">
                      Parameter
                    </th>
                    <th className="py-3 px-4 font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-wider bg-warm-canvas">
                      Result
                    </th>
                    <th className="py-3 px-4 font-abcfavoritvariable text-xs font-bold text-stone uppercase tracking-wider bg-warm-canvas">
                      Unit
                    </th>
                    <th className="py-3 px-4 font-abcfavoritvariable text-xs font-bold text-stone uppercase tracking-wider bg-warm-canvas rounded-tr-lg">
                      Normal Range
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-border">
                  {fields.map((item, index) => (
                    <tr key={item.id} className="hover:bg-warm-canvas/50 transition-colors">
                      {/* Read-only Parameter */}
                      <td className="py-4 px-4 align-middle">
                        <span className="text-sm font-semibold text-charcoal block">
                          {item.parameter}
                        </span>
                        <input
                          type="hidden"
                          {...register(`results.${index}.parameter`)}
                        />
                      </td>

                      {/* Editable Result */}
                      <td className="py-4 px-4 align-middle">
                        {(() => {
                          const { ref, ...rest } = register(`results.${index}.value`);
                          return (
                            <input
                              type="text"
                              placeholder="Enter value"
                              className="w-full min-w-[160px] md:w-64 bg-white border border-electric-cobalt focus:border-ink-navy focus:ring-1 focus:ring-ink-navy rounded-inputs px-3 py-2 text-sm font-medium text-charcoal transition-colors"
                              {...rest}
                              ref={(e) => {
                                ref(e);
                                inputRefs.current[index] = e;
                              }}
                              onKeyDown={(e) => handleKeyDown(e, index)}
                              autoComplete="off"
                            />
                          );
                        })()}
                      </td>

                      {/* Read-only Unit */}
                      <td className="py-4 px-4 align-middle">
                        <span className="text-sm text-stone px-3 py-1.5 bg-warm-canvas rounded-md border border-cream-border inline-block">
                          {item.unit || "-"}
                        </span>
                        <input
                          type="hidden"
                          {...register(`results.${index}.unit`)}
                        />
                      </td>

                      {/* Read-only Normal Range */}
                      <td className="py-4 px-4 align-middle">
                        <span className="text-sm text-stone px-3 py-1.5 bg-warm-canvas rounded-md border border-cream-border inline-block">
                          {item.normalRange || "-"}
                        </span>
                        <input
                          type="hidden"
                          {...register(`results.${index}.normalRange`)}
                        />
                      </td>
                    </tr>
                  ))}
                  
                  {fields.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-stone text-sm">
                        No parameters defined in this test template.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end pt-6 border-t border-cream-border space-x-4">
              <Link
                to={report?.patientId ? `/patients/${report.patientId._id || report.patientId}` : "/patients"}
                className="text-sm font-medium text-graphite hover:text-charcoal transition duration-200"
              >
                Cancel
              </Link>
              <button
                type="submit"
                ref={saveButtonRef}
                disabled={saving}
                className="bg-electric-cobalt text-paper-white font-medium py-2.5 px-8 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm flex items-center space-x-2 disabled:opacity-70"
              >
                {saving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-paper-white border-t-transparent"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? "Saving..." : "Save Results"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EditTestResult;
