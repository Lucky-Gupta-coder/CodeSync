import { useAuthStore } from "../modules/auth/store/auth.store.js";
import { Card } from "../components/common/Card.js";
import { Avatar } from "../components/common/Avatar.js";
import { Badge } from "../components/common/Badge.js";

export const ProfilePage = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Profile</h2>
        <p className="text-sm text-slate-400">View and manage your account information</p>
      </div>

      {user && (
        <Card className="flex flex-col items-center text-center p-8 gap-4 border-slate-850">
          <Avatar
            name={user.name}
            size="lg"
            className="w-20 h-20 text-3xl shadow-xl shadow-indigo-600/30"
          />
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{user.name}</h3>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
          <Badge variant="primary" size="sm">
            {user.role}
          </Badge>

          <div className="w-full grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-6 mt-2 text-left">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                User ID
              </span>
              <span className="text-xs text-slate-350 font-mono truncate">{user.id}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Account Status
              </span>
              <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">
                ACTIVE
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
