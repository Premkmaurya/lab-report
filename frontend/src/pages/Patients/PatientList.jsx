import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { patientService } from "../../services/patientService";
import { Plus, Search, Eye, Edit2 } from "lucide-react";

export const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await patientService.getAllPatients();
        setPatients(data.patients || []);
      } catch (err) {
        setErrorMsg("Failed to load patients list.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter((patient) =>
    patient.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cream-border border-t-electric-cobalt"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-2">
            REGISTRATION
          </span>
          <h1 className="font-martinaplantijn text-4xl text-ink-navy">
            Patient <span className="italic font-light">Directory</span>
          </h1>
          <p className="font-inter text-stone text-sm mt-1">
            Register and monitor patients or create laboratory reports.
          </p>
        </div>
        <div>
          <Link
            to="/patients/create"
            className="inline-flex items-center space-x-2 bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Patient</span>
          </Link>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-cards">
          {errorMsg}
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex items-center bg-paper-white border border-cream-border rounded-cards px-4 py-1 max-w-md">
        <Search className="h-5 w-5 text-stone shrink-0 mr-2" />
        <input
          type="text"
          placeholder="Search patients by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border-none bg-transparent p-3 text-sm text-charcoal outline-none focus:ring-0"
        />
      </div>

      {/* Table */}
      <div className="bg-paper-white border border-cream-border rounded-cards overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-warm-canvas border-b border-cream-border">
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                  Age / Gender
                </th>
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                  Referred Doctor
                </th>
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider">
                  Registered On
                </th>
                <th className="px-6 py-4 font-abcfavoritvariable text-xs font-bold text-graphite uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-stone text-sm">
                    No patients found.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-warm-canvas/30 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-charcoal">
                      {patient.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone">
                      {patient.age} yrs • <span className="capitalize">{patient.gender}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                      {patient.referredDoctor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-stone font-mono">
                      {new Date(patient.createdAt || patient.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/patients/${patient._id}`}
                          className="inline-flex items-center space-x-1 border border-cream-border text-graphite bg-paper-white hover:bg-warm-canvas px-3 py-1.5 rounded-buttons text-xs transition duration-200 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Details</span>
                        </Link>
                        <Link
                          to={`/patients/edit/${patient._id}`}
                          className="inline-flex items-center space-x-1 border border-cream-border text-electric-cobalt bg-paper-white hover:bg-lavender-mist/40 px-3 py-1.5 rounded-buttons text-xs transition duration-200 cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default PatientList;
