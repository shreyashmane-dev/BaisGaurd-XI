import React from "react";
import { AppShell } from "../components/Layout";
import AppIcon from "../components/AppIcon";

export default function DebateLogs() {
  const debateRounds = [
    {
      round: 1,
      timestamp: "14:20:05",
      status: "Analyzing Discrepancies",
      agents: [
        { name: "Gemini Pro", role: "Primary Analyzer", text: "I have identified a statistically significant bias trigger in the 'Income' variable when correlated with 'Age'. The model's baseline shows a 15% lower approval for this cohort despite higher credit scores.", status: "completed" },
        { name: "GPT-4 Turbo", role: "Cross-Validator", text: "My evaluation confirms Gemini's finding. However, I also detect a secondary bias layer in the 'Geospatial' data. Specific zip codes are being penalized regardless of individual creditworthiness.", status: "completed" }
      ]
    },
    {
      round: 2,
      timestamp: "14:20:12",
      status: "Synthesizing Consensus",
      agents: [
        { name: "Claude 3 Opus", role: "Semantic Critic", text: "Reviewing Round 1 outputs. The Geospatial penalty mentioned by GPT-4 appears to be a proxy for demographic features. I recommend a weighted reduction on zip code influence by 0.4.", status: "completed" },
        { name: "Gemini Pro", role: "Primary Analyzer", text: "Acknowledged. Recalculating variance with Claude's suggestion. The bias delta has dropped from 0.82 to 0.45. Proceeding to final aggregation.", status: "completed" }
      ]
    }
  ];

  return (
    <AppShell title="Agent Debate Logs">
      <div className="flex flex-col gap-lg antialiased">
        <div className="mb-lg">
          <p className="font-body-main text-body-main text-on-surface-variant max-w-2xl mt-2 leading-relaxed">
            Real-time audit of the recursive consensus process. Watch how different intelligence engines challenge each other's bias detection results to reach a verified conclusion.
          </p>
        </div>

        <div className="flex flex-col gap-xl">
          {debateRounds.map((round, rIdx) => (
            <div key={rIdx} className="relative pl-8">
              {/* Timeline Connector */}
              <div className="absolute left-[11px] top-4 bottom-[-48px] w-[2px] bg-outline-variant/30 hidden sm:block" />
              
              {/* Round Badge */}
              <div className="absolute left-0 top-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-on-primary z-10 shadow-lg ring-4 ring-surface-bright">
                {round.round}
              </div>

              <div className="flex flex-col gap-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-h2 text-h2 text-on-background">Round {round.round}: {round.status}</h3>
                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest bg-surface-container px-2 py-0.5 rounded">{round.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Active Processing</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-grid_gutter">
                  {round.agents.map((agent, aIdx) => (
                    <div key={aIdx} className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-2xl p-md flex flex-col relative group hover:border-primary/40 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${agent.name.includes('Gemini') ? 'bg-blue-100 text-blue-600' : agent.name.includes('GPT') ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                            <AppIcon name={agent.name.includes('Gemini') ? 'magic_button' : agent.name.includes('GPT') ? 'forum' : 'psychology_alt'} className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-body-main text-body-main font-bold text-on-background uppercase tracking-tight leading-none">{agent.name}</div>
                            <div className="font-label-caps text-[9px] text-on-surface-variant font-bold uppercase tracking-widest mt-1 opacity-60">{agent.role}</div>
                          </div>
                        </div>
                        <AppIcon name="verified" className="h-5 w-5 text-primary/30" />
                      </div>
                      
                      <div className="bg-surface-container-low/50 rounded-xl p-sm border border-outline-variant/10 flex-1">
                        <p className="font-body-sm text-[13px] text-on-surface leading-relaxed italic opacity-90">
                          "{agent.text}"
                        </p>
                      </div>

                      <div className="mt-md pt-sm border-t border-outline-variant/10 flex justify-between items-center">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map(i => <div key={i} className="w-5 h-5 rounded-full border-2 border-surface bg-outline-variant/20" />)}
                        </div>
                        <span className="text-[9px] font-bold text-outline uppercase tracking-widest">Metadata Hash: 0x8a...4f37</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Console Footprint */}
        <div className="mt-xl bg-surface-container-highest/50 rounded-xl p-md border border-outline-variant/20 font-mono text-[11px] text-on-surface-variant overflow-hidden relative">
          <div className="flex items-center gap-2 mb-2 text-outline">
            <AppIcon name="terminal" className="h-4 w-4" />
            <span className="font-bold uppercase tracking-widest text-[9px]">Consensus Engine Logs</span>
          </div>
          <div className="space-y-1 opacity-60">
            <div>[SYSTEM] Initializing parallel request to Gemini-1.5-Pro and GPT-4-Turbo...</div>
            <div>[STREAMS] Receiving token buffers from 2/3 active providers...</div>
            <div>[LOGIC] Round 1 complete. High variance detected in 'Income' attribute.</div>
            <div>[SYSTEM] Triggering Round 2 recursive evaluation with Claude-3-Opus...</div>
            <div className="flex items-center gap-1">
              <span className="animate-pulse">_</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
