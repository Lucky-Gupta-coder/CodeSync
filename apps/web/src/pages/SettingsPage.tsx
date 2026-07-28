import { useUIStore } from "../store/ui.store.js";
import { Card } from "../components/common/Card.js";
import { Button } from "../components/common/Button.js";

export const SettingsPage = () => {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Settings</h2>
        <p className="text-sm text-slate-400">Configure theme and preferences for the workspace</p>
      </div>

      <Card
        title="Appearance"
        description="Select the color theme of the workspace interface"
        className="border-slate-850"
      >
        <div className="flex items-center gap-4 mt-2">
          <Button
            variant={theme === "light" ? "primary" : "outline"}
            size="sm"
            onClick={() => setTheme("light")}
          >
            Light Mode
          </Button>
          <Button
            variant={theme === "dark" ? "primary" : "outline"}
            size="sm"
            onClick={() => setTheme("dark")}
          >
            Dark Mode
          </Button>
        </div>
      </Card>
    </div>
  );
};
