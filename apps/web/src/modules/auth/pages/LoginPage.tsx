import { AuthLayout } from "../components/AuthLayout.js";
import { LoginForm } from "../components/LoginForm.js";

export const LoginPage = () => {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
};
