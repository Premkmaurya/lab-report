import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { patientService } from "../../services/patientService";
import { doctorService } from "../../services/doctorService";
import { ArrowLeft, ShieldAlert, CheckCircle2, Plus } from "lucide-react";

export const CreatePatient = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [registeredPatient, setRegisteredPatient] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      gender: "male",
      date: new Date().toISOString().substring(0, 10), // Defaults to today's date
    },
  });

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await doctorService.getAllDoctors();
        // Only show active doctors
        setDoctors((data.doctors || []).filter((d) => d.isActive !== false));
      } catch (err) {
        console.warn("Could not load doctor listings for dropdown", err);
      }
    };
    fetchDoctors();
  }, []);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      // Cast age to number
      const payload = {
        ...data,
        age: parseInt(data.age, 10),
      };
      const response = await patientService.createPatient(payload);
      if (response.success && response.patient) {
        setRegisteredPatient(response.patient);
      } else {
        navigate("/patients");
      }
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || "Failed to create patient. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredPatient) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="bg-paper-white border border-cream-border rounded-cards p-6 md:p-8 space-y-6">
          <div className="text-center space-y-3 py-4">
            <div className="inline-flex items-center justify-center h-16 w-16 bg-green-50 text-green-600 rounded-full border border-green-100">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <span className="font-abcfavoritvariable text-xs font-bold text-green-600 uppercase tracking-widest block mb-1">
                REGISTRATION COMPLETE
              </span>
              <h1 className="font-martinaplantijn text-3xl text-ink-navy">
                Patient Registered Successfully
              </h1>
            </div>
            <p className="font-inter text-stone text-sm max-w-md mx-auto">
              The patient file has been securely initialized in the database directory.
            </p>
          </div>

          <div className="bg-warm-canvas/20 border border-cream-border rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-bold text-stone uppercase tracking-wider mb-0.5">
                  Patient ID
                </p>
                <p className="font-mono font-semibold text-charcoal">
                  {registeredPatient._id}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone uppercase tracking-wider mb-0.5">
                  Name
                </p>
                <p className="font-semibold text-charcoal">
                  {registeredPatient.name}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone uppercase tracking-wider mb-0.5">
                  Age & Gender
                </p>
                <p className="font-semibold text-charcoal capitalize">
                  {registeredPatient.age} yrs • {registeredPatient.gender}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-stone uppercase tracking-wider mb-0.5">
                  Referred Doctor
                </p>
                <p className="font-semibold text-charcoal">
                  Dr. {registeredPatient.referredDoctor}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-cream-border">
            <Link
              to={`/patients/${registeredPatient._id}`}
              className="w-full sm:w-auto bg-paper-white border border-cream-border text-graphite font-medium py-2.5 px-6 rounded-buttons hover:bg-warm-canvas transition duration-200 text-sm text-center"
            >
              View Patient Profile
            </Link>
            <Link
              to={`/reports/create?patientId=${registeredPatient._id}`}
              className="w-full sm:w-auto bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm text-center inline-flex items-center justify-center space-x-2 animate-pulse"
            >
              <Plus className="h-4 w-4" />
              <span>Create Report</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back Link */}
      <div>
        <Link
          to="/patients"
          className="inline-flex items-center space-x-2 text-sm text-stone hover:text-charcoal transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Directory</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-2">
          PATIENT REGISTRATION
        </span>
        <h1 className="font-martinaplantijn text-4xl text-ink-navy">
          Add New <span className="italic font-light">Patient</span>
        </h1>
        <p className="font-inter text-stone text-sm mt-1">
          Record details, birth age, and select referring doctor.
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
                minLength: {
                  value: 1,
                  message: "Name cannot be empty",
                },
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
              {doctors.length > 0 ? (
                <select
                  className="w-full bg-paper-white border border-cream-border rounded-inputs px-4 py-3 outline-none"
                  {...register("referredDoctor", {
                    required: "Please select referred doctor",
                  })}
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d.name}>
                      Dr. {d.name} ({d.qualification})
                    </option>
                  ))}
                  <option value="Self Referral">Self Referral</option>
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Doctor's name"
                  className={`w-full ${errors.referredDoctor ? "border-red-500" : ""}`}
                  {...register("referredDoctor", {
                    required: "Referred doctor is required",
                  })}
                />
              )}
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
              className="bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 disabled:opacity-50 text-sm"
            >
              {isSubmitting ? "Registering..." : "Add Patient"}
            </button>
            <Link
              to="/patients"
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
export default CreatePatient;
