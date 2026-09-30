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
    <div className="w-full bg-[#0F1623]/90 dark:bg-[#0F1623]/90 border border-slate-800 rounded-xl p-8 shadow-2xl backdrop-blur-md transition-all">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-inner">
          <span className="font-mono text-xl font-bold">&lt;/&gt;</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Create an account</h2>
        <p className="text-xs text-slate-400">Join CodeSync to start collaborating</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div
            className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2"
            role="alert"
          >
            <span className="material-symbols-outlined text-[16px] mt-0.5">error</span>
            <span>{serverError}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="name"
            className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5"
          >
            Full Name
          </label>
          <input
            id="name"
            type="text"
            disabled={loading}
            aria-invalid={errors.name ? "true" : "false"}
            className={`w-full bg-[#161F30] border rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
              errors.name
                ? "border-rose-500/50 focus:border-rose-500"
                : "border-slate-800 focus:border-indigo-500"
            }`}
            placeholder="John Doe"
            {...register("name")}
          />
          {errors.name && (
            <p className="mt-1 text-xs text-rose-400 flex items-center gap-1" role="alert">
              <span>{errors.name.message}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            disabled={loading}
            aria-invalid={errors.email ? "true" : "false"}
            className={`w-full bg-[#161F30] border rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
              errors.email
                ? "border-rose-500/50 focus:border-rose-500"
                : "border-slate-800 focus:border-indigo-500"
            }`}
            placeholder="developer@company.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-rose-400 flex items-center gap-1" role="alert">
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            disabled={loading}
            aria-invalid={errors.password ? "true" : "false"}
            className={`w-full bg-[#161F30] border rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
              errors.password
                ? "border-rose-500/50 focus:border-rose-500"
                : "border-slate-800 focus:border-indigo-500"
            }`}
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-rose-400 flex items-center gap-1" role="alert">
              <span>{errors.password.message}</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white font-medium text-sm py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0F1623] mt-6"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Create Account &rarr;</span>
          )}
        </button>

        <div className="text-center mt-6 pt-4 border-t border-slate-800/60">
          <p className="text-xs text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors ml-1"
            >
              Sign In &rarr;
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};
