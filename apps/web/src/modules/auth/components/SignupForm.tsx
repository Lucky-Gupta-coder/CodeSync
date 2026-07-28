import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignupSchema, SignupInput } from "@codesync/validators";
import { useAuthStore } from "../store/auth.store.js";

export const SignupForm = () => {
  const navigate = useNavigate();
  const signup = useAuthStore((state) => state.signup);
  const loading = useAuthStore((state) => state.loading);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignupInput) => {
    setServerError(null);
    try {
      await signup(data.name, data.email, data.password);
      navigate("/login", {
        state: { successMessage: "Account created successfully! Please sign in." },
      });
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      setServerError(msg);
    }
  };

  return (
    <div className="w-full bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-slate-950/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-600/30 mb-4">
          CS
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Create an Account</h2>
        <p className="text-sm text-slate-400">Join CodeSync to start collaborating</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div
            className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400 flex items-start gap-2.5"
            role="alert"
          >
            <svg
              className="w-5 h-5 shrink-0 text-rose-400 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{serverError}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="name"
            className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
          >
            Full Name
          </label>
          <input
            id="name"
            type="text"
            disabled={loading}
            aria-invalid={errors.name ? "true" : "false"}
            className={`w-full bg-slate-950/60 border rounded-lg px-4.5 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
              errors.name
                ? "border-rose-500 focus:border-rose-500"
                : "border-slate-800 focus:border-indigo-500"
            }`}
            placeholder="John Doe"
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-rose-400" role="alert">
              <span>{errors.name.message}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            disabled={loading}
            aria-invalid={errors.email ? "true" : "false"}
            className={`w-full bg-slate-950/60 border rounded-lg px-4.5 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
              errors.email
                ? "border-rose-500 focus:border-rose-500"
                : "border-slate-800 focus:border-indigo-500"
            }`}
            placeholder="name@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1.5 text-xs text-rose-400" role="alert">
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            disabled={loading}
            aria-invalid={errors.password ? "true" : "false"}
            className={`w-full bg-slate-950/60 border rounded-lg px-4.5 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
              errors.password
                ? "border-rose-500 focus:border-rose-500"
                : "border-slate-800 focus:border-indigo-500"
            }`}
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1.5 text-xs text-rose-400" role="alert">
              <span>{errors.password.message}</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>Creating account...</span>
            </>
          ) : (
            <span>Sign Up</span>
          )}
        </button>

        <div className="text-center mt-4">
          <p className="text-xs text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};
