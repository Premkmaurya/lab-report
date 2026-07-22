import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, Link } from "react-router-dom";
import { patientService } from "../../services/patientService";
import { doctorService } from "../../services/doctorService";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import DoctorAutocomplete from "../../components/DoctorAutocomplete";
import LaboratorySelect from "../../components/LaboratorySelect";
import { useAuth } from "../../hooks/useAuth";
import { useLaboratory } from "../../context/LaboratoryContext";
import { toast } from "../../lib/toast";

export const EditPatient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { laboratories } = useLaboratory();
  const isSystemAdmin = user?.role === "system_admin";

  const [loading, setLoading] = useState(true);
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

        const currentLabId = typeof patient.laboratoryId === 'object'
          ? patient.laboratoryId?._id
          : patient.laboratoryId;

        // Prefill Form
        reset({
          title: patient.title || "Mr.",
          firstName: patient.firstName || patient.name || "",
          lastName: patient.lastName || "",
          age: patient.age,
          gender: patient.gender,
          referredDoctor: patient.referredDoctor,
          date: patient.date ? new Date(patient.date).toISOString().substring(0, 10) : "",
          laboratoryId: currentLabId || "",
        });

        // Prefill Doctors list
        try {
          const doctorData = await doctorService.getAllDoctors();
          setDoctors((doctorData.doctors || []).filter((d) => d.isActive !== false));
        } catch (e) {
          console.warn("Could not load doctor listings", e);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load patient records.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const payload = {
      ...data,
      age: parseInt(data.age, 10),
    };
    
    if (isSystemAdmin) {
      payload.laboratoryId = data.laboratoryId;
    }

    toast.promise(patientService.updatePatient(id, payload), {
      loading: "Saving changes...",
      success: () => {
        navigate(`/patients/${id}`);
        return "Patient updated successfully";
      },
      error: (err) => err.response?.data?.message || "Failed to update patient details.",
      finally: () => setIsSubmitting(false)
    });
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

          <div className="grid grid-cols-[100px_auto] gap-4">
            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                Title
              </label>
              <select
                className="w-full bg-paper-white border border-cream-border rounded-inputs px-3 py-3 outline-none text-sm"
                {...register("title")}
              >
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Miss">Miss</option>
                <option value="Master">Master</option>
                <option value="Baby of">Baby of</option>
                <option value="Dr.">Dr.</option>
                <option value="">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prem"
                  className={`w-full bg-paper-white border border-cream-border rounded-inputs px-4 py-3 outline-none ${
                    errors.firstName ? "border-red-500" : ""
                  }`}
                  {...register("firstName", {
                    required: "First name is required",
                  })}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maurya"
                  className="w-full bg-paper-white border border-cream-border rounded-inputs px-4 py-3 outline-none"
                  {...register("lastName")}
                />
              </div>
            </div>
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
