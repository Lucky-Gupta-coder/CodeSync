import { useNavigate } from "react-router-dom";
import { Button } from "../components/common/Button.js";

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center text-indigo-500 mb-6 shadow-xl border border-slate-800">
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-3xl font-black text-white mb-2 tracking-tight">404 - Page Not Found</h2>
      <p className="text-sm text-slate-400 max-w-sm mb-8 leading-relaxed">
        The page you are looking for does not exist or has been relocated to another directory.
      </p>
      <Button variant="primary" size="sm" onClick={() => navigate("/dashboard")}>
        Back to Dashboard
      </Button>
    </div>
  );
};
