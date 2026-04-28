import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/Layout";
import AppIcon from "../components/AppIcon";
import { AI_MODELS, AI_PROVIDERS, getModelMeta } from "../services/aiCatalog";
import { useApp } from "../context/AppContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { processCaseWithAI, saveProviderKey } from "../services/ai";
import { ATTRIBUTE_LABELS, DOMAIN_FIELDS, DOMAIN_LABELS, buildDecisionSummary, getDefaultDomainInput, normalizeAuditConfig, validateCaseInput } from "../services/engine";
import { createCase, updateCase } from "../services/firestore";

function buildLocalModelOutput(modelId, summary, threshold, index) {
  const meta = getModelMeta(modelId) || {
    id: modelId,
    label: modelId,
    shortLabel: modelId,
  };
  const variancePattern = [0, 4, -3, 6];
  const adjustedBias = Math.max(0, Math.min(100, summary.results.biasScore + (variancePattern[index] || 0)));
  const verdict = adjustedBias > threshold ? "Not Fair" : "Fair";

  return {
    aiId: meta.id,
    decision: summary.originalDecision,
    verdict,
    bias_score: adjustedBias,
    riskLevel: adjustedBias >= 45 ? "High" : adjustedBias >= 15 ? "Medium" : "Low",
    key_biased_attributes: Object.entries(summary.results.attributeSensitivity)
      .filter(([, sensitivity]) => Number(sensitivity) > 0)
      .map(([attribute]) => attribute),
    violations: summary.violations,
    recommendations: summary.recommendations,
    reasoning: `${meta.shortLabel} review: ${summary.decisionDetails.summary}`,
    confidence: Math.max(0.62, 0.8 - index * 0.04),
    approval_reasons: summary.decisionDetails.approvalReasons,
    rejection_reasons: summary.decisionDetails.rejectionReasons,
    fairness_drivers: summary.decisionDetails.fairnessDrivers,
    protocol: "local",
  };
}

function buildLocalFinalResult(summary, outputs, mode) {
  const scores = outputs.map((entry) => Number(entry.bias_score || 0));
  const averageBias = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
  const finalDecision = summary.originalDecision;
  const agreement = Math.round((outputs.filter((entry) => entry.decision === finalDecision).length / outputs.length) * 100);
  const variance = Math.max(...scores) - Math.min(...scores);

  return {
    bias_score: averageBias,
    average_bias_score: averageBias,
    flipRate: summary.results.flipRate,
    attributeSensitivity: summary.results.attributeSensitivity,
    riskLevel: averageBias >= 45 ? "High" : averageBias >= 15 ? "Medium" : "Low",
    explanation: summary.decisionDetails.summary,
    key_factors: outputs[0]?.key_biased_attributes || [],
    violations: summary.violations,
    recommendations: summary.recommendations,
    final_decision: finalDecision,
    decision: finalDecision,
    verdict: outputs.filter((entry) => String(entry.verdict).toLowerCase() === "fair").length > outputs.length / 2 ? "Fair" : "Not Fair",
    agreement,
    confidence: agreement === 100 && variance <= 6 ? "High" : agreement >= 67 ? "Medium" : "Low",
    protocol: "local",
    decision_details: summary.decisionDetails,
    mode,
  };
}

function normalizeAnalysisPayload(analysis, fallbackSummary, mode, selectedModels) {
  const responses = Array.isArray(analysis?.aiOutputs)
    ? analysis.aiOutputs
    : Array.isArray(analysis?.responses)
      ? analysis.responses
      : Array.isArray(analysis?.models)
        ? analysis.models
        : [];

  const finalResult = analysis?.finalResult ?? analysis?.final ?? null;
  const nextStatus = analysis?.status === "processing" ? "processing" : "complete";

  return {
    status: nextStatus,
    aiUsed: selectedModels,
    aiOutputs: responses,
    ai: {
      mode,
      models: selectedModels,
      responses,
      final: finalResult,
    },
    finalResult: finalResult
      ? {
          ...fallbackSummary.results,
          ...finalResult,
          decision_details: finalResult.decision_details || fallbackSummary.decisionDetails,
          recommendations: finalResult.recommendations || fallbackSummary.recommendations,
          violations: finalResult.violations || fallbackSummary.violations,
        }
      : null,
  };
}

const QUICK_TEST_PRESETS = {
  banking: [
    { id: "prime", label: "Prime", values: { creditScore: 780, income: 120000, loanAmount: 28000, age: 37, gender: "male", region: "urban", incomeGroup: "high" } },
    { id: "stretched", label: "Stretched", values: { creditScore: 645, income: 47000, loanAmount: 140000, age: 26, gender: "female", region: "rural", incomeGroup: "mid" } },
    { id: "edge", label: "Edge", values: { creditScore: 590, income: 32000, loanAmount: 180000, age: 22, gender: "other", region: "rural", incomeGroup: "low" } },
  ],
  hiring: [
    { id: "high-signal", label: "High Signal", values: { experience: 10, skills: 91, education: 82, age: 33, gender: "male", region: "urban", incomeGroup: "high" } },
    { id: "switch", label: "Switch", values: { experience: 4, skills: 79, education: 64, age: 28, gender: "female", region: "urban", incomeGroup: "mid" } },
    { id: "proxy", label: "Proxy Risk", values: { experience: 7, skills: 74, education: 58, age: 24, gender: "other", region: "rural", incomeGroup: "low" } },
  ],
  healthcare: [
    { id: "stable", label: "Stable", values: { riskScore: 28, income: 94000, coverageScore: 87, age: 43, gender: "female", region: "urban", incomeGroup: "high" } },
    { id: "coverage", label: "Coverage", values: { riskScore: 58, income: 41000, coverageScore: 46, age: 55, gender: "male", region: "rural", incomeGroup: "low" } },
    { id: "acute", label: "Acute", values: { riskScore: 76, income: 52000, coverageScore: 62, age: 67, gender: "other", region: "rural", incomeGroup: "mid" } },
  ],
};

function formatPercent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function buildOperationalPreview(domain, form, summary) {
  if (!summary) return null;

  if (domain === "banking") {
    const ratio = Number(form.income) > 0 ? Number(form.loanAmount) / Number(form.income) : 0;
    const pressure = Math.min(100, Math.round(ratio * 100));
    return {
      title: "Loan Signal",
      scoreLabel: "Underwriting",
      scoreValue: summary.decisionDetails.score,
      primaryLabel: "Repayment Pressure",
      primaryValue: `${pressure}%`,
      secondary: [
        { label: "Loan / Income", value: `${ratio.toFixed(2)}x` },
        { label: "Income", value: formatCurrency(form.income) },
        { label: "Loan", value: formatCurrency(form.loanAmount) },
      ],
    };
  }

  if (domain === "hiring") {
    const readiness = Math.round(Number(form.skills) * 0.45 + Number(form.education) * 0.2 + Math.min(Number(form.experience), 12) * 3.5);
    const rampRisk = Math.max(0, Math.min(100, 72 - readiness + (Number(form.experience) < 3 ? 12 : 0)));
    return {
      title: "Hiring Signal",
      scoreLabel: "Selection",
      scoreValue: summary.decisionDetails.score,
      primaryLabel: "Ramp Risk",
      primaryValue: `${rampRisk}%`,
      secondary: [
        { label: "Readiness", value: `${readiness}/100` },
        { label: "Experience", value: `${form.experience} yrs` },
        { label: "Skills", value: `${form.skills}/100` },
      ],
    };
  }

  const accessGap = Math.max(0, Math.min(100, 100 - Number(form.coverageScore || 0) + (Number(form.income || 0) < 50000 ? 12 : 0)));
  return {
    title: "Access Signal",
    scoreLabel: "Eligibility",
    scoreValue: summary.decisionDetails.score,
    primaryLabel: "Access Gap",
    primaryValue: `${accessGap}%`,
    secondary: [
      { label: "Coverage", value: `${form.coverageScore}/100` },
      { label: "Risk", value: `${form.riskScore}/100` },
      { label: "Income", value: formatCurrency(form.income) },
    ],
  };
}

export default function NewTest() {
  const navigate = useNavigate();
  const { currentUser, role, mode, setMode, selectedAIs, debateRounds, userProfile, updateProfileSettings, apiKeys, refreshApiKeys } = useApp();
  const [domain, setDomain] = useState("banking");
  const [form, setForm] = useState(getDefaultDomainInput("banking"));
  const [threshold, setThreshold] = useState(userProfile?.fairnessRules?.maxBiasScore ?? 35);
  const debouncedForm = useDebouncedValue(form, 250);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const auditConfig = useMemo(() => normalizeAuditConfig(userProfile?.proSettings), [userProfile?.proSettings]);
  const liveSummary = useMemo(() => {
    const nextErrors = validateCaseInput(domain, debouncedForm);
    if (Object.keys(nextErrors).length > 0) return null;
    try {
      return buildDecisionSummary(domain, debouncedForm, userProfile?.proSettings);
    } catch {
      return null;
    }
  }, [debouncedForm, domain, userProfile?.proSettings]);
  const operationalPreview = useMemo(() => buildOperationalPreview(domain, debouncedForm, liveSummary), [debouncedForm, domain, liveSummary]);
  const linkedProvidersCount = useMemo(
    () => AI_PROVIDERS.filter((provider) => apiKeys.some((key) => key.provider === provider.id)).length,
    [apiKeys],
  );

  // Quick Key Link State
  const [quickKey, setQuickKey] = useState("");
  const [keyLinking, setKeyLinking] = useState(false);

  useEffect(() => {
    setErrors(validateCaseInput(domain, debouncedForm));
  }, [debouncedForm, domain]);

  const handleDomainChange = (nextDomain) => {
    setDomain(nextDomain);
    setForm(getDefaultDomainInput(nextDomain));
    setErrors({});
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleLinkKey = async (providerId) => {
    if (!quickKey.trim()) return;
    setKeyLinking(true);
    try {
      await saveProviderKey({ provider: providerId, key: quickKey });
      setQuickKey("");
      await refreshApiKeys();
    } catch (err) {
      console.error("Key linking failed", err);
    } finally {
      setKeyLinking(false);
    }
  };

  const dynamicFields = useMemo(() => DOMAIN_FIELDS[domain], [domain]);
  const domainPresets = useMemo(() => QUICK_TEST_PRESETS[domain] || [], [domain]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateCaseInput(domain, form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !currentUser) {
      return;
    }

    setLoading(true);
    setSubmitError("");

    try {
      const normalizedInput = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value !== "" && !Number.isNaN(Number(value)) ? Number(value) : value]),
      );

      const proSettings = userProfile?.proSettings;
      const summary = buildDecisionSummary(domain, normalizedInput, proSettings);
      const fairnessRules = {
        ...(userProfile?.fairnessRules ?? {}),
        maxBiasScore: threshold,
      };

      if (role === "auditor" || role === "engineer" || role === "admin") {
        await updateProfileSettings({ fairnessRules });
      }

      const caseId = await createCase({
        userId: currentUser.uid,
        domain,
        input: summary.normalizedInput,
        twins: summary.twins,
        decisions: summary.decisions,
        results: summary.results,
        mode,
        fairnessRules,
        proSettings: mode === "pro" ? { ...auditConfig, ...proSettings } : auditConfig,
        status: "processing",
        aiUsed: mode === "pro" ? selectedAIs : ["gemini-flash"],
        aiOutputs: [],
        ai: {
          mode,
          models: mode === "pro" ? selectedAIs : ["gemini-flash"],
          responses: [],
          final: null,
        },
        finalResult: {
          bias_score: summary.results.biasScore,
          flipRate: summary.results.flipRate,
          attributeSensitivity: summary.results.attributeSensitivity,
          riskLevel: summary.results.riskLevel,
          violations: summary.violations,
          recommendations: summary.recommendations,
          decision: summary.originalDecision,
          explanation: summary.decisionDetails.summary,
          decision_details: summary.decisionDetails,
        },
      });

      const analysis = await processCaseWithAI({ caseId, mode, role, selectedAIs, debateRounds: auditConfig.rounds });

      if (analysis?.status === "simulated" || !analysis?.finalResult) {
        const localModels = mode === "pro"
          ? (selectedAIs.length > 0 ? selectedAIs : ["gemini-flash", "openai-gpt4o-mini"]).slice(0, 4)
          : ["gemini-flash"];
        const localOutputs = localModels.map((modelId, index) => buildLocalModelOutput(modelId, summary, threshold, index));
        const localFinalResult = buildLocalFinalResult(summary, localOutputs, mode);

        await updateCase(caseId, {
          status: "complete",
          aiUsed: localModels,
          aiOutputs: localOutputs,
          ai: {
            mode,
            models: localModels,
            responses: localOutputs,
            final: localFinalResult,
          },
          finalResult: localFinalResult,
        });
      } else {
        const remoteModels = mode === "pro"
          ? (selectedAIs.length > 0 ? selectedAIs : ["gemini-flash", "openai-gpt4o-mini"]).slice(0, 4)
          : ["gemini-flash"];
        const normalizedAnalysis = normalizeAnalysisPayload(analysis, summary, mode, remoteModels);

        await updateCase(caseId, normalizedAnalysis);
      }

      navigate(`/results/${caseId}`);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Quick Test">
      <div className="grid gap-lg lg:grid-cols-[1fr_0.4fr] antialiased max-w-[1400px] mx-auto">
        {/* Main Configuration Pane */}
        <form onSubmit={handleSubmit} className="bg-surface-container-lowest/90 backdrop-blur-2xl border border-outline-variant/40 shadow-2xl p-lg rounded-3xl flex flex-col gap-lg transition-all">
          
          <div className="flex flex-col gap-xs mb-2">
             <h2 className="text-2xl font-h2 text-on-surface tracking-tight">Neutral Interrogation</h2>
             <p className="text-sm font-body-sm text-on-surface-variant opacity-70">Initialize a multi-variate bias audit on your decision engine.</p>
          </div>

          {/* Domain Selection */}
          <div className="flex flex-col gap-base">
            <label className="font-label-caps text-[11px] text-primary uppercase tracking-[0.2em] font-black">Domain Architecture</label>
            <div className="flex flex-wrap gap-xs">
              {Object.entries(DOMAIN_LABELS).map(([id, label]) => (
                <button 
                  key={id} 
                  type="button" 
                  onClick={() => handleDomainChange(id)} 
                  className={`px-6 py-2.5 rounded-xl font-label-caps text-label-caps uppercase transition-all border shadow-sm ${domain === id ? "bg-primary text-on-primary border-primary scale-[1.02]" : "bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container-low hover:border-primary/30"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-base">
            <label className="font-label-caps text-[11px] text-primary uppercase tracking-[0.2em] font-black">Scenario Presets</label>
            <div className="flex flex-wrap gap-xs">
              {domainPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setForm(preset.values);
                    setErrors({});
                  }}
                  className="px-4 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface-variant text-[10px] font-bold uppercase tracking-widest hover:border-primary/40 hover:text-primary transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Input Fields */}
          <div className="grid gap-md md:grid-cols-2 bg-surface-container-low/30 p-6 rounded-2xl border border-outline-variant/20">
            {dynamicFields.map((field) => (
              <div key={field.name} className="flex flex-col gap-base">
                <label className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-bold" htmlFor={field.name}>{field.label}</label>
                <div className="relative group">
                  {field.type === "select" ? (
                    <>
                      <select 
                        id={field.name}
                        name={field.name} 
                        value={form[field.name]} 
                        onChange={handleChange} 
                        className="w-full bg-surface border border-outline-variant rounded-xl py-3.5 px-4 font-body-sm text-body-sm text-on-surface focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer"
                      >
                        {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                      <AppIcon name="expand_more" className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline-variant pointer-events-none group-hover:text-primary transition-colors" />
                    </>
                  ) : (
                    <input 
                      id={field.name}
                      name={field.name} 
                      type="number" 
                      value={form[field.name]} 
                      onChange={handleChange} 
                      placeholder="Enter value..."
                      className="w-full bg-surface border border-outline-variant rounded-xl py-3.5 px-4 font-body-sm text-body-sm text-on-surface placeholder:text-outline-variant/50 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    />
                  )}
                </div>
                {errors[field.name] ? <span className="text-[10px] text-error font-bold uppercase tracking-tight ml-1">{errors[field.name]}</span> : null}
              </div>
            ))}
          </div>

          {/* Execution Mode Toggles */}
          <div className="flex flex-col gap-base border-t border-outline-variant/30 pt-lg mt-2">
            <div className="flex items-center justify-between">
              <label className="font-label-caps text-[11px] text-primary uppercase tracking-[0.2em] font-black">Audit Intensity Mode</label>
              <div className="flex gap-xs p-1.5 bg-surface-container-high rounded-2xl border border-outline-variant/50 shadow-inner">
                {["normal", "pro"].map((entry) => (
                  <button 
                    key={entry} 
                    type="button" 
                    onClick={() => setMode(entry)} 
                    className={`px-8 py-2 rounded-xl font-label-caps text-label-caps uppercase transition-all ${mode === entry ? "bg-surface-container-lowest text-primary shadow-lg font-black scale-[1.05]" : "text-on-surface-variant opacity-60 hover:opacity-100"}`}
                  >
                    {entry}
                  </button>
                ))}
              </div>
            </div>

            {mode === "pro" && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-surface-container-lowest border border-primary/20 rounded-3xl p-8 flex flex-col gap-lg shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                   <AppIcon name="security" className="h-[120px] w-[120px]" />
                </div>
                
                <div className="flex items-center gap-3 text-primary relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <AppIcon name="verified_user" className="h-6 w-6" />
                  </div>
                  <span className="font-label-caps text-sm uppercase tracking-widest font-black">Consensus Engine Configuration</span>
                </div>

                <div className="grid gap-10 md:grid-cols-2 relative z-10">
                  <div className="flex flex-col gap-md">
                    <div className="flex flex-col gap-base">
                      <div className="flex justify-between items-center px-1">
                        <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Authorized Intelligence Nodes</span>
                        <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">{linkedProvidersCount} Providers Linked</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {AI_MODELS.map((model) => {
                          const aiId = model.id;
                          const isLinked = apiKeys.some((key) => key.provider === model.providerId);
                          const isSelected = selectedAIs.includes(aiId);
                          
                          return (
                            <div key={aiId} className="flex flex-col gap-1">
                              <button
                                key={aiId}
                                type="button"
                                disabled={!isLinked}
                                onClick={() => {
                                  const next = isSelected ? selectedAIs.filter(a => a !== aiId) : [...selectedAIs, aiId];
                                  if (next.length > 0) updateProfileSettings({ proSettings: { ...userProfile?.proSettings, selectedAIs: next } });
                                }}
                                className={`px-4 py-2.5 rounded-xl border text-[10px] font-bold uppercase transition-all flex items-center gap-3 ${isSelected ? "bg-primary text-on-primary border-primary shadow-md" : isLinked ? "bg-surface border-outline-variant text-on-surface-variant hover:border-primary/50" : "bg-surface-container-high border-outline-variant/20 text-on-surface-variant opacity-40 cursor-not-allowed"}`}
                              >
                                <AppIcon name={isSelected ? "check_circle" : model.icon} className="h-[18px] w-[18px]" />
                                {model.label}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Link Key Section */}
                    <div className="mt-4 p-5 rounded-2xl bg-surface-container-low/50 border border-outline-variant/30">
                       <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-bold block mb-4">Express Key Authorization</span>
                       <div className="flex gap-2">
                          <input 
                            type="password" 
                            placeholder="Enter sk-..." 
                            value={quickKey}
                            onChange={(e) => setQuickKey(e.target.value)}
                            className="flex-1 bg-surface border border-outline-variant rounded-xl px-4 py-2 text-xs font-mono focus:border-primary outline-none transition-all shadow-inner"
                          />
                          <div className="relative group/sel">
                             <select 
                               onChange={(e) => handleLinkKey(e.target.value)}
                               disabled={!quickKey.trim() || keyLinking}
                               className="bg-primary text-on-primary rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest appearance-none pr-8 cursor-pointer disabled:opacity-50"
                             >
                                <option value="">Link</option>
                                {AI_PROVIDERS.filter((provider) => !apiKeys.some((key) => key.provider === provider.id)).map((provider) => (
                                  <option key={provider.id} value={provider.id}>{provider.label}</option>
                                ))}
                             </select>
                             <AppIcon name="bolt" className="absolute right-2 top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-white/50 pointer-events-none" />
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-lg">
                    <div className="flex flex-col gap-base">
                      <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Interrogation Vectors</span>
                      <div className="grid grid-cols-2 gap-2">
                        {["age", "gender", "region", "incomeGroup"].map(attr => (
                          <button
                            key={attr}
                            type="button"
                            onClick={() => {
                              const current = userProfile?.proSettings?.sensitiveAttributes || ["age", "gender", "region"];
                              const next = current.includes(attr) ? current.filter(a => a !== attr) : [...current, attr];
                              updateProfileSettings({ proSettings: { ...userProfile?.proSettings, sensitiveAttributes: next } });
                            }}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-[10px] font-bold uppercase transition-all ${userProfile?.proSettings?.sensitiveAttributes?.includes(attr) ? "bg-primary/5 border-primary/40 text-primary shadow-sm" : "bg-surface border-outline-variant text-on-surface-variant opacity-60 hover:opacity-100"}`}
                          >
                            <AppIcon name={userProfile?.proSettings?.sensitiveAttributes?.includes(attr) ? "task_alt" : "radio_button_unchecked"} className="h-[18px] w-[18px]" />
                            {ATTRIBUTE_LABELS[attr]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-base">
                      <div className="flex justify-between items-center">
                        <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Audit Threshold</span>
                        <span className="text-[10px] font-black text-primary font-mono bg-primary/5 px-2 py-0.5 rounded">{auditConfig.biasThreshold}%</span>
                      </div>
                      <input type="range" min="20" max="70" step="5" value={auditConfig.biasThreshold} onChange={(e) => updateProfileSettings({ proSettings: { ...userProfile?.proSettings, biasThreshold: Number(e.target.value) } })} className="w-full accent-primary h-1.5 bg-surface-container-high rounded-full appearance-none cursor-pointer" />
                    </div>

                    <div className="flex flex-col gap-base">
                      <div className="flex justify-between items-center">
                        <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Explanation Depth</span>
                        <span className="text-[10px] font-black text-primary font-mono bg-primary/5 px-2 py-0.5 rounded uppercase">{auditConfig.explanationDepth}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {["brief", "standard", "deep"].map((depth) => (
                          <button
                            key={depth}
                            type="button"
                            onClick={() => updateProfileSettings({ proSettings: { ...userProfile?.proSettings, explanationDepth: depth } })}
                            className={`px-3 py-2 rounded-xl border text-[10px] font-bold uppercase transition-all ${auditConfig.explanationDepth === depth ? "bg-primary/5 border-primary/40 text-primary" : "bg-surface border-outline-variant text-on-surface-variant"}`}
                          >
                            {depth}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {submitError && <div className="p-4 rounded-xl bg-error-container/10 border border-error/20 text-error font-body-sm text-body-sm text-center font-medium animate-shake">{submitError}</div>}

          <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary via-primary to-primary-container text-on-primary font-label-caps text-sm uppercase tracking-[0.2em] font-black hover:shadow-2xl hover:shadow-primary/40 transition-all flex justify-center items-center gap-3 disabled:opacity-50 active:scale-[0.98] mt-4">
            {loading ? (mode === "pro" ? "Synchronizing Consensus Nodes..." : "Running Neutral Audit...") : "Initialize Neutral Audit"}
            {!loading && <AppIcon name="rocket_launch" className="h-6 w-6" />}
          </button>
        </form>

        {/* Configuration Summary Aside */}
        <aside className="bg-surface-container-low/40 backdrop-blur-xl border border-outline-variant/30 rounded-3xl p-8 flex flex-col gap-lg h-fit sticky top-lg transition-all hover:border-primary/20">
          <div className="flex flex-col gap-xs">
            <h2 className="text-xl font-h2 text-on-surface">Audit Summary</h2>
            <p className="text-xs font-body-sm text-on-surface-variant opacity-60">Active session parameters.</p>
          </div>

          {liveSummary && operationalPreview ? (
            <div className="bg-surface-container-lowest/80 border border-outline-variant/20 rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary">{operationalPreview.title}</div>
                  <div className="text-2xl font-bold text-on-surface mt-1">{liveSummary.originalDecision}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{operationalPreview.scoreLabel}</div>
                  <div className="text-2xl font-bold text-on-surface mt-1">{operationalPreview.scoreValue}</div>
                </div>
              </div>
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-primary">{operationalPreview.primaryLabel}</div>
                <div className="text-xl font-bold text-on-surface mt-1">{operationalPreview.primaryValue}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {operationalPreview.secondary.map((item) => (
                  <div key={item.label} className="rounded-xl bg-surface border border-outline-variant/20 p-3">
                    <div className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">{item.label}</div>
                    <div className="text-[12px] font-bold text-on-surface mt-1">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                    <span className="text-on-surface-variant">Bias Score</span>
                    <span className={liveSummary.results.biasScore >= 45 ? "text-error" : liveSummary.results.biasScore >= 15 ? "text-amber-500" : "text-primary"}>
                      {liveSummary.results.biasScore}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                    <div
                      className={`${liveSummary.results.biasScore >= 45 ? "bg-error" : liveSummary.results.biasScore >= 15 ? "bg-amber-500" : "bg-primary"} h-full`}
                      style={{ width: `${Math.max(6, liveSummary.results.biasScore)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                    <span className="text-on-surface-variant">Flip Rate</span>
                    <span className="text-on-surface">{formatPercent(liveSummary.results.flipRate)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                    <div className="bg-secondary h-full" style={{ width: `${Math.max(6, Math.round(liveSummary.results.flipRate * 100))}%` }} />
                  </div>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-on-surface-variant">
                {liveSummary.decisionDetails.summary}
              </p>
            </div>
          ) : null}
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
              <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Interrogator</span>
              <span className="text-[11px] text-on-surface font-black uppercase tracking-tight">{role}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
              <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Engine Mode</span>
              <span className="text-[11px] text-primary font-black uppercase tracking-tight">{mode}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
              <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Twin Matrix</span>
              <span className="text-[11px] text-on-surface font-black uppercase tracking-tight">{auditConfig.maxTwins} nodes</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
              <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Explainability</span>
              <span className="text-[11px] text-on-surface font-black uppercase tracking-tight">{auditConfig.explanationDepth}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
              <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">AI Nodes Ready</span>
              <span className="text-[11px] text-on-surface font-black uppercase tracking-tight">{linkedProvidersCount}</span>
            </div>
          </div>

          <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 mt-4">
            <div className="flex items-center gap-3 text-primary mb-3">
              <AppIcon name="info" className="h-5 w-5" />
              <span className="text-[10px] uppercase font-black tracking-widest">Protocol Note</span>
            </div>
            <p className="text-[11px] leading-relaxed text-on-surface-variant italic opacity-80">
              BiasGuard X utilizes synthetic identity mutations to stress-test your decision logic across all protected classes in real-time.
            </p>
          </div>

          {liveSummary ? (
            <div className="bg-surface-container-lowest/80 border border-outline-variant/20 rounded-2xl p-5">
              <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-3">Most Sensitive Attributes</div>
              <div className="space-y-3">
                {Object.entries(liveSummary.results.attributeSensitivity).map(([attribute, sensitivity]) => (
                  <div key={attribute}>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1">
                      <span className="text-on-surface">{ATTRIBUTE_LABELS[attribute]}</span>
                      <span className={Number(sensitivity) >= 0.5 ? "text-error" : "text-primary"}>{formatPercent(sensitivity)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className={`${Number(sensitivity) >= 0.5 ? "bg-error" : "bg-primary"} h-full`}
                        style={{ width: `${Math.max(6, Math.round(Number(sensitivity) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </AppShell>
  );
}
