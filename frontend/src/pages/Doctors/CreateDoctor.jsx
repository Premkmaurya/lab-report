import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShieldAlert, Upload } from "lucide-react";
import LaboratorySelect from "../../components/LaboratorySelect";
import { useAuth } from "../../hooks/useAuth";
import { useLaboratory } from "../../context/LaboratoryContext";
import { toast } from "../../lib/toast";
import { useCreateDoctorMutation } from "../../services/doctorApi";

export const CreateDoctor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { laboratories, selectedLabId } = useLaboratory();
  const isSystemAdmin = user?.role === "system_admin";

  const [createDoctor] = useCreateDoctorMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      laboratoryId: selectedLabId || "",
    },
  });

  const watchedLabId = watch("laboratoryId", selectedLabId || "");

  React.useEffect(() => {
    if (isSystemAdmin && selectedLabId && !watchedLabId) {
      setValue("laboratoryId", selectedLabId);
    }
  }, [selectedLabId, isSystemAdmin]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("qualification", data.qualification);

    if (isSystemAdmin) {
      if (!data.laboratoryId) {
        toast.error("Please select a laboratory.");
        setIsSubmitting(false);
        return;
      }
      formData.append("laboratoryId", data.laboratoryId);
    }

    if (data.signature && data.signature[0]) {
      formData.append("signature", data.signature[0]);
    } else {
      toast.error("Please upload a doctor's signature file.");
      setIsSubmitting(false);
      return;
    }

    toast.promise(createDoctor(formData).unwrap(), {
      loading: "Saving doctor profile...",
      success: () => {
        navigate("/doctors");
        return "Doctor added successfully";
      },
      error: (err) => err.data?.message || "Failed to add doctor. Please try again.",
      finally: () => setIsSubmitting(false)
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back Link */}
      <div>
        <Link
          to="/doctors"
          className="inline-flex items-center space-x-2 text-sm text-stone hover:text-charcoal transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Specialists</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-2">
          CREATION
        </span>
        <h1 className="font-martinaplantijn text-4xl text-ink-navy">
          Add New <span className="italic font-light">Doctor</span>
        </h1>
        <p className="font-inter text-stone text-sm mt-1">
          Add doctor profile and upload their signature image.
        </p>
      </div>


      {/* Form Card */}
      <div className="bg-paper-white border border-cream-border rounded-cards p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Laboratory Selection for System Admin Only */}
          {isSystemAdmin && (
            <div>
              <LaboratorySelect
                value={watch("laboratoryId")}
                onChange={(val) => setValue("laboratoryId", val, { shouldValidate: true })}
                laboratories={laboratories}
                error={!!errors.laboratoryId}
                required={true}
              />
              <input
                type="hidden"
                {...register("laboratoryId", { required: "Laboratory selection is required for System Admin" })}
              />
              {errors.laboratoryId && (
                <p className="text-xs text-red-500 mt-1">{errors.laboratoryId.message}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                Doctor Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Stephen Strange"
                className={`w-full ${errors.name ? "border-red-500" : ""}`}
                {...register("name", {
                  required: "Doctor name is required",
                  maxLength: {
                    value: 100,
                    message: "Name cannot exceed 100 characters",
                  },
                })}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                Qualification
              </label>
              <input
                type="text"
                placeholder="e.g. MBBS, MD"
                className={`w-full ${errors.qualification ? "border-red-500" : ""}`}
                {...register("qualification", {
                  required: "Qualification is required",
                  maxLength: {
                    value: 100,
                    message: "Qualification cannot exceed 100 characters",
                  },
                })}
              />
              {errors.qualification && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.qualification.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
              Signature Upload (Image file)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-cream-border border-dashed rounded-cards bg-warm-canvas/20 hover:bg-warm-canvas/40 transition-colors duration-200">
              <div className="space-y-2 text-center">
                <Upload className="mx-auto h-8 w-8 text-stone" />
                <div className="flex text-sm text-stone">
                  <label className="relative cursor-pointer bg-transparent rounded-md font-semibold text-electric-cobalt hover:underline focus-within:outline-none">
                    <span>Upload a signature image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      {...register("signature", {
                        required: "Signature image is required",
                        onChange: handleFileChange,
                      })}
                    />
                  </label>
                </div>
                <p className="text-xs text-stone">PNG, JPG, JPEG up to 5MB</p>
                {fileName && (
                  <p className="text-xs font-semibold text-electric-cobalt mt-2 font-mono">
                    Selected: {fileName}
                  </p>
                )}
              </div>
            </div>
            {errors.signature && (
              <p className="text-xs text-red-500 mt-1">
                {errors.signature.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3 pt-4 border-t border-cream-border">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 disabled:opacity-50 text-sm cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Add Doctor"}
            </button>
            <Link
              to="/doctors"
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
export default CreateDoctor;
