import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button.js";

export const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center text-red-500 mb-6 shadow-xl border border-slate-800">
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 15v2m0-8v6m0-8h.01M4.93 19h14.14c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Access Denied</h2>
      <p className="text-sm text-slate-400 max-w-sm mb-8 leading-relaxed">
        You do not have the required role or permissions to access this private workspace.
      </p>
      <Button variant="primary" size="sm" onClick={() => navigate("/dashboard")}>
        Back to Dashboard
      </Button>
    </div>
  );
};
