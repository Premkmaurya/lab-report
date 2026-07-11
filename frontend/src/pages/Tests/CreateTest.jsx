import React, { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { testService } from "../../services/testService";
import { departmentService } from "../../services/departmentService";
import { ArrowLeft, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "../../lib/toast";

export const CreateTest = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [isCreatingDept, setIsCreatingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [isSavingDept, setIsSavingDept] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      departmentId: "",
      name: "",
      subTests: [{ name: "", type: "parameter", price: "", unit: "", normalRange: "", isListParameter: false, allowedValues: [] }],
    },
  });

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await departmentService.getAllDepartments();
        setDepartments(res.departments || []);
      } catch (err) {
        toast.error("Failed to load departments.");
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepts();
  }, []);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subTests",
  });

  const testName = watch("name");
  const watchedTypes = watch(fields.map((_, i) => `subTests.${i}.type`));
  const inputRefs = useRef({});

  const isEmptyRow = (st) => {
    if (!st) return true;
    if (st.type === "section") {
      return !st.name;
    }
    return (
      !st.name &&
      !st.unit &&
      !st.normalRange &&
      (st.price === "" || st.price === null || st.price === undefined)
    );
  };

  const isRowComplete = (st) => {
    if (!st) return false;
    if (st.type === "section") {
      return !!st.name;
    }
    return (
      !!st.name &&
      st.price !== "" &&
      st.price !== null &&
      st.price !== undefined
    );
  };

  const handleKeyDown = (e, index, fieldName) => {
    const fieldsOrder = ["name", "price", "unit", "normalRange"];
    const fieldIndex = fieldsOrder.indexOf(fieldName);
    const currentValues = getValues("subTests");
    const isSection = currentValues[index]?.type === "section";

    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        // Move to previous field
        if (fieldIndex > 0) {
          inputRefs.current[index]?.[fieldsOrder[fieldIndex - 1]]?.focus();
        } else if (index > 0) {
          const prevIsSection = currentValues[index - 1]?.type === "section";
          inputRefs.current[index - 1]?.[
            prevIsSection ? "name" : fieldsOrder[fieldsOrder.length - 1]
          ]?.focus();
        }
      } else {
        // Move to next field
        if (fieldIndex < fieldsOrder.length - 1 && !isSection) {
          inputRefs.current[index]?.[fieldsOrder[fieldIndex + 1]]?.focus();
        } else {
          // On last field, check completion
          if (
            index === fields.length - 1 &&
            isRowComplete(currentValues[index])
          ) {
            append({ name: "", type: "parameter", price: "", unit: "", normalRange: "", isListParameter: false, allowedValues: [] });
            setTimeout(() => {
              inputRefs.current[index + 1]?.name?.focus();
            }, 0);
          } else if (index < fields.length - 1) {
            inputRefs.current[index + 1]?.name?.focus();
          }
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (index < fields.length - 1) {
        const nextIsSection = currentValues[index + 1]?.type === "section";
        inputRefs.current[index + 1]?.[nextIsSection ? "name" : fieldName]?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (index > 0) {
        const prevIsSection = currentValues[index - 1]?.type === "section";
        inputRefs.current[index - 1]?.[prevIsSection ? "name" : fieldName]?.focus();
      }
    } else if (e.key === "ArrowRight") {
      let isAtEnd = false;
      try {
        if (typeof e.target.selectionStart === "number") {
          isAtEnd = e.target.selectionStart === e.target.value.length;
        }
      } catch (err) {
        isAtEnd = true; // Fallback for type="number"
      }
      if (isAtEnd) {
        e.preventDefault();
        if (fieldIndex < fieldsOrder.length - 1 && !isSection) {
          inputRefs.current[index]?.[fieldsOrder[fieldIndex + 1]]?.focus();
        } else if (index < fields.length - 1) {
          inputRefs.current[index + 1]?.[fieldsOrder[0]]?.focus();
        }
      }
    } else if (e.key === "ArrowLeft") {
      let isAtStart = false;
      try {
        if (typeof e.target.selectionStart === "number") {
          isAtStart = e.target.selectionStart === 0;
        }
      } catch (err) {
        isAtStart = true; // Fallback for type="number"
      }
      if (isAtStart) {
        e.preventDefault();
        if (fieldIndex > 0) {
          inputRefs.current[index]?.[fieldsOrder[fieldIndex - 1]]?.focus();
        } else if (index > 0) {
          const prevIsSection = currentValues[index - 1]?.type === "section";
          inputRefs.current[index - 1]?.[
            prevIsSection ? "name" : fieldsOrder[fieldsOrder.length - 1]
          ]?.focus();
        }
      }
    }
  };

  const handleBlur = (index, fieldName) => {
    if (index === fields.length - 1) {
      setTimeout(() => {
        const currentValues = getValues("subTests");
        const isSection = currentValues[index]?.type === "section";
        if ((fieldName === "normalRange" || (isSection && fieldName === "name")) && isRowComplete(currentValues[index])) {
          // Do not append on blur to avoid duplicate rows since Enter might have already appended
          // Actually the user requirement states: "When the final required field of a completed row is confirmed, create the next row."
          // But appending on blur might cause issues if they click elsewhere. Let's keep it but check if the last row is actually complete and no blank row exists.
          if (isRowComplete(currentValues[currentValues.length - 1])) {
            append({ name: "", type: "parameter", price: "", unit: "", normalRange: "", isListParameter: false, allowedValues: [] });
          }
        }
      }, 100);
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDeptName.trim()) return;
    setIsSavingDept(true);
    
    toast.promise(departmentService.createDepartment({ name: newDeptName }), {
      loading: "Creating department...",
      success: (res) => {
        const newDept = res.department;
        setDepartments(prev => [...prev, newDept].sort((a,b) => a.name.localeCompare(b.name)));
        setValue("departmentId", newDept._id, { shouldValidate: true });
        setIsCreatingDept(false);
        setNewDeptName("");
        return "Department created successfully";
      },
      error: (err) => err.response?.data?.message || "Failed to create department",
      finally: () => setIsSavingDept(false)
    });
  };

  const handleNextStep1 = async () => {
    const isValid = await trigger("departmentId");
    if (isValid) setStep(2);
  };

  const handleNextStep2 = async () => {
    const isValid = await trigger("name");
    if (isValid) setStep(3);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    const validSubTests = data.subTests.filter((st) => !isEmptyRow(st));

    if (validSubTests.length === 0) {
      toast.error("Please provide at least one complete parameter.");
      setIsSubmitting(false);
      return;
    }

    const rootPrice = validSubTests.reduce(
      (acc, curr) => acc + (parseFloat(curr.price) || 0),
      0,
    );

    const payload = {
      departmentId: data.departmentId,
      name: data.name,
      price: rootPrice,
      subTests: validSubTests.map((st) => {
        return {
          ...st,
          price: st.type === "section" ? 0 : (parseFloat(st.price) || 0),
          isListParameter: !!st.isListParameter,
          allowedValues: st.allowedValues || [],
        };
      }),
    };

    toast.promise(testService.createTest(payload), {
      loading: "Saving test...",
      success: () => {
        navigate("/tests");
        return "Test created successfully";
      },
      error: (err) => err.response?.data?.message || "Failed to create test profile. Please try again.",
      finally: () => setIsSubmitting(false)
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Link */}
      <div>
        <Link
          to="/tests"
          className="inline-flex items-center space-x-2 text-sm text-stone hover:text-charcoal transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-2">
          CREATION
        </span>
        <h1 className="font-martinaplantijn text-4xl text-ink-navy">
          {step === 1 ? (
            <>
              Select <span className="italic font-light">Department</span>
            </>
          ) : step === 2 ? (
            <>
              Create <span className="italic font-light">Laboratory Test</span>
            </>
          ) : (
            <>
              Configure <span className="italic font-light">{testName}</span>
            </>
          )}
        </h1>
        <p className="font-inter text-stone text-sm mt-1">
          {step === 1
            ? "Choose a department to group this test under."
            : step === 2
            ? "Add a test name to begin."
            : "Add test parameters, pricing, and configure reporting ranges."}
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-paper-white border border-cream-border rounded-cards p-6 md:p-8">
        <form onSubmit={e => e.preventDefault()} className="space-y-6">
          {step === 1 && (
            <div className="max-w-md space-y-5">
              <div>
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2 flex justify-between items-center">
                  <span>Department</span>
                  {!isCreatingDept && (
                    <button 
                      type="button" 
                      onClick={() => setIsCreatingDept(true)}
                      className="text-electric-cobalt text-xs font-semibold hover:underline"
                    >
                      + Create New
                    </button>
                  )}
                </label>
                
                {isCreatingDept ? (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="New department name..."
                      className="w-full border border-cream-border rounded-inputs px-3 py-2 text-sm focus:outline-none focus:border-electric-cobalt"
                      value={newDeptName}
                      onChange={e => setNewDeptName(e.target.value)}
                      disabled={isSavingDept}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleCreateDepartment}
                      disabled={isSavingDept || !newDeptName.trim()}
                      className="bg-electric-cobalt text-paper-white px-4 py-2 rounded-buttons text-sm font-medium disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsCreatingDept(false); setNewDeptName(""); }}
                      disabled={isSavingDept}
                      className="bg-warm-canvas border border-cream-border text-charcoal px-4 py-2 rounded-buttons text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      className={`w-full border border-cream-border rounded-inputs px-3 py-2 text-sm focus:outline-none ${errors.departmentId ? "border-red-500" : ""}`}
                      {...register("departmentId", {
                        required: "Please select a department",
                      })}
                      disabled={loadingDepts}
                    >
                      <option value="">-- Select a Department --</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    {errors.departmentId && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.departmentId.message}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleNextStep1}
                  className="bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm cursor-pointer"
                >
                  Next
                </button>
                <Link
                  to="/tests"
                  className="bg-paper-white border border-cream-border text-graphite font-medium py-2.5 px-6 rounded-buttons hover:bg-warm-canvas transition duration-200 text-sm"
                >
                  Cancel
                </Link>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="max-w-md space-y-5">
              <div>
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                  Test Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete Blood Count (CBC)"
                  className={`w-full border border-cream-border rounded-inputs px-3 py-2 text-sm focus:outline-none ${errors.name ? "border-red-500" : ""}`}
                  {...register("name", {
                    required: "Test name is required",
                    maxLength: {
                      value: 100,
                      message: "Test name cannot exceed 100 characters",
                    },
                  })}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleNextStep2}
                  className="bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm cursor-pointer"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-paper-white border border-cream-border text-graphite font-medium py-2.5 px-6 rounded-buttons hover:bg-warm-canvas transition duration-200 text-sm cursor-pointer"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </form>
        {step === 3 && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <div className="overflow-x-auto border border-cream-border rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-warm-canvas border-b border-cream-border">
                      <th className="px-4 py-3 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                        Parameter Name
                      </th>
                      <th className="px-4 py-3 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                        Price (INR)
                      </th>
                      <th className="px-4 py-3 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-4 py-3 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                        Normal Range
                      </th>
                      <th className="px-4 py-3 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-border">
                    {fields.map((item, index) => {
                      if (!inputRefs.current[index])
                        inputRefs.current[index] = {};
                      const isSection = watchedTypes[index] === "section";
                      return (
                        <React.Fragment key={item.id}>
                        <tr className="bg-paper-white">
                          <td className="px-4 py-3 align-top">
                            <input
                              type="text"
                              placeholder={isSection ? "e.g. DIFFERENTIAL LEUKOCYTE COUNT" : "e.g. Hemoglobin"}
                              className={`w-full min-w-[150px] text-sm ${errors?.subTests?.[index]?.name ? "border-red-500" : ""}`}
                              {...register(`subTests.${index}.name`, {
                                validate: (val, formValues) =>
                                  isEmptyRow(formValues.subTests[index])
                                    ? true
                                    : !!val || "Required",
                              })}
                              onKeyDown={(e) => handleKeyDown(e, index, "name")}
                              ref={(el) => {
                                register(`subTests.${index}.name`).ref(el);
                                inputRefs.current[index].name = el;
                              }}
                            />
                            <div className="mt-2 flex items-center">
                              <input type="hidden" {...register(`subTests.${index}.type`)} />
                              <input 
                                type="checkbox" 
                                id={`isSection-${index}`} 
                                className="mr-1.5 cursor-pointer"
                                checked={isSection}
                                onChange={(e) => {
                                  setValue(`subTests.${index}.type`, e.target.checked ? 'section' : 'parameter');
                                  if (e.target.checked) {
                                    setValue(`subTests.${index}.price`, "");
                                    setValue(`subTests.${index}.unit`, "");
                                    setValue(`subTests.${index}.normalRange`, "");
                                    setValue(`subTests.${index}.isListParameter`, false);
                                  }
                                  const currentValues = getValues("subTests");
                                  if (index === currentValues.length - 1 && isRowComplete(currentValues[index])) {
                                    append({ name: "", type: "parameter", price: "", unit: "", normalRange: "", isListParameter: false, allowedValues: [] });
                                    setTimeout(() => {
                                      inputRefs.current[index + 1]?.name?.focus();
                                    }, 0);
                                  }
                                }}
                              />
                              <label htmlFor={`isSection-${index}`} className="text-[10px] text-stone uppercase tracking-wider font-bold cursor-pointer">
                                Section Header
                              </label>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <input
                              type="number"
                              step="0.01"
                              placeholder={isSection ? "-" : "0.00"}
                              disabled={isSection}
                              className={`w-full min-w-[80px] text-sm ${isSection ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""} ${errors?.subTests?.[index]?.price ? "border-red-500" : ""}`}
                              {...register(`subTests.${index}.price`, {
                                validate: (val, formValues) => {
                                  if (formValues.subTests[index].type === "section") return true;
                                  if (isEmptyRow(formValues.subTests[index]))
                                    return true;
                                  if (
                                    val === "" ||
                                    val === null ||
                                    val === undefined
                                  )
                                    return "Required";
                                  if (parseFloat(val) < 0) return "Invalid";
                                  return true;
                                },
                              })}
                              onKeyDown={(e) =>
                                handleKeyDown(e, index, "price")
                              }
                              ref={(el) => {
                                register(`subTests.${index}.price`).ref(el);
                                inputRefs.current[index].price = el;
                              }}
                            />
                            {!isSection && (
                              <div className="mt-2 flex items-center">
                                <input 
                                  type="checkbox" 
                                  id={`isListParameter-${index}`} 
                                  className="mr-1.5 cursor-pointer"
                                  {...register(`subTests.${index}.isListParameter`)}
                                  onChange={(e) => {
                                    setValue(`subTests.${index}.isListParameter`, e.target.checked);
                                    if (e.target.checked) {
                                      setValue(`subTests.${index}.normalRange`, "");
                                      // initialize allowed values with empty if empty
                                      const currentAllowed = getValues(`subTests.${index}.allowedValues`);
                                      if (!currentAllowed || currentAllowed.length === 0) {
                                        setValue(`subTests.${index}.allowedValues`, [""]);
                                      }
                                    }
                                  }}
                                />
                                <label htmlFor={`isListParameter-${index}`} className="text-[10px] text-stone uppercase tracking-wider font-bold cursor-pointer">
                                  Convert to List
                                </label>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <input
                              type="text"
                              placeholder={isSection ? "-" : "e.g. g/dL"}
                              disabled={isSection}
                              className={`w-full min-w-[80px] text-sm ${(isSection || watch(`subTests.${index}.isListParameter`)) ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""} ${errors?.subTests?.[index]?.unit ? "border-red-500" : ""}`}
                              {...register(`subTests.${index}.unit`)}
                              onKeyDown={(e) => handleKeyDown(e, index, "unit")}
                              ref={(el) => {
                                register(`subTests.${index}.unit`).ref(el);
                                inputRefs.current[index].unit = el;
                              }}
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <input
                              type="text"
                              placeholder={isSection || watch(`subTests.${index}.isListParameter`) ? "-" : "e.g. 13-17"}
                              disabled={isSection || watch(`subTests.${index}.isListParameter`)}
                              className={`w-full min-w-[100px] text-sm ${(isSection || watch(`subTests.${index}.isListParameter`)) ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""} ${errors?.subTests?.[index]?.normalRange ? "border-red-500" : ""}`}
                              {...register(`subTests.${index}.normalRange`)}
                              onKeyDown={(e) =>
                                handleKeyDown(e, index, "normalRange")
                              }
                              onBlur={() => handleBlur(index, "normalRange")}
                              ref={(el) => {
                                register(`subTests.${index}.normalRange`).ref(
                                  el,
                                );
                                inputRefs.current[index].normalRange = el;
                              }}
                            />
                          </td>
                          <td className="px-4 py-3 align-top text-right">
                            {index !== fields.length - 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  remove(index);
                                  // Ensure one blank row remains if all are deleted
                                  const currentValues = watch("subTests");
                                  if (currentValues.length <= 1) {
                                    append({
                                      name: "",
                                      type: "parameter",
                                      price: "",
                                      unit: "",
                                      normalRange: "",
                                      isListParameter: false,
                                      allowedValues: []
                                    });
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete Parameter"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                        {watch(`subTests.${index}.isListParameter`) && !isSection && (
                          <tr key={`${item.id}-list`} className="bg-slate-50 border-t border-cream-border">
                            <td colSpan="5" className="px-4 py-4">
                              <div className="flex flex-col max-w-sm pl-4 border-l-2 border-electric-cobalt">
                                <span className="text-xs font-bold text-charcoal uppercase mb-2">Available Values</span>
                                {(watch(`subTests.${index}.allowedValues`) || []).map((val, vIndex) => (
                                  <div key={vIndex} className="flex items-center space-x-2 mb-2">
                                    <input
                                      type="text"
                                      className="flex-1 text-sm border border-cream-border rounded-inputs px-2 py-1"
                                      placeholder="Value (e.g. Positive)"
                                      {...register(`subTests.${index}.allowedValues.${vIndex}`)}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const vals = [...getValues(`subTests.${index}.allowedValues`)];
                                        vals.splice(vIndex, 1);
                                        setValue(`subTests.${index}.allowedValues`, vals);
                                      }}
                                      className="text-stone hover:text-red-600 p-1 rounded-full transition-colors"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const vals = getValues(`subTests.${index}.allowedValues`) || [];
                                    setValue(`subTests.${index}.allowedValues`, [...vals, ""]);
                                  }}
                                  className="text-electric-cobalt text-xs font-bold self-start mt-1 hover:underline"
                                >
                                  + Add Value
                                </button>
                                {errors?.subTests?.[index]?.allowedValues && (
                                  <p className="text-xs text-red-500 mt-2">Required at least 2 distinct values</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center space-x-3 pt-6 border-t border-cream-border mt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 disabled:opacity-50 text-sm cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Test"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-paper-white border border-cream-border text-graphite font-medium py-2.5 px-6 rounded-buttons hover:bg-warm-canvas transition duration-200 text-sm"
                >
                  Back
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateTest;
