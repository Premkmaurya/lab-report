import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Users,
  UserCheck,
  Stethoscope,
  FlaskConical,
  FileText,
  Layers,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Edit,
  Search,
  Globe,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  FileSpreadsheet,
  Settings as SettingsIcon,
} from 'lucide-react';
import laboratoryService from '../../services/laboratoryService';
import { toast } from '../../lib/toast';

export const LaboratoryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [laboratory, setLaboratory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Sub-resource states
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [tests, setTests] = useState([]);
  const [reports, setReports] = useState([]);

  const [loadingTab, setLoadingTab] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  const fetchLabDetails = async () => {
    setLoading(true);
    try {
      const res = await laboratoryService.getLaboratoryById(id);
      if (res.success) {
        setLaboratory(res.data);
      }
    } catch (err) {
      toast.error('Failed to load laboratory details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabDetails();
  }, [id]);

  // Fetch tab data on demand
  useEffect(() => {
    if (!id) return;
    const fetchTabData = async () => {
      setLoadingTab(true);
      try {
        if (activeTab === 'users') {
          const res = await laboratoryService.getLaboratoryUsers(id);
          if (res.success) setUsers(res.data || []);
        } else if (activeTab === 'patients') {
          const res = await laboratoryService.getLaboratoryPatients(id, { search: patientSearch });
          if (res.success) setPatients(res.data || []);
        } else if (activeTab === 'doctors') {
          const res = await laboratoryService.getLaboratoryDoctors(id);
          if (res.success) setDoctors(res.data || []);
        } else if (activeTab === 'tests') {
          const res = await laboratoryService.getLaboratoryTests(id);
          if (res.success) setTests(res.data || []);
        } else if (activeTab === 'reports') {
          const res = await laboratoryService.getLaboratoryReports(id);
          if (res.success) setReports(res.data || []);
        }
      } catch (err) {
        toast.error(`Failed to load ${activeTab} data`);
      } finally {
        setLoadingTab(false);
      }
    };

    fetchTabData();
  }, [id, activeTab, patientSearch]);

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await laboratoryService.updateStatus(id, newStatus);
      if (res.success) {
        toast.success(`Laboratory status updated to ${newStatus}`);
        fetchLabDetails();
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Active
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Suspended
          </span>
        );
      case 'inactive':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <XCircle className="w-3.5 h-3.5" />
            Inactive
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 mb-3"></div>
        <p className="text-sm text-slate-500 font-medium">Loading laboratory workspace...</p>
      </div>
    );
  }

  if (!laboratory) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Laboratory Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">The requested laboratory workspace does not exist or has been removed.</p>
        <Link
          to="/laboratories"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Laboratory List
        </Link>
      </div>
    );
  }

  const stats = laboratory.stats || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Back Action */}
      <div className="space-y-4">
        <Link
          to="/laboratories"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Laboratory Management</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl shrink-0">
              {laboratory.code ? laboratory.code.slice(0, 3) : <Building2 className="w-7 h-7" />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800">{laboratory.name}</h1>
                <span className="font-mono bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-xs font-bold">
                  {laboratory.code}
                </span>
                {getStatusBadge(laboratory.status)}
              </div>
              <p className="text-slate-500 text-sm mt-1 flex flex-wrap items-center gap-4">
                {laboratory.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {laboratory.email}
                  </span>
                )}
                {laboratory.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {laboratory.phone}
                  </span>
                )}
                {laboratory.address && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {laboratory.address}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/laboratories/edit/${laboratory._id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition"
            >
              <Edit className="w-4 h-4" />
              Edit Workspace
            </Link>

            {laboratory.status === 'active' ? (
              <button
                onClick={() => handleStatusChange('suspended')}
                className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-lg text-sm font-medium transition"
              >
                Suspend
              </button>
            ) : (
              <button
                onClick={() => handleStatusChange('active')}
                className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-sm font-medium transition"
              >
                Activate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Users</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-2xl font-bold text-slate-800">{stats.users || 0}</span>
          <span className="text-[11px] text-slate-400 mt-1">Lab personnel</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Patients</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-bold text-slate-800">{stats.patients || 0}</span>
          <span className="text-[11px] text-slate-400 mt-1">Registered patients</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Doctors</span>
            <Stethoscope className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-2xl font-bold text-slate-800">{stats.doctors || 0}</span>
          <span className="text-[11px] text-slate-400 mt-1">Referring doctors</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tests</span>
            <FlaskConical className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-bold text-slate-800">{stats.tests || 0}</span>
          <span className="text-[11px] text-slate-400 mt-1">Active lab tests</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Reports</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-bold text-slate-800">{stats.reports || 0}</span>
          <span className="text-[11px] text-slate-400 mt-1">Generated reports</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Departments</span>
            <Layers className="w-4 h-4 text-pink-500" />
          </div>
          <span className="text-2xl font-bold text-slate-800">{stats.departments || 0}</span>
          <span className="text-[11px] text-slate-400 mt-1">Test categories</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 text-sm font-medium">
          {[
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'users', label: `Users (${stats.users || 0})`, icon: Users },
            { id: 'patients', label: `Patients (${stats.patients || 0})`, icon: UserCheck },
            { id: 'doctors', label: `Doctors (${stats.doctors || 0})`, icon: Stethoscope },
            { id: 'tests', label: `Tests (${stats.tests || 0})`, icon: FlaskConical },
            { id: 'reports', label: `Reports (${stats.reports || 0})`, icon: FileText },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3.5 border-b-2 font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Basic Information
                </h3>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 text-sm">
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500 font-medium">Laboratory Name</span>
                    <span className="font-semibold text-slate-800">{laboratory.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500 font-medium">Laboratory Code</span>
                    <span className="font-mono font-bold text-indigo-600">{laboratory.code}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500 font-medium">Official Email</span>
                    <span className="text-slate-800">{laboratory.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500 font-medium">Contact Phone</span>
                    <span className="text-slate-800">{laboratory.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-slate-500 font-medium">GST Number</span>
                    <span className="font-mono text-slate-800">{laboratory.gstNumber || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-500 font-medium">License Number</span>
                    <span className="font-mono text-slate-800">{laboratory.licenseNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  Address & Metadata
                </h3>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 text-sm">
                  <div>
                    <span className="text-slate-500 font-medium block mb-1">Physical Address</span>
                    <p className="text-slate-800 font-normal">
                      {laboratory.address || 'No address specified'}
                    </p>
                  </div>
                  {laboratory.letterheadAddressLine && (
                    <div className="border-t border-slate-200/60 pt-2">
                      <span className="text-slate-500 font-medium block mb-1">Letterhead Header Line</span>
                      <p className="text-slate-700 italic text-xs">
                        "{laboratory.letterheadAddressLine}"
                      </p>
                    </div>
                  )}
                  <div className="border-t border-slate-200/60 pt-2 flex justify-between">
                    <span className="text-slate-500 font-medium">Registration Date</span>
                    <span className="text-slate-800 font-mono">
                      {new Date(laboratory.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Last Updated</span>
                    <span className="text-slate-800 font-mono">
                      {new Date(laboratory.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS */}
          {activeTab === 'users' && (
            <div>
              {loadingTab ? (
                <div className="py-8 text-center text-slate-400">Loading laboratory users...</div>
              ) : users.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">No users registered under this laboratory.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Created Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => (
                        <tr key={u._id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-800">{u.username || u.name}</td>
                          <td className="py-3 px-4">
                            <span className="capitalize text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{u.email}</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${u.active !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {u.active !== false ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PATIENTS */}
          {activeTab === 'patients' && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patients by name, phone, or ID..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {loadingTab ? (
                <div className="py-8 text-center text-slate-400">Loading patients...</div>
              ) : patients.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">No patients found.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Patient ID</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Age / Gender</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {patients.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono text-xs font-bold text-indigo-600">{p.patientId || p._id.slice(-6)}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{p.name}</td>
                          <td className="py-3 px-4 text-slate-600">{p.age ? `${p.age} Yrs` : ''} {p.gender ? `/ ${p.gender}` : ''}</td>
                          <td className="py-3 px-4 text-slate-600">{p.phone || 'N/A'}</td>
                          <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DOCTORS */}
          {activeTab === 'doctors' && (
            <div>
              {loadingTab ? (
                <div className="py-8 text-center text-slate-400">Loading doctors...</div>
              ) : doctors.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">No referring doctors registered.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Doctor Name</th>
                        <th className="py-3 px-4">Specialization</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4 text-right">Commission (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {doctors.map((d) => (
                        <tr key={d._id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-800">{d.name}</td>
                          <td className="py-3 px-4 text-slate-600">{d.specialization || d.degree || 'General'}</td>
                          <td className="py-3 px-4 text-slate-600">{d.phone || 'N/A'}</td>
                          <td className="py-3 px-4 text-slate-600">{d.email || 'N/A'}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600">
                            {d.commissionPercentage !== undefined ? `${d.commissionPercentage}%` : '0%'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TESTS */}
          {activeTab === 'tests' && (
            <div>
              {loadingTab ? (
                <div className="py-8 text-center text-slate-400">Loading lab test catalog...</div>
              ) : tests.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">No tests configured in this laboratory.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Test Name</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4 text-center">Parameters</th>
                        <th className="py-3 px-4">Import Source</th>
                        <th className="py-3 px-4 text-right">Price (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tests.map((t) => (
                        <tr key={t._id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-800">{t.name}</td>
                          <td className="py-3 px-4 text-slate-600">{t.departmentId?.name || 'General'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                              {t.subTests?.length || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {t.sourceTestId ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <Globe className="w-3 h-3" />
                                Global Import
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600">
                                Custom Test
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                            ₹{(t.price || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: REPORTS */}
          {activeTab === 'reports' && (
            <div>
              {loadingTab ? (
                <div className="py-8 text-center text-slate-400">Loading reports...</div>
              ) : reports.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">No reports generated yet.</div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-3 px-4">Report ID</th>
                        <th className="py-3 px-4">Patient</th>
                        <th className="py-3 px-4">Doctor</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 font-mono text-right">Generated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reports.map((r) => (
                        <tr key={r._id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono text-xs font-bold text-indigo-600">{r.reportId || r._id.slice(-6)}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{r.patientId?.name || 'N/A'}</td>
                          <td className="py-3 px-4 text-slate-600">{r.doctorId?.name || 'Self'}</td>
                          <td className="py-3 px-4">
                            <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                              {r.status || 'Completed'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500 text-right font-mono">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Laboratory Settings & Print Layouts
              </h3>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-800">Print Template Designer</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Customize letterheads, margins, signatures, and barcode positions for {laboratory.name}.</p>
                  </div>
                  <Link
                    to="/settings/print-designer"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
                  >
                    Open Designer
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaboratoryDetails;
