import { useState, useEffect } from "react";
import { Modal } from "./Modal.js";
import { Button } from "./Button.js";
import { useAuthStore } from "../../modules/auth/store/auth.store.js";
import { useNavigate } from "react-router-dom";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    // Check initial theme from document class
    if (document.documentElement.classList.contains("dark")) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  }, []);

  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="flex flex-col gap-6 py-4">
        {/* Profile Section */}
        <div>
          <h3 className="font-label-md text-on-surface mb-2">Profile</h3>
          <div className="bg-surface-container-low p-4 rounded-lg border border-surface-container-highest flex items-center gap-4">
            <div className="w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center font-bold text-lg">
              {user?.name?.substring(0, 2).toUpperCase() || "US"}
            </div>
            <div>
              <div className="font-body-lg text-on-surface">{user?.name || "Unknown User"}</div>
              <div className="text-body-sm text-outline">{user?.email || "No email provided"}</div>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div>
          <h3 className="font-label-md text-on-surface mb-2">Preferences</h3>
          <div className="bg-surface-container-low p-4 rounded-lg border border-surface-container-highest">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-body-md text-on-surface">Theme</div>
                <div className="text-body-sm text-outline">Toggle between Light and Dark mode</div>
              </div>
              <button
                onClick={handleThemeToggle}
                className="w-12 h-6 rounded-full bg-surface-container-highest relative transition-colors focus:outline-none"
              >
                <div
                  className={`w-5 h-5 rounded-full absolute top-0.5 transition-transform duration-200 flex items-center justify-center ${
                    theme === "dark" ? "left-[calc(100%-22px)] bg-primary" : "left-0.5 bg-outline"
                  }`}
                >
                  <span className="material-symbols-outlined text-[12px] text-surface">
                    {theme === "dark" ? "dark_mode" : "light_mode"}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-surface-container-highest mt-4">
        <Button variant="danger" onClick={handleLogout}>
          Logout
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};
