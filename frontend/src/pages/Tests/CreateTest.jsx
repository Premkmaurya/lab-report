import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { testService } from "../../services/testService";
import { ArrowLeft, ShieldAlert, Trash2 } from "lucide-react";

export const CreateTest = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      subTests: [
        { name: "", price: "", unit: "", normalRange: "" }
      ]
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
    const currentSubTests = watchSubTestsStr ? JSON.parse(watchSubTestsStr) : [];
    if (currentSubTests.length > 0) {
      const lastItem = currentSubTests[currentSubTests.length - 1];
      if (isRowComplete(lastItem)) {
        append({ name: "", price: "", unit: "", normalRange: "" });
      }
    } else {
      append({ name: "", price: "", unit: "", normalRange: "" });
    }
  }, [watchSubTestsStr, append]);

  const handleNext = async () => {
    const isStep1Valid = await trigger("name");
    if (isStep1Valid) {
      setStep(2);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
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
      await testService.createTest(payload);
      navigate("/tests");
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Failed to create test profile. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
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
            <>Create <span className="italic font-light">Laboratory Test</span></>
          ) : (
            <>Configure <span className="italic font-light">{testName}</span></>
          )}
        </h1>
        <p className="font-inter text-stone text-sm mt-1">
          {step === 1 
            ? "Add a test name to begin." 
            : "Add test parameters, pricing, and configure reporting ranges."}
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <div className="max-w-md space-y-5">
              <div>
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                  Test Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete Blood Count (CBC)"
                  className={`w-full ${errors.name ? "border-red-500" : ""}`}
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

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleNext}
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
                  onClick={() => setStep(1)}
                  className="bg-paper-white border border-cream-border text-graphite font-medium py-2.5 px-6 rounded-buttons hover:bg-warm-canvas transition duration-200 text-sm"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateTest;
