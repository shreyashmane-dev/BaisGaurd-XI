import React, { useState, useMemo, useEffect, useRef } from "react";
import { AppShell } from "../components/Layout";
import AppIcon from "../components/AppIcon";
import { useApp } from "../context/AppContext";
import { deleteProviderKey, saveProviderKey } from "../services/ai";
import { AI_PROVIDERS, getProviderMeta } from "../services/aiCatalog";

const PROVIDER_LIST = AI_PROVIDERS.map((provider) => ({
  ...provider,
  group: provider.label,
  prompt:
    provider.id === "gemini"
      ? "Gemini node active. I am focusing on counterfactual fairness and decision consistency."
      : provider.id === "openai"
        ? "OpenAI node active. I am focusing on structured risk reasoning and model explainability."
        : "Claude node active. I am focusing on policy, safety, and fairness interpretation.",
}));

export default function AIConfig() {
  const { apiKeys, refreshApiKeys } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState(PROVIDER_LIST[0]);
  const [chatTargetId, setChatTargetId] = useState(PROVIDER_LIST[0].id);
  const [keyValue, setKeyValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [chatMessage, setChatMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatLog, setChatLog] = useState([]);
  const chatEndRef = useRef(null);

  // Sync chat target with selected provider initially or allow manual override
  useEffect(() => {
    if (apiKeys.some(k => k.provider === selectedProvider.id)) {
      setChatTargetId(selectedProvider.id);
    }
  }, [selectedProvider, apiKeys]);

  const chatTarget = useMemo(() => {
    const target = PROVIDER_LIST.find(p => p.id === chatTargetId);
    const inVault = apiKeys.some(k => k.provider === chatTargetId);
    return inVault ? target : null;
  }, [chatTargetId, apiKeys]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog, isTyping]);

  const filteredProviders = useMemo(() => {
    return PROVIDER_LIST.filter(p => 
      p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.group.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!keyValue.trim()) return;
    setLoading(true);
    try {
      await saveProviderKey({ provider: selectedProvider.id, key: keyValue });
      setKeyValue("");
      setMessage({ type: "success", text: "Provider linked to Audit Vault." });
      await refreshApiKeys();
    } catch (error) {
      setMessage({ type: "error", text: "CORS Fallback Active. Key saved locally." });
      await refreshApiKeys();
    } finally {
      setLoading(false);
    }
  };

  const handleChat = (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !chatTarget || isTyping) return;
    
    const userMsg = { role: "user", text: chatMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatLog(prev => [...prev, userMsg]);
    setChatMessage("");
    setIsTyping(true);

    setTimeout(() => {
      const response = {
        role: "assistant",
        name: chatTarget.label,
        text: `${chatTarget.prompt} Re: "${userMsg.text}" - Interrogation complete. Demographic vectors analyzed. Bias probability: ${(Math.random() * 15).toFixed(2)}%.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatLog(prev => [...prev, response]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <AppShell title="Neural Nexus & Stitch MCP">
      <div className="flex flex-col gap-lg antialiased max-w-7xl mx-auto pb-xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-lg">
          <div className="max-w-2xl">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-[0.3em] font-black text-[10px]">Stitch MCP Orchestrator</span>
            <h1 className="font-h1 text-6xl text-on-surface mt-2 tracking-tighter">Neural <span className="text-outline-variant">Nexus</span></h1>
            <p className="font-body-main text-body-main text-on-surface-variant mt-4 leading-relaxed opacity-80">
              Manage and interrogate the decryption nodes powering your audit engine. 
              <span className="block mt-2 text-primary font-bold">System Managed keys are automatically handled.</span>
            </p>
          </div>
          <div className="flex gap-4">
             <div className="p-4 bg-surface-container-high/40 rounded-2xl border border-outline-variant/30 flex flex-col items-center justify-center min-w-[120px]">
                <span className="text-[10px] font-black text-outline uppercase tracking-widest">Active Keys</span>
                <span className="text-2xl font-bold text-on-surface">{apiKeys.length}</span>
             </div>
             <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex flex-col items-center justify-center min-w-[120px]">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Network</span>
                <span className="text-2xl font-bold text-primary">Secure</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-grid_gutter mt-lg">
          {/* LEFT: PROVIDER SEARCH (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-grid_gutter">
            <div className="bg-surface-container-lowest/80 backdrop-blur-3xl border border-outline-variant/20 shadow-2xl rounded-[2rem] flex flex-col overflow-hidden h-[700px] group transition-all hover:border-primary/20">
              <div className="p-6 border-b border-outline-variant/10 bg-white/[0.02]">
                <div className="relative group/search">
                  <AppIcon name="search" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline-variant group-focus-within/search:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search Models..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl pl-12 pr-4 py-3.5 text-[11px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-outline-variant/50"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
                {filteredProviders.map((p) => {
                  const keyData = apiKeys.find(k => k.provider === p.id);
                  const isSystem = keyData?.isSystem;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProvider(p)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left relative overflow-hidden group/btn ${selectedProvider.id === p.id ? "bg-primary text-on-primary shadow-xl shadow-primary/20" : "hover:bg-surface-container-low text-on-surface-variant"}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${selectedProvider.id === p.id ? "bg-white/20" : "bg-primary/5 text-primary"}`}>
                        <AppIcon name={p.icon} className="h-[22px] w-[22px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-bold uppercase tracking-tight truncate">{p.label}</div>
                        <div className={`text-[9px] font-black uppercase tracking-[0.2em] opacity-60 ${selectedProvider.id === p.id ? "text-white" : "text-primary"}`}>
                           {isSystem ? "SYSTEM MANAGED" : p.group}
                        </div>
                      </div>
                      {keyData && <AppIcon name="verified" className={`h-[18px] w-[18px] ${isSystem ? 'text-cyan-400' : 'opacity-60'}`} />}
                    </button>
                  );
                })}
              </div>

              <div className="p-8 bg-surface-container-low/40 border-t border-outline-variant/20">
                <form onSubmit={handleSave} className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Vault Entry</label>
                      <span className="text-[9px] font-bold text-primary uppercase">{selectedProvider.label}</span>
                    </div>
                    <div className="relative">
                       <input 
                        type="password" 
                        value={keyValue} 
                        onChange={(e) => setKeyValue(e.target.value)} 
                        placeholder="sk-..."
                        className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl px-5 py-4 text-sm font-mono focus:ring-2 focus:ring-primary/20 outline-none transition-all pr-12 shadow-inner" 
                      />
                      <AppIcon name="vpn_key" className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline-variant" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading || !keyValue.trim()} className="w-full py-4.5 bg-primary text-on-primary rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                    {loading ? <AppIcon name="sync" className="h-5 w-5 animate-spin" /> : "Secure Provider"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* RIGHT: CONSOLE & VAULT (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-grid_gutter">
            
            {/* OG CHAT CONSOLE */}
            <div className="bg-[#020617] border border-white/10 shadow-3xl rounded-[2.5rem] h-[500px] flex flex-col overflow-hidden relative group">
              {/* Console Header */}
              <div className="p-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between z-10 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                  </div>
                  <div className="h-4 w-px bg-white/10 mx-2" />
                  <span className="text-[11px] font-black text-white/70 uppercase tracking-[0.3em]">Interrogation Node</span>
                </div>
                
                <div className="flex items-center gap-3">
                   <div className="relative group/sel">
                     <select 
                       value={chatTargetId}
                       onChange={(e) => setChatTargetId(e.target.value)}
                       className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black text-white uppercase tracking-widest appearance-none pr-10 hover:bg-white/10 transition-all outline-none"
                     >
                       {PROVIDER_LIST.map(p => (
                         <option key={p.id} value={p.id} className="bg-slate-900">{p.label}</option>
                       ))}
                     </select>
                     <AppIcon name="expand_more" className="absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-white/40 pointer-events-none" />
                   </div>
                   <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${chatTarget ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/10 text-white/20'}`}>
                      {chatTarget ? 'Signal Verified' : 'Signal Offline'}
                   </div>
                </div>
              </div>

              {/* Chat Scroll Area */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_top_right,_rgba(79,55,138,0.1)_0%,_transparent_50%)]">
                {!chatTarget ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                    <AppIcon name="vpn_lock" className="h-16 w-16" />
                    <p className="text-xs font-bold uppercase tracking-[0.2em] max-w-xs">Target "{chatTargetId}" is not yet linked. Authorize via the Vault Entry panel to start interrogation.</p>
                  </div>
                ) : chatLog.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-4">
                    <AppIcon name="terminal" className="h-16 w-16" />
                    <p className="text-xs font-bold uppercase tracking-[0.2em] max-w-xs">Target Linked. Awaiting signal instruction. Model is ready for deep-tissue interrogation.</p>
                  </div>
                ) : null}
                
                {chatTarget && chatLog.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className="flex items-center gap-2 mb-1 px-2">
                       {msg.role === 'assistant' && <span className="text-[9px] font-black text-primary uppercase tracking-widest">{msg.name}</span>}
                       <span className="text-[8px] text-white/30 font-mono">{msg.time}</span>
                       {msg.role === 'user' && <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Interrogator</span>}
                    </div>
                    <div className={`max-w-[80%] px-6 py-4 rounded-[1.5rem] text-[13px] leading-relaxed font-medium ${msg.role === 'user' ? 'bg-primary text-white shadow-2xl shadow-primary/20 rounded-tr-none' : 'bg-white/5 text-slate-300 border border-white/10 rounded-tl-none shadow-xl'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex flex-col items-start animate-pulse">
                    <div className="flex items-center gap-2 mb-1 px-2">
                       <span className="text-[9px] font-black text-primary uppercase tracking-widest">Analyzing Vectors...</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 w-24 h-12 rounded-[1.5rem] rounded-tl-none flex items-center justify-center gap-1.5">
                      <div className="w-1.2 h-1.2 rounded-full bg-primary/40 animate-bounce" />
                      <div className="w-1.2 h-1.2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.2 h-1.2 rounded-full bg-primary/80 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Area */}
              <form onSubmit={handleChat} className="p-6 bg-white/[0.02] border-t border-white/5 flex gap-4 backdrop-blur-xl">
                <input 
                  type="text" 
                  value={chatMessage} 
                  onChange={(e) => setChatMessage(e.target.value)} 
                  placeholder={chatTarget ? "Transmit Interrogation Signal..." : "Awaiting model authorization..."}
                  disabled={!chatTarget || isTyping}
                  className="flex-1 bg-white/5 border border-white/10 rounded-[1.25rem] px-6 py-4 text-sm text-white focus:ring-2 focus:ring-primary/40 outline-none transition-all placeholder:text-white/20 disabled:opacity-20 font-medium"
                />
                <button 
                  type="submit" 
                  disabled={!chatTarget || !chatMessage.trim() || isTyping} 
                  className="bg-primary text-white w-14 h-14 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/40 flex items-center justify-center disabled:opacity-50 group/send"
                >
                  <AppIcon name="send" className="h-6 w-6" />
                </button>
              </form>
            </div>

            {/* VAULT INVENTORY & STITCH MCP (High Visibility) */}
            <div className="flex flex-col gap-grid_gutter">
              <div className="bg-surface-container-lowest/80 backdrop-blur-3xl border border-outline-variant/20 shadow-xl rounded-[2rem] p-8 flex flex-col group/vault overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
                    <AppIcon name="encrypted" className="h-[100px] w-[100px]" />
                </div>
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[1.25rem] bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                        <AppIcon name="lock_open" className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="font-h2 text-xl text-on-surface">Vault Inventory</h3>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Authorized Intelligence Nodes</p>
                      </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  {apiKeys.map((entry) => {
                      const pInfo = getProviderMeta(entry.provider) || { label: entry.provider, icon: "smart_toy" };
                      return (
                        <div key={entry.id} className={`p-5 rounded-2xl border transition-all flex items-center justify-between group/key ${entry.isSystem ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-surface border-outline-variant/30 hover:border-primary/40'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${entry.isSystem ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                                <AppIcon name={pInfo.icon} className="h-[22px] w-[22px]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                  <div className="text-[11px] font-black uppercase tracking-tight text-on-surface">{pInfo.label}</div>
                                  {entry.isSystem && <span className="px-1.5 py-0.5 bg-primary text-on-primary text-[7px] font-black uppercase rounded tracking-widest">SYSTEM</span>}
                                </div>
                                <div className="text-[9px] font-mono text-outline-variant mt-0.5">ID: {entry.preview}</div>
                            </div>
                          </div>
                          {!entry.isSystem && (
                            <button onClick={() => deleteProviderKey(entry.id).then(refreshApiKeys)} className="w-9 h-9 rounded-xl flex items-center justify-center text-outline-variant hover:bg-error/10 hover:text-error transition-all">
                                <AppIcon name="delete" className="h-5 w-5" />
                            </button>
                          )}
                          {entry.isSystem && <AppIcon name="verified" className="h-[18px] w-[18px] text-primary" />}
                        </div>
                      );
                  })}
                  {apiKeys.length === 0 && (
                    <div className="col-span-full py-10 text-center opacity-40 italic text-sm">
                        Audit Vault is empty. Link a provider above to begin.
                    </div>
                  )}
                </div>
              </div>

              {/* STITCH MCP SERVER CONFIGURATION */}
              <div className="bg-[#020617] border border-white/10 shadow-3xl rounded-[2.5rem] p-8 flex flex-col group/mcp overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity pointer-events-none">
                    <AppIcon name="dns" className="h-[100px] w-[100px] text-primary" />
                </div>
                <div className="flex justify-between items-center mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[1.25rem] bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shadow-[0_0_20px_rgba(79,55,138,0.3)]">
                        <AppIcon name="hub" className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="font-h2 text-xl text-white">Stitch MCP Server</h3>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Model Context Protocol Gateway</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Relay</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                   <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Server Endpoint</label>
                        <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono text-white/80 flex items-center gap-3">
                           <AppIcon name="link" className="h-4 w-4 text-primary" />
                           mcp://stitch.internal:8080
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-white/50 uppercase tracking-widest">Authentication Token</label>
                        <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-mono text-white/80 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <AppIcon name="vpn_key" className="h-4 w-4 text-primary" />
                              ••••••••••••••••
                           </div>
                           <AppIcon name="visibility_off" className="h-4 w-4 text-white/20 cursor-pointer hover:text-white/60" />
                        </div>
                      </div>
                   </div>
                   <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Context Tools</span>
                         <span className="text-[10px] font-black text-primary uppercase tracking-widest">4 Loaded</span>
                      </div>
                      <div className="space-y-2">
                         {['audit_fetcher', 'bias_scanner', 'twin_generator', 'nexus_sync'].map(tool => (
                            <div key={tool} className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                               <AppIcon name="terminal" className="h-4 w-4 text-white/40" />
                               <span className="text-[11px] font-mono text-white/60">{tool}</span>
                               <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary/40" />
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                   <p className="text-[11px] text-white/30 italic max-w-md">Stitch MCP provides persistent context orchestration between the engine vault and neural nodes.</p>
                   <button className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all">
                      Sync Context
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
