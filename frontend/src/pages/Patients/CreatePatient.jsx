import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { patientService } from "../../services/patientService";
import { doctorService } from "../../services/doctorService";
import { useQueryClient } from "@tanstack/react-query";
import { testService } from "../../services/testService";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import DoctorAutocomplete from "../../components/DoctorAutocomplete";
import SearchableTestSelector from "../../components/SearchableTestSelector";
import LaboratorySelect from "../../components/LaboratorySelect";
import { useAuth } from "../../hooks/useAuth";
import { useLaboratory } from "../../context/LaboratoryContext";
import { toast } from "../../lib/toast";

export const CreatePatient = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { laboratories, selectedLabId } = useLaboratory();
  const isSystemAdmin = user?.role === "system_admin";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctors, setDoctors] = useState([]);

  const [step, setStep] = useState(1);
  const [tests, setTests] = useState([]);
  const [selectedTestIds, setSelectedTestIds] = useState([]);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "Mr.",
      firstName: "",
      lastName: "",
      gender: "male",
      date: new Date().toISOString().substring(0, 10), // Defaults to today's date
      laboratoryId: selectedLabId || "",
    },
  });

  const watchedDoctor = watch('referredDoctor', '');
  const watchedLabId = watch('laboratoryId', selectedLabId || '');

  useEffect(() => {
    if (isSystemAdmin && selectedLabId && !watchedLabId) {
      setValue("laboratoryId", selectedLabId);
    }
  }, [selectedLabId, isSystemAdmin]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const docData = await doctorService.getAllDoctors();
        // Only show active doctors
        setDoctors((docData.doctors || []).filter((d) => d.isActive !== false));
      } catch (err) {
        console.warn("Could not load doctor listings for dropdown", err);
      }

      try {
        const testData = await testService.getAllTests();
        setTests(testData.tests || []);
      } catch (err) {
        console.warn("Could not load test listings", err);
      }
    };
    fetchInitialData();
  }, []);

  const handleNext = async () => {
    const isValid = await trigger();
    if (isValid) {
      setStep(2);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    const payload = {
      ...data,
      age: parseInt(data.age, 10),
      name: [data.title, data.firstName, data.lastName].filter(Boolean).join(" ").trim(),
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    };

    toast.promise(patientService.createPatient(payload), {
      loading: "Saving Patient...",
      success: (response) => {
        if (response.success && response.patient) {
          if (selectedTestIds.length > 0) {
            const tests = selectedTestIds.map((t) => ({
              testId: t.testId,
              testName: t.testName,
            }));
            patientService.createPatientTests(response.patient._id, tests)
              .catch((testErr) => {
                console.warn("Failed to assign tests to patient", testErr);
                toast.warning("Patient created, but failed to assign some tests.");
              });
          }
          queryClient.invalidateQueries({ queryKey: ['patients'] });
          queryClient.invalidateQueries({ queryKey: ['reports'] });
          queryClient.invalidateQueries({ queryKey: ['summary'] });
          navigate(`/`);
        } else {
          navigate("/patients");
        }
        return "Patient created successfully";
      },
      error: (err) => {
        return err.response?.data?.message || "Failed to create patient";
      },
      finally: () => setIsSubmitting(false)
    });
  };

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
          {step === 1
            ? "Record details, birth age, and select referring doctor."
            : "Select the tests to assign to this patient."}
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-paper-white border border-cream-border rounded-cards p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className={step === 1 ? "block space-y-5" : "hidden"}>
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
                  <p className="text-xs text-red-500 mt-1">
                    {errors.age.message}
                  </p>
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
                  <p className="text-xs text-red-500 mt-1">
                    {errors.date.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4 border-t border-cream-border">
              <button
                type="button"
                onClick={handleNext}
                className="bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm"
              >
                Next
              </button>
              <Link
                to="/patients"
                className="bg-paper-white border border-cream-border text-graphite font-medium py-2.5 px-6 rounded-buttons hover:bg-warm-canvas transition duration-200 text-sm"
              >
                Cancel
              </Link>
            </div>
          </div>

          <div className={step === 2 ? "block space-y-5" : "hidden"}>
            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-3">
                Available Tests
              </label>
              {tests.length === 0 ? (
                <p className="text-sm text-stone">
                  No tests available. Please configure tests in the system.
                </p>
              ) : (
                <SearchableTestSelector
                  tests={tests}
                  selectedTests={selectedTestIds}
                  onChange={setSelectedTestIds}
                  multi={true}
                />
              )}
            </div>

            <div className="flex items-center space-x-3 pt-4 border-t border-cream-border">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="bg-paper-white border border-cream-border text-graphite font-medium py-2.5 px-6 rounded-buttons hover:bg-warm-canvas transition duration-200 text-sm"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 disabled:opacity-50 text-sm"
              >
                {isSubmitting ? "Saving..." : "Save Patient"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreatePatient;
