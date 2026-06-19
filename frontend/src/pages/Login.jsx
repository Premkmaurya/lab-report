import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export const Login = () => {
  const { login, authError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setLocalError("");
    try {
      await login(data.email, data.password);
      navigate("/");
    } catch (err) {
      setLocalError(err.message || "Invalid credentials");
    } finally {
      setIsSubmitting(false);
    }
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
          <input
            type="password"
            placeholder="••••••••"
            className={`w-full ${errors.password ? "border-red-500 focus:border-red-500" : ""}`}
            {...register("password", { required: "Password is required" })}
          />
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

      <div className="mt-6 text-center text-sm border-t border-cream-border pt-4">
        <span className="text-stone">New to the portal?</span>{" "}
        <Link
          to="/signup"
          className="text-electric-cobalt font-medium hover:underline ml-1"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
};
export default Login;
