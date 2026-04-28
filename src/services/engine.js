const GENDER_OPTIONS = ["male", "female", "other"];
const REGION_OPTIONS = ["urban", "rural"];
const INCOME_GROUP_OPTIONS = ["low", "mid", "high"];
const INTENSITY_LEVELS = ["low", "medium", "high"];

export const DOMAIN_FIELDS = {
  banking: [
    { name: "creditScore", label: "Credit Score", type: "number", min: 300, max: 900 },
    { name: "income", label: "Annual Income", type: "number", min: 0, max: 10000000 },
    { name: "loanAmount", label: "Loan Amount", type: "number", min: 0, max: 5000000 },
    { name: "age", label: "Age", type: "number", min: 18, max: 80 },
    { name: "gender", label: "Gender", type: "select", options: GENDER_OPTIONS },
    { name: "region", label: "Region", type: "select", options: REGION_OPTIONS },
    { name: "incomeGroup", label: "Income Group Override", type: "select", options: INCOME_GROUP_OPTIONS },
  ],
  hiring: [
    { name: "experience", label: "Years of Experience", type: "number", min: 0, max: 50 },
    { name: "skills", label: "Skills Score", type: "number", min: 0, max: 100 },
    { name: "education", label: "Education Score", type: "number", min: 0, max: 100 },
    { name: "age", label: "Age", type: "number", min: 18, max: 80 },
    { name: "gender", label: "Gender", type: "select", options: GENDER_OPTIONS },
    { name: "region", label: "Region", type: "select", options: REGION_OPTIONS },
    { name: "incomeGroup", label: "Income Group Override", type: "select", options: INCOME_GROUP_OPTIONS },
  ],
  healthcare: [
    { name: "riskScore", label: "Risk Score", type: "number", min: 0, max: 100 },
    { name: "income", label: "Annual Income", type: "number", min: 0, max: 10000000 },
    { name: "coverageScore", label: "Coverage Score", type: "number", min: 0, max: 100 },
    { name: "age", label: "Age", type: "number", min: 18, max: 80 },
    { name: "gender", label: "Gender", type: "select", options: GENDER_OPTIONS },
    { name: "region", label: "Region", type: "select", options: REGION_OPTIONS },
    { name: "incomeGroup", label: "Income Group Override", type: "select", options: INCOME_GROUP_OPTIONS },
  ],
};

export const DOMAIN_LABELS = {
  banking: "Banking (Loan)",
  hiring: "Hiring",
  healthcare: "Healthcare",
};

export const ATTRIBUTE_LABELS = {
  age: "Age",
  gender: "Gender",
  region: "Region",
  incomeGroup: "Income Group",
};

export function getDefaultDomainInput(domain = "banking") {
  const defaults = {
    banking: { creditScore: 720, income: 85000, loanAmount: 25000, age: 34, gender: "female", region: "urban", incomeGroup: "mid" },
    hiring: { experience: 8, skills: 85, education: 75, age: 29, gender: "female", region: "urban", incomeGroup: "mid" },
    healthcare: { riskScore: 35, income: 65000, coverageScore: 80, age: 45, gender: "female", region: "urban", incomeGroup: "mid" }
  };
  return defaults[domain] || defaults.banking;
}

export function normalizeAuditConfig(proSettings = {}) {
  const intensity = INTENSITY_LEVELS.includes(proSettings?.twinIntensity) ? proSettings.twinIntensity : "medium";
  const maxTwins = Math.min(Math.max(Number(proSettings?.maxTwins ?? 8), 4), 16);
  const attributesToVary = Array.isArray(proSettings?.sensitiveAttributes) && proSettings.sensitiveAttributes.length > 0
    ? proSettings.sensitiveAttributes.filter((entry) => ["age", "gender", "region", "incomeGroup"].includes(entry))
    : ["age", "gender", "region"];

  return {
    attributesToVary,
    intensity,
    maxTwins,
    biasThreshold: Math.min(Math.max(Number(proSettings?.biasThreshold ?? 20), 20), 70),
    rounds: Math.min(Math.max(Number(proSettings?.debateRounds ?? 1), 1), 3),
    aggregation: proSettings?.aggregationStrategy || "majority",
    explanationDepth: proSettings?.explanationDepth || "brief",
  };
}

export function validateCaseInput(domain, input) {
  const errors = {};
  const fields = DOMAIN_FIELDS[domain] || DOMAIN_FIELDS.banking;
  for (const field of fields) {
    const value = input[field.name];
    if (value === "" || value === null || value === undefined) {
      errors[field.name] = `${field.label} is required.`;
      continue;
    }
    if (field.type === "number") {
      const numeric = Number(value);
      if (Number.isNaN(numeric)) {
        errors[field.name] = `${field.label} must be a number.`;
      } else if (numeric < field.min || numeric > field.max) {
        errors[field.name] = `${field.label} must be between ${field.min} and ${field.max}.`;
      }
    }
  }
  return errors;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatPercent(value) {
  return `${Math.round(Number(value) * 100)}%`;
}

function startCase(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function toIncomeGroup(income) {
  if (income < 40000) return "low";
  if (income < 90000) return "mid";
  return "high";
}

function incomeFromGroup(group, fallbackIncome) {
  const groups = { low: 30000, mid: 65000, high: 120000 };
  return groups[group] || fallbackIncome;
}

function normalizeInput(domain, input) {
  const fields = DOMAIN_FIELDS[domain] || DOMAIN_FIELDS.banking;
  const normalized = {};
  for (const field of fields) {
    const raw = input[field.name];
    normalized[field.name] = field.type === "number" ? Number(raw) : String(raw).toLowerCase();
  }
  if (!normalized.incomeGroup && typeof normalized.income === "number") {
    normalized.incomeGroup = toIncomeGroup(normalized.income);
  }
  return normalized;
}

export function decisionEngine(domain, input) {
  const norm = normalizeInput(domain, input);
  const breakdown = getDecisionBreakdown(domain, norm);
  return breakdown.decision;
}

export function getDecisionBreakdown(domain, input) {
  const norm = normalizeInput(domain, input);
  let baseScore = 0;
  const positiveFactors = [];
  const negativeFactors = [];

  function addPositive(label, detail, points) {
    positiveFactors.push({ label, detail, points });
  }

  function addNegative(label, detail, points) {
    negativeFactors.push({ label, detail, points });
  }

  if (domain === "banking") {
    const incomeMultiple = norm.income > 0 ? Number((norm.loanAmount / norm.income).toFixed(2)) : 99;

    if (norm.creditScore >= 700) {
      baseScore += 40;
      addPositive("Strong credit profile", `Credit score of ${norm.creditScore} signals lower default risk.`, 40);
    } else if (norm.creditScore >= 600) {
      baseScore += 20;
      addPositive("Moderate credit profile", `Credit score of ${norm.creditScore} is usable but not premium.`, 20);
    } else {
      addNegative("Weak credit profile", `Credit score of ${norm.creditScore} falls below the preferred lending range.`, -20);
    }

    if (norm.income >= 60000) {
      baseScore += 30;
      addPositive("Healthy income support", `Annual income of ${norm.income} provides repayment capacity.`, 30);
    } else if (norm.income >= 30000) {
      baseScore += 15;
      addPositive("Basic income support", `Annual income of ${norm.income} supports the application with tighter margin.`, 15);
    } else {
      addNegative("Income pressure", `Annual income of ${norm.income} limits repayment flexibility.`, -15);
    }

    if (norm.loanAmount <= norm.income * 3) {
      baseScore += 20;
      addPositive("Balanced loan size", `Loan request is ${incomeMultiple}x annual income, which is within a safer lending band.`, 20);
    } else if (norm.loanAmount <= norm.income * 6) {
      baseScore += 10;
      addPositive("Manageable loan size", `Loan request is ${incomeMultiple}x annual income, acceptable but stretched.`, 10);
    } else {
      addNegative("Loan burden is high", `Requested amount is ${incomeMultiple}x annual income and increases repayment stress.`, -20);
    }
  } 
  else if (domain === "hiring") {
    const experiencePoints = clamp(norm.experience * 5, 0, 40);
    const skillPoints = clamp(norm.skills * 0.4, 0, 40);
    const educationPoints = clamp(norm.education * 0.2, 0, 20);
    baseScore += experiencePoints + skillPoints + educationPoints;
    addPositive("Experience contribution", `${norm.experience} years of experience adds execution confidence.`, experiencePoints);
    addPositive("Skills contribution", `Skills score of ${norm.skills} supports role readiness.`, skillPoints);
    addPositive("Education contribution", `Education score of ${norm.education} improves qualification confidence.`, educationPoints);
  } 
  else {
    const riskPoints = clamp((100 - norm.riskScore) * 0.5, 0, 50);
    const coveragePoints = clamp(norm.coverageScore * 0.3, 0, 30);
    const incomePoints = clamp(norm.income / 5000, 0, 20);
    baseScore += riskPoints + coveragePoints + incomePoints;
    addPositive("Clinical risk contribution", `Risk score of ${norm.riskScore} translates to ${riskPoints} stability points.`, riskPoints);
    addPositive("Coverage contribution", `Coverage score of ${norm.coverageScore} improves service access confidence.`, coveragePoints);
    addPositive("Income contribution", `Income contributes ${incomePoints} affordability points.`, incomePoints);
  }

  if (norm.age < 25) {
    baseScore -= 12;
    addNegative("Age-linked penalty", `Applicants under 25 lose 12 points in the current decision rule.`, -12);
  }
  if (norm.age > 65) {
    baseScore -= 8;
    addNegative("Senior-age penalty", `Applicants over 65 lose 8 points in the current decision rule.`, -8);
  }
  if (domain !== "healthcare" && (norm.gender === "female" || norm.gender === "other")) {
    baseScore -= 10;
    addNegative("Gender-linked penalty", `Gender value "${norm.gender}" reduces the score by 10 points in the current rule.`, -10);
  }
  if (norm.region === "rural") {
    baseScore -= 15;
    addNegative("Regional penalty", `Rural region reduces the score by 15 points in the current rule.`, -15);
  }

  const threshold = 60;
  return {
    normalizedInput: norm,
    score: baseScore,
    threshold,
    margin: baseScore - threshold,
    decision: baseScore >= threshold ? "APPROVED" : "REJECTED",
    positiveFactors,
    negativeFactors,
  };
}

function createVariants(attribute, input) {
  switch (attribute) {
    case "age": {
      const age = Number(input.age);
      return [...new Set([clamp(age + 15, 18, 80), clamp(age - 15, 18, 80), clamp(22, 18, 80), clamp(70, 18, 80)])]
        .filter((value) => Math.abs(value - age) > 5)
        .map((value) => ({ age: value }));
    }
    case "gender":
      return GENDER_OPTIONS.filter((value) => value !== input.gender).map((value) => ({ gender: value }));
    case "region":
      return REGION_OPTIONS.filter((value) => value !== input.region).map((value) => ({ region: value }));
    case "incomeGroup":
      return INCOME_GROUP_OPTIONS.filter((value) => value !== input.incomeGroup).map((value) => ({
        incomeGroup: value,
        income: incomeFromGroup(value, input.income),
      }));
    default:
      return [];
  }
}

function boundedPushTwins(target, candidates, maxTwins, seen) {
  for (const candidate of candidates) {
    if (target.length >= maxTwins) break;
    const key = JSON.stringify(candidate.input);
    if (seen.has(key)) continue;
    seen.add(key);
    target.push(candidate);
  }
}

export function generateTwins(domain, input, config = {}) {
  const normalizedInput = normalizeInput(domain, input);
  const normalizedConfig = normalizeAuditConfig(config);
  const originalDecision = decisionEngine(domain, normalizedInput);
  const seen = new Set([JSON.stringify(normalizedInput)]);
  const twins = [];

  for (const attribute of normalizedConfig.attributesToVary) {
    const variants = createVariants(attribute, normalizedInput).map((changes, index) => {
      const twinInput = { ...normalizedInput, ...changes };
      return {
        twinId: `${attribute}-${index + 1}`,
        variedAttributes: [attribute],
        mutation: changes,
        input: twinInput,
        decision: decisionEngine(domain, twinInput),
      };
    });
    const sliceSize = normalizedConfig.intensity === "low" ? 1 : variants.length;
    boundedPushTwins(twins, variants.slice(0, sliceSize), normalizedConfig.maxTwins, seen);
  }

  if (normalizedConfig.intensity !== "low" && twins.length < normalizedConfig.maxTwins) {
    const attrs = normalizedConfig.attributesToVary;
    for (let i = 0; i < attrs.length && twins.length < normalizedConfig.maxTwins; i++) {
      for (let j = i + 1; j < attrs.length && twins.length < normalizedConfig.maxTwins; j++) {
        const v1 = createVariants(attrs[i], normalizedInput)[0];
        const v2 = createVariants(attrs[j], normalizedInput)[0];
        if (v1 && v2) {
          const twinInput = { ...normalizedInput, ...v1, ...v2 };
          boundedPushTwins(twins, [{
            twinId: `pair-${attrs[i]}-${attrs[j]}`,
            variedAttributes: [attrs[i], attrs[j]],
            mutation: { ...v1, ...v2 },
            input: twinInput,
            decision: decisionEngine(domain, twinInput),
          }], normalizedConfig.maxTwins, seen);
        }
      }
    }
  }

  return twins.map((twin) => ({
    ...twin,
    isFlipped: twin.decision !== originalDecision,
  }));
}

export function computeBiasMetrics(originalDecision, twins, attributesToVary) {
  const flips = twins.filter((twin) => twin.isFlipped);
  const flipRate = twins.length > 0 ? flips.length / twins.length : 0;
  const attributeSensitivity = {};

  for (const attribute of attributesToVary) {
    const scopedTwins = twins.filter((twin) => twin.variedAttributes.includes(attribute));
    const scopedFlips = scopedTwins.filter((twin) => twin.isFlipped);
    attributeSensitivity[attribute] = scopedTwins.length > 0 ? Number((scopedFlips.length / scopedTwins.length).toFixed(2)) : 0;
  }

  const maxSens = Math.max(...Object.values(attributeSensitivity), 0);
  const biasScore = Math.round((flipRate * 0.7 + maxSens * 0.3) * 100);
  const riskLevel = biasScore >= 45 ? "High" : biasScore >= 15 ? "Medium" : "Low";

  return {
    flipRate: Number(flipRate.toFixed(2)),
    biasScore: clamp(biasScore, 0, 100),
    riskLevel,
    attributeSensitivity,
  };
}

function buildViolations(metrics) {
  return Object.entries(metrics.attributeSensitivity)
    .filter(([, sensitivity]) => sensitivity > 0.1)
    .map(([attribute, sensitivity]) => `${ATTRIBUTE_LABELS[attribute] || attribute} caused decision flips in ${Math.round(sensitivity * 100)}% of tested variations.`);
}

function buildRecommendations(metrics) {
  const impacts = Object.entries(metrics.attributeSensitivity).filter(([, s]) => s >= 0.3).map(([a]) => ATTRIBUTE_LABELS[a] || a);
  if (impacts.length === 0) return ["Maintain quarterly re-validation.", "The model demonstrates high structural neutrality."];
  return [`Audit ${impacts.join(" and ")} weighting.`, "Check for geographic proxies.", "Implement de-biasing layers."];
}

export function buildDecisionNarrative(domain, input, metrics, config = {}) {
  const breakdown = getDecisionBreakdown(domain, input);
  const topSupports = [...breakdown.positiveFactors].sort((a, b) => b.points - a.points).slice(0, 3);
  const topRisks = [...breakdown.negativeFactors].sort((a, b) => a.points - b.points).slice(0, 3);
  const highSensitivity = Object.entries(metrics.attributeSensitivity || {})
    .filter(([, sensitivity]) => Number(sensitivity) > 0.1)
    .map(([attribute, sensitivity]) => `${ATTRIBUTE_LABELS[attribute] || startCase(attribute)} changed the decision in ${formatPercent(sensitivity)} of tested variations.`);

  const verdictSummary = breakdown.decision === "APPROVED"
    ? `The application was approved because the rule-based score reached ${breakdown.score}, which is ${breakdown.margin} points above the ${breakdown.threshold}-point cutoff.`
    : `The application was rejected because the rule-based score reached only ${breakdown.score}, which is ${Math.abs(breakdown.margin)} points below the ${breakdown.threshold}-point cutoff.`;

  const supportSummary = topSupports.length > 0
    ? topSupports.map((factor) => factor.detail)
    : ["No strong approval-supporting factors were recorded."];
  const riskSummary = topRisks.length > 0
    ? topRisks.map((factor) => factor.detail)
    : ["No major rejection-driving factors were recorded."];

  const counterfactualSummary = highSensitivity.length > 0
    ? highSensitivity
    : ["Counterfactual twin testing found limited sensitivity to the protected attributes under review."];

  const explanationDepth = config.explanationDepth || "brief";
  let narrative = verdictSummary;

  if (explanationDepth === "standard" || explanationDepth === "brief") {
    narrative = `${verdictSummary} Strongest support: ${supportSummary[0]} Main risk: ${riskSummary[0]}`;
  }
  if (explanationDepth === "deep") {
    narrative = [
      verdictSummary,
      `Approval-supporting factors: ${supportSummary.join(" ")}`,
      `Rejection-driving factors: ${riskSummary.join(" ")}`,
      `Fairness stress test: ${counterfactualSummary.join(" ")}`,
    ].join(" ");
  }

  return {
    score: breakdown.score,
    threshold: breakdown.threshold,
    margin: breakdown.margin,
    decision: breakdown.decision,
    summary: narrative,
    approvalReasons: supportSummary,
    rejectionReasons: riskSummary,
    fairnessDrivers: counterfactualSummary,
    positiveFactors: breakdown.positiveFactors,
    negativeFactors: breakdown.negativeFactors,
    borderline: Math.abs(breakdown.margin) <= 10,
  };
}

export function buildLocalChatResponse(latestCase, query, role = "analyst") {
  if (!latestCase) {
    return "No completed case is loaded yet. Run a Quick Test first and I can explain the approval or rejection logic, fairness risks, and counterfactual changes.";
  }

  const result = latestCase.finalResult || {};
  const details = result.decision_details || {};
  const question = String(query || "").toLowerCase();
  const modelOutputs = latestCase.aiOutputs?.length
    ? latestCase.aiOutputs
    : latestCase.ai?.responses?.length
      ? latestCase.ai.responses
      : [];
  const sortedSensitivity = Object.entries(result.attributeSensitivity || latestCase.results?.attributeSensitivity || {})
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  const topAttribute = sortedSensitivity[0];
  const approvalText = (details.approvalReasons || []).join(" ") || "No approval reasons recorded.";
  const rejectionText = (details.rejectionReasons || []).join(" ") || "No rejection pressures recorded.";
  const fairnessText = (details.fairnessDrivers || []).join(" ") || "No fairness stress-test summary recorded.";
  const comparisonText = modelOutputs.length > 0
    ? modelOutputs
        .map((entry, index) => {
          const label = entry.label || entry.aiId || entry.provider || `Model ${index + 1}`;
          const score = entry.bias_score ?? entry.score ?? entry.biasScore ?? "N/A";
          const verdict = entry.decision || entry.verdict || "Pending";
          return `${label}: bias ${score}, outcome ${verdict}`;
        })
        .join(" | ")
    : "Per-model outputs were not stored, so I can only infer from the aggregate result.";

  if (question.includes("compare") || question.includes("model")) {
    return [
      `Model comparison: ${comparisonText}`,
      `Agreement: ${result.agreement ?? "Unknown"}%`,
      `Confidence: ${result.confidence || "Unknown"}`,
      `Aggregate decision: ${result.final_decision || result.decision || latestCase.results?.originalDecision || "Unknown"}`,
    ].join("\n\n");
  }

  if (question.includes("approve") || question.includes("reject") || question.includes("why")) {
    return [
      `Decision: ${result.final_decision || result.decision || latestCase.results?.originalDecision || "Unknown"}`,
      `Summary: ${result.explanation || details.summary || "No detailed explanation is available yet."}`,
      `Why approved: ${approvalText}`,
      `Why rejected: ${rejectionText}`,
      `Fairness findings: ${fairnessText}`,
    ].join("\n\n");
  }

  if (question.includes("bias") || question.includes("fair")) {
    return [
      `Bias score: ${result.bias_score ?? latestCase.results?.biasScore ?? "Unknown"}`,
      `Risk level: ${result.riskLevel || latestCase.results?.riskLevel || "Unknown"}`,
      `Most sensitive attribute: ${topAttribute ? `${ATTRIBUTE_LABELS[topAttribute[0]] || topAttribute[0]} at ${formatPercent(topAttribute[1])}` : "No sensitivity data available."}`,
      `Violations: ${(result.violations || []).join(" ") || "No explicit violations were recorded."}`,
      `Recommended fixes: ${(result.recommendations || []).join(" ") || "No recommendations were recorded."}`,
    ].join("\n\n");
  }

  if (question.includes("executive") || question.includes("summary") || question.includes("stakeholder")) {
    return [
      `Executive summary: ${result.explanation || details.summary || "No summary available."}`,
      `Outcome: ${result.final_decision || result.decision || latestCase.results?.originalDecision || "Unknown"} with risk ${result.riskLevel || latestCase.results?.riskLevel || "Unknown"}.`,
      `Top fairness issue: ${topAttribute ? `${ATTRIBUTE_LABELS[topAttribute[0]] || topAttribute[0]} shifted results in ${formatPercent(topAttribute[1])} of tested variations.` : "No major fairness instability was stored."}`,
      `Immediate action: ${(result.recommendations || [])[0] || "Review weighting and monitor future audits."}`,
    ].join("\n\n");
  }

  return [
    `I can explain the latest ${DOMAIN_LABELS[latestCase.domain] || latestCase.domain} case in detail.`,
    `Current outcome: ${result.final_decision || result.decision || latestCase.results?.originalDecision || "Unknown"}`,
    `Best next questions: ask why it was approved or rejected, compare model outputs, request an executive summary, or ask which protected attributes were most sensitive.`,
    role === "engineer" || role === "admin"
      ? `Engineering note: the stored case includes twins, attribute sensitivity, decision details, and any available model comparison payloads for debugging.`
      : `Analyst note: I can turn the latest audit into plain-English reasoning for stakeholders.`,
  ].join("\n\n");
}

export function buildDecisionSummary(domain, input, proSettings = null) {
  const config = normalizeAuditConfig(proSettings);
  const normalizedInput = normalizeInput(domain, input);
  const breakdown = getDecisionBreakdown(domain, normalizedInput);
  const originalDecision = breakdown.decision;
  const twins = generateTwins(domain, normalizedInput, config);
  const metrics = computeBiasMetrics(originalDecision, twins, config.attributesToVary);
  const violations = buildViolations(metrics);
  const recommendations = buildRecommendations(metrics);
  const decisionDetails = buildDecisionNarrative(domain, normalizedInput, metrics, config);

  const decisions = twins.map((t) => ({
    twinId: t.twinId,
    variedAttributes: t.variedAttributes,
    decision: t.decision,
    isFlipped: t.isFlipped,
  }));

  return {
    normalizedInput,
    originalDecision,
    twins,
    decisions,
    results: {
      originalDecision,
      twinDecisions: decisions,
      biasScore: metrics.biasScore,
      flipRate: metrics.flipRate,
      attributeSensitivity: metrics.attributeSensitivity,
      riskLevel: metrics.riskLevel,
      decisionDetails,
    },
    biasScore: metrics.biasScore,
    riskLevel: metrics.riskLevel,
    violations,
    recommendations,
    auditConfig: config,
    decisionDetails,
  };
}
