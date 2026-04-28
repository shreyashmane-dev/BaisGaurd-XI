import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const ROLES = [
  { id: "analyst", title: "Analyst", body: "Run tests, inspect results, and chat in simple mode." },
  { id: "auditor", title: "Auditor", body: "Define fairness rules, tune thresholds, and compare detailed reports." },
  { id: "engineer", title: "Engineer", body: "Manage AI keys, model priority, raw outputs, and debug logs." },
  { id: "admin", title: "Admin", body: "Oversee users, global settings, security rules, and system usage." },
];

export default function RoleSelection() {
  const { completeRoleSelection, role } = useApp();
  const navigate = useNavigate();
  const [saving, setSaving] = useState("");

  useEffect(() => {
    if (role) {
      navigate("/dashboard", { replace: true });
    }
  }, [role, navigate]);

  const handleSelect = async (role) => {
    setSaving(role);
    await completeRoleSelection(role);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.15),_transparent_30%),linear-gradient(180deg,#020617,#0f172a)] px-4 py-10">
      <div className="w-full max-w-6xl rounded-[32px] border border-white/10 bg-slate-950/70 p-8 shadow-2xl backdrop-blur">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Choose Role</p>
          <h1 className="mt-4 text-4xl font-bold text-white">BiasGuard X adapts to how you inspect fairness.</h1>
          <p className="mt-4 text-base leading-7 text-slate-300">Pick your role to unlock the right level of testing, reporting, AI configuration, and system control.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {ROLES.map((role) => (
            <button key={role.id} type="button" onClick={() => handleSelect(role.id)} disabled={Boolean(saving)} className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-left transition hover:border-cyan-300/40 hover:bg-cyan-300/5">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">{role.id}</p>
              <h2 className="mt-4 text-2xl font-semibold text-white">{role.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{role.body}</p>
              <span className="mt-8 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
                {saving === role.id ? "Saving..." : `Continue as ${role.title}`}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
