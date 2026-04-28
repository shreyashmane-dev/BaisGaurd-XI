import React from "react";
import { AppShell } from "../components/Layout";
import { useApp } from "../context/AppContext";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import AppIcon from "../components/AppIcon";

export default function Analytics() {
  const { usageStats, cases = [] } = useApp();

  return (
    <AppShell title="Analytics Dashboard">
      <div className="flex flex-col gap-lg antialiased">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-lg">
          <div>
            <p className="font-body-main text-body-main text-on-surface-variant mt-1">System-wide performance and bias distribution analysis.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm font-medium text-on-surface shadow-sm hover:bg-surface-container-low transition-colors">
              <AppIcon name="calendar_month" className="h-[18px] w-[18px]" />
              Last 30 Days
              <AppIcon name="expand_more" className="h-[18px] w-[18px] text-outline" />
            </button>
            <button className="flex items-center justify-center w-10 h-10 bg-primary text-on-primary rounded-lg shadow-sm hover:bg-primary/90 transition-colors" title="Export Report">
              <AppIcon name="download" className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-grid_gutter">
          {/* Avg Bias Score */}
          <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-xl p-6 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-tertiary"></div>
            <div className="flex justify-between items-start mb-4">
              <p className="font-label-caps text-label-caps text-on-surface-variant font-bold tracking-widest uppercase opacity-60">Avg Bias Score</p>
              <AppIcon name="balance" className="h-6 w-6 text-tertiary/50" />
            </div>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-display-lg text-display-lg text-on-surface">{usageStats.averageBias || "0"}</span>
              <span className={`text-sm font-medium flex items-center px-2 py-0.5 rounded-full ${usageStats.averageBias > 50 ? "bg-error/10 text-error" : "bg-primary/10 text-primary"}`}>
                {usageStats.averageBias > 50 ? "High Risk" : "Stable"}
              </span>
            </div>
            <div className="mt-auto">
              <div className="flex justify-between text-[10px] text-on-surface-variant mb-1 font-bold uppercase tracking-widest">
                <span>Fair (0)</span>
                <span>Critical (100)</span>
              </div>
              <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden flex relative backdrop-blur-sm shadow-inner">
                <div 
                  className="h-full bg-tertiary rounded-full transition-all duration-1000 ease-out" 
                  style={{ width: `${(usageStats.averageBias || 0)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Tests Run */}
          <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-xl p-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            <div className="flex justify-between items-start mb-4">
              <p className="font-label-caps text-label-caps text-on-surface-variant font-bold tracking-widest uppercase opacity-60">Lifetime Audits</p>
              <AppIcon name="science" className="h-6 w-6 text-primary/50" />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-display-lg text-display-lg text-on-surface">{usageStats.totalCases || "0"}</span>
              <span className="text-sm font-medium text-primary flex items-center bg-primary/10 px-2 py-0.5 rounded-full">
                Total Runs
              </span>
            </div>
            <div className="mt-auto pt-6 flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-primary" /> {usageStats.proModeCount} Pro Mode
              <span className="w-2 h-2 rounded-full bg-outline-variant ml-2" /> {(usageStats.totalCases - usageStats.proModeCount) || 0} Standard
            </div>
          </div>

          {/* High Risk Cases */}
          <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-xl p-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-error"></div>
            <div className="flex justify-between items-start mb-4">
              <p className="font-label-caps text-label-caps text-on-surface-variant font-bold tracking-widest uppercase opacity-60">Critical Flags</p>
              <AppIcon name="warning" className="h-6 w-6 text-error/50" />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-display-lg text-display-lg text-on-surface">
                {cases.filter(c => (c.finalResult?.bias_score || 0) > 50).length}
              </span>
              <span className="text-sm font-medium text-secondary flex items-center bg-surface-container px-2 py-0.5 rounded-full">
                {cases.length > 0 ? Math.round((cases.filter(c => (c.finalResult?.bias_score || 0) > 50).length / cases.length) * 100) : 0}% Ratio
              </span>
            </div>
            <div className="mt-auto pt-6">
              <Link to="/history" className="w-full py-2 bg-error/10 text-error rounded-lg font-bold text-[11px] uppercase tracking-widest hover:bg-error/20 transition-colors flex items-center justify-center gap-2">
                Review Critical Cases
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
              </Link>
            </div>
          </div>
        </div>

        {/* Bento Grid Layout for Charts */}
        <div className="grid grid-cols-12 gap-grid_gutter">
          {/* Bias Trend Line Graph (8 cols) */}
          <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-xl p-sm flex flex-col min-h-[400px]">
            <div className="px-4 pt-4 flex justify-between items-center mb-6">
              <div>
                <h3 className="font-h2 text-h2 text-on-surface">System Bias Trend</h3>
                <p className="text-sm text-on-surface-variant mt-1">Aggregated scoring over the last 30 days</p>
              </div>
              <button className="p-2 hover:bg-surface-container rounded-lg text-outline transition-colors">
                <AppIcon name="more_vert" className="h-5 w-5" />
              </button>
            </div>
            {/* Simulated Chart Canvas */}
            <div className="flex-1 relative w-full px-4 pb-8 flex items-end">
              <div className="absolute inset-0 px-4 pb-8 flex flex-col justify-between z-0 opacity-10">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="border-b border-on-surface w-full h-0" />)}
              </div>
              <div className="absolute bottom-0 left-4 right-4 flex justify-between text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-md">
                <span>Oct 1</span>
                <span>Oct 8</span>
                <span>Oct 15</span>
                <span>Oct 22</span>
                <span>Today</span>
              </div>
              <div className="w-full h-[90%] relative z-10 flex items-end justify-between px-md">
                <svg className="overflow-visible w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
                  <defs>
                    <linearGradient id="line-gradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#4f378a" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#4f378a" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,250 C100,220 200,260 300,180 C400,100 500,150 600,80 C700,10 800,120 900,60 C950,30 1000,70 1000,70 L1000,300 L0,300 Z" fill="url(#line-gradient)" />
                  <path d="M0,250 C100,220 200,260 300,180 C400,100 500,150 600,80 C700,10 800,120 900,60 C950,30 1000,70 1000,70" fill="none" stroke="#4f378a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
                  <circle cx="300" cy="180" fill="#ffffff" r="6" stroke="#4f378a" strokeWidth="3" />
                  <circle cx="600" cy="80" fill="#ffffff" r="6" stroke="#4f378a" strokeWidth="3" />
                  <circle cx="900" cy="60" fill="#4f378a" r="8" stroke="#ffffff" strokeWidth="3" />
                </svg>
              </div>
            </div>
          </div>

          {/* AI Agreement (Radar Simulation - 4 cols) */}
          <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-xl p-sm flex flex-col min-h-[400px]">
            <div className="px-4 pt-4 mb-4">
              <h3 className="font-h2 text-h2 text-on-surface">AI Agreement</h3>
              <p className="text-sm text-on-surface-variant mt-1">Variance across evaluation models</p>
            </div>
            <div className="flex-1 flex items-center justify-center relative p-4 scale-90">
              <svg className="overflow-visible" height="220" viewBox="0 0 100 100" width="220">
                <polygon fill="none" points="50,5 95,30 95,70 50,95 5,70 5,30" stroke="#e6e0e9" strokeWidth="1" />
                <polygon fill="none" points="50,20 80,40 80,60 50,80 20,60 20,40" stroke="#e6e0e9" strokeWidth="1" />
                <polygon fill="none" points="50,35 65,45 65,55 50,65 35,55 35,45" stroke="#e6e0e9" strokeWidth="1" />
                <line stroke="#e6e0e9" strokeWidth="1" x1="50" x2="50" y1="50" y2="5" />
                <line stroke="#e6e0e9" strokeWidth="1" x1="50" x2="95" y1="50" y2="30" />
                <line stroke="#e6e0e9" strokeWidth="1" x1="50" x2="95" y1="50" y2="70" />
                <line stroke="#e6e0e9" strokeWidth="1" x1="50" x2="50" y1="50" y2="95" />
                <line stroke="#e6e0e9" strokeWidth="1" x1="50" x2="5" y1="50" y2="70" />
                <line stroke="#e6e0e9" strokeWidth="1" x1="50" x2="5" y1="50" y2="30" />
                <polygon fill="#4f378a" fillOpacity="0.5" points="50,25 75,40 85,75 50,70 25,75 10,40" stroke="#4f378a" strokeLinejoin="round" strokeWidth="2" />
              </svg>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <span className="absolute top-0 text-[8px] font-bold text-on-surface-variant uppercase">Accuracy</span>
                <span className="absolute top-1/4 right-0 text-[8px] font-bold text-on-surface-variant uppercase">Recall</span>
                <span className="absolute bottom-1/4 right-0 text-[8px] font-bold text-on-surface-variant uppercase">F1 Score</span>
                <span className="absolute bottom-0 text-[8px] font-bold text-on-surface-variant uppercase">Precision</span>
                <span className="absolute bottom-1/4 left-0 text-[8px] font-bold text-on-surface-variant uppercase">Fairness</span>
                <span className="absolute top-1/4 left-0 text-[8px] font-bold text-on-surface-variant uppercase">Robustness</span>
              </div>
            </div>
            <div className="px-4 pb-4 mt-auto flex justify-center gap-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                <div className="w-2 h-2 rounded-sm bg-primary opacity-80" /> Model Alpha
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap (12 cols) */}
        <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-xl p-sm flex flex-col">
          <div className="px-4 pt-4 mb-6 flex justify-between items-center">
            <div>
              <h3 className="font-h2 text-h2 text-on-surface">Bias Distribution Heatmap</h3>
              <p className="text-sm text-on-surface-variant mt-1">Cross-section analysis of demographic features vs. regional impact</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-outline uppercase tracking-widest">
              <span>Low Bias</span>
              <div className="w-24 h-2 rounded-full bg-gradient-to-r from-surface-container-high to-primary"></div>
              <span>High Bias</span>
            </div>
          </div>
          <div className="w-full overflow-x-auto pb-4 px-4">
            <div className="min-w-[800px] grid grid-cols-6 gap-1">
              <div className="h-10" />
              {['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East'].map(reg => (
                <div key={reg} className="h-10 flex items-center justify-center text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-center">{reg}</div>
              ))}
              {['Gender Identity', 'Age Cohort', 'Income Level', 'Education'].map(feat => (
                <React.Fragment key={feat}>
                  <div className="h-12 flex items-center justify-end pr-4 text-[11px] font-bold text-on-surface uppercase tracking-tight">{feat}</div>
                  {[1, 2, 3, 4, 5].map(i => {
                    const intensity = Math.random();
                    return (
                      <div 
                        key={i} 
                        className={`h-12 rounded transition-all hover:scale-[1.02] cursor-help shadow-sm ${intensity > 0.8 ? 'bg-primary' : intensity > 0.5 ? 'bg-primary/40' : intensity > 0.2 ? 'bg-primary/10' : 'bg-surface-container-high'}`}
                        title={`Bias Intensity: ${intensity.toFixed(2)}`}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
