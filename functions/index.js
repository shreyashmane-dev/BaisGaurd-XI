const crypto = require("crypto");
const admin = require("firebase-admin");
const { HttpsError, onCall } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

admin.initializeApp();

const db = admin.firestore();
const PROVIDERS = {
  gemini: { envKey: "GEMINI_API_KEY" },
  openai: { envKey: "OPENAI_API_KEY" },
  claude: { envKey: "CLAUDE_API_KEY" },
};
const PROVIDER_ALIASES = {
  gemini_pro: "gemini",
  gemini_flash: "gemini",
  openai_gpt4: "openai",
  claude_opus: "claude",
};

const MODEL_REGISTRY = {
  "gemini-flash": { provider: "gemini", model: "gemini-2.5-flash" },
  "gemini-pro": { provider: "gemini", model: "gemini-2.5-pro" },
  "openai-gpt4o-mini": { provider: "openai", model: "gpt-4o-mini" },
  "claude-sonnet": { provider: "claude", model: "claude-3-5-sonnet-latest" },
};
const MODEL_ALIASES = {
  gemini_flash: "gemini-flash",
  gemini_pro: "gemini-pro",
  openai_gpt4: "openai-gpt4o-mini",
  claude_opus: "claude-sonnet",
};
const callableOptions = {
  region: "us-central1",
  cors: ["http://localhost:5173", "https://baisguard-x.web.app", "https://baisguard-x.firebaseapp.com"],
};

function getEncryptionKey() {
  const secret = process.env.KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error("KEY_ENCRYPTION_SECRET is not configured.");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

function encryptValue(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    cipherText: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

function decryptValue(payload) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(payload.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.cipherText, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

async function getUserApiKey(uid, provider) {
  const normalizedProvider = PROVIDER_ALIASES[provider] || provider;
  const docId = `${uid}_${normalizedProvider}`;
  const snapshot = await db.collection("api_keys").doc(docId).get();
  if (snapshot.exists) {
    return decryptValue(snapshot.data().secret);
  }
  const envKeyName = PROVIDERS[normalizedProvider]?.envKey;
  return envKeyName ? process.env[envKeyName] : "";
}

async function writeLog(entry) {
  await db.collection("logs").add({
    ...entry,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw error;
    }
    return JSON.parse(match[0]);
  }
}

async function callGemini(model, apiKey, prompt) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed with ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
}

async function callOpenAI(model, apiKey, prompt) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: prompt,
      temperature: 0.2,
      text: {
        format: {
          type: "json_object",
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`);
  }

  const data = await response.json();
  return data.output_text || "{}";
}

async function callClaude(model, apiKey, prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude request failed with ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "{}";
}

async function invokeModel(aiId, prompt, uid) {
  const normalizedAiId = MODEL_ALIASES[aiId] || aiId;
  const target = MODEL_REGISTRY[normalizedAiId];
  if (!target) {
    throw new Error(`Unsupported model ${aiId}`);
  }

  const apiKey = await getUserApiKey(uid, target.provider);
  if (!apiKey) {
    throw new Error(`No API key available for provider ${target.provider}`);
  }

  if (target.provider === "gemini") {
    return safeJsonParse(await callGemini(target.model, apiKey, prompt));
  }
  if (target.provider === "openai") {
    return safeJsonParse(await callOpenAI(target.model, apiKey, prompt));
  }
  return safeJsonParse(await callClaude(target.model, apiKey, prompt));
}

function buildNormalPrompt(caseData) {
  return `
You are auditing fairness for a decision system. Return JSON only.
{
  "verdict": "Fair" | "Not Fair",
  "decision": string,
  "bias_score": number,
  "riskLevel": "Low" | "Medium" | "High",
  "explanation": string,
  "approval_reasons": string[],
  "rejection_reasons": string[],
  "fairness_drivers": string[],
  "key_biased_attributes": string[],
  "violations": string[],
  "recommendations": string[],
  "confidence": number
}

Domain: ${caseData.domain}
Original input: ${JSON.stringify(caseData.input)}
Original decision: ${JSON.stringify(caseData.results?.originalDecision)}
Twin Results: ${JSON.stringify(caseData.results?.twinDecisions || caseData.decisions)}
Metrics: ${JSON.stringify({
    biasScore: caseData.results?.biasScore,
    flipRate: caseData.results?.flipRate,
    attributeSensitivity: caseData.results?.attributeSensitivity,
    riskLevel: caseData.results?.riskLevel,
  })}
Tasks:
1) Explain clearly why the application was approved or rejected.
2) Separate business reasons from fairness-risk reasons.
3) Identify which attributes likely cause unfairness.
4) Give 2 actionable fixes.
`;
}

function buildProAnalysisPrompt(caseData, aiId) {
  return `
You are ${aiId}. Audit fairness of this system and respond as JSON only:
{
  "verdict": "Fair" | "Not Fair",
  "decision": string,
  "bias_score": number,
  "riskLevel": "Low" | "Medium" | "High",
  "approval_reasons": string[],
  "rejection_reasons": string[],
  "fairness_drivers": string[],
  "key_biased_attributes": string[],
  "violations": string[],
  "recommendations": string[],
  "reasoning": string,
  "confidence": number
}
Case: ${JSON.stringify({
    domain: caseData.domain,
    input: caseData.input,
    originalDecision: caseData.results?.originalDecision,
    twinResults: caseData.results?.twinDecisions || caseData.decisions,
    metrics: caseData.results,
  })}
`;
}

function buildCritiquePrompt(caseData, ownOutput, targetOutput) {
  return `
Critique another model's fairness analysis. Respond as JSON only:
{
  "critique": string,
  "recommended_adjustment": string
}
Case: ${JSON.stringify(caseData.input)}
Your prior output: ${JSON.stringify(ownOutput)}
Target output: ${JSON.stringify(targetOutput)}
`;
}

function buildRevisionPrompt(caseData, ownOutput, critique) {
  return `
Revise your fairness analysis using the critique below. Respond as JSON only:
{
  "verdict": "Fair" | "Not Fair",
  "decision": string,
  "bias_score": number,
  "riskLevel": "Low" | "Medium" | "High",
  "approval_reasons": string[],
  "rejection_reasons": string[],
  "fairness_drivers": string[],
  "key_biased_attributes": string[],
  "violations": string[],
  "recommendations": string[],
  "reasoning": string,
  "confidence": number
}
Case: ${JSON.stringify(caseData.input)}
Prior output: ${JSON.stringify(ownOutput)}
Critique: ${JSON.stringify(critique)}
`;
}

exports.saveApiKey = onCall(callableOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const { provider, key } = request.data || {};
  const normalizedProvider = PROVIDER_ALIASES[provider] || provider;
  if (!PROVIDERS[normalizedProvider] || !key) {
    throw new HttpsError("invalid-argument", "Provider and key are required.");
  }

  const docId = `${request.auth.uid}_${normalizedProvider}`;
  await db.collection("api_keys").doc(docId).set({
    userId: request.auth.uid,
    provider: normalizedProvider,
    preview: `****${String(key).slice(-4)}`,
    secret: encryptValue(String(key)),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true };
});

exports.listApiKeys = onCall(callableOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const snapshot = await db.collection("api_keys").where("userId", "==", request.auth.uid).get();
  return {
    keys: snapshot.docs.map((entry) => ({
      id: entry.id,
      provider: entry.data().provider,
      preview: entry.data().preview,
    })),
  };
});

exports.deleteApiKey = onCall(callableOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const { keyId } = request.data || {};
  const snapshot = await db.collection("api_keys").doc(keyId).get();
  if (!snapshot.exists || snapshot.data().userId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Key not found.");
  }
  await snapshot.ref.delete();
  return { ok: true };
});

exports.processCase = onCall(callableOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const { caseId, mode, role, selectedAIs = [], debateRounds = 2 } = request.data || {};
  if (!caseId) {
    throw new HttpsError("invalid-argument", "caseId is required.");
  }

  const caseRef = db.collection("cases").doc(caseId);
  const caseSnapshot = await caseRef.get();
  if (!caseSnapshot.exists) {
    throw new HttpsError("not-found", "Case not found.");
  }

  const caseData = caseSnapshot.data();
  if (caseData.userId !== request.auth.uid) {
    throw new HttpsError("permission-denied", "This case does not belong to you.");
  }

  await caseRef.update({ status: "processing" });

  try {
    if (mode !== "pro") {
      const analysis = await invokeModel("gemini-flash", buildNormalPrompt(caseData), request.auth.uid);
      const storedAnalysis = {
        aiId: "gemini-flash",
        verdict: analysis.verdict || (Number(analysis.bias_score || caseData.results?.biasScore || 0) > (caseData.fairnessRules?.maxBiasScore || 20) ? "Not Fair" : "Fair"),
        decision: analysis.decision || caseData.results?.originalDecision,
        bias_score: Number(analysis.bias_score || caseData.results?.biasScore || 0),
        riskLevel: analysis.riskLevel || caseData.results?.riskLevel || "Low",
        key_biased_attributes: analysis.key_biased_attributes || Object.entries(caseData.results?.attributeSensitivity || {}).filter(([, value]) => value > 0).map(([key]) => key),
        explanation: analysis.explanation,
        approval_reasons: analysis.approval_reasons || [],
        rejection_reasons: analysis.rejection_reasons || [],
        fairness_drivers: analysis.fairness_drivers || [],
        violations: analysis.violations || [],
        recommendations: analysis.recommendations || [],
        confidence: Number(analysis.confidence || 0.75),
      };
      const finalResult = {
        bias_score: storedAnalysis.bias_score,
        flipRate: caseData.results?.flipRate ?? 0,
        attributeSensitivity: caseData.results?.attributeSensitivity || {},
        riskLevel: storedAnalysis.riskLevel,
        explanation: storedAnalysis.explanation,
        decision_details: {
          approvalReasons: storedAnalysis.approval_reasons,
          rejectionReasons: storedAnalysis.rejection_reasons,
          fairnessDrivers: storedAnalysis.fairness_drivers,
        },
        key_factors: storedAnalysis.key_biased_attributes,
        violations: storedAnalysis.violations.length > 0 ? storedAnalysis.violations : caseData.finalResult?.violations || [],
        recommendations: storedAnalysis.recommendations.length > 0 ? storedAnalysis.recommendations : caseData.finalResult?.recommendations || [],
        final_decision: storedAnalysis.decision,
        verdict: storedAnalysis.verdict,
        agreement: 100,
        confidence: storedAnalysis.confidence >= 0.8 ? "High" : storedAnalysis.confidence >= 0.6 ? "Medium" : "Low",
      };

      await caseRef.update({
        aiUsed: ["gemini-flash"],
        aiOutputs: [storedAnalysis],
        ai: {
          mode: "normal",
          models: ["gemini-flash"],
          responses: [storedAnalysis],
          final: finalResult,
        },
        finalResult,
        status: "complete",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await writeLog({
        userId: request.auth.uid,
        caseId,
        type: "normal",
        level: "info",
        message: "Gemini normal mode completed.",
      });

      return { ok: true, finalResult };
    }

    const models = role === "engineer" || role === "admin"
      ? selectedAIs.map((entry) => MODEL_ALIASES[entry] || entry).slice(0, 4)
      : ["gemini-flash", "openai-gpt4o-mini"];
    const rounds = role === "engineer" || role === "admin" ? Math.min(Math.max(debateRounds, 2), 3) : 2;

    let outputs = await Promise.all(
      models.map(async (aiId) => ({
        aiId,
        round: 1,
        ...(await invokeModel(aiId, buildProAnalysisPrompt(caseData, aiId), request.auth.uid)),
      })),
    );

    await writeLog({
      userId: request.auth.uid,
      caseId,
      type: "round_1",
      message: "Independent AI analysis complete.",
      payload: outputs,
    });

    let critiques = [];
    if (rounds >= 2) {
      critiques = await Promise.all(
        outputs.map(async (output, index) => {
          const target = outputs[(index + 1) % outputs.length];
          return {
            aiId: output.aiId,
            target: target.aiId,
            round: 2,
            ...(await invokeModel(output.aiId, buildCritiquePrompt(caseData, output, target), request.auth.uid)),
          };
        }),
      );

      await writeLog({
        userId: request.auth.uid,
        caseId,
        type: "round_2",
        message: "AI critique round complete.",
        payload: critiques,
      });
    }

    if (rounds >= 3) {
      outputs = await Promise.all(
        outputs.map(async (output) => {
          const critique = critiques.find((entry) => entry.aiId === output.aiId);
          return {
            aiId: output.aiId,
            round: 3,
            ...(await invokeModel(output.aiId, buildRevisionPrompt(caseData, output, critique), request.auth.uid)),
          };
        }),
      );

      await writeLog({
        userId: request.auth.uid,
        caseId,
        type: "round_3",
        message: "AI revision round complete.",
        payload: outputs,
      });
    }

    const decisions = outputs.map((entry) => entry.decision);
    const scores = outputs.map((entry) => Number(entry.bias_score || 0));
    const allEqual = decisions.every((entry) => entry === decisions[0]);
    const variance = Math.max(...scores) - Math.min(...scores);
    const agreement = Math.round((decisions.filter((entry) => entry === decisions[0]).length / decisions.length) * 100);
    const averageBias = Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
    const mergedViolations = [...new Set(outputs.flatMap((entry) => entry.violations || []))];
    const mergedRecommendations = [...new Set(outputs.flatMap((entry) => entry.recommendations || []))];
    const mergedAttributes = [...new Set(outputs.flatMap((entry) => entry.key_biased_attributes || []))];
    const mergedApprovalReasons = [...new Set(outputs.flatMap((entry) => entry.approval_reasons || []))];
    const mergedRejectionReasons = [...new Set(outputs.flatMap((entry) => entry.rejection_reasons || []))];
    const mergedFairnessDrivers = [...new Set(outputs.flatMap((entry) => entry.fairness_drivers || []))];
    const riskLevel = averageBias >= 50 ? "High" : averageBias >= 20 ? "Medium" : "Low";
    const fairVotes = outputs.filter((entry) => String(entry.verdict || "").toLowerCase() === "fair").length;
    const verdict = fairVotes > outputs.length / 2 ? "Fair" : "Not Fair";

    const finalResult = {
      final_decision: decisions[0],
      average_bias_score: averageBias,
      bias_score: averageBias,
      flipRate: caseData.results?.flipRate ?? 0,
      attributeSensitivity: caseData.results?.attributeSensitivity || {},
      riskLevel,
      agreement,
      verdict,
      confidence: agreement === 100 && variance < 8 ? "High" : agreement >= 67 ? "Medium" : "Low",
      convergence: allEqual && variance < 8,
      score_variance: variance,
      explanation: outputs.map((entry) => `${entry.aiId}: ${entry.reasoning}`).join("\n\n"),
      decision_details: {
        approvalReasons: mergedApprovalReasons,
        rejectionReasons: mergedRejectionReasons,
        fairnessDrivers: mergedFairnessDrivers,
      },
      key_factors: mergedAttributes,
      violations: mergedViolations,
      recommendations: mergedRecommendations,
    };

    await caseRef.update({
      aiUsed: models,
      aiOutputs: outputs.map((entry) => ({
        ...entry,
        critiques: critiques.filter((critique) => critique.aiId === entry.aiId),
      })),
      ai: {
        mode: "pro",
        models,
        responses: outputs.map((entry) => ({
          ...entry,
          critiques: critiques.filter((critique) => critique.aiId === entry.aiId),
        })),
        final: finalResult,
      },
      finalResult,
      status: "complete",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await writeLog({
      userId: request.auth.uid,
      caseId,
      type: "final",
      message: "Consensus pipeline complete.",
      payload: finalResult,
    });

    return { ok: true, finalResult };
  } catch (error) {
    logger.error(error);
    await caseRef.update({
      status: "failed",
      finalResult: {
        error: error.message,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    await writeLog({
      userId: request.auth.uid,
      caseId,
      type: "error",
      level: "error",
      message: error.message,
    });
    throw new HttpsError("internal", error.message);
  }
});

exports.chatWithCaseContext = onCall(callableOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }

  const { query, role = "analyst", latestCaseId = null } = request.data || {};
  if (!query) {
    throw new HttpsError("invalid-argument", "query is required.");
  }

  let caseSnapshot = null;
  if (latestCaseId) {
    caseSnapshot = await db.collection("cases").doc(latestCaseId).get();
  } else {
    const latestCase = await db
      .collection("cases")
      .where("userId", "==", request.auth.uid)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();
    caseSnapshot = latestCase.docs[0] || null;
  }

  const latestCase = caseSnapshot?.data ? caseSnapshot.data() : null;
  const responseMode = role === "engineer" || role === "admin" ? "with structured, implementation-aware detail and compact JSON where helpful." : "in simple language.";
  const prompt = `
Role: ${role}
User last case: ${JSON.stringify(latestCase)}
Respond ${responseMode}
Question: ${query}
Return JSON only:
{
  "answer": string
}
`;

  const response = await invokeModel("gemini-flash", prompt, request.auth.uid);
  return { answer: response.answer };
});
