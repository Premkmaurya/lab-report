import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, Link } from "react-router-dom";
import { testService } from "../../services/testService";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export const EditTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        const data = await testService.getTestById(id);
        reset({
          name: data.test.name,
          price: data.test.price,
        });
      } catch (err) {
        setSubmitError("Failed to fetch test profile details.");
      } finally {
        setLoading(false);
      }
    };
    fetchTestDetails();
  }, [id, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        name: data.name,
        price: parseFloat(data.price),
      };
      await testService.updateTest(id, payload);
      navigate("/tests");
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Failed to update test details. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
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
          Edit Test <span className="italic font-light">Profile</span>
        </h1>
        <p className="font-inter text-stone text-sm mt-1">
          Modify the test catalog entry, parameters, or service fees.
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

          <div>
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
              Price (INR)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              className={`w-full ${errors.price ? "border-red-500" : ""}`}
              {...register("price", {
                required: "Price is required",
                min: {
                  value: 0,
                  message: "Price must be at least 0",
                },
                max: {
                  value: 1000000,
                  message: "Price cannot exceed 1,000,000",
                },
              })}
            />
            {errors.price && (
              <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-3 pt-4 border-t border-cream-border">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 disabled:opacity-50 text-sm cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
            <Link
              to="/tests"
              className="bg-paper-white border border-cream-border text-graphite font-medium py-2.5 px-6 rounded-buttons hover:bg-warm-canvas transition duration-200 text-sm"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
export default EditTest;
