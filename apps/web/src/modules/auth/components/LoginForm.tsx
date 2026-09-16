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
    <div className="w-full bg-surface-container-low border border-surface-container-highest rounded p-8 shadow-md">
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[32px] text-primary">data_object</span>
          <span className="font-headline-md text-headline-md text-on-surface">CodeSync</span>
        </div>
        <h2 className="text-xl font-headline-sm tracking-tight text-on-surface mb-1">
          Sign in to your account
        </h2>
        <p className="text-body-sm text-outline">Welcome back! Please enter your details.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div
            className="p-3 rounded bg-error/10 border border-error/20 text-body-sm text-on-error flex items-start gap-2"
            role="alert"
          >
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{serverError}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-label-sm font-label-sm text-on-surface uppercase tracking-wider mb-1.5"
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
            className={`w-full bg-surface-container border rounded px-3 py-2 text-body-sm text-on-surface placeholder-outline-variant focus:outline-none focus:ring-1 focus:ring-primary-container transition-all ${
              errors.email
                ? "border-error focus:border-error"
                : "border-outline-variant focus:border-primary-container"
            }`}
            placeholder="name@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p
              id="email-error"
              className="mt-1 text-label-sm text-error flex items-center gap-1"
              role="alert"
            >
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-label-sm font-label-sm text-on-surface uppercase tracking-wider mb-1.5"
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
            className={`w-full bg-surface-container border rounded px-3 py-2 text-body-sm text-on-surface placeholder-outline-variant focus:outline-none focus:ring-1 focus:ring-primary-container transition-all ${
              errors.password
                ? "border-error focus:border-error"
                : "border-outline-variant focus:border-primary-container"
            }`}
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && (
            <p
              id="password-error"
              className="mt-1 text-label-sm text-error flex items-center gap-1"
              role="alert"
            >
              <span>{errors.password.message}</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary-container hover:bg-primary-fixed-dim active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-on-primary font-body-sm py-2 px-4 rounded transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 mt-6"
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
            <span>Sign In</span>
          )}
        </button>

        <div className="text-center mt-6 pt-4 border-t border-surface-container-highest">
          <p className="text-body-sm text-outline">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary hover:text-primary-container font-medium transition-colors"
            >
              Create Account
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};
