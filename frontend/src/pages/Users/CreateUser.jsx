import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { userService } from "../../services/userService";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { toast } from "../../lib/toast";

import { useLaboratory } from "../../context/LaboratoryContext";
import { useAuth } from "../../hooks/useAuth";

const AVAILABLE_PERMISSIONS = [
  { key: 'manage_doctors', label: 'Manage Doctors' },
  { key: 'manage_tests', label: 'Manage Tests' },
  { key: 'manage_settings', label: 'Manage Settings' },
];

import laboratoryService from "../../services/laboratoryService";
import { Plus, Building2, X } from "lucide-react";

export const CreateUser = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { laboratories, fetchLaboratories } = useLaboratory();
  const isSystemAdmin = currentUser?.role === 'system_admin';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  
  // New Laboratory Modal State
  const [showNewLabModal, setShowNewLabModal] = useState(false);
  const [isCreatingLab, setIsCreatingLab] = useState(false);
  const [newLabData, setNewLabData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: "user",
      laboratoryId: "",
    },
  });

  const watchedRole = watch('role', 'user');

  const handleCreateNewLabSubmit = async (e) => {
    e.preventDefault();
    if (!newLabData.name.trim() || !newLabData.code.trim()) {
      toast.error('Laboratory Name and Code are required');
      return;
    }

    setIsCreatingLab(true);
    try {
      const res = await laboratoryService.createLaboratory(newLabData);
      if (res.success && res.data) {
        toast.success(`Laboratory "${res.data.name}" created successfully`);
        await fetchLaboratories();
        setValue("laboratoryId", res.data._id);
        setShowNewLabModal(false);
        setNewLabData({ name: '', code: '', email: '', phone: '', address: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create laboratory');
    } finally {
      setIsCreatingLab(false);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    toast.promise(userService.createUser({ ...data, permissions: selectedPermissions }), {
      loading: "Creating user...",
      success: () => {
        navigate("/users");
        return "User created successfully";
      },
      error: (err) => err.response?.data?.message || "Failed to create user. Please try again.",
      finally: () => setIsSubmitting(false)
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back to list */}
      <div>
        <Link
          to="/users"
          className="inline-flex items-center space-x-2 text-sm text-stone hover:text-charcoal transition-colors duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Users</span>
        </Link>
      </div>

      {/* Header */}
      <div>
        <span className="font-abcfavoritvariable text-xs font-bold text-electric-cobalt uppercase tracking-widest block mb-2">
          CREATION
        </span>
        <h1 className="font-martinaplantijn text-4xl text-ink-navy">
          Create <span className="italic font-light">New User</span>
        </h1>
        <p className="font-inter text-stone text-sm mt-1">
          Add a new staff or administrator account assigned to a laboratory tenant.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-paper-white border border-cream-border rounded-cards p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Laboratory Selection for System Admin */}
          {isSystemAdmin && watchedRole !== 'system_admin' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-charcoal uppercase tracking-wider">
                  Laboratory Tenant *
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewLabModal(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-electric-cobalt hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New Laboratory
                </button>
              </div>

              <select
                className={`w-full bg-paper-white border ${errors.laboratoryId ? "border-red-500" : "border-cream-border"} rounded-inputs px-4 py-3 outline-none`}
                {...register("laboratoryId", { 
                  required: watchedRole !== 'system_admin' ? "Please select a laboratory" : false,
                  onChange: (e) => {
                    if (e.target.value === "__CREATE_NEW__") {
                      setValue("laboratoryId", "");
                      setShowNewLabModal(true);
                    }
                  }
                })}
              >
                <option value="">-- Select Laboratory --</option>
                <option value="__CREATE_NEW__" className="font-semibold text-electric-cobalt">
                  + Create New Laboratory...
                </option>
                {laboratories.map((lab) => (
                  <option key={lab._id} value={lab._id}>
                    {lab.name} ({lab.code})
                  </option>
                ))}
              </select>
              {errors.laboratoryId && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.laboratoryId.message}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                type="text"
                placeholder="e.g. tech_john"
                className={`w-full ${errors.username ? "border-red-500" : ""}`}
                {...register("username", {
                  required: "Username is required",
                  minLength: {
                    value: 3,
                    message: "Username must be at least 3 characters",
                  },
                  maxLength: {
                    value: 30,
                    message: "Username cannot exceed 30 characters",
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_-]+$/,
                    message: "Letters, numbers, underscores, and hyphens only",
                  },
                })}
              />
              {errors.username && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                Role
              </label>
              <select
                className="w-full bg-paper-white border border-cream-border rounded-inputs px-4 py-3 outline-none"
                {...register("role", { required: "Role is required" })}
              >
                <option value="user">Lab Technician</option>
                <option value="receptionist">Receptionist</option>
                <option value="admin">Lab Administrator (Admin)</option>
                {isSystemAdmin && <option value="system_admin">System Administrator (Global)</option>}
              </select>
              {errors.role && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.role.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              placeholder="technician@balajilabs.com"
              className={`w-full ${errors.email ? "border-red-500" : ""}`}
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                  message: "Please enter a valid email address",
                },
              })}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className={`w-full ${errors.password ? "border-red-500" : ""}`}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {watchedRole !== 'admin' && (
            <div className="border-t border-cream-border pt-5">
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-3">
                Permissions
              </label>
              <p className="text-xs text-stone mb-4">Select the permissions to assign to this user.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVAILABLE_PERMISSIONS.map(perm => (
                    <label key={perm.key} className="flex items-center space-x-3 p-3 border border-cream-border rounded-lg cursor-pointer hover:bg-warm-canvas transition-colors">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-electric-cobalt rounded border-cream-border"
                        checked={selectedPermissions.includes(perm.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, perm.key]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(p => p !== perm.key));
                          }
                        }}
                      />
                      <span className="text-sm font-medium text-charcoal">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          {watchedRole === 'admin' && (
            <div className="border-t border-cream-border pt-5">
              <p className="text-xs text-stone italic">Administrators have all permissions by default.</p>
            </div>
          )}

          <div className="flex items-center space-x-3 pt-4 border-t border-cream-border">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-electric-cobalt text-paper-white font-medium py-2.5 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 disabled:opacity-50 text-sm"
            >
              {isSubmitting ? "Creating User..." : "Create User"}
            </button>
            <Link
              to="/users"
              className="bg-paper-white border border-cream-border text-graphite font-medium py-2.5 px-6 rounded-buttons hover:bg-warm-canvas transition duration-200 text-sm"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* Inline Quick Create Laboratory Modal */}
      {showNewLabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Quick Create Laboratory
              </h3>
              <button
                type="button"
                onClick={() => setShowNewLabModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewLabSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Laboratory Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Diagnostics"
                  value={newLabData.name}
                  onChange={(e) => setNewLabData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Laboratory Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. APEXLAB"
                  value={newLabData.code}
                  onChange={(e) => setNewLabData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  placeholder="contact@apexlab.com"
                  value={newLabData.email}
                  onChange={(e) => setNewLabData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newLabData.phone}
                  onChange={(e) => setNewLabData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Medical Center, Main Road"
                  value={newLabData.address}
                  onChange={(e) => setNewLabData((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewLabModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingLab}
                  className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
                >
                  {isCreatingLab ? 'Creating...' : 'Create & Select'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CreateUser;
