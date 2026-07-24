import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { toast } from "../lib/toast";

export const Login = () => {
  const { login, authError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setLocalError("");
    
    toast.promise(login(data.email, data.password), {
      loading: "Signing in...",
      success: () => {
        navigate("/");
        return "Logged in successfully";
      },
      error: (err) => {
        setLocalError(err.message || "Invalid credentials");
        return err.message || "Invalid credentials";
      },
      finally: () => setIsSubmitting(false)
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-abcfavoritvariable text-2xl font-medium text-charcoal">
          Sign <span className="font-martinaplantijn italic text-ink-navy">in</span>
        </h2>
        <p className="text-sm text-stone mt-1">
          Welcome back. Enter your credentials to access the portal.
        </p>
      </div>

      {(localError || authError) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-cards">
          {localError || authError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
            Email Address
          </label>
          <input
            type="email"
            placeholder="name@company.com"
            className={`w-full ${errors.email ? "border-red-500 focus:border-red-500" : ""}`}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                message: "Please enter a valid email address",
              },
            })}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className={`w-full pr-10 ${errors.password ? "border-red-500 focus:border-red-500" : ""}`}
              {...register("password", { required: "Password is required" })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 flex items-center text-stone hover:text-charcoal"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-electric-cobalt text-paper-white font-medium py-3 px-6 rounded-buttons hover:bg-opacity-95 transition duration-200 disabled:opacity-50 text-base"
        >
          {isSubmitting ? "Signing in..." : "Continue"}
        </button>
      </form>
    </div>
  );
};
export default Login;
