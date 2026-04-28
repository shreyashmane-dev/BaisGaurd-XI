import React, { useMemo, useState } from "react";
import AppIcon from "./AppIcon";
import { chatWithCaseContext } from "../services/ai";
import { useApp } from "../context/AppContext";

export default function Chatbox() {
  const { latestCase, role } = useApp();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const suggestions = useMemo(
    () => [
      "Why was this application approved or rejected?",
      "Compare the model outputs for this case.",
      "Which protected attributes created the highest fairness risk?",
      "Summarize this audit for an executive stakeholder.",
      "What should we change in the decision rules first?",
    ],
    [],
  );

  const handleSubmit = async (event, presetMessage = "") => {
    event.preventDefault();
    const nextMessage = presetMessage || message;
    if (!nextMessage.trim()) {
      return;
    }

    setLoading(true);
    setError("");
    setMessages((current) => [...current, { role: "user", text: nextMessage }]);

    try {
      const result = await chatWithCaseContext({
        query: nextMessage,
        role,
        latestCaseId: latestCase?.id ?? null,
        latestCaseSnapshot: latestCase ?? null,
      });
      setMessages((current) => [...current, { role: "assistant", text: result.answer || "No response was returned." }]);
      setMessage("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#020617] border border-white/10 shadow-2xl rounded-[2.5rem] flex flex-col h-full min-h-[500px] overflow-hidden group">
      {/* Neural Header */}
      <div className="p-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between z-10 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shadow-[0_0_15px_rgba(79,55,138,0.2)]">
            <AppIcon name="psychology" className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-h2 text-white text-base font-bold tracking-tight">Neural Assistant</h3>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-black">Nexus Link Active</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors cursor-pointer">
              <AppIcon name="history" className="h-4 w-4" />
           </div>
           <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors cursor-pointer">
              <AppIcon name="more_vert" className="h-4 w-4" />
           </div>
        </div>
      </div>

      {/* Chat Space */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_top_right,_rgba(79,55,138,0.05)_0%,_transparent_50%)]">
        {messages.length > 0 ? (
          <div className="flex flex-col gap-6">
            {messages.map((entry, index) => (
              <div key={`${entry.role}-${index}`} className={`flex flex-col ${entry.role === "user" ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                <div className="flex items-center gap-2 mb-1.5 px-2">
                   {entry.role === 'assistant' && <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Neural Node</span>}
                   <span className="text-[8px] text-white/20 font-mono">03:42:11</span>
                   {entry.role === 'user' && <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Authorized Analyst</span>}
                </div>
                <div className={`${entry.role === "user" ? "bg-primary text-white shadow-[0_10px_30px_rgba(79,55,138,0.3)] rounded-tr-none" : "bg-white/5 border border-white/10 text-slate-300 rounded-tl-none"} max-w-[85%] rounded-[1.5rem] p-5 lg:p-6`}>
                  <p className="font-body-sm text-[13px] leading-relaxed whitespace-pre-line tracking-tight">{entry.text}</p>
                </div>
              </div>
            ))}
            {loading ? (
              <div className="flex flex-col items-start animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-1.5 px-2">
                   <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Neural Synthesis...</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-[1.5rem] rounded-tl-none p-6 flex flex-col gap-4 min-w-[200px]">
                   <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" />
                         <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
                         <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Interrogating Context</span>
                   </div>
                   <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-primary animate-progress-indefinite w-1/3" />
                   </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-12">
            <div className="relative">
               <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
               <AppIcon name="bubble_chart" className="h-20 w-20 text-primary relative z-10" />
            </div>
            <div className="space-y-2">
               <p className="font-label-caps text-white text-xs uppercase tracking-[0.4em] font-black opacity-40">Cognitive Hub</p>
               <h4 className="text-white/60 text-sm font-medium max-w-[280px] leading-relaxed">Advanced neural node ready for deep context interrogation.</h4>
            </div>
            <div className="grid gap-3 w-full max-w-sm">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={(event) => handleSubmit(event, suggestion)}
                  className="text-left bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-[11px] text-white/50 hover:border-primary/40 hover:text-white hover:bg-white/[0.06] transition-all flex items-center justify-between group/sug"
                >
                  <span className="truncate mr-4">{suggestion}</span>
                  <AppIcon name="chevron_right" className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Input */}
      <form onSubmit={handleSubmit} className="p-6 bg-white/[0.02] border-t border-white/5 backdrop-blur-xl">
        <div className="relative group/input">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={2}
            placeholder={role === "engineer" || role === "admin" ? "Transmit complex query..." : "Ask the assistant..."}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-5 pr-16 font-body-sm text-[13px] text-white outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all resize-none shadow-inner placeholder:text-white/20"
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="absolute right-3 bottom-3 w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-20 shadow-xl shadow-primary/20"
          >
            <AppIcon name={loading ? "sync" : "send"} className={`h-6 w-6 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {error && (
           <div className="flex items-center gap-2 mt-3 px-2 text-rose-500">
              <AppIcon name="error" className="h-3.5 w-3.5" />
              <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
           </div>
        )}
      </form>
    </div>
  );
}
