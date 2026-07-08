import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { userService } from "../../services/userService";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { toast } from "../../lib/toast";

const AVAILABLE_PERMISSIONS = [
  { key: 'manage_doctors', label: 'Manage Doctors' },
  { key: 'manage_tests', label: 'Manage Tests' },
];

export const CreateUser = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: "user",
    },
  });

  const watchedRole = watch('role', 'user');

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
          Add a new technician or administrator account. These accounts are authorized by default.
        </p>
      </div>


      {/* Form Card */}
      <div className="bg-paper-white border border-cream-border rounded-cards p-6 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                <option value="user">Lab Technician (User)</option>
                <option value="admin">Administrator (Admin)</option>
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
    </div>
  );
};
export default CreateUser;
