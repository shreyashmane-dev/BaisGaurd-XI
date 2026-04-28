import React, { useMemo, useState } from "react";
import { AppShell } from "../components/Layout";
import AppIcon from "../components/AppIcon";
import { DOMAIN_FIELDS, DOMAIN_LABELS, ATTRIBUTE_LABELS, buildDecisionSummary, getDefaultDomainInput } from "../services/engine";

const SCENARIO_PRESETS = {
  banking: [
    {
      id: "prime-borrower",
      label: "Prime",
      values: {
        creditScore: 782,
        income: 132000,
        loanAmount: 24000,
        age: 36,
        gender: "male",
        region: "urban",
        incomeGroup: "high",
      },
    },
    {
      id: "stretched-applicant",
      label: "Stretched",
      values: {
        creditScore: 641,
        income: 46000,
        loanAmount: 118000,
        age: 27,
        gender: "female",
        region: "rural",
        incomeGroup: "mid",
      },
    },
    {
      id: "edge-case",
      label: "Edge",
      values: {
        creditScore: 598,
        income: 31000,
        loanAmount: 165000,
        age: 23,
        gender: "other",
        region: "rural",
        incomeGroup: "low",
      },
    },
  ],
  hiring: [
    {
      id: "high-signal",
      label: "High Signal",
      values: {
        experience: 11,
        skills: 92,
        education: 84,
        age: 34,
        gender: "male",
        region: "urban",
        incomeGroup: "high",
      },
    },
    {
      id: "career-switch",
      label: "Switch",
      values: {
        experience: 4,
        skills: 81,
        education: 66,
        age: 29,
        gender: "female",
        region: "urban",
        incomeGroup: "mid",
      },
    },
    {
      id: "proxy-risk",
      label: "Proxy Risk",
      values: {
        experience: 7,
        skills: 76,
        education: 58,
        age: 24,
        gender: "other",
        region: "rural",
        incomeGroup: "low",
      },
    },
  ],
  healthcare: [
    {
      id: "covered-stable",
      label: "Stable",
      values: {
        riskScore: 24,
        income: 98000,
        coverageScore: 88,
        age: 42,
        gender: "female",
        region: "urban",
        incomeGroup: "high",
      },
    },
    {
      id: "coverage-gap",
      label: "Coverage",
      values: {
        riskScore: 61,
        income: 39000,
        coverageScore: 44,
        age: 57,
        gender: "male",
        region: "rural",
        incomeGroup: "low",
      },
    },
    {
      id: "acute-priority",
      label: "Acute",
      values: {
        riskScore: 79,
        income: 52000,
        coverageScore: 63,
        age: 68,
        gender: "other",
        region: "rural",
        incomeGroup: "mid",
      },
    },
  ],
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatPercent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

function getMetricTone(value, low, medium) {
  if (value >= medium) return "text-error";
  if (value >= low) return "text-amber-500";
  return "text-emerald-500";
}

function buildBankingSimulation(summary, input) {
  const monthlyIncome = Number(input.income || 0) / 12;
  const debtToIncome = monthlyIncome > 0 ? Number(input.loanAmount || 0) / (monthlyIncome * 12) : 0;
  const repaymentPressure = Math.min(100, Math.round(debtToIncome * 100));
  const affordabilityBuffer = Math.max(0, Math.round((Number(input.creditScore || 0) - 300) * 0.12 + (Number(input.income || 0) / 5000) - (Number(input.loanAmount || 0) / 12000)));
  const approvalLikelihood = Math.max(5, Math.min(97, 45 + summary.decisionDetails.margin * 1.4 - repaymentPressure * 0.2));
  const pricingBand =
    Number(input.creditScore) >= 760 ? "Prime pricing" :
    Number(input.creditScore) >= 680 ? "Near-prime pricing" :
    Number(input.creditScore) >= 620 ? "Subprime review" :
    "Manual decline watch";

  return {
    headline: summary.originalDecision === "APPROVED" ? "Loan Approved" : "Loan Declined",
    subheadline: "Consumer lending simulation",
    scoreLabel: "Underwriting Score",
    scoreValue: summary.decisionDetails.score,
    confidenceLabel: "Approval Likelihood",
    confidenceValue: `${Math.round(approvalLikelihood)}%`,
    primaryMetricLabel: "Repayment Pressure",
    primaryMetricValue: repaymentPressure,
    primaryMetricTone: getMetricTone(repaymentPressure, 35, 65),
    advisory:
      summary.results.biasScore >= 35
        ? "Fairness stress detected. Sensitive-attribute flips are large enough to affect approval consistency."
        : "Credit and affordability drive most of the outcome. Fairness drift is present but not dominant.",
    pills: [
      { label: "Pricing Band", value: pricingBand },
      { label: "Loan / Income", value: `${debtToIncome.toFixed(2)}x` },
      { label: "Buffer", value: `${affordabilityBuffer} pts` },
    ],
    drivers: [
      {
        name: "Credit strength",
        value: `${input.creditScore}`,
        detail: Number(input.creditScore) >= 700 ? "Credit quality is supporting approval velocity." : "Credit profile is adding default risk pressure.",
        icon: "vpn_lock",
        tone: Number(input.creditScore) >= 700 ? "positive" : "risk",
      },
      {
        name: "Affordability",
        value: formatCurrency(input.income),
        detail: monthlyIncome >= 5000 ? "Income coverage leaves room for monthly repayment." : "Income coverage is thin for the requested exposure.",
        icon: "account_balance",
        tone: monthlyIncome >= 5000 ? "positive" : "risk",
      },
      {
        name: "Debt load",
        value: formatCurrency(input.loanAmount),
        detail: repaymentPressure < 40 ? "Requested balance fits the current earning profile." : "Requested balance is oversized relative to earnings.",
        icon: "payments",
        tone: repaymentPressure < 40 ? "neutral" : "risk",
      },
      {
        name: "Fairness sensitivity",
        value: `${summary.results.biasScore}`,
        detail: summary.decisionDetails.fairnessDrivers[0],
        icon: "compare_arrows",
        tone: summary.results.biasScore >= 35 ? "risk" : "neutral",
      },
    ],
  };
}

function buildHiringSimulation(summary, input) {
  const readinessIndex = Math.round(
    Number(input.skills || 0) * 0.45 +
    Number(input.education || 0) * 0.2 +
    Math.min(Number(input.experience || 0), 12) * 3.5
  );
  const interviewLikelihood = Math.max(8, Math.min(98, 38 + summary.decisionDetails.margin * 1.8 + readinessIndex * 0.18));
  const rampRisk = Math.max(0, Math.min(100, 72 - readinessIndex + (Number(input.experience || 0) < 3 ? 12 : 0)));
  const compensationBand =
    readinessIndex >= 85 ? "Senior band" :
    readinessIndex >= 68 ? "Mid band" :
    readinessIndex >= 52 ? "Associate band" :
    "Development track";

  return {
    headline: summary.originalDecision === "APPROVED" ? "Candidate Shortlisted" : "Candidate Rejected",
    subheadline: "Hiring workflow simulation",
    scoreLabel: "Selection Score",
    scoreValue: summary.decisionDetails.score,
    confidenceLabel: "Interview Likelihood",
    confidenceValue: `${Math.round(interviewLikelihood)}%`,
    primaryMetricLabel: "Ramp Risk",
    primaryMetricValue: rampRisk,
    primaryMetricTone: getMetricTone(rampRisk, 35, 65),
    advisory:
      summary.results.biasScore >= 35
        ? "Selection stability is weak. Counterfactual changes across protected attributes are materially affecting shortlist status."
        : "Capability indicators dominate the decision. Fairness volatility remains within a lower operational band.",
    pills: [
      { label: "Readiness", value: `${readinessIndex}/100` },
      { label: "Experience", value: `${input.experience} yrs` },
      { label: "Comp band", value: compensationBand },
    ],
    drivers: [
      {
        name: "Skill fit",
        value: `${input.skills}/100`,
        detail: Number(input.skills) >= 80 ? "Skills score signals strong day-one role fit." : "Skills score suggests coaching or narrower role match is needed.",
        icon: "psychology",
        tone: Number(input.skills) >= 80 ? "positive" : "risk",
      },
      {
        name: "Experience depth",
        value: `${input.experience} yrs`,
        detail: Number(input.experience) >= 6 ? "Experience supports independent execution." : "Experience depth may require closer onboarding support.",
        icon: "work",
        tone: Number(input.experience) >= 6 ? "positive" : "neutral",
      },
      {
        name: "Education signal",
        value: `${input.education}/100`,
        detail: Number(input.education) >= 70 ? "Education score reinforces role readiness." : "Education signal is modest relative to the role bar.",
        icon: "history_edu",
        tone: Number(input.education) >= 70 ? "positive" : "neutral",
      },
      {
        name: "Fairness sensitivity",
        value: `${summary.results.biasScore}`,
        detail: summary.decisionDetails.fairnessDrivers[0],
        icon: "groups",
        tone: summary.results.biasScore >= 35 ? "risk" : "neutral",
      },
    ],
  };
}

function buildHealthcareSimulation(summary, input) {
  const acuityIndex = Math.round(Number(input.riskScore || 0) * 0.65 + (100 - Number(input.coverageScore || 0)) * 0.2 + Number(input.age || 0) * 0.15);
  const accessGap = Math.max(0, Math.min(100, 100 - Number(input.coverageScore || 0) + (Number(input.income || 0) < 50000 ? 12 : 0)));
  const servicePriority = Math.max(5, Math.min(99, 30 + acuityIndex * 0.45 + summary.decisionDetails.margin));
  const triageBand =
    acuityIndex >= 72 ? "Priority review" :
    acuityIndex >= 52 ? "Standard clinical review" :
    "Routine pathway";

  return {
    headline: summary.originalDecision === "APPROVED" ? "Coverage Approved" : "Coverage Denied",
    subheadline: "Healthcare access simulation",
    scoreLabel: "Eligibility Score",
    scoreValue: summary.decisionDetails.score,
    confidenceLabel: "Service Priority",
    confidenceValue: `${Math.round(servicePriority)}%`,
    primaryMetricLabel: "Access Gap",
    primaryMetricValue: accessGap,
    primaryMetricTone: getMetricTone(accessGap, 35, 65),
    advisory:
      summary.results.biasScore >= 35
        ? "Protected-attribute sensitivity is materially changing access outcomes. Escalate for policy review."
        : "Clinical and coverage features are the main decision drivers, with lower fairness instability.",
    pills: [
      { label: "Acuity", value: `${acuityIndex}/100` },
      { label: "Coverage", value: `${input.coverageScore}/100` },
      { label: "Pathway", value: triageBand },
    ],
    drivers: [
      {
        name: "Clinical acuity",
        value: `${input.riskScore}/100`,
        detail: Number(input.riskScore) >= 55 ? "Higher risk score increases urgency and plan scrutiny." : "Lower risk score supports easier approval flow.",
        icon: "science",
        tone: Number(input.riskScore) >= 55 ? "risk" : "positive",
      },
      {
        name: "Coverage strength",
        value: `${input.coverageScore}/100`,
        detail: Number(input.coverageScore) >= 75 ? "Coverage depth supports broader access eligibility." : "Coverage limits are constraining the access pathway.",
        icon: "shield",
        tone: Number(input.coverageScore) >= 75 ? "positive" : "risk",
      },
      {
        name: "Affordability pressure",
        value: formatCurrency(input.income),
        detail: Number(input.income) >= 60000 ? "Income reduces out-of-pocket stress." : "Lower income raises treatment affordability pressure.",
        icon: "account_balance",
        tone: Number(input.income) >= 60000 ? "positive" : "neutral",
      },
      {
        name: "Fairness sensitivity",
        value: `${summary.results.biasScore}`,
        detail: summary.decisionDetails.fairnessDrivers[0],
        icon: "compare_arrows",
        tone: summary.results.biasScore >= 35 ? "risk" : "neutral",
      },
    ],
  };
}

function buildSimulation(domain, form) {
  const summary = buildDecisionSummary(domain, form, {
    twinIntensity: "high",
    maxTwins: 12,
    sensitiveAttributes: ["age", "gender", "region", "incomeGroup"],
    explanationDepth: "deep",
  });

  const domainView =
    domain === "banking"
      ? buildBankingSimulation(summary, form)
      : domain === "hiring"
        ? buildHiringSimulation(summary, form)
        : buildHealthcareSimulation(summary, form);

  return { summary, domainView };
}

function metricToneClasses(tone) {
  if (tone === "risk") return "bg-rose-500/10 text-rose-500";
  if (tone === "positive") return "bg-emerald-500/10 text-emerald-500";
  return "bg-primary/10 text-primary";
}

export default function ScenarioPlayground() {
  const [domain, setDomain] = useState("banking");
  const [form, setForm] = useState(getDefaultDomainInput("banking"));

  const dynamicFields = useMemo(() => DOMAIN_FIELDS[domain] || [], [domain]);
  const presets = SCENARIO_PRESETS[domain] || [];

  const simulation = useMemo(() => buildSimulation(domain, form), [domain, form]);

  const applyPreset = (presetValues) => {
    setForm(presetValues);
  };

  const resetCurrentDomain = () => {
    setForm(getDefaultDomainInput(domain));
  };

  const handleDomainChange = (nextDomain) => {
    setDomain(nextDomain);
    setForm(getDefaultDomainInput(nextDomain));
  };

  const handleChange = (field, value, type) => {
    setForm((current) => ({
      ...current,
      [field]: type === "number" ? Number(value) : value,
    }));
  };

  const { summary, domainView } = simulation;

  return (
    <AppShell title="Scenario Playground">
      <div className="flex flex-col gap-lg antialiased max-w-7xl mx-auto pb-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-lg">
          <div className="max-w-3xl">
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-[0.3em] font-black text-[10px]">Decision Systems Lab</span>
            <h1 className="font-h1 text-6xl text-on-surface mt-2 tracking-tighter">
              Domain-Aware <span className="text-outline-variant">Simulation</span>
            </h1>
            <p className="font-body-main text-body-main text-on-surface-variant mt-4 leading-relaxed opacity-80">
              Model realistic lending, hiring, and healthcare access scenarios with operational scoring and fairness stress tests running together.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {Object.entries(DOMAIN_LABELS).map(([id, label]) => (
              <button
                key={id}
                onClick={() => handleDomainChange(id)}
                className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${domain === id ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" : "bg-surface-container-high/40 text-on-surface-variant border-outline-variant/30 hover:border-primary/40 hover:text-primary"}`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={resetCurrentDomain}
              className="p-3 bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/40 rounded-2xl transition-all text-on-surface-variant hover:text-primary"
            >
              <AppIcon name="restart_alt" className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-grid_gutter">
          <div className="lg:col-span-5 flex flex-col gap-grid_gutter">
            <div className="bg-surface-container-lowest/80 backdrop-blur-3xl border border-outline-variant/20 shadow-2xl rounded-[2.5rem] p-8 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                  <AppIcon name="tune" className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-h2 text-xl text-on-surface">{DOMAIN_LABELS[domain]} Controls</h3>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Operational + protected attributes</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.values)}
                    className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-surface text-on-surface-variant border-outline-variant/30 hover:border-primary/40 hover:text-primary transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {dynamicFields.map((field) => (
                  <div key={field.name} className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                      {field.label}
                    </label>
                    {field.type === "select" ? (
                      <div className="relative">
                        <select
                          value={form[field.name]}
                          onChange={(e) => handleChange(field.name, e.target.value, field.type)}
                          className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl px-4 py-3.5 text-sm font-medium text-on-surface appearance-none focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                        >
                          {field.options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <AppIcon name="expand_more" className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline-variant pointer-events-none" />
                      </div>
                    ) : (
                      <input
                        type="range"
                        min={field.min}
                        max={field.max}
                        value={form[field.name]}
                        onChange={(e) => handleChange(field.name, e.target.value, field.type)}
                        className="w-full accent-primary h-1.5 bg-surface-container rounded-full appearance-none cursor-pointer"
                      />
                    )}
                    {field.type === "number" && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-on-surface font-bold">{form[field.name]}</span>
                        <span className="text-on-surface-variant opacity-60">{field.min} - {field.max}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-grid_gutter">
            <div className="bg-[#020617] border border-white/10 shadow-3xl rounded-[2.5rem] overflow-hidden group">
              <div className="p-10 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="text-center md:text-left flex-1 space-y-4">
                  <span className="font-label-caps text-[10px] text-primary font-black uppercase tracking-[0.3em]">
                    {domainView.subheadline}
                  </span>
                  <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tighter">{domainView.headline}</h2>
                  <div className="flex items-center gap-3 mt-6 justify-center md:justify-start flex-wrap">
                    {domainView.pills.map((pill) => (
                      <div key={pill.label} className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-white/5 border-white/10 text-white/80">
                        {pill.label}: {pill.value}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="w-48 h-48 rounded-full bg-white/[0.02] border border-white/5 relative flex flex-col items-center justify-center shadow-2xl overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent" />
                  <div
                    className={`absolute inset-0 transition-all duration-1000 ${summary.originalDecision === "APPROVED" ? "border-emerald-500/40" : "border-rose-500/40"}`}
                    style={{ borderBottomWidth: "4px", transform: `rotate(${Math.max(0, Math.min(domainView.scoreValue, 100)) * 3.6}deg)` }}
                  />
                  <span className="text-6xl font-bold text-white relative z-10">{domainView.scoreValue}</span>
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest relative z-10 mt-1">{domainView.scoreLabel}</span>
                </div>
              </div>

              <div className="px-10 pb-10 space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-black text-white/50 uppercase tracking-widest">{domainView.primaryMetricLabel}</h4>
                  <span className={`text-2xl font-black ${domainView.primaryMetricTone}`}>{domainView.primaryMetricValue}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    className={`h-full transition-all duration-1000 ${domainView.primaryMetricValue > 40 ? "bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)]" : "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"}`}
                    style={{ width: `${domainView.primaryMetricValue}%` }}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl">
                    <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">{domainView.confidenceLabel}</div>
                    <div className="text-2xl font-black text-white">{domainView.confidenceValue}</div>
                  </div>
                  <div className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl">
                    <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Bias Flip Rate</div>
                    <div className="text-2xl font-black text-white">{formatPercent(summary.results.flipRate)}</div>
                  </div>
                </div>
                <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl">
                  <p className="text-xs text-white/60 leading-relaxed font-medium">{domainView.advisory}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-grid_gutter">
              {domainView.drivers.map((driver) => (
                <div key={driver.name} className="bg-surface-container-lowest border border-outline-variant/30 shadow-xl rounded-[2rem] p-6 flex items-start gap-5 hover:scale-[1.02] transition-all">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${metricToneClasses(driver.tone)}`}>
                    <AppIcon name={driver.icon} className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center gap-3 mb-1">
                      <h4 className="text-[12px] font-black text-on-surface uppercase tracking-tight">{driver.name}</h4>
                      <span className="text-[10px] font-black text-on-surface-variant">{driver.value}</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant font-medium opacity-70">{driver.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-grid_gutter">
              <div className="bg-surface-container-lowest/90 border border-outline-variant/20 rounded-[2rem] p-6">
                <div className="flex items-center gap-3 mb-5">
                  <AppIcon name="analytics" className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">Fairness Sensitivity</h3>
                </div>
                <div className="space-y-4">
                  {Object.entries(summary.results.attributeSensitivity).map(([attribute, sensitivity]) => (
                    <div key={attribute}>
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight mb-1">
                        <span className="text-on-surface">{ATTRIBUTE_LABELS[attribute] || attribute}</span>
                        <span className={Number(sensitivity) >= 0.5 ? "text-error" : "text-primary"}>
                          {formatPercent(sensitivity)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className={`h-full ${Number(sensitivity) >= 0.5 ? "bg-error" : "bg-primary"}`}
                          style={{ width: `${Math.max(6, Math.round(Number(sensitivity) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-6 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 opacity-[0.06]">
                  <AppIcon name="auto_awesome" className="h-36 w-36" />
                </div>
                <div className="flex items-center gap-3 mb-5 relative z-10">
                  <AppIcon name="psychology" className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary">Narrative Summary</h3>
                </div>
                <p className="text-[13px] text-on-surface font-medium leading-relaxed relative z-10">
                  {summary.decisionDetails.summary}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
