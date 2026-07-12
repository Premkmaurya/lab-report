import React, { useState, useEffect, useRef } from "react";
import { reportService } from "../../services/reportService";
import { Save, ShieldAlert, ChevronDown, ChevronRight, Edit2, X } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";

export const InlineTestEditor = ({
  reportId,
  test,
  isExpanded,
  isEditing,
  onToggleExpand,
  onSetEditing,
  onCancelEditing,
  onSaveSuccess
}) => {
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [testTemplate, setTestTemplate] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const inputRefs = useRef([]);
  const saveButtonRef = useRef(null);

  const { register, handleSubmit, control, reset, formState: { isDirty } } = useForm({
    defaultValues: {
      results: [],
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "results",
  });

  const testIdStr = test.testId?._id || test.testId;

  useEffect(() => {
    if (isExpanded && !testTemplate && !loadingTemplate) {
      const fetchTemplate = async () => {
        setLoadingTemplate(true);
        setErrorMsg("");
        try {
          const res = await reportService.getReportAndTestTemplate(reportId, testIdStr);
          setTestTemplate(res.testTemplate);
        } catch (err) {
          setErrorMsg(err.response?.data?.message || "Failed to load test template.");
        } finally {
          setLoadingTemplate(false);
        }
      };
      fetchTemplate();
    }
  }, [isExpanded, testTemplate, loadingTemplate, reportId, testIdStr]);

  // Setup form data when entering edit mode or when template loads
  useEffect(() => {
    if ((isEditing || isExpanded) && testTemplate) {
      const mergedResults = testTemplate.subTests.map((sub, index) => {
        // Match by index to preserve customized parameter names instead of strictly matching by template name
        const existingResult = test.result?.[index];
        return {
          parameter: existingResult ? existingResult.parameter : sub.name,
          value: existingResult ? existingResult.value : "",
          unit: sub.unit,
          normalRange: sub.normalRange,
          type: sub.type || "parameter",
          isListParameter: sub.isListParameter || false,
          allowedValues: sub.allowedValues || [],
        };
      });
      reset({ results: mergedResults });
    }
  }, [isEditing, isExpanded, testTemplate, test.result, reset]);

  const handleEditClick = (e) => {
    e.stopPropagation();
    onSetEditing();
  };

  const handleCancelClick = () => {
    if (isDirty) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        return;
      }
    }
    onCancelEditing();
    // Reset back to original values
    if (testTemplate) {
      const mergedResults = testTemplate.subTests.map((sub, index) => {
        const existingResult = test.result?.[index];
        return {
          parameter: existingResult ? existingResult.parameter : sub.name,
          value: existingResult ? existingResult.value : "",
          unit: sub.unit,
          normalRange: sub.normalRange,
          type: sub.type || "parameter",
          isListParameter: sub.isListParameter || false,
          allowedValues: sub.allowedValues || [],
        };
      });
      reset({ results: mergedResults });
    }
  };

  const handleEscape = (e) => {
    if (e.key === "Escape" && isEditing) {
      handleCancelClick();
    }
  };

  useEffect(() => {
    if (isEditing) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [isEditing, isDirty]);

  const onSubmit = async (data) => {
    setSaving(true);
    setErrorMsg("");

    try {
      const reportData = await reportService.getReportAndTestTemplate(reportId, testIdStr);
      const fullReport = reportData.patientTest;
      
      const updatedTests = fullReport.tests.map((t) => {
        if ((t.testId?._id || t.testId).toString() === testIdStr.toString()) {
          return {
            ...t,
            result: data.results.map(r => {
              if (r.type === "section") {
                return {
                  parameter: r.parameter,
                  type: "section"
                };
              }
              return {
                parameter: r.parameter,
                value: r.value,
                unit: r.unit,
                normalRange: r.normalRange,
                type: r.type || "parameter",
                isListParameter: r.isListParameter,
                allowedValues: r.allowedValues,
              };
            })
          };
        }
        return t;
      });

      const updatedReportRes = await reportService.updatePatientTest(reportId, { tests: updatedTests });
      
      onSaveSuccess(updatedReportRes.patientTest);
      onCancelEditing();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to save test results.");
    } finally {
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

  const displayResults = testTemplate && fields.length > 0 
    ? fields 
    : test.result || [];

  return (
    <div className={`border-b border-cream-border last:border-0 ${isEditing ? 'bg-white shadow-sm ring-1 ring-cream-border rounded-md my-2' : ''}`}>
      <div 
        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
          isEditing ? 'bg-warm-canvas border-b border-cream-border rounded-t-md cursor-default' : 'hover:bg-gray-300/50 bg-warm-canvas'
        }`}
        onClick={() => {
          if (!isEditing) onToggleExpand();
        }}
      >
        <div className="flex items-center space-x-2">
          {!isEditing && (
            <span className="text-stone">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          )}
          <span className="text-sm font-bold text-charcoal tracking-wide uppercase">
            {test.testName}
          </span>
          {isEditing && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              EDITING
            </span>
          )}
        </div>
        
        {!isEditing && (
          <button
            onClick={handleEditClick}
            className="text-xs font-semibold text-electric-cobalt hover:text-opacity-80 transition-colors inline-flex items-center space-x-1 px-2 py-1 rounded hover:bg-electric-cobalt/10"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="p-4 bg-white">
          {errorMsg && (
             <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-cards flex items-center space-x-2">
               <ShieldAlert className="h-4 w-4 shrink-0" />
               <span>{errorMsg}</span>
             </div>
          )}

          {loadingTemplate ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-cream-border border-t-electric-cobalt"></div>
              <span className="ml-2 text-sm text-stone">Loading test details...</span>
            </div>
          ) : (
            isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '45%' }} />
                      <col style={{ width: '20%' }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: '20%' }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-cream-border text-xs text-stone uppercase tracking-wider bg-warm-canvas/50">
                        <th className="py-2 px-3 font-medium rounded-tl-md text-left">Parameter</th>
                        <th className="py-2 px-3 font-medium text-electric-cobalt text-left">Result</th>
                        <th className="py-2 px-3 font-medium text-center">Unit</th>
                        <th className="py-2 px-3 font-medium rounded-tr-md text-left">Normal Range</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-border">
                      {fields.map((item, index) => {
                        if (item.type === "section") {
                          return (
                            <tr key={item.id} className="bg-warm-canvas/50 border-y border-cream-border">
                              <td colSpan="1" className="py-3 px-3 align-middle">
                                <input
                                  type="text"
                                  className="w-full text-base font-bold text-black uppercase tracking-wider block bg-transparent border-none outline-none focus:ring-1 focus:ring-electric-cobalt rounded px-2"
                                  style={{ whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word', maxWidth: '100%' }}
                                  {...register(`results.${index}.parameter`)}
                                />
                                <input type="hidden" value="section" {...register(`results.${index}.type`)} />
                              </td>
                              <td colSpan="3"></td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={item.id} className="hover:bg-warm-canvas/30 transition-colors">
                            <td className="py-3 px-3 align-middle pl-6 border-l-4 border-l-transparent" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'normal' }}>
                              <span className="w-full text-sm font-medium text-charcoal block px-2">
                                {item.parameter}
                              </span>
                              <input type="hidden" value={item.parameter} {...register(`results.${index}.parameter`)} />
                              <input type="hidden" value="parameter" {...register(`results.${index}.type`)} />
                            </td>
                            <td className="py-3 px-3 align-middle">
                              {(() => {
                                const { ref, ...rest } = register(`results.${index}.value`);
                                
                                if (item.isListParameter) {
                                  return (
                                    <select
                                      className="w-full min-w-[120px] bg-white border border-electric-cobalt focus:border-ink-navy focus:ring-1 focus:ring-ink-navy rounded-inputs px-3 py-1.5 text-sm font-medium text-charcoal transition-colors"
                                      {...rest}
                                      ref={(e) => {
                                        ref(e);
                                        inputRefs.current[index] = e;
                                      }}
                                      value={item.value || ""}
                                      onKeyDown={(e) => handleKeyDown(e, index)}
                                    >
                                      <option value="">Select...</option>
                                      {(item.allowedValues || []).map((opt, i) => (
                                        <option key={i} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  );
                                }
                                
                                return (
                                  <input
                                    type="text"
                                    placeholder="Value"
                                    className="w-full min-w-[120px] bg-white border border-electric-cobalt focus:border-ink-navy focus:ring-1 focus:ring-ink-navy rounded-inputs px-3 py-1.5 text-sm font-medium text-charcoal transition-colors"
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
                            <td className="py-3 px-3 align-middle text-center">
                              {item.unit ? (
                                <span className="text-xs text-stone px-2 py-1 bg-warm-canvas rounded border border-cream-border inline-block">
                                  {item.unit}
                                </span>
                              ) : (
                                <span className="text-xs text-stone/50 italic">None</span>
                              )}
                              <input type="hidden" {...register(`results.${index}.unit`)} />
                            </td>
                            <td className="py-3 px-3 align-middle">
                              {item.normalRange ? (
                                <span className="text-xs text-stone px-2 py-1 bg-warm-canvas rounded border border-cream-border inline-block">
                                  {item.normalRange}
                                </span>
                              ) : (
                                <span className="text-xs text-stone/50 italic">None</span>
                              )}
                              <input type="hidden" {...register(`results.${index}.normalRange`)} />
                            </td>
                          </tr>
                        );
                      })}
                      {fields.length === 0 && (
                        <tr>
                          <td colSpan="4" className="py-6 text-center text-stone text-sm">
                            No parameters defined for this test.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end pt-4 border-t border-cream-border space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={handleCancelClick}
                    disabled={saving}
                    className="text-xs font-medium text-graphite hover:text-charcoal bg-white border border-cream-border px-4 py-2 rounded transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    ref={saveButtonRef}
                    disabled={saving}
                    className="bg-electric-cobalt text-paper-white font-medium py-2 px-5 rounded hover:bg-opacity-95 transition-colors text-xs flex items-center space-x-2 disabled:opacity-70"
                  >
                    {saving ? (
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-paper-white border-t-transparent"></div>
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    <span>{saving ? "Approving..." : "Approve"}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '45%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '20%' }} />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-cream-border text-xs text-stone uppercase tracking-wider">
                      <th className="py-2 px-3 font-medium text-left">Parameter</th>
                      <th className="py-2 px-3 font-medium text-left">Result</th>
                      <th className="py-2 px-3 font-medium text-center">Unit</th>
                      <th className="py-2 px-3 font-medium text-left">Normal Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-border">
                    {displayResults.length > 0 ? (
                      displayResults.map((item, index) => {
                        if (item.type === "section") {
                          return (
                            <tr key={index} className="bg-warm-canvas/50 border-y border-cream-border">
                              <td colSpan="1" className="py-3 px-3 text-base font-bold text-black tracking-wider uppercase" style={{ whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word', maxWidth: '100%' }}>
                                {item.parameter}
                              </td>
                              <td colSpan="3"></td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={index} className="hover:bg-warm-canvas/20">
                            <td className="py-2 px-3 text-sm font-medium text-charcoal pl-6 border-l-4 border-l-transparent" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'normal' }}>{item.parameter}</td>
                            <td className="py-2 px-3 text-sm text-charcoal">
                              {item.value ? (
                                <span className="font-semibold">{item.value}</span>
                              ) : (
                                <span className="text-stone italic text-xs">Not recorded</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-xs text-stone text-center">
                              {item.unit || "-"}
                            </td>
                            <td className="py-2 px-3 text-xs text-stone">
                              {item.normalRange || "-"}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-6 text-center text-stone text-sm italic">
                          No results available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default InlineTestEditor;
