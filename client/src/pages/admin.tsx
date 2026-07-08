import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useState } from "react";
import { Shield, Users, Activity, CheckCircle, XCircle, ChevronDown } from "lucide-react";

const ROLES = [
  "platform_admin",
  "agency_admin",
  "caregiver",
  "independent_caregiver",
  "family",
] as const;

type Role = typeof ROLES[number];

const ROLE_LABELS: Record<Role, string> = {
  platform_admin:        "Platform Admin",
  agency_admin:          "Agency Admin",
  caregiver:             "Caregiver",
  independent_caregiver: "Independent Caregiver",
  family:                "Family",
};

const ROLE_COLORS: Record<Role, string> = {
  platform_admin:        "bg-purple-900/40 text-purple-300",
  agency_admin:          "bg-blue-900/40 text-blue-300",
  caregiver:             "bg-emerald-900/40 text-emerald-300",
  independent_caregiver: "bg-teal-900/40 text-teal-300",
  family:                "bg-amber-900/40 text-amber-300",
};

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, { credentials: "include", ...options });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Redirect non-admins immediately
  if (user && user.role !== "platform_admin") {
    navigate("/");
    return null;
  }

  const { data: metrics } = useQuery({
    queryKey: ["/api/admin/metrics"],
    queryFn: () => apiFetch("/api/admin/metrics"),
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/admin/users", roleFilter],
    queryFn: () => apiFetch(`/api/admin/users${roleFilter !== "all" ? `?role=${roleFilter}` : ""}`),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, any> }) =>
      apiFetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/metrics"] });
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Platform Admin</h1>
          <p className="text-xs text-slate-400">CareTrack · care-chain.com</p>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 gap-3 mb-8">
          <MetricCard label="Total Users" value={metrics.totalUsers} icon={<Users size={16} />} />
          <MetricCard label="Active Subscriptions" value={metrics.activeSubscriptions} icon={<Activity size={16} />} color="text-emerald-400" />
          <MetricCard label="Clients" value={metrics.totalClients} icon={<CheckCircle size={16} />} />
          <MetricCard label="Family Members" value={metrics.byRole.family} icon={<Users size={16} />} color="text-amber-400" />
        </div>
      )}

      {/* Role breakdown */}
      {metrics && (
        <div className="bg-slate-900 rounded-2xl p-4 mb-6">
          <h2 className="text-sm font-semibold text-slate-400 mb-3">Users by Role</h2>
          <div className="flex flex-col gap-2">
            {ROLES.map(role => (
              <div key={role} className="flex items-center justify-between">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[role]}`}>
                  {ROLE_LABELS[role]}
                </span>
                <span className="text-sm font-semibold">{metrics.byRole[role] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User list */}
      <div className="bg-slate-900 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">All Users</h2>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300"
          >
            <option value="all">All roles</option>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>

        {isLoading ? (
          <div className="text-sm text-slate-500 text-center py-8">Loading…</div>
        ) : (
          <div className="flex flex-col gap-3">
            {users.map((u: any) => (
              <UserRow
                key={u.id}
                user={u}
                onRoleChange={(role) => updateUser.mutate({ id: u.id, updates: { role } })}
                onToggleActive={() => updateUser.mutate({ id: u.id, updates: { isActive: !u.isActive } })}
                currentUserId={user?.id}
              />
            ))}
            {users.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-6">No users found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color = "text-slate-100" }: {
  label: string; value: number; icon: React.ReactNode; color?: string;
}) {
  return (
    <div className="bg-slate-900 rounded-2xl p-4">
      <div className="flex items-center gap-2 text-slate-400 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function UserRow({ user, onRoleChange, onToggleActive, currentUserId }: {
  user: any;
  onRoleChange: (role: Role) => void;
  onToggleActive: () => void;
  currentUserId?: string;
}) {
  const [showRoles, setShowRoles] = useState(false);
  const isSelf = user.id === currentUserId;

  return (
    <div className={`border rounded-xl p-3 ${user.isActive ? "border-slate-700" : "border-slate-800 opacity-50"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{user.name}</div>
          <div className="text-xs text-slate-500 truncate">{user.email || user.username}</div>
          {user.subscriptionStatus === "active" && (
            <div className="text-xs text-emerald-400 mt-0.5">● {user.subscriptionPlan?.replace("_", " ")}</div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Role selector */}
          <div className="relative">
            <button
              onClick={() => !isSelf && setShowRoles(v => !v)}
              disabled={isSelf}
              className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 ${ROLE_COLORS[user.role as Role] ?? "bg-slate-800 text-slate-300"} ${isSelf ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {ROLE_LABELS[user.role as Role] ?? user.role}
              {!isSelf && <ChevronDown size={10} />}
            </button>
            {showRoles && (
              <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10 min-w-[180px]">
                {ROLES.map(role => (
                  <button
                    key={role}
                    onClick={() => { onRoleChange(role); setShowRoles(false); }}
                    className="w-full text-left text-xs px-3 py-2 hover:bg-slate-700 first:rounded-t-xl last:rounded-b-xl"
                  >
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active toggle */}
          {!isSelf && (
            <button
              onClick={onToggleActive}
              className={`p-1.5 rounded-lg ${user.isActive ? "text-emerald-400 hover:bg-emerald-900/30" : "text-slate-500 hover:bg-slate-800"}`}
              title={user.isActive ? "Deactivate user" : "Activate user"}
            >
              {user.isActive ? <CheckCircle size={16} /> : <XCircle size={16} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
