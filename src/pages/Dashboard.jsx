import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/Layout";
import AppIcon from "../components/AppIcon";
import { useApp } from "../context/AppContext";
import { DOMAIN_LABELS } from "../services/engine";
import Chatbox from "../components/Chatbox";

export default function Dashboard() {
  const { latestCase, cases, usageStats, role } = useApp();

  const trendData = useMemo(
    () => [...cases].reverse().map((entry, index) => ({ 
      name: `T-${index + 1}`, 
      biasScore: Number(entry.finalResult?.bias_score ?? entry.finalResult?.biasScore ?? 0) 
    })),
    [cases]
  );

  return (
    <AppShell title="Executive Overview">
      <div className="flex flex-col gap-lg antialiased">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-md">
          <div>
            <span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest opacity-60 font-bold">Systems Operational</span>
            <h1 className="font-h1 text-h1 text-on-surface mt-1">Status: Governance Active</h1>
          </div>
          <Link 
            to="/new-test" 
            className="px-6 py-3 rounded-xl bg-primary text-on-primary font-label-caps text-label-caps uppercase tracking-widest font-bold shadow-lg hover:shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <AppIcon name="add_circle" className="h-5 w-5" />
            Initiate Fairness Audit
          </Link>
        </div>

        {/* Neural Core Status Banner */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 mb-lg animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                 <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                    <AppIcon name="diamond" className="h-[18px] w-[18px]" />
                 </div>
                 <div className="w-10 h-10 rounded-full bg-secondary/20 border-2 border-surface-container-lowest flex items-center justify-center text-secondary shadow-sm">
                    <AppIcon name="bolt" className="h-[18px] w-[18px]" />
                 </div>
              </div>
              <div>
                 <div className="text-[11px] font-black text-on-surface uppercase tracking-tight">Neural Core Active</div>
                 <div className="text-[9px] text-on-surface-variant font-bold uppercase tracking-widest opacity-60">Gemini 1.5 Pro & GPT-4o Nodes Operational</div>
              </div>
           </div>
           <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-black text-primary uppercase tracking-widest">Mandatory System Sync Complete</span>
           </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-grid_gutter">
          <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-2xl p-md relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Tests Run (Total)</span>
              <AppIcon name="science" className="h-6 w-6 text-primary/40" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-display-lg text-on-surface">{usageStats.totalCases}</span>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">+12%</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-2xl p-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-tertiary" />
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Avg Bias Score</span>
              <AppIcon name="balance" className="h-6 w-6 text-tertiary/40" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display-lg text-display-lg text-on-surface">{usageStats.averageBias}%</span>
              <span className="text-[10px] font-bold text-error bg-error/10 px-2 py-0.5 rounded-full">+0.4</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-2xl p-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
            <div className="flex justify-between items-start mb-4">
              <span className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Vault Integrity</span>
              <AppIcon name="vpn_lock" className="h-6 w-6 text-secondary/40" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="font-display-md text-2xl text-on-surface uppercase tracking-tight">Verified</span>
                <span className="text-[9px] text-secondary font-black uppercase tracking-widest">Resiliency Active</span>
              </div>
              <div className="ml-auto w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                 <AppIcon name="check_circle" className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-grid_gutter">
          {/* Trend Section (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-grid_gutter">
            <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-2xl p-lg flex flex-col min-h-[400px]">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="font-h2 text-h2 text-on-surface">Compliance Trend</h3>
                  <p className="text-sm text-on-surface-variant mt-1">Cross-model fairness scoring over recent audits.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Bias Score</span>
                </div>
              </div>
              
              <div className="flex-1 flex items-end justify-between gap-4 px-4 pb-4 overflow-x-auto">
                {trendData.length > 0 ? trendData.slice(-10).map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group min-w-[40px]">
                    <div className="w-full relative flex items-end justify-center min-h-[200px]">
                      <div 
                        className={`w-8 rounded-t-lg transition-all duration-1000 group-hover:scale-x-110 ${d.biasScore > 50 ? "bg-gradient-to-t from-error/20 to-error" : "bg-gradient-to-t from-primary/20 to-primary"}`} 
                        style={{ height: `${Math.max(d.biasScore, 5)}%` }} 
                      />
                      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-container-highest text-on-surface text-[10px] font-bold px-2 py-1 rounded shadow-lg z-20">
                        {d.biasScore}%
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-outline uppercase tracking-tighter whitespace-nowrap">{d.name}</span>
                  </div>
                )) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-outline-variant py-xl">
                    <AppIcon name="bar_chart" className="h-12 w-12 mb-4" />
                    <p className="font-label-caps text-label-caps uppercase tracking-widest">No audit data available yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Panels (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-grid_gutter">
            {/* Latest Case Snapshot */}
            <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-2xl p-lg">
              <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest opacity-60 font-bold mb-6">Recent Assessment</h3>
              {latestCase ? (
                <div className="flex flex-col gap-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <AppIcon name={latestCase.domain === 'banking' ? 'payments' : 'work'} className="h-7 w-7" />
                    </div>
                    <div>
                      <div className="font-body-main text-body-main font-bold text-on-surface uppercase tracking-tight">{DOMAIN_LABELS[latestCase.domain] || latestCase.domain}</div>
                      <div className="text-[10px] text-outline font-bold uppercase tracking-widest mt-0.5">#{latestCase.id.slice(-6)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-md pt-md border-t border-outline-variant/10">
                    <div>
                      <div className="text-[9px] text-outline font-bold uppercase tracking-widest">Result</div>
                      <div className={`text-sm font-bold mt-1 ${latestCase.finalResult?.riskLevel === 'High' ? 'text-error' : 'text-primary'}`}>
                        {latestCase.finalResult?.riskLevel || 'Processing'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-outline font-bold uppercase tracking-widest">Bias Score</div>
                      <div className="text-sm font-bold text-on-surface mt-1">{latestCase.finalResult?.bias_score ?? '--'}%</div>
                    </div>
                  </div>
                  <Link to={`/results/${latestCase.id}`} className="mt-md w-full py-2 bg-surface-container-high hover:bg-surface-container-highest rounded-lg text-center text-[10px] font-bold uppercase tracking-widest transition-colors">
                    View Full Report
                  </Link>
                </div>
              ) : (
                <div className="py-xl text-center text-outline-variant italic text-sm">
                  Initialize your first audit to see results here.
                </div>
              )}
            </div>

            {/* Quick Support / Chatbox Integration */}
            <div className="flex-1 min-h-[300px]">
              <Chatbox />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
