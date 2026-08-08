// Central place for score -> risk-tier logic so every component
// (rings, badges, table rows, charts) agrees on the same thresholds.
// Backend/ML team: if the model's own risk banding differs from this,
// prefer sending an explicit `riskTier` field on the batch/prediction
// payload and short-circuit these helpers.

export function freshnessTier(score) {
  if (score >= 70) return "low";
  if (score >= 40) return "medium";
  return "high";
}

export function spoilageTier(riskPercent) {
  if (riskPercent < 20) return "low";
  if (riskPercent < 45) return "medium";
  return "high";
}

export const tierColor = {
  low: "#2F7D5A",
  medium: "#DB9A2C",
  high: "#C3452E",
};

export const tierLabel = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

export function shelfLifeUrgency(days) {
  if (days <= 1) return "high";
  if (days <= 3) return "medium";
  return "low";
}
