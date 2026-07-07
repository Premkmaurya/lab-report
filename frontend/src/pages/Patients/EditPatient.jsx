import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, Link } from "react-router-dom";
import { patientService } from "../../services/patientService";
import { doctorService } from "../../services/doctorService";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import DoctorAutocomplete from "../../components/DoctorAutocomplete";

export const EditPatient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [doctors, setDoctors] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const watchedDoctor = watch('referredDoctor', '');

  useEffect(() => {
    const loadData = async () => {
      try {
        const patientData = await patientService.getPatientById(id);
        const patient = patientData.patient;

        // Prefill Form
        reset({
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          referredDoctor: patient.referredDoctor,
          date: patient.date ? new Date(patient.date).toISOString().substring(0, 10) : "",
        });

        // Prefill Doctors list
        try {
          const doctorData = await doctorService.getAllDoctors();
          setDoctors((doctorData.doctors || []).filter((d) => d.isActive !== false));
        } catch (e) {
          console.warn("Could not load doctor listings", e);
        }
      } catch (err) {
        setSubmitError(
          err.response?.data?.message || "Failed to load patient records."
        );
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        ...data,
        age: parseInt(data.age, 10),
      };
      await patientService.updatePatient(id, payload);
      navigate(`/patients/${id}`);
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Failed to update patient details."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back Link */}
      <div>
        <Link
          to={`/patients/${id}`}
          className="inline-flex items-center space-x-2 text-sm text-stone hover:text-charcoal transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Profile</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-2">
          PATIENT DETAILS EDIT
        </span>
        <h1 className="font-martinaplantijn text-4xl text-ink-navy">
          Edit Patient <span className="italic font-light">Profile</span>
        </h1>
        <p className="font-inter text-stone text-sm mt-1">
          Update patient demographics, registration date, or referred doctor.
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
              Patient Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Eleanor Vance"
              className={`w-full ${errors.name ? "border-red-500" : ""}`}
              {...register("name", {
                required: "Patient name is required",
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                Age
              </label>
              <input
                type="number"
                placeholder="Years"
                className={`w-full ${errors.age ? "border-red-500" : ""}`}
                {...register("age", {
                  required: "Age is required",
                  min: {
                    value: 1,
                    message: "Age must be at least 1",
                  },
                  max: {
                    value: 150,
                    message: "Age must be less than 150",
                  },
                })}
              />
              {errors.age && (
                <p className="text-xs text-red-500 mt-1">{errors.age.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                Gender
              </label>
              <select
                className="w-full bg-paper-white border border-cream-border rounded-inputs px-4 py-3 outline-none"
                {...register("gender", { required: "Gender is required" })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.gender.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                Referred Doctor
              </label>
              <DoctorAutocomplete
                value={watchedDoctor}
                onChange={(val) => setValue('referredDoctor', val, { shouldValidate: true })}
                doctors={doctors}
                error={!!errors.referredDoctor}
              />
              <input type="hidden" {...register('referredDoctor', { required: 'Please select referred doctor' })} />
              {errors.referredDoctor && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.referredDoctor.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                Registration Date (Optional)
              </label>
              <input
                type="date"
                className={`w-full ${errors.date ? "border-red-500" : ""}`}
                {...register("date")}
              />
              {errors.date && (
                <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>
              )}
            </div>
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
              to={`/patients/${id}`}
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
export default EditPatient;
