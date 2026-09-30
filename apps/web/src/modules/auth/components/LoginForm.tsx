import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginInput } from "../validation/login.schema.js";
import { useAuthStore } from "../store/auth.store.js";

export const LoginForm = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.loading);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      navigate("/");
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const msg =
        err.response?.data?.message || "Login failed. Please verify your email and password.";
      setServerError(msg);
    }
  };

  return (
    <div className="w-full bg-surface border border-outline-variant rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
      <div className="flex flex-col items-start mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary border border-primary/20 flex items-center justify-center font-mono font-bold text-lg shadow-sm mb-4">
          &lt;/&gt;
        </div>
        <h2 className="text-2xl font-black tracking-tight text-on-surface mb-1">
          Sign in to your account
        </h2>
        <p className="text-xs text-on-surface-variant">
          Enter your credentials to enter your active workspace
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div
            className="p-3 rounded-xl bg-error-container border border-error/20 text-xs text-on-error-container flex items-start gap-2"
            role="alert"
          >
            <svg
              className="w-4 h-4 text-error shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{serverError}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-[11px] font-mono font-bold text-on-surface-variant uppercase tracking-wider mb-1.5"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            disabled={isLoading}
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`w-full bg-surface-container border rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
              errors.email ? "border-error focus:ring-error" : "border-outline-variant"
            }`}
            placeholder="developer@company.com"
            {...register("email")}
          />
          {errors.email && (
            <p
              id="email-error"
              className="mt-1.5 text-xs text-error flex items-center gap-1 font-medium"
              role="alert"
            >
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-[11px] font-mono font-bold text-on-surface-variant uppercase tracking-wider mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            disabled={isLoading}
            aria-invalid={errors.password ? "true" : "false"}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={`w-full bg-surface-container border rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
              errors.password ? "border-error focus:ring-error" : "border-outline-variant"
            }`}
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && (
            <p
              id="password-error"
              className="mt-1.5 text-xs text-error flex items-center gap-1 font-medium"
              role="alert"
            >
              <span>{errors.password.message}</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary-fixed-dim active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-on-primary font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 mt-6 text-sm"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-on-primary" fill="none" viewBox="0 0 24 24">
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
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In &rarr;</span>
          )}
        </button>

        <div className="text-center mt-6 pt-4 border-t border-outline-variant">
          <p className="text-xs text-on-surface-variant">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="text-primary hover:underline font-bold transition-colors"
            >
              Create Account &rarr;
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};
