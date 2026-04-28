import React from "react";
import { AppShell } from "../components/Layout";
import { useApp } from "../context/AppContext";

export default function Reports() {
  const { latestCase } = useApp();

  return (
    <AppShell title="Reports">
      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl backdrop-blur">
        <h2 className="text-xl font-semibold text-white">Exportable Fairness Report</h2>
        {latestCase ? (
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <p>Decision: <span className="font-semibold text-white">{latestCase.finalResult?.final_decision || latestCase.finalResult?.decision}</span></p>
            <p>Bias Score: <span className="font-semibold text-white">{latestCase.finalResult?.bias_score}%</span></p>
            <p>Violations: {(latestCase.finalResult?.violations || []).length}</p>
            <p>Recommendations: {(latestCase.finalResult?.recommendations || []).length}</p>
            <button type="button" className="mt-3 rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950">Generate PDF Summary</button>
          </div>
        ) : (
          <p className="mt-5 text-sm text-slate-400">Run a test to generate a reportable fairness summary.</p>
        )}
      </div>
    </AppShell>
  );
}
