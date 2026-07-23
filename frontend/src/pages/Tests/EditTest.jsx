import React, { useEffect, useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { testService } from "../../services/testService";
import { departmentService } from "../../services/departmentService";
import { ArrowLeft, Trash2, Search, ChevronDown } from "lucide-react";
import { toast } from "../../lib/toast";
import { generateObjectId } from "../../utils/objectId";
import { useQueryClient } from "@tanstack/react-query";

const ParameterSelect = ({ index, field, watch, setValue, register, errors, disabled }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const currentId = watch(`subTests.${index}.formula.${field}`);
  
  const options = watch("subTests").filter((f, i) => i !== index && f.name && f.type !== "section");
  
  React.useEffect(() => {
    const matched = options.find(o => o._id === currentId);
    if (matched && !isOpen) {
      setSearch(matched.name);
    }
  }, [currentId, options, isOpen]);

  return (
    <div className="relative flex-1">
      <input 
        type="text" 
        value={search}
        disabled={disabled}
        onChange={(e) => {
           setSearch(e.target.value);
           setIsOpen(true);
           if (e.target.value === "") {
             setValue(`subTests.${index}.formula.${field}`, "");
           }
        }}
        onFocus={() => !disabled && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={`-- ${field === 'leftParameterId' ? 'Left' : 'Right'} Parameter --`}
        className={`w-full text-sm border border-cream-border rounded-inputs px-2 py-2 focus:outline-none focus:border-electric-cobalt ${errors?.subTests?.[index]?.formula?.[field] ? "border-red-500" : ""} ${disabled ? "bg-transparent text-stone border-transparent" : ""}`}
      />
      <input type="hidden" {...register(`subTests.${index}.formula.${field}`, { required: "Required" })} />
      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-cream-border rounded shadow-lg max-h-40 overflow-y-auto">
          {options.filter(o => o.name.toLowerCase().includes(search.toLowerCase())).map(o => (
            <div 
              key={o._id} 
              className="px-2 py-1.5 text-sm hover:bg-warm-canvas cursor-pointer"
              onClick={() => {
                setValue(`subTests.${index}.formula.${field}`, o._id, { shouldValidate: true });
                setSearch(o.name);
                setIsOpen(false);
              }}
            >
              {o.name}
            </div>
          ))}
          {options.filter(o => o.name.toLowerCase().includes(search.toLowerCase())).length === 0 && (
             <div className="px-2 py-1.5 text-sm text-stone italic">No parameters found</div>
          )}
        </div>
      )}
    </div>
  );
};

export const EditTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const isReadOnly = pathname.includes('/view');
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(id ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 states
  const [allTests, setAllTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTestId, setSelectedTestId] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const dropdownRef = useRef(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      departmentId: "",
      name: "",
      subTests: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subTests"
  });

  const testName = watch("name");
  const watchedTypes = watch(fields.map((_, i) => `subTests.${i}.type`));
  const watchedTextBlocks = watch(fields.map((_, i) => `subTests.${i}.isTextBlock`)) || [];
  const inputRefs = useRef({});

  const isEmptyRow = (st) => {
    if (!st) return true;
    if (st.type === "section" || st.type === "text_block") {
      return !st.name;
    }
    return !st.name && !st.unit && !st.normalRange && (st.price === "" || st.price === null || st.price === undefined);
  };

  const isRowComplete = (st) => {
    if (!st) return false;
    if (st.type === "section" || st.type === "text_block") {
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
    if (isReadOnly) return;
    const fieldsOrder = ["name", "price", "unit", "normalRange"];
    const fieldIndex = fieldsOrder.indexOf(fieldName);
    const currentValues = getValues("subTests");
    const isSection = currentValues[index]?.type === "section";
    
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        if (fieldIndex > 0) {
          inputRefs.current[index]?.[fieldsOrder[fieldIndex - 1]]?.focus();
        } else if (index > 0) {
          const prevIsSection = currentValues[index - 1]?.type === "section";
          inputRefs.current[index - 1]?.[prevIsSection ? "name" : fieldsOrder[fieldsOrder.length - 1]]?.focus();
        }
      } else {
        if (fieldIndex < fieldsOrder.length - 1 && !isSection) {
          inputRefs.current[index]?.[fieldsOrder[fieldIndex + 1]]?.focus();
        } else {
          if (index === fields.length - 1 && isRowComplete(currentValues[index])) {
            append({ _id: generateObjectId(), name: "", type: "parameter", price: "", unit: "", normalRange: "", isListParameter: false, allowedValues: [], isCalculated: false, isTextBlock: false, formula: { leftParameterId: "", operator: "+", rightParameterId: "" }, textBlockSettings: { defaultText: "" } });
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
      } catch {
        isAtEnd = true;
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
      } catch {
        isAtStart = true;
      }
      if (isAtStart) {
        e.preventDefault();
        if (fieldIndex > 0) {
          inputRefs.current[index]?.[fieldsOrder[fieldIndex - 1]]?.focus();
        } else if (index > 0) {
          const prevIsSection = currentValues[index - 1]?.type === "section";
          inputRefs.current[index - 1]?.[prevIsSection ? "name" : fieldsOrder[fieldsOrder.length - 1]]?.focus();
        }
      }
    }
  };

  const handleBlur = (index, fieldName) => {
    if (isReadOnly) return;
    if (index === fields.length - 1) {
      setTimeout(() => {
        const currentValues = getValues("subTests");
        const isSection = currentValues[index]?.type === "section";
        if ((fieldName === "normalRange" || (isSection && fieldName === "name")) && isRowComplete(currentValues[index])) {
          if (isRowComplete(currentValues[currentValues.length - 1])) {
            append({ _id: generateObjectId(), name: "", type: "parameter", price: "", unit: "", normalRange: "", isListParameter: false, allowedValues: [], isCalculated: false, isTextBlock: false, formula: { leftParameterId: "", operator: "+", rightParameterId: "" }, textBlockSettings: { defaultText: "" } });
          }
        }
      }, 100);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (step === 1) {
      const fetchTests = async () => {
        try {
          const data = await testService.getAllTests();
          setAllTests(data.tests || []);
        } catch {
          toast.error("Failed to fetch tests catalog.");
        } finally {
          setLoading(false);
        }
      };
      fetchTests();
    }
  }, [step]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await departmentService.getAllDepartments();
        setDepartments(res.departments || []);
      } catch {
        toast.error("Failed to load departments.");
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepts();
  }, []);

  // Fetch specific test details for Step 2
  const location = useLocation();
  const isGlobalMode = new URLSearchParams(location.search).get("global") === "true";

  useEffect(() => {
    if (step === 2) {
      const testIdToFetch = id || selectedTestId;
      if (!testIdToFetch) return;

      const fetchTestDetails = async () => {
        setLoading(true);
        try {
          const data = isGlobalMode 
            ? await testService.getGlobalTestById(testIdToFetch)
            : await testService.getTestById(testIdToFetch);
          const t = data.test;
          
           let tests = (t.subTests || []).map(st => {
            if (st.type === 'text_block') {
              return {
                ...st,
                type: 'parameter',
                isTextBlock: true
              };
            }
            return {
              ...st,
              isTextBlock: st.isTextBlock || false
            };
          });
          if (!isReadOnly && (tests.length === 0 || !isEmptyRow(tests[tests.length - 1]))) {
             tests = [...tests, { _id: generateObjectId(), name: "", type: "parameter", price: "", unit: "", normalRange: "", isListParameter: false, allowedValues: [], isCalculated: false, isTextBlock: false, formula: { leftParameterId: "", operator: "+", rightParameterId: "" }, textBlockSettings: { defaultText: "" } }];
          }

          const targetDeptId = t.departmentId?._id || t.departmentId || "";
          const targetDeptName = t.departmentId?.name;

          if (targetDeptId) {
            setDepartments((prev) => {
              const exists = prev.some((d) => d._id === targetDeptId);
              if (!exists && targetDeptName) {
                return [{ _id: targetDeptId, name: targetDeptName }, ...prev];
              }
              return prev;
            });
          }

          reset({
            departmentId: targetDeptId,
            name: t.name,
            subTests: tests
          });
        } catch {
          toast.error("Failed to fetch test profile details.");
        } finally {
          setLoading(false);
        }
      };
      fetchTestDetails();
    }
  }, [step, id, selectedTestId, reset, isGlobalMode]);

  const handleNextStep1 = () => {
    if (selectedTestId) {
      setStep(2);
    } else {
      toast.error("Please select a test to edit.");
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    const targetId = id || selectedTestId;
    const validSubTests = data.subTests.filter(st => !isEmptyRow(st));

    if (validSubTests.length === 0) {
      toast.error("Please provide at least one complete parameter.");
      setIsSubmitting(false);
      return;
    }

    const rootPrice = validSubTests.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
    
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
    
    const apiCall = isGlobalMode
      ? testService.updateGlobalTest(targetId, payload)
      : testService.updateTest(targetId, payload);
    
    toast.promise(apiCall, {
      loading: isGlobalMode ? "Updating global template..." : "Saving changes...",
      success: () => {
        try {
          if (queryClient) {
            queryClient.invalidateQueries({ queryKey: ['tests'] });
            queryClient.invalidateQueries({ queryKey: ['summary'] });
          }
        } catch {
          // Ignore secondary query invalidation errors
        }
        setTimeout(() => {
          navigate("/tests");
        }, 50);
        return isGlobalMode
          ? "Global test template updated successfully"
          : "Test updated successfully";
      },
      error: (err) => err.response?.data?.message || err.message || "Failed to update test details. Please try again.",
      finally: () => setIsSubmitting(false)
    });
  };

  const filteredTests = allTests.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTestName = allTests.find(t => t._id === selectedTestId)?.name || "Select a test...";

  if (loading && step === 2) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
      </div>
    );
  }

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
          TEST PROFILE EDIT
        </span>
        <h1 className="font-martinaplantijn text-4xl text-ink-navy">
          {step === 1 ? (
            <>Select <span className="italic font-light">Test</span></>
          ) : isReadOnly ? (
            <>View <span className="italic font-light">{testName || "Test"}</span></>
          ) : (
            <>Edit <span className="italic font-light">{testName || "Test"}</span></>
          )}
        </h1>
        <p className="font-inter text-stone text-sm mt-1">
          {step === 1
            ? "Choose an existing test from the catalog to edit."
            : isReadOnly 
              ? "Reference catalog view of test parameters."
              : "Modify the test catalog entry, parameters, or service fees."}
        </p>
      </div>


      {/* Form Card */}
      <div className="bg-paper-white border border-cream-border rounded-cards p-6 md:p-8">
        {step === 1 && (
          <div className="max-w-md space-y-5">
            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                Select Test
              </label>
              
              <div className="relative" ref={dropdownRef}>
                <div 
                  className="w-full border border-cream-border rounded-lg p-3 bg-paper-white flex justify-between items-center cursor-pointer hover:border-electric-cobalt transition-colors"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className={selectedTestId ? "text-charcoal" : "text-stone"}>
                    {selectedTestName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-stone" />
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-paper-white border border-cream-border rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-cream-border flex items-center space-x-2 bg-warm-canvas/50">
                      <Search className="h-4 w-4 text-stone" />
                      <input
                        type="text"
                        placeholder="Search tests..."
                        className="w-full bg-transparent border-none focus:ring-0 text-sm p-1"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {filteredTests.length === 0 ? (
                        <div className="p-3 text-sm text-stone text-center">No tests found.</div>
                      ) : (
                        filteredTests.map((test) => (
                          <div
                            key={test._id}
                            className={`p-3 text-sm cursor-pointer hover:bg-warm-canvas transition-colors ${selectedTestId === test._id ? 'bg-electric-cobalt/10 font-medium text-electric-cobalt' : 'text-charcoal'}`}
                            onClick={() => {
                              setSelectedTestId(test._id);
                              setIsDropdownOpen(false);
                              setSearchQuery("");
                            }}
                          >
                            {test.name}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4 border-t border-cream-border">
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                  Department
                </label>
                <select
                  className={`w-full border border-cream-border rounded-inputs px-3 py-2 text-sm focus:outline-none ${errors.departmentId ? "border-red-500" : ""}`}
                  {...register("departmentId", {
                    required: "Please select a department",
                  })}
                  disabled={loadingDepts || isReadOnly}
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
              </div>
              
              <div>
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                  Test Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete Blood Count (CBC)"
                  className={`w-full ${errors.name ? "border-red-500" : ""} ${isReadOnly ? "bg-warm-canvas text-stone" : ""}`}
                  disabled={isReadOnly}
                  {...register("name", {
                    required: "Test name is required",
                    maxLength: {
                      value: 100,
                      message: "Test name cannot exceed 100 characters",
                    },
                  })}
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>
            </div>
            
            <div className="pt-4 border-t border-cream-border">
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-4">
                Test Parameters
              </label>
              
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
                      {!isReadOnly && (
                        <th className="px-4 py-3 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider text-right">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-border">
                    {fields.map((item, index) => {
                      if (!inputRefs.current[index]) inputRefs.current[index] = {};
                      const isSection = watchedTypes[index] === "section";
                      const isTextBlock = watchedTextBlocks[index];
                      return (
                        <React.Fragment key={item.id}>
                        <tr className="bg-paper-white">
                          <td className="px-4 py-3 align-top">
                            <input
                              type="text"
                              placeholder={isSection ? "e.g. DIFFERENTIAL LEUKOCYTE COUNT" : "e.g. Hemoglobin"}
                              className={`w-full min-w-[150px] text-sm ${errors?.subTests?.[index]?.name ? "border-red-500" : ""} ${isReadOnly ? "bg-transparent text-stone border-transparent" : ""}`}
                              disabled={isReadOnly}
                              {...register(`subTests.${index}.name`, { 
                                validate: (val, formValues) => isEmptyRow(formValues.subTests[index]) ? true : (!!val || "Required")
                              })}
                              onKeyDown={(e) => handleKeyDown(e, index, "name")}
                              ref={(el) => {
                                register(`subTests.${index}.name`).ref(el);
                                inputRefs.current[index].name = el;
                              }}
                            />
                            {!isReadOnly && (
                              <div className="mt-2 flex items-center">
                                <div className="flex items-center">
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
                                        setValue(`subTests.${index}.isCalculated`, false);
                                        setValue(`subTests.${index}.isTextBlock`, false);
                                      }
                                      const currentValues = getValues("subTests");
                                      if (index === currentValues.length - 1 && isRowComplete(currentValues[index])) {
                                        append({ _id: generateObjectId(), name: "", type: "parameter", price: "", unit: "", normalRange: "", isListParameter: false, allowedValues: [], isCalculated: false, isTextBlock: false, formula: { leftParameterId: "", operator: "+", rightParameterId: "" }, textBlockSettings: { defaultText: "" } });
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
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <input
                              type="number"
                              step="0.01"
                              placeholder={isSection ? "-" : "0.00"}
                              disabled={isReadOnly || isSection}
                              className={`w-full min-w-[80px] text-sm ${errors?.subTests?.[index]?.price ? "border-red-500" : ""} ${isReadOnly ? "bg-transparent text-stone border-transparent" : (isSection ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "")}`}
                              {...register(`subTests.${index}.price`, { 
                                validate: (val, formValues) => {
                                  if (formValues.subTests[index].type === "section" || formValues.subTests[index].type === "text_block") return true;
                                  if (isEmptyRow(formValues.subTests[index])) return true;
                                  if (val === "" || val === null || val === undefined) return "Required";
                                  if (parseFloat(val) < 0) return "Invalid";
                                  return true;
                                }
                              })}
                              onKeyDown={(e) => handleKeyDown(e, index, "price")}
                              ref={(el) => {
                                register(`subTests.${index}.price`).ref(el);
                                inputRefs.current[index].price = el;
                              }}
                            />
                             {!isReadOnly && (!isSection) && (
                              <div className="mt-2 flex flex-col space-y-2">
                                <div className="flex items-center">
                                  <input 
                                    type="checkbox" 
                                    id={`isListParameter-${index}`} 
                                    className="mr-1.5 cursor-pointer"
                                    {...register(`subTests.${index}.isListParameter`)}
                                    onChange={(e) => {
                                      setValue(`subTests.${index}.isListParameter`, e.target.checked);
                                      if (e.target.checked) {
                                        setValue(`subTests.${index}.normalRange`, "");
                                        setValue(`subTests.${index}.isCalculated`, false);
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
                                <div className="flex items-center">
                                  <input 
                                    type="checkbox" 
                                    id={`isCalculated-${index}`} 
                                    className="mr-1.5 cursor-pointer"
                                    {...register(`subTests.${index}.isCalculated`)}
                                    onChange={(e) => {
                                      setValue(`subTests.${index}.isCalculated`, e.target.checked);
                                      if (e.target.checked) {
                                        setValue(`subTests.${index}.isListParameter`, false);
                                      }
                                    }}
                                  />
                                  <label htmlFor={`isCalculated-${index}`} className="text-[10px] text-stone uppercase tracking-wider font-bold cursor-pointer">
                                    Calculated
                                  </label>
                                </div>
                                <div className="flex items-center">
                                  <input 
                                    type="checkbox" 
                                    id={`isTextBlock-${index}`} 
                                    className="mr-1.5 cursor-pointer"
                                    {...register(`subTests.${index}.isTextBlock`)}
                                    onChange={(e) => {
                                      setValue(`subTests.${index}.isTextBlock`, e.target.checked);
                                    }}
                                  />
                                  <label htmlFor={`isTextBlock-${index}`} className="text-[10px] text-stone uppercase tracking-wider font-bold cursor-pointer">
                                    Text Block
                                  </label>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <input
                              type="text"
                              placeholder={isSection || watch(`subTests.${index}.isListParameter`) ? "-" : "e.g. g/dL"}
                              disabled={isReadOnly || isSection || watch(`subTests.${index}.isListParameter`)}
                              className={`w-full min-w-[80px] text-sm ${errors?.subTests?.[index]?.unit ? "border-red-500" : ""} ${isReadOnly ? "bg-transparent text-stone border-transparent" : (isSection || watch(`subTests.${index}.isListParameter`) ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "")}`}
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
                              placeholder={(isSection || isTextBlock || watch(`subTests.${index}.isListParameter`)) ? "-" : "e.g. 13-17"}
                              disabled={isReadOnly || isSection || watch(`subTests.${index}.isListParameter`)}
                              className={`w-full min-w-[100px] text-sm ${errors?.subTests?.[index]?.normalRange ? "border-red-500" : ""} ${isReadOnly ? "bg-transparent text-stone border-transparent" : (isSection || watch(`subTests.${index}.isListParameter`) ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "")}`}
                              {...register(`subTests.${index}.normalRange`)}
                              onKeyDown={(e) => handleKeyDown(e, index, "normalRange")}
                              onBlur={() => handleBlur(index, "normalRange")}
                              ref={(el) => {
                                register(`subTests.${index}.normalRange`).ref(el);
                                inputRefs.current[index].normalRange = el;
                              }}
                            />
                          </td>
                          {!isReadOnly && (
                            <td className="px-4 py-3 align-top text-right">
                              {index !== fields.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    remove(index);
                                    const currentValues = watch("subTests");
                                    if (currentValues.length <= 1 && !isReadOnly) {
                                      append({ _id: generateObjectId(), name: "", type: "parameter", price: "", unit: "", normalRange: "", isListParameter: false, allowedValues: [], isCalculated: false, isTextBlock: false, formula: { leftParameterId: "", operator: "+", rightParameterId: "" }, textBlockSettings: { defaultText: "" } });
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                                  title="Delete Parameter"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                        {watch(`subTests.${index}.isListParameter`) && (!isSection && !isTextBlock) && (
                          <tr key={`${item.id}-list`} className="bg-slate-50 border-t border-cream-border">
                            <td colSpan={isReadOnly ? "4" : "5"} className="px-4 py-4">
                              <div className="flex flex-col max-w-sm pl-4 border-l-2 border-electric-cobalt">
                                <span className="text-xs font-bold text-charcoal uppercase mb-2">Available Values</span>
                                {(watch(`subTests.${index}.allowedValues`) || []).map((val, vIndex) => (
                                  <div key={vIndex} className="flex items-center space-x-2 mb-2">
                                    <input
                                      type="text"
                                      disabled={isReadOnly}
                                      className={`flex-1 text-sm border border-cream-border rounded-inputs px-2 py-1 ${isReadOnly ? "bg-transparent text-stone border-transparent" : ""}`}
                                      placeholder="Value (e.g. Positive)"
                                      {...register(`subTests.${index}.allowedValues.${vIndex}`)}
                                    />
                                    {!isReadOnly && (
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
                                    )}
                                  </div>
                                ))}
                                {!isReadOnly && (
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
                                )}
                                {errors?.subTests?.[index]?.allowedValues && !isReadOnly && (
                                  <p className="text-xs text-red-500 mt-2">Required at least 2 distinct values</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                        {watch(`subTests.${index}.isCalculated`) && (!isSection && !isTextBlock) && (
                          <tr key={`${item.id}-calc`} className="bg-slate-50 border-t border-cream-border">
                            <td colSpan={isReadOnly ? "4" : "5"} className="px-4 py-4">
                              <div className="flex flex-col max-w-2xl pl-4 border-l-2 border-electric-cobalt">
                                <span className="text-xs font-bold text-charcoal uppercase mb-2">Formula Builder</span>
                                <div className="flex items-center space-x-4 mb-2">
                                  <ParameterSelect 
                                    index={index} 
                                    field="leftParameterId" 
                                    watch={watch} 
                                    setValue={setValue} 
                                    register={register} 
                                    errors={errors} 
                                    disabled={isReadOnly}
                                  />

                                  <select 
                                    className={`w-20 text-sm border border-cream-border rounded-inputs px-2 py-2 text-center focus:outline-none font-bold ${isReadOnly ? "bg-transparent text-stone border-transparent" : ""}`}
                                    disabled={isReadOnly}
                                    {...register(`subTests.${index}.formula.operator`, { required: "Required" })}
                                  >
                                    <option value="+">+</option>
                                    <option value="-">-</option>
                                    <option value="*">*</option>
                                    <option value="/">/</option>
                                  </select>

                                  <ParameterSelect 
                                    index={index} 
                                    field="rightParameterId" 
                                    watch={watch} 
                                    setValue={setValue} 
                                    register={register} 
                                    errors={errors} 
                                    disabled={isReadOnly}
                                  />
                                </div>
                                {!isReadOnly && (errors?.subTests?.[index]?.formula?.leftParameterId || errors?.subTests?.[index]?.formula?.rightParameterId) && (
                                  <p className="text-xs text-red-500 mt-1">Please select both parameters to calculate.</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                                                {isTextBlock && (
                          <tr key={`${item.id}-textblock`} className="bg-slate-50 border-t border-cream-border">
                            <td colSpan="5" className="px-4 py-4">
                              <div className="flex flex-col max-w-2xl pl-4 border-l-2 border-electric-cobalt">
                                <span className="text-xs font-bold text-charcoal uppercase mb-2">Default Text</span>
                                <textarea
                                  className="w-full text-sm border border-cream-border rounded-inputs px-3 py-2 focus:outline-none focus:border-electric-cobalt"
                                  placeholder="Optional pre-filled text for this text block..."
                                  rows="3"
                                  disabled={isReadOnly}
                                  {...register(`subTests.${index}.textBlockSettings.defaultText`)}
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-6 border-t border-cream-border mt-8">
              {!isReadOnly && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 disabled:opacity-50 text-sm cursor-pointer"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (id) {
                    navigate("/tests");
                  } else {
                    setStep(1);
                  }
                }}
                className="bg-paper-white border border-cream-border text-graphite font-medium py-2.5 px-6 rounded-buttons hover:bg-warm-canvas transition duration-200 text-sm"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditTest;
