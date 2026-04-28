import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/Layout";
import AppIcon from "../components/AppIcon";
import { useApp } from "../context/AppContext";
import { saveProviderKey } from "../services/ai";
import { AI_MODELS, AI_PROVIDERS } from "../services/aiCatalog";
import { normalizeAuditConfig } from "../services/engine";

const MODEL_OPTIONS = AI_MODELS.map((model) => ({
  id: model.id,
  name: model.label,
  provider: AI_PROVIDERS.find((provider) => provider.id === model.providerId)?.label || model.providerId,
  desc: model.description,
  icon: model.icon,
  color: "text-primary",
  bg: "bg-primary/10",
}));

const TWIN_INTENSITIES = [
  { id: "low", label: "Fast", detail: "Few twins, quick directional check." },
  { id: "medium", label: "Balanced", detail: "Moderate twin set and standard stress." },
  { id: "high", label: "Deep", detail: "Largest counterfactual set and stronger bias surfacing." },
];

const EXPLANATION_DEPTHS = [
  { id: "brief", label: "Brief" },
  { id: "standard", label: "Standard" },
  { id: "deep", label: "Deep" },
];

const AGGREGATION_OPTIONS = [
  { id: "majority", label: "Majority" },
  { id: "strict", label: "Strict" },
  { id: "weighted", label: "Weighted" },
];

export default function ProMode() {
  const navigate = useNavigate();
  const {
    selectedAIs,
    debateRounds,
    apiKeys,
    refreshApiKeys,
    updateProfileSettings,
    userProfile,
    setMode,
  } = useApp();
  const [apiKeyForm, setApiKeyForm] = useState({ provider: "", key: "" });
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [message, setMessage] = useState("");

  const auditConfig = useMemo(() => normalizeAuditConfig(userProfile?.proSettings), [userProfile?.proSettings]);
  const proSettings = userProfile?.proSettings ?? {};

  const linkedProvidersCount = useMemo(
    () => AI_PROVIDERS.filter((provider) => apiKeys.some((key) => key.provider === provider.id)).length,
    [apiKeys],
  );

  const enabledModels = useMemo(
    () => AI_MODELS.filter((model) => apiKeys.some((key) => key.provider === model.providerId)),
    [apiKeys],
  );

  const persistProSettings = async (patch) => {
    await updateProfileSettings({
      proSettings: {
        ...(userProfile?.proSettings ?? {}),
        ...patch,
      },
    });
  };

  const toggleAI = async (id) => {
    const next = selectedAIs.includes(id)
      ? selectedAIs.filter((ai) => ai !== id)
      : [...selectedAIs, id];

    if (next.length === 0) {
      setMessage("At least one intelligence engine must stay active.");
      return;
    }

    setMessage("");
    await persistProSettings({ selectedAIs: next });
  };

  const handleSaveKey = async () => {
    if (!apiKeyForm.provider || !apiKeyForm.key) return;
    setSaving(true);
    setMessage("");
    try {
      await saveProviderKey(apiKeyForm);
      await refreshApiKeys();
      setApiKeyForm({ provider: "", key: "" });
      setMessage("Provider access synced.");
    } catch (error) {
      setMessage(error.message || "Unable to sync provider key.");
    } finally {
      setSaving(false);
    }
  };

  const handleLaunch = async () => {
    setLaunching(true);
    setMessage("");
    try {
      await persistProSettings({
        defaultMode: "pro",
        debateRounds,
      });
      setMode("pro");
      navigate("/new-test");
    } finally {
      setLaunching(false);
    }
  };

  return (
    <AppShell title="Pro Mode Setup">
      <div className="flex flex-col gap-lg antialiased">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-[0.3em] font-black text-[10px]">Consensus Orchestration</span>
            <h1 className="font-h1 text-5xl text-on-surface mt-2 tracking-tighter">Advanced Pro Runtime</h1>
            <p className="font-body-main text-body-main text-on-surface-variant mt-4 leading-relaxed">
              Configure the multi-model review stack, counterfactual stress depth, and explanation policy used by high-trust audits.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-container-lowest/90 border border-outline-variant/30 rounded-2xl p-4 text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Linked</div>
              <div className="text-2xl font-bold text-on-surface mt-1">{linkedProvidersCount}</div>
            </div>
            <div className="bg-surface-container-lowest/90 border border-outline-variant/30 rounded-2xl p-4 text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Active Models</div>
              <div className="text-2xl font-bold text-on-surface mt-1">{selectedAIs.length}</div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-primary">Twin Depth</div>
              <div className="text-2xl font-bold text-primary mt-1">{auditConfig.maxTwins}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-grid_gutter">
          <div className="lg:col-span-8 flex flex-col gap-grid_gutter">
            <section className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-[20px] p-md">
              <div className="flex items-center justify-between mb-md">
                <div>
                  <h2 className="font-h2 text-h2 text-on-background">Intelligence Engines</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Select the models that participate in consensus review.</p>
                </div>
                <span className="font-label-caps text-[10px] font-bold text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full uppercase tracking-widest">
                  Persisted to Profile
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                {MODEL_OPTIONS.map((model) => {
                  const isSelected = selectedAIs.includes(model.id);
                  const hasKey = apiKeys.some((key) => key.provider === AI_MODELS.find((entry) => entry.id === model.id)?.providerId);

                  return (
                    <button
                      key={model.id}
                      type="button"
                      disabled={!hasKey}
                      onClick={() => toggleAI(model.id)}
                      className={`relative flex flex-col p-md rounded-[16px] border-2 transition-all text-left ${isSelected ? "bg-primary/5 border-primary shadow-md" : "bg-surface border-outline-variant/30 hover:border-primary/50"} ${!hasKey ? "opacity-60 grayscale cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-start justify-between w-full mb-3">
                        <div className={`w-10 h-10 rounded-xl ${model.bg} flex items-center justify-center ${model.color}`}>
                          <AppIcon name={model.icon} className="h-6 w-6" />
                        </div>
                        <input type="checkbox" checked={isSelected} readOnly className="w-5 h-5 rounded border-outline-variant text-primary mt-1" />
                      </div>
                      <div className="font-body-main text-body-main font-bold text-on-background uppercase tracking-tight">{model.name}</div>
                      <div className="font-body-sm text-[12px] text-on-surface-variant mt-1 leading-snug">{model.desc}</div>
                      <div className="absolute top-3 right-10">
                        <span className={`font-label-caps text-[9px] px-2 py-[2px] rounded-full uppercase tracking-tighter font-black ${hasKey ? "bg-primary/10 text-primary" : "bg-error-container text-on-error-container"}`}>
                          {hasKey ? "Ready" : "Key Missing"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-[20px] p-md">
              <div className="grid gap-lg md:grid-cols-2">
                <div className="flex flex-col gap-md">
                  <div>
                    <h3 className="font-body-main text-body-main font-bold text-on-background flex items-center gap-2 uppercase tracking-tight">
                      <AppIcon name="layers" className="h-5 w-5 text-primary" />
                      Debate Rounds
                    </h3>
                    <p className="font-body-sm text-[12px] text-on-surface-variant mt-1">Higher rounds increase agreement checks and analysis cost.</p>
                  </div>
                  <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/30 shadow-inner">
                    {[1, 2, 3, 4].map((round) => (
                      <button
                        key={round}
                        type="button"
                        onClick={() => persistProSettings({ debateRounds: round })}
                        className={`px-6 py-2 font-label-caps text-[11px] font-bold rounded-lg transition-all ${debateRounds === round ? "bg-surface-container-lowest text-primary shadow-lg border border-outline-variant/20" : "text-on-surface-variant hover:text-on-background"}`}
                      >
                        {round}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-md">
                  <div>
                    <h3 className="font-body-main text-body-main font-bold text-on-background uppercase tracking-tight">Twin Intensity</h3>
                    <p className="font-body-sm text-[12px] text-on-surface-variant mt-1">Controls how aggressively protected attributes are mutated.</p>
                  </div>
                  <div className="grid gap-2">
                    {TWIN_INTENSITIES.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => persistProSettings({ twinIntensity: entry.id })}
                        className={`flex items-start justify-between rounded-xl border px-4 py-3 text-left transition-all ${auditConfig.intensity === entry.id ? "bg-primary/5 border-primary/40 text-primary" : "bg-surface border-outline-variant text-on-surface-variant"}`}
                      >
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-widest">{entry.label}</div>
                          <div className="text-[11px] mt-1 opacity-70">{entry.detail}</div>
                        </div>
                        {auditConfig.intensity === entry.id && <AppIcon name="verified" className="h-4 w-4 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-md">
                  <div className="flex justify-between items-center">
                    <h3 className="font-body-main text-body-main font-bold text-on-background uppercase tracking-tight">Bias Threshold</h3>
                    <span className="text-[10px] font-black text-primary font-mono bg-primary/5 px-2 py-0.5 rounded">{auditConfig.biasThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="70"
                    step="5"
                    value={auditConfig.biasThreshold}
                    onChange={(e) => persistProSettings({ biasThreshold: Number(e.target.value) })}
                    className="w-full accent-primary h-1.5 bg-surface-container-high rounded-full appearance-none cursor-pointer"
                  />
                  <div className="text-[11px] text-on-surface-variant">Alerts and fairness severity use this threshold as the primary red-line.</div>
                </div>

                <div className="flex flex-col gap-md">
                  <div className="flex justify-between items-center">
                    <h3 className="font-body-main text-body-main font-bold text-on-background uppercase tracking-tight">Twin Volume</h3>
                    <span className="text-[10px] font-black text-primary font-mono bg-primary/5 px-2 py-0.5 rounded">{auditConfig.maxTwins}</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="16"
                    step="2"
                    value={auditConfig.maxTwins}
                    onChange={(e) => persistProSettings({ maxTwins: Number(e.target.value) })}
                    className="w-full accent-primary h-1.5 bg-surface-container-high rounded-full appearance-none cursor-pointer"
                  />
                  <div className="text-[11px] text-on-surface-variant">More twins increase counterfactual coverage and runtime.</div>
                </div>
              </div>
            </section>

            <section className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-[20px] p-md">
              <div className="grid gap-lg md:grid-cols-2">
                <div>
                  <h3 className="font-body-main text-body-main font-bold text-on-background uppercase tracking-tight mb-3">Sensitive Attributes</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["age", "gender", "region", "incomeGroup"].map((attr) => {
                      const selected = auditConfig.attributesToVary.includes(attr);
                      const current = userProfile?.proSettings?.sensitiveAttributes || ["age", "gender", "region"];
                      const next = selected ? current.filter((entry) => entry !== attr) : [...current, attr];
                      return (
                        <button
                          key={attr}
                          type="button"
                          onClick={() => next.length > 0 && persistProSettings({ sensitiveAttributes: next })}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-[10px] font-bold uppercase transition-all ${selected ? "bg-primary/5 border-primary/40 text-primary shadow-sm" : "bg-surface border-outline-variant text-on-surface-variant opacity-60 hover:opacity-100"}`}
                        >
                          <AppIcon name={selected ? "task_alt" : "radio_button_unchecked"} className="h-[18px] w-[18px]" />
                          {attr}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-lg">
                  <div>
                    <h3 className="font-body-main text-body-main font-bold text-on-background uppercase tracking-tight mb-3">Explanation Depth</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {EXPLANATION_DEPTHS.map((depth) => (
                        <button
                          key={depth.id}
                          type="button"
                          onClick={() => persistProSettings({ explanationDepth: depth.id })}
                          className={`px-3 py-2 rounded-xl border text-[10px] font-bold uppercase transition-all ${auditConfig.explanationDepth === depth.id ? "bg-primary/5 border-primary/40 text-primary" : "bg-surface border-outline-variant text-on-surface-variant"}`}
                        >
                          {depth.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-body-main text-body-main font-bold text-on-background uppercase tracking-tight mb-3">Aggregation Strategy</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {AGGREGATION_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => persistProSettings({ aggregationStrategy: option.id })}
                          className={`px-3 py-2 rounded-xl border text-[10px] font-bold uppercase transition-all ${proSettings.aggregationStrategy === option.id || (!proSettings.aggregationStrategy && option.id === "majority") ? "bg-primary/5 border-primary/40 text-primary" : "bg-surface border-outline-variant text-on-surface-variant"}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-grid_gutter">
            <section className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-[20px] p-md">
              <div className="mb-md border-b border-outline-variant/20 pb-sm">
                <h2 className="font-h2 text-h2 text-on-background flex items-center gap-2">
                  <AppIcon name="vpn_key" className="h-5 w-5 text-on-surface-variant" />
                  API Key Manager
                </h2>
                <p className="font-body-sm text-[12px] text-on-surface-variant mt-2 leading-relaxed">Link external providers used by the consensus engine.</p>
              </div>

              <div className="flex flex-col gap-sm">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-caps text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Target Model</label>
                  <select
                    value={apiKeyForm.provider}
                    onChange={(e) => setApiKeyForm((prev) => ({ ...prev, provider: e.target.value }))}
                    className="w-full bg-surface-bright border border-outline-variant rounded-xl px-3 py-2.5 font-body-sm text-body-sm text-on-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  >
                    <option value="">Select a model...</option>
                    <option value="openai">OpenAI</option>
                    <option value="claude">Anthropic</option>
                    <option value="gemini">Google Gemini</option>
                  </select>
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="font-label-caps text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Secret Key</label>
                  <input
                    type="password"
                    placeholder="sk-****************"
                    value={apiKeyForm.key}
                    onChange={(e) => setApiKeyForm((prev) => ({ ...prev, key: e.target.value }))}
                    className="w-full bg-surface-bright border border-outline-variant rounded-xl px-3 py-2.5 font-mono text-[12px] text-on-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveKey}
                  disabled={saving || !apiKeyForm.provider || !apiKeyForm.key}
                  className="w-full mt-sm bg-primary text-on-primary font-label-caps text-label-caps uppercase py-sm rounded-xl hover:bg-primary/90 transition-all shadow-lg flex items-center justify-center gap-xs font-bold disabled:opacity-50"
                >
                  <AppIcon name={saving ? "sync" : "save"} className={`h-5 w-5 ${saving ? "animate-spin" : ""}`} />
                  {saving ? "Syncing..." : "Sync Key to Vault"}
                </button>
              </div>
            </section>

            <section className="bg-primary/5 border border-primary/20 rounded-[20px] p-md">
              <div className="flex items-center gap-3 mb-4">
                <AppIcon name="analytics" className="h-5 w-5 text-primary" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-primary">Launch Summary</h3>
              </div>
              <div className="space-y-3 text-[12px] text-on-surface">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Ready providers</span>
                  <span className="font-bold">{linkedProvidersCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Selectable models</span>
                  <span className="font-bold">{enabledModels.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Rounds</span>
                  <span className="font-bold">{debateRounds}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Explanation</span>
                  <span className="font-bold uppercase">{auditConfig.explanationDepth}</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {message ? (
          <div className="px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface">
            {message}
          </div>
        ) : null}

        <div className="mt-xl pt-lg border-t border-outline-variant/20 flex justify-end gap-sm pb-xl">
          <button
            type="button"
            onClick={() => persistProSettings({
              selectedAIs: ["gemini-flash", "openai-gpt4o-mini"],
              debateRounds: 2,
              twinIntensity: "medium",
              maxTwins: 12,
              biasThreshold: 20,
              sensitiveAttributes: ["age", "gender", "region"],
              explanationDepth: "brief",
              aggregationStrategy: "majority",
            })}
            className="px-6 py-2.5 rounded-xl font-label-caps text-[11px] font-bold text-on-surface border border-outline-variant bg-surface-bright hover:bg-surface-container-low transition-colors uppercase tracking-widest"
          >
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={handleLaunch}
            disabled={launching}
            className="px-6 py-2.5 rounded-xl font-label-caps text-[11px] font-bold text-on-primary bg-primary hover:bg-primary/90 shadow-lg transition-all flex items-center gap-2 uppercase tracking-widest disabled:opacity-50"
          >
            <AppIcon name={launching ? "sync" : "play_arrow"} className={`h-5 w-5 ${launching ? "animate-spin" : ""}`} />
            {launching ? "Launching..." : "Open Pro Audit"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
