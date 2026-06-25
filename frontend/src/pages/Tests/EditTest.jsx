import React, { useEffect, useState, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate, useParams, Link } from "react-router-dom";
import { testService } from "../../services/testService";
import { ArrowLeft, ShieldAlert, Trash2, Search, ChevronDown } from "lucide-react";

export const EditTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(id ? 2 : 1);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 states
  const [allTests, setAllTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTestId, setSelectedTestId] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      subTests: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subTests"
  });

  const testName = watch("name");
  const watchSubTests = watch("subTests");

  const isEmptyRow = (st) => {
    if (!st) return true;
    return !st.name && !st.unit && !st.normalRange && (st.price === "" || st.price === null || st.price === undefined);
  };

  const isRowComplete = (st) => {
    if (!st) return false;
    return !!st.name && !!st.unit && !!st.normalRange && st.price !== "" && st.price !== null && st.price !== undefined;
  };

  const watchSubTestsStr = JSON.stringify(watchSubTests);

  useEffect(() => {
    if (step === 2 && !loading) {
      const currentSubTests = watchSubTestsStr ? JSON.parse(watchSubTestsStr) : [];
      if (currentSubTests.length > 0) {
        const lastItem = currentSubTests[currentSubTests.length - 1];
        if (isRowComplete(lastItem)) {
          append({ name: "", price: "", unit: "", normalRange: "" });
        }
      } else {
        append({ name: "", price: "", unit: "", normalRange: "" });
      }
    }
  }, [watchSubTestsStr, append, step, loading]);

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

  // Fetch all tests for Step 1
  useEffect(() => {
    if (step === 1) {
      const fetchTests = async () => {
        try {
          const data = await testService.getAllTests();
          setAllTests(data.tests || []);
        } catch (err) {
          setSubmitError("Failed to fetch tests catalog.");
        } finally {
          setLoading(false);
        }
      };
      fetchTests();
    }
  }, [step]);

  // Fetch specific test details for Step 2
  useEffect(() => {
    if (step === 2) {
      const testIdToFetch = id || selectedTestId;
      if (!testIdToFetch) return;

      const fetchTestDetails = async () => {
        setLoading(true);
        try {
          const data = await testService.getTestById(testIdToFetch);
          const t = data.test;
          
          let tests = t.subTests || [];
          if (tests.length === 0 || !isEmptyRow(tests[tests.length - 1])) {
             tests = [...tests, { name: "", price: "", unit: "", normalRange: "" }];
          }

          reset({
            name: t.name,
            subTests: tests
          });
        } catch (err) {
          setSubmitError("Failed to fetch test profile details.");
        } finally {
          setLoading(false);
        }
      };
      fetchTestDetails();
    }
  }, [step, id, selectedTestId, reset]);

  const handleNextStep1 = () => {
    if (selectedTestId) {
      setSubmitError("");
      setStep(2);
    } else {
      setSubmitError("Please select a test to edit.");
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const targetId = id || selectedTestId;
      const validSubTests = data.subTests.filter(st => !isEmptyRow(st));

      if (validSubTests.length === 0) {
        setSubmitError("Please provide at least one complete parameter.");
        setIsSubmitting(false);
        return;
      }

      const rootPrice = validSubTests.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);
      
      const payload = {
        name: data.name,
        price: rootPrice,
        subTests: validSubTests.map(st => ({
          ...st,
          price: parseFloat(st.price) || 0
        })),
      };
      
      await testService.updateTest(targetId, payload);
      navigate("/tests");
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Failed to update test details. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTests = allTests.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTestName = allTests.find(t => t._id === selectedTestId)?.name || "Select a test...";

  if (loading && step === 2) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
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
          ) : (
            <>Edit <span className="italic font-light">{testName || "Test"}</span></>
          )}
        </h1>
        <p className="font-inter text-stone text-sm mt-1">
          {step === 1
            ? "Choose an existing test from the catalog to edit."
            : "Modify the test catalog entry, parameters, or service fees."}
        </p>
      </div>

      {submitError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-cards flex items-center space-x-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

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
            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                Test Name
              </label>
              <input
                type="text"
                placeholder="e.g. Complete Blood Count (CBC)"
                className={`w-full max-w-md ${errors.name ? "border-red-500" : ""}`}
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
                      <th className="px-4 py-3 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-border">
                    {fields.map((item, index) => (
                      <tr key={item.id} className="bg-paper-white">
                        <td className="px-4 py-3 align-top">
                          <input
                            type="text"
                            placeholder="e.g. Hemoglobin"
                            className={`w-full min-w-[150px] text-sm ${errors?.subTests?.[index]?.name ? "border-red-500" : ""}`}
                            {...register(`subTests.${index}.name`, { 
                              validate: (val, formValues) => isEmptyRow(formValues.subTests[index]) ? true : (!!val || "Required")
                            })}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className={`w-full min-w-[80px] text-sm ${errors?.subTests?.[index]?.price ? "border-red-500" : ""}`}
                            {...register(`subTests.${index}.price`, { 
                              validate: (val, formValues) => {
                                if (isEmptyRow(formValues.subTests[index])) return true;
                                if (val === "" || val === null || val === undefined) return "Required";
                                if (parseFloat(val) < 0) return "Invalid";
                                return true;
                              }
                            })}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <input
                            type="text"
                            placeholder="e.g. g/dL"
                            className={`w-full min-w-[80px] text-sm ${errors?.subTests?.[index]?.unit ? "border-red-500" : ""}`}
                            {...register(`subTests.${index}.unit`, { 
                              validate: (val, formValues) => isEmptyRow(formValues.subTests[index]) ? true : (!!val || "Required")
                            })}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <input
                            type="text"
                            placeholder="e.g. 13-17"
                            className={`w-full min-w-[100px] text-sm ${errors?.subTests?.[index]?.normalRange ? "border-red-500" : ""}`}
                            {...register(`subTests.${index}.normalRange`, { 
                              validate: (val, formValues) => isEmptyRow(formValues.subTests[index]) ? true : (!!val || "Required")
                            })}
                          />
                        </td>
                        <td className="px-4 py-3 align-top text-right">
                          {index !== fields.length - 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors"
                              title="Delete Parameter"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-6 border-t border-cream-border mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 disabled:opacity-50 text-sm cursor-pointer"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
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
