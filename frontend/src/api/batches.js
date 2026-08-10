import apiClient from "./client";

const USE_MOCK = false;

const ACTION_LABELS = {
  SELL: "Sell locally",
  DISCOUNT: "Discount now",
  REDISTRIBUTE: "Ship to high-demand location",
  RESCUE: "Redirect to processing",
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Adapts a real Mongo Batch document (+ optional latest Prediction) into
 * the display shape the existing UI (BatchCard, BatchTable, BatchDetails)
 * already renders — see data/mockData.js for the shape this mirrors. */
function mapBatchToDisplayShape(batch, prediction = null) {
  const decisionAction = prediction?.decision?.recommendation?.primary_action;
  return {
    id: batch._id,
    produce: capitalize(batch.produceType),
    origin: batch.origin,
    harvestDate: batch.harvestDate,
    quantityKg: batch.quantity,
    freshness: prediction?.freshnessScore ?? batch.latestFreshnessScore ?? null,
    shelfLifeDays: prediction?.shelfLifeDays ?? batch.latestShelfLifeDays ?? null,
    spoilageRisk: Math.round(
      (prediction?.spoilageProbability ?? batch.latestSpoilageProbability ?? 0.5) * 100
    ),
    confidence: prediction?.confidence != null
      ? prediction.confidence >= 0.75
        ? "High"
        : prediction.confidence >= 0.5
        ? "Medium"
        : "Low"
      : "Unknown",
    action: ACTION_LABELS[decisionAction] || "Monitor",
    imageKey: batch.produceType,
    // kept for pages that want the full backend record (analysis flows)
    _raw: batch,
    _latestPrediction: prediction,
  };
}

export async function getBatches() {
  if (USE_MOCK) {
    const { mockBatches } = await import("../data/mockData");
    return mockBatches;
  }
  const { data } = await apiClient.get("/batches");
  return data.data.map((b) => mapBatchToDisplayShape(b));
}

export async function getBatchById(id) {
  if (USE_MOCK) {
    const { mockBatches } = await import("../data/mockData");
    return mockBatches.find((b) => b.id === id);
  }
  const [{ data: batchRes }, predictionRes] = await Promise.all([
    apiClient.get(`/batches/${id}`),
    apiClient.get(`/predictions/${id}`).catch(() => null),
  ]);
  const prediction = predictionRes?.data?.data ?? null;
  return mapBatchToDisplayShape(batchRes.data, prediction);
}

/**
 * Creates a batch. Payload from the create-batch form: { produce, origin,
 * harvestDate, quantityKg }. arrivalDate/currentLocation aren't collected
 * by that form yet, so they default to harvestDate/origin — good enough
 * to satisfy the backend's required fields without reworking the form.
 */
export async function createBatch(payload) {
  if (USE_MOCK) {
    return { ...payload, id: `NEW-${Date.now()}` };
  }
  const body = {
    produceType: payload.produce?.toLowerCase(),
    productName: payload.produce,
    origin: payload.origin,
    harvestDate: payload.harvestDate,
    arrivalDate: payload.arrivalDate || payload.harvestDate,
    currentLocation: payload.currentLocation || payload.origin,
    quantity: payload.quantityKg,
    unit: "kg",
  };
  const { data } = await apiClient.post("/batches", body);
  return mapBatchToDisplayShape(data.data);
}
