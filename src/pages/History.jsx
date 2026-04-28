import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/Layout";
import AppIcon from "../components/AppIcon";
import { useApp } from "../context/AppContext";
import { DOMAIN_LABELS } from "../services/engine";
import { deleteCase } from "../services/firestore";

export default function History() {
  const { cases } = useApp();
  const [filters, setFilters] = useState({ domain: "all", mode: "all" });

  const filteredCases = useMemo(
    () =>
      cases.filter(
        (entry) =>
          (filters.domain === "all" || entry.domain === filters.domain) &&
          (filters.mode === "all" || entry.mode === filters.mode),
      ),
    [cases, filters],
  );

  return (
    <AppShell title="Audit Vault">
      <div className="flex flex-col gap-lg antialiased">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-lg">
          <div>
            <p className="font-body-main text-body-main text-on-surface-variant mt-1">Review and manage your complete historical audit database.</p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={filters.domain} 
              onChange={(e) => setFilters(prev => ({ ...prev, domain: e.target.value }))}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 font-label-caps text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Domains</option>
              {Object.entries(DOMAIN_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <select 
              value={filters.mode} 
              onChange={(e) => setFilters(prev => ({ ...prev, mode: e.target.value }))}
              className="bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 font-label-caps text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Modes</option>
              <option value="normal">Normal</option>
              <option value="pro">Pro</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-grid_gutter">
          <div className="lg:col-span-12 flex flex-col gap-md">
            {filteredCases.length > 0 ? (
              <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/20 bg-surface-container-low/30">
                      <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Case ID</th>
                      <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Domain</th>
                      <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Date</th>
                      <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Risk Score</th>
                      <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Status</th>
                      <th className="py-4 px-6 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map((entry) => (
                      <tr key={entry.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50 transition-colors group">
                        <td className="py-4 px-6">
                          <span className="font-mono text-[12px] font-bold text-primary">#{entry.id.slice(-6).toUpperCase()}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <AppIcon name={entry.domain === 'banking' ? 'payments' : 'work'} className="h-[18px] w-[18px] text-outline" />
                            <span className="font-body-sm text-[13px] text-on-surface font-medium uppercase tracking-tight">{DOMAIN_LABELS[entry.domain] || entry.domain}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-body-sm text-[12px] text-on-surface-variant">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                              <div className={`h-full ${entry.finalResult?.bias_score > 50 ? 'bg-error' : 'bg-primary'}`} style={{ width: `${entry.finalResult?.bias_score || 0}%` }} />
                            </div>
                            <span className="font-body-sm text-[11px] font-bold">{entry.finalResult?.bias_score || 0}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${entry.status === 'completed' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-tertiary/5 border-tertiary/20 text-tertiary'}`}>
                            {entry.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link to={`/results/${entry.id}`} className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors">
                              <AppIcon name="visibility" className="h-5 w-5" />
                            </Link>
                            <button onClick={() => deleteCase(entry.id)} className="p-2 hover:bg-error/10 text-error rounded-lg transition-colors">
                              <AppIcon name="delete" className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-2xl p-xl flex flex-col items-center justify-center text-center">
                <AppIcon name="folder_open" className="h-16 w-16 text-outline-variant mb-4" />
                <h3 className="font-h2 text-h2 text-on-surface mb-2">No Records Found</h3>
                <p className="text-on-surface-variant max-w-sm">You haven't run any fairness audits yet, or your current filters yielded no results.</p>
                <Link to="/new-test" className="mt-md px-6 py-2.5 bg-primary text-on-primary rounded-xl font-label-caps text-label-caps font-bold uppercase tracking-widest shadow-lg">
                  Start New Audit
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
