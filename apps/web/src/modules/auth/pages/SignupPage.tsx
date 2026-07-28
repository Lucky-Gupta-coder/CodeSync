import { AuthLayout } from "../components/AuthLayout.js";
import { SignupForm } from "../components/SignupForm.js";

export const SignupPage = () => {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
};
