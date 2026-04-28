import React, { useMemo } from "react";
import { AppShell } from "../components/Layout";
import AppIcon from "../components/AppIcon";
import { useApp } from "../context/AppContext";

export default function Profile() {
  const { currentUser, userProfile, role, usageStats, updateProfileSettings, apiKeys } = useApp();

  const lastActivity = useMemo(() => usageStats.lastActivity || "No activity yet", [usageStats.lastActivity]);

  const handleRoleChange = async (nextRole) => {
    await updateProfileSettings({ role: nextRole });
  };

  const toggleTheme = async () => {
    await updateProfileSettings({
      preferences: {
        ...(userProfile?.preferences ?? {}),
        theme: userProfile?.preferences?.theme === "dark" ? "light" : "dark",
      },
    });
  };

  const roles = [
    { id: "analyst", label: "Analyst", icon: "monitoring" },
    { id: "auditor", label: "Auditor", icon: "gavel" },
    { id: "engineer", label: "Engineer", icon: "engineering" },
    { id: "admin", label: "Admin", icon: "admin_panel_settings" },
  ];

  return (
    <AppShell title="Identity Settings">
      <div className="grid gap-lg lg:grid-cols-[0.8fr_1.2fr] antialiased">
        <section className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/50 shadow-xl p-lg rounded-xl flex flex-col gap-lg">
          <div className="flex flex-col gap-xs">
            <h2 className="font-h2 text-h2 text-on-surface">{currentUser?.displayName || "Anonymous User"}</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant opacity-70">{currentUser?.email}</p>
          </div>

          <div className="flex flex-col gap-md border-t border-outline-variant/30 pt-lg">
            <div className="flex flex-col gap-base">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase">Default Identity Role</label>
              <div className="grid gap-xs">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleRoleChange(r.id)}
                    className={`flex items-center gap-md px-md py-sm rounded-lg border transition-all ${role === r.id ? "bg-primary/5 border-primary text-primary" : "bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container-low"}`}
                  >
                    <AppIcon name={r.icon} className="h-5 w-5" />
                    <span className="font-body-sm text-body-sm font-bold uppercase tracking-tight">{r.label}</span>
                    {role === r.id && <AppIcon name="verified" className="ml-auto h-[18px] w-[18px]" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-base">
              <label className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.2em] mb-2">Visual Interface</label>
              <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-1.5 flex gap-1.5">
                <button 
                  onClick={() => userProfile?.preferences?.theme !== "light" && toggleTheme()} 
                  className={`flex-1 flex items-center justify-center gap-3 px-md py-3.5 rounded-xl transition-all font-bold text-[11px] uppercase tracking-widest ${userProfile?.preferences?.theme === "light" ? "bg-white text-primary shadow-lg border border-primary/10" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"}`}
                >
                  <AppIcon name="light_mode" className={`h-5 w-5 ${userProfile?.preferences?.theme === "light" ? "text-primary" : "opacity-40"}`} />
                  Light
                </button>
                <button 
                  onClick={() => userProfile?.preferences?.theme !== "dark" && toggleTheme()} 
                  className={`flex-1 flex items-center justify-center gap-3 px-md py-3.5 rounded-xl transition-all font-bold text-[11px] uppercase tracking-widest ${userProfile?.preferences?.theme === "dark" ? "bg-[#020617] text-white shadow-lg border border-white/10" : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"}`}
                >
                  <AppIcon name="dark_mode" className={`h-5 w-5 ${userProfile?.preferences?.theme === "dark" ? "text-primary" : "opacity-40"}`} />
                  Dark
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-lg">
          <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/50 shadow-xl p-lg rounded-xl flex flex-col gap-lg">
            <h2 className="font-h2 text-h2 text-on-surface">Telemetry & Usage</h2>
            <div className="grid gap-md md:grid-cols-3">
              <div className="bg-surface border border-outline-variant rounded-xl p-md flex flex-col gap-base shadow-sm">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase opacity-70">Total Audits</span>
                <span className="font-display-lg text-display-lg text-on-surface">{usageStats.totalCases || 0}</span>
              </div>
              <div className="bg-surface border border-outline-variant rounded-xl p-md flex flex-col gap-base shadow-sm">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase opacity-70">Mean Variance</span>
                <span className="font-display-lg text-display-lg text-primary">{usageStats.averageBias || 0}%</span>
              </div>
              <div className="bg-surface border border-outline-variant rounded-xl p-md flex flex-col gap-base shadow-sm overflow-hidden">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase opacity-70">Last Log</span>
                <span className="font-body-sm text-[11px] font-bold text-on-surface uppercase truncate mt-xs">{lastActivity}</span>
              </div>
            </div>
          </div>

          {(role === "engineer" || role === "admin") && (
            <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/50 shadow-xl p-lg rounded-xl flex flex-col gap-md">
              <div className="flex items-center justify-between">
                <h2 className="font-h2 text-h2 text-on-surface">Provider Keys</h2>
                <span className="px-xs py-[2px] bg-primary/10 text-primary text-[10px] font-bold rounded uppercase">Active</span>
              </div>
              <div className="bg-surface border border-outline-variant rounded-xl p-md flex items-center justify-between">
                <div className="flex flex-col gap-[2px]">
                  <span className="font-label-caps text-[10px] text-on-surface-variant uppercase opacity-60">Consensus Providers</span>
                  <p className="font-body-sm text-body-sm text-on-surface font-bold uppercase tracking-tighter">
                    {apiKeys.length > 0 ? `${apiKeys.length} Keys Configured` : "No keys stored in vault"}
                  </p>
                </div>
                <button className="text-on-surface-variant hover:text-primary transition-colors">
                  <AppIcon name="settings" className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
