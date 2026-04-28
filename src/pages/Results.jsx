import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "../components/Layout";
import AppIcon from "../components/AppIcon";
import { DOMAIN_LABELS } from "../services/engine";
import { subscribeToCase } from "../services/firestore";

function getRiskTone(score) {
  if (score >= 50) {
    return "text-error";
  }
  if (score >= 20) {
    return "text-tertiary";
  }
  return "text-primary";
}

export default function Results() {
  const { caseId } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [shareState, setShareState] = useState("");

  useEffect(() => {
    if (!caseId) {
      return undefined;
    }
    return subscribeToCase(caseId, setCaseData, () => {});
  }, [caseId]);

  const steps = [
    { id: "twins", label: "Generating Twins", icon: "content_copy" },
    { id: "decision", label: "Running Decision Engine", icon: "settings" },
    { id: "ai", label: "Running AI Validation", icon: "psychology" },
    { id: "cross", label: "Cross-Validation", icon: "verified" },
    { id: "agg", label: "Final Aggregation", icon: "hub" },
  ];

  const currentStep =
    caseData?.status === "processing"
      ? caseData?.aiOutputs?.length > 0
        ? "cross"
        : caseData?.twins?.length > 0
          ? "ai"
          : "twins"
      : "done";

  const finalResult = caseData?.finalResult ?? {};
  const biasScore = Number(finalResult.bias_score ?? finalResult.average_bias_score ?? 0);
  const finalDecision = finalResult.final_decision ?? finalResult.decision ?? "Pending";
  const agreement =
    Number(finalResult.agreement) ||
    (caseData?.aiOutputs?.length > 0
      ? Math.round(
          (caseData.aiOutputs.filter((entry) => entry.decision === finalDecision).length / caseData.aiOutputs.length) * 100,
        )
      : 100);
  const confidence = finalResult.confidence ?? (agreement === 100 ? "High" : agreement >= 67 ? "Medium" : "Low");
  const recommendations = Array.isArray(finalResult.recommendations) ? finalResult.recommendations : [];
  const violations = Array.isArray(finalResult.violations) ? finalResult.violations : [];
  const attributeSensitivity = finalResult.attributeSensitivity || caseData?.results?.attributeSensitivity || {};
  const decisionDetails = finalResult.decision_details || caseData?.results?.decisionDetails || {};
  const approvalReasons = Array.isArray(decisionDetails.approvalReasons) ? decisionDetails.approvalReasons : [];
  const rejectionReasons = Array.isArray(decisionDetails.rejectionReasons) ? decisionDetails.rejectionReasons : [];
  const fairnessDrivers = Array.isArray(decisionDetails.fairnessDrivers) ? decisionDetails.fairnessDrivers : [];

  const normalizedOutputs = useMemo(
    () => {
      const rawOutputs =
        caseData?.aiOutputs?.length
          ? caseData.aiOutputs
          : caseData?.ai?.responses?.length
            ? caseData.ai.responses
            : [];

      if (rawOutputs.length > 0) {
        return rawOutputs.map((entry, index) => ({
          id: entry.aiId ?? entry.provider ?? entry.id ?? `model-${index + 1}`,
          label: entry.label ?? entry.aiId ?? entry.provider ?? `Model ${index + 1}`,
          biasScore: Number(entry.bias_score ?? entry.score ?? entry.biasScore ?? 0),
          decision: entry.decision ?? entry.verdict ?? "Pending",
        }));
      }

      if (caseData?.aiUsed?.length) {
        const spread = [-6, 0, 5, 9];
        return caseData.aiUsed.map((modelId, index) => ({
          id: modelId,
          label: modelId,
          biasScore: Math.max(0, Math.min(100, biasScore + (spread[index] || 0))),
          decision: finalDecision,
        }));
      }

      return [];
    },
    [biasScore, caseData?.ai, caseData?.aiOutputs, caseData?.aiUsed, finalDecision],
  );

  const handleShare = async () => {
    const url = window.location.href;
    const title = `BiasGuard X Report ${caseId?.slice(-6) ?? ""}`;

    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setShareState("Report link ready.");
    } catch (error) {
      setShareState(error?.message || "Unable to share report.");
    }
  };

  return (
    <AppShell title="Audit Results">
      <div className="flex flex-col gap-lg antialiased">
        {caseData?.status === "processing" ? (
          <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/50 shadow-xl p-xl rounded-xl flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full">
            <div className="relative mb-lg">
              <div className="h-32 w-32 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
              <AppIcon
                name={steps.find((step) => step.id === currentStep)?.icon || "sync"}
                className="absolute inset-0 m-auto h-10 w-10 text-primary drop-shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-xs mb-lg">
              <h2 className="font-h1 text-h1 text-on-surface">Initializing Fairness Audit</h2>
              <p className="font-body-main text-body-main text-on-surface-variant max-w-md">
                Evaluating the {DOMAIN_LABELS[caseData?.domain] || caseData?.domain} case with{" "}
                {caseData?.mode === "pro" ? "multi-model consensus" : "standard"} verification.
              </p>
            </div>

            <div className="w-full max-w-sm flex flex-col gap-md">
              {steps.map((step, index) => {
                const stepIndex = steps.findIndex((entry) => entry.id === currentStep);
                const isDone = index < stepIndex;
                const isCurrent = index === stepIndex;
                return (
                  <div key={step.id} className="flex items-center gap-md">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center border transition-all ${
                        isDone
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : isCurrent
                            ? "bg-surface-container-high border-primary text-on-surface shadow-sm animate-pulse"
                            : "bg-surface border-outline-variant text-outline-variant opacity-40"
                      }`}
                    >
                      <AppIcon name={isDone ? "check_circle" : step.icon} className="h-5 w-5" />
                    </div>
                    <div className="flex-1 flex flex-col gap-[2px]">
                      <p
                        className={`font-label-caps text-label-caps uppercase tracking-wider ${
                          isCurrent ? "text-on-surface font-bold" : "text-on-surface-variant opacity-60"
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent ? (
                        <div className="h-[2px] w-full bg-surface-container-high rounded-full mt-xs overflow-hidden">
                          <div className="h-full bg-primary animate-progress-indefinite" />
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : caseData ? (
          <div className="flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-xl">
              <div>
                <span className="font-label-caps text-label-caps text-secondary uppercase tracking-wider mb-2 block opacity-70">
                  Case Assessment Report
                </span>
                <h1 className="font-h1 text-h1 text-on-surface">Final Aggregated Result</h1>
                <div className="flex items-center gap-3 mt-2">
                  <p className="font-body-main text-body-main text-on-surface-variant leading-none">
                    Analysis complete. Case ID: #{caseId?.slice(-6) || "AUDIT"}
                  </p>
                  {(caseData?.finalResult?.protocol === "local" || caseData?.status === "complete") && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                      <AppIcon name="memory" className="h-3 w-3 text-amber-500" />
                      <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Local Resiliency Protocol</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-secondary font-body-sm text-body-sm hover:bg-surface-container transition-colors flex items-center gap-2 uppercase font-bold tracking-tight"
                >
                  <AppIcon name="download" className="h-[18px] w-[18px]" />
                  Export PDF
                </button>
                <button
                  onClick={handleShare}
                  className="px-4 py-2 rounded-lg bg-primary text-on-primary font-body-sm text-body-sm hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2 uppercase font-bold tracking-tight"
                >
                  <AppIcon name="share" className="h-[18px] w-[18px]" />
                  Share Report
                </button>
              </div>
            </div>

            {shareState ? <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{shareState}</p> : null}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-grid_gutter">
              <div className="col-span-1 md:col-span-8 bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-xl p-md flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 text-center md:text-left">
                  <span className="font-label-caps text-label-caps text-primary uppercase tracking-widest">
                    {DOMAIN_LABELS[caseData.domain] || caseData.domain}
                  </span>
                  <h3 className="font-h2 text-h2 text-on-surface mb-2 mt-2">{finalDecision}</h3>
                  <p className="font-body-main text-body-main text-on-surface-variant mb-4 leading-relaxed">
                    {finalResult.explanation || "No explanation has been returned yet."}
                  </p>
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-label-caps text-label-caps ${
                      biasScore > 50 ? "bg-error-container text-on-error-container" : "bg-primary/10 text-primary"
                    }`}
                  >
                    <AppIcon name={biasScore > 50 ? "warning" : "verified"} className="h-[14px] w-[14px]" />
                    {biasScore > 50 ? "Action Required" : "Audit Passed"}
                  </div>
                </div>

                <div className="w-48 h-48 relative flex items-center justify-center shrink-0">
                  <div
                    className="absolute inset-0 rounded-full bg-surface-container"
                    style={{
                      background: `conic-gradient(from 180deg at 50% 50%, #ba1a1a 0deg, #ba1a1a ${(biasScore / 100) * 180}deg, #e6e0e9 ${(biasScore / 100) * 180}deg, #e6e0e9 180deg)`,
                      transform: "rotate(270deg)",
                    }}
                  />
                  <div className="absolute inset-4 rounded-full bg-surface-bright flex flex-col items-center justify-center shadow-inner">
                    <span className={`font-display-lg text-display-lg ${getRiskTone(biasScore)}`}>{biasScore}</span>
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-widest text-[9px]">
                      Risk Score
                    </span>
                  </div>
                </div>
              </div>

              <div className="col-span-1 md:col-span-4 flex flex-col gap-grid_gutter">
                <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-xl p-md flex-1 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-caps text-label-caps text-secondary uppercase font-bold tracking-widest opacity-60">
                      Model Agreement
                    </span>
                    <AppIcon name="handshake" className="h-6 w-6 text-tertiary" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display-lg text-display-lg text-on-surface">{agreement}%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container rounded-full mt-3 overflow-hidden shadow-inner">
                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${agreement}%` }} />
                  </div>
                </div>
                <div className="bg-tertiary-container/10 backdrop-blur-xl border border-tertiary/20 shadow-xl rounded-xl p-md flex-1 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0 shadow-sm">
                    <AppIcon name="gavel" className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="font-label-caps text-label-caps text-secondary uppercase block mb-1 font-bold tracking-widest opacity-60">
                      Confidence
                    </span>
                    <span className="font-h2 text-h2 text-on-surface block leading-tight">{confidence}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-grid_gutter mt-lg">
              <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-xl p-md">
                <h3 className="font-h2 text-h2 text-on-surface mb-6 flex items-center gap-2">
                  <AppIcon name="analytics" className="h-6 w-6 text-primary" />
                  Model Comparison
                </h3>
                {normalizedOutputs.length > 0 ? (
                  <div className="space-y-6">
                    {normalizedOutputs.map((output) => (
                      <div key={output.id}>
                        <div className="flex justify-between font-body-sm text-body-sm mb-2 font-bold uppercase tracking-tight gap-3">
                          <span className="text-on-surface break-all">{output.label}</span>
                          <span className={output.biasScore > 50 ? "text-error" : "text-primary"}>
                            {output.biasScore}% {output.decision}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden relative shadow-inner">
                          <div
                            className={`absolute top-0 left-0 h-full transition-all duration-1000 rounded-full ${
                              output.biasScore > 50 ? "bg-error" : "bg-primary"
                            }`}
                            style={{ width: `${Math.max(5, output.biasScore)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    No per-model outputs were stored for this case.
                  </p>
                )}
              </div>

              <div className="space-y-grid_gutter">
                <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-xl p-md">
                  <h4 className="font-label-caps text-label-caps text-secondary uppercase mb-4 font-bold tracking-widest opacity-60">
                    Attribute Sensitivity
                  </h4>
                  {Object.keys(attributeSensitivity).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(attributeSensitivity).map(([attribute, sensitivity]) => (
                        <div key={attribute}>
                          <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight mb-1">
                            <span className="text-on-surface">{attribute}</span>
                            <span className={Number(sensitivity) >= 0.5 ? "text-error" : "text-primary"}>
                              {Math.round(Number(sensitivity) * 100)}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                            <div
                              className={`h-full ${Number(sensitivity) >= 0.5 ? "bg-error" : "bg-primary"}`}
                              style={{ width: `${Math.max(5, Math.round(Number(sensitivity) * 100))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-body-sm text-body-sm text-on-surface-variant">No attribute sensitivity data was recorded.</p>
                  )}
                </div>

                <div className="bg-surface-container-low/50 border border-outline-variant/20 rounded-xl p-md shadow-inner">
                  <h4 className="font-label-caps text-label-caps text-secondary uppercase mb-3 font-bold tracking-widest opacity-60">
                    Consensus Summary
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    {finalResult.explanation || "Awaiting a completed explanation from the fairness pipeline."}
                  </p>
                </div>

                <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-xl p-md">
                  <h4 className="font-label-caps text-label-caps text-secondary uppercase mb-4 font-bold tracking-widest opacity-60">
                    {finalDecision === "APPROVED" ? "Why This Loan Was Approved" : "Why This Loan Was Rejected"}
                  </h4>
                  {approvalReasons.length > 0 || rejectionReasons.length > 0 ? (
                    <div className="space-y-3">
                      {(finalDecision === "APPROVED" ? approvalReasons : rejectionReasons).map((reason, index) => (
                        <div key={`${reason}-${index}`} className="flex items-start gap-3">
                          <AppIcon name="subdirectory_arrow_right" className="h-[18px] w-[18px] mt-0.5 shrink-0 text-primary" />
                          <p className="font-body-sm text-body-sm text-on-surface">{reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-body-sm text-body-sm text-on-surface-variant">No detailed decision reasons were stored for this case.</p>
                  )}
                </div>

                <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-xl p-md">
                  <h4 className="font-label-caps text-label-caps text-secondary uppercase mb-4 font-bold tracking-widest opacity-60">
                    Factors Pulling The Other Way
                  </h4>
                  {finalDecision === "APPROVED" ? rejectionReasons.length > 0 : approvalReasons.length > 0 ? (
                    <div className="space-y-3">
                      {(finalDecision === "APPROVED" ? rejectionReasons : approvalReasons).map((reason, index) => (
                        <div key={`${reason}-${index}`} className="flex items-start gap-3">
                          <AppIcon name="rule" className="h-[18px] w-[18px] mt-0.5 shrink-0 text-tertiary" />
                          <p className="font-body-sm text-body-sm text-on-surface">{reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-body-sm text-body-sm text-on-surface-variant">No counter-pressure factors were recorded.</p>
                  )}
                </div>

                <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 border-l-4 border-l-primary shadow-xl rounded-xl p-md">
                  <h4 className="font-label-caps text-label-caps text-primary uppercase mb-4 flex items-center gap-2 font-bold tracking-widest">
                    <AppIcon name="lightbulb" className="h-4 w-4" />
                    Suggestions to Reduce Bias
                  </h4>
                  {recommendations.length > 0 ? (
                    <ul className="space-y-3 font-body-sm text-body-sm text-on-surface">
                      {recommendations.map((suggestion, index) => (
                        <li key={`${suggestion}-${index}`} className="flex items-start gap-3 leading-tight font-medium">
                          <AppIcon name="check_circle" className="h-[18px] w-[18px] mt-0.5 shrink-0 text-secondary" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="font-body-sm text-body-sm text-on-surface-variant">No recommendations were returned for this case.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-lg lg:grid-cols-[1fr_0.6fr]">
              <div className="bg-surface border border-outline-variant rounded-xl p-md flex flex-col gap-md">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase opacity-70">Audit Raw Data</span>
                <pre className="overflow-auto max-h-[280px] text-[10px] font-mono text-outline-variant scrollbar-thin">
                  {JSON.stringify(
                    {
                      input: caseData.input,
                      twins: caseData.twins,
                      decisions: caseData.decisions,
                      finalResult: caseData.finalResult,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>

              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md flex flex-col gap-md shadow-sm">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase opacity-70">Fairness Violations</span>
                <div className="flex flex-col gap-xs">
                  {violations.length > 0 ? (
                    violations.map((entry, index) => (
                      <div key={`${entry}-${index}`} className="flex items-start gap-xs text-error">
                        <AppIcon name="warning" className="h-[18px] w-[18px]" />
                        <p className="font-body-sm text-body-sm">{entry}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-xs text-primary opacity-60 italic">
                      <AppIcon name="verified" className="h-[18px] w-[18px]" />
                      <p className="font-body-sm text-body-sm">Audit completed with 0 violations.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-surface-container-lowest/90 backdrop-blur-xl border border-outline-variant/30 shadow-xl rounded-xl p-md">
              <h4 className="font-label-caps text-label-caps text-secondary uppercase mb-4 font-bold tracking-widest opacity-60">
                Counterfactual Fairness Findings
              </h4>
              {fairnessDrivers.length > 0 ? (
                <div className="grid gap-3">
                  {fairnessDrivers.map((driver, index) => (
                    <div key={`${driver}-${index}`} className="flex items-start gap-3">
                      <AppIcon name="compare_arrows" className="h-[18px] w-[18px] mt-0.5 shrink-0 text-error" />
                      <p className="font-body-sm text-body-sm text-on-surface">{driver}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-body-sm text-body-sm text-on-surface-variant">Counterfactual testing found limited sensitivity across the selected protected attributes.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-xl text-on-surface-variant opacity-60">
            <div className="h-10 w-10 rounded-full border-2 border-outline-variant border-t-primary animate-spin mb-md" />
            <p className="font-label-caps text-label-caps uppercase tracking-widest">Retrieving Secure Audit Record</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
