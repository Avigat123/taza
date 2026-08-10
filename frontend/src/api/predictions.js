import apiClient from "./client";

// Maps a Layer 3 ActionType (SELL/DISCOUNT/REDISTRIBUTE/RESCUE) onto the
// label vocabulary ActionBadge / common.actions.* already understand, so
// batch analysis results can reuse that component instead of a new one.
const ACTION_LABELS = {
  SELL: "Sell locally",
  DISCOUNT: "Discount now",
  REDISTRIBUTE: "Ship to high-demand location",
  RESCUE: "Redirect to processing",
};

const CONFIDENCE_LABEL = (score) => {
  if (score == null) return "Unknown";
  if (score >= 0.75) return "High";
  if (score >= 0.5) return "Medium";
  return "Low";
};

const SPOILAGE_RISK_PCT = { LOW: 15, MEDIUM: 50, HIGH: 80, UNKNOWN: 50 };

const BATCH_CONDITION_LABEL = { GOOD: "Good", MIXED: "Mixed", POOR: "Poor" };

// Pulls per-factor risk percentages out of the LLM's `factors` list when it
// named one matching a known signal; falls back to a share of the overall
// spoilage risk so the existing SpoilageRisk bar chart always has values.
function buildRiskFactors(shelfLife, spoilagePct) {
  const factors = shelfLife.factors || [];
  const find = (keywords) => {
    const hit = factors.find((f) =>
      keywords.some((k) => f.factor?.toLowerCase().includes(k))
    );
    if (!hit) return null;
    if (hit.impact === "negative") return Math.min(100, spoilagePct + 20);
    if (hit.impact === "positive") return Math.max(0, spoilagePct - 20);
    return spoilagePct;
  };

  return {
    visualDefectRisk: Math.round(100 - shelfLife.condition.freshness_score),
    temperatureStress: find(["temperature", "heat", "cold"]) ?? spoilagePct,
    ageRisk: find(["age", "harvest", "days"]) ?? spoilagePct,
    storageRisk: find(["storage", "humidity", "transport"]) ?? spoilagePct,
  };
}

/** Adapts a real AnalyzeBatchResult into the shape the existing
 * DetectionResults / FreshnessScore / ShelfLife / SpoilageRisk display
 * components already render, so those components need no changes. */
function mapAnalyzeResultToDisplayShape(result) {
  const { cv_analysis: cv, shelf_life: shelfLife, decision } = result;
  const spoilagePct = SPOILAGE_RISK_PCT[shelfLife.assessment.spoilage_risk] ?? 50;

  return {
    // DetectionResults
    produce: shelfLife.produce.charAt(0).toUpperCase() + shelfLife.produce.slice(1),
    ripeness: Math.round(cv.freshness_score),
    visibleDefects: cv.high_disagreement ? "Mixed batch" : 0,
    surfaceQuality: BATCH_CONDITION_LABEL[shelfLife.condition.batch_condition] || "Unknown",
    visualQualityScore: Math.round(cv.freshness_score),
    // FreshnessScore
    freshness: Math.round(cv.freshness_score),
    // ShelfLife
    shelfLifeDays: shelfLife.assessment.estimated_remaining_shelf_life_days ?? 0,
    confidence: CONFIDENCE_LABEL(shelfLife.assessment.confidence),
    // SpoilageRisk
    spoilageRisk: spoilagePct,
    riskFactors: buildRiskFactors(shelfLife, spoilagePct),
    // Decision & action plan (new — rendered by DecisionPlan.jsx)
    decision: {
      action: ACTION_LABELS[decision.recommendation.primary_action] || "Monitor",
      urgency: decision.recommendation.urgency,
      reasoning: decision.reasoning,
      impact: decision.impact,
      allocations: decision.allocations,
      constraints: decision.constraints,
    },
    // Raw payload, kept for the "Get AI Insights" follow-up call
    _raw: { cv, shelfLife, decision },
  };
}

/**
 * Runs the full CV -> shelf-life -> decision pipeline for a batch.
 * POST /api/batches/:batchId/analyze (multipart)
 *
 * @param {string} batchId
 * @param {File[]} files - produce images
 * @param {object} [storage] - { temperatureC, humidityPercent, harvestAgeDays }
 */
export async function analyzeBatchImages(batchId, files, storage = {}) {
  const form = new FormData();
  files.forEach((f) => form.append("images", f));
  if (storage.temperatureC !== undefined && storage.temperatureC !== "")
    form.append("temperatureC", storage.temperatureC);
  if (storage.humidityPercent !== undefined && storage.humidityPercent !== "")
    form.append("humidityPercent", storage.humidityPercent);
  if (storage.harvestAgeDays !== undefined && storage.harvestAgeDays !== "")
    form.append("harvestAgeDays", storage.harvestAgeDays);

  const { data } = await apiClient.post(`/batches/${batchId}/analyze`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return mapAnalyzeResultToDisplayShape(data.data);
}

/**
 * Requests an LLM explanation layered on top of the batch's most recent
 * decision. POST /api/batches/:batchId/analyze/insights
 */
export async function getBatchAiInsights(batchId) {
  const { data } = await apiClient.post(`/batches/${batchId}/analyze/insights`, {});
  return data.data; // { agent_explanation, agent_notes, agent_provider, agent_model, ... }
}
