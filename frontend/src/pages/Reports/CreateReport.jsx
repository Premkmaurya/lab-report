import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShieldAlert, Plus, CheckCircle } from "lucide-react";
import { patientService } from "../../services/patientService";
import { reportService } from "../../services/reportService";
import { testService } from "../../services/testService";
import { toast } from "../../lib/toast";

export const CreateReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [allTests, setAllTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const patientData = await patientService.getPatientById(id);
        const patientDetails = patientData.patient;
        setPatient(patientDetails);

        const labId = patientDetails?.laboratoryId?._id || patientDetails?.laboratoryId;
        const testData = await testService.getAllTests(labId ? { laboratoryId: labId } : {});

        const tests = testData.tests || [];
        setAllTests(tests);

        const patientAssignedTests = patientDetails?.tests || [];
        const initialSelected = tests.filter((test) =>
          patientAssignedTests.some(
            (assigned) => assigned._id === test._id || assigned.name === test.name
          )
        );

        setSelectedTests(initialSelected);
      } catch (err) {
        toast.error("Failed to load patient and test data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const availableTests = useMemo(() => {
    if (!allTests.length) return [];
    return allTests.filter((test) =>
      test?.name && test.name.trim().length > 0
    );
  }, [allTests]);

  const filteredTests = useMemo(() => {
    if (!searchQuery.trim()) return availableTests;
    const q = searchQuery.toLowerCase();
    return availableTests.filter((test) => {
      const nameMatch = test.name?.toLowerCase().includes(q);
      const deptMatch = test.departmentId?.name?.toLowerCase().includes(q);
      return nameMatch || deptMatch;
    });
  }, [availableTests, searchQuery]);

  const toggleTest = (test) => {
    setSelectedTests((current) =>
      current.some((item) => item._id === test._id)
        ? current.filter((item) => item._id !== test._id)
        : [...current, test]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedTests.length === 0) {
      toast.error("Please select at least one test to create a report.");
      return;
    }

    setIsSubmitting(true);

    const labId = patient?.laboratoryId?._id || patient?.laboratoryId;

    const payload = {
      patientId: id,
      laboratoryId: labId,
      tests: selectedTests.map((test) => ({
        testId: test._id,
        testName: test.name,
        result: [],
      })),
    };

    toast.promise(reportService.createReport(payload), {
      loading: "Creating report...",
      success: () => {
        navigate(`/patients/${id}`);
        return "Report created successfully";
      },
      error: (err) => err.response?.data?.message || "Failed to create report. Please try again.",
      finally: () => setIsSubmitting(false)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link
          to={`/patients/${id}`}
          className="inline-flex items-center space-x-2 text-sm text-stone hover:text-charcoal transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Patient</span>
        </Link>
      </div>

      <div>
        <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-2">
          REPORT CREATION
        </span>
        <h1 className="font-martinaplantijn text-4xl text-ink-navy">
          Create <span className="italic font-light">Patient Report</span>
        </h1>
        <p className="font-inter text-stone text-sm mt-1">
          {patient?.name ? `For ${patient.name}` : "Select the tests to include in this report."}
        </p>
      </div>

      <div className="bg-paper-white border border-cream-border rounded-cards p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-3">
              Select Tests
            </label>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search tests by name or department..."
                className="w-full bg-paper-white border border-cream-border rounded-inputs px-4 py-3 outline-none text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {filteredTests.length === 0 && availableTests.length > 0 ? (
              <p className="text-sm text-stone">No matching tests.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTests.map((test) => {
                  const isSelected = selectedTests.some((item) => item._id === test._id);

                  return (
                    <button
                      type="button"
                      key={test._id}
                      onClick={() => toggleTest(test)}
                      className={`border rounded-cards p-4 text-left transition duration-200 ${
                        isSelected
                          ? "border-electric-cobalt bg-electric-cobalt/5"
                          : "border-cream-border hover:bg-warm-canvas"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-charcoal">{test.name}</p>
                          <p className="text-xs text-stone">₹{test.price || 0}</p>
                        </div>
                        {isSelected ? (
                          <CheckCircle className="h-5 w-5 text-electric-cobalt" />
                        ) : (
                          <Plus className="h-5 w-5 text-stone" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 pt-4 border-t border-cream-border">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 disabled:opacity-50 text-sm cursor-pointer"
            >
              {isSubmitting ? "Creating..." : "Create Report"}
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

export default CreateReport;
