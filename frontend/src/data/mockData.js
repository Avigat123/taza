// ---------------------------------------------------------------------------
// MOCK DATA — stand-in for the backend + ML responses described in the API
// layer (src/api/*.js). Every shape here matches what those endpoints are
// expected to return, so swapping mock -> real fetch should not require
// touching component code. Once the backend team exposes real endpoints,
// delete this file's usage from src/api/*.js and point axios at them.
// ---------------------------------------------------------------------------

export const mockBatches = [
  {
    id: "MNG-102",
    produce: "Mango",
    origin: "Farm A, Ratnagiri",
    harvestDate: "2026-08-04",
    quantityKg: 850,
    freshness: 81,
    shelfLifeDays: 3.2,
    spoilageRisk: 18,
    confidence: "Medium",
    action: "Sell locally",
    imageKey: "mango-102", // PHOTO PLACEHOLDER — see PHOTO_PLACEHOLDERS.txt
  },
  {
    id: "MNG-118",
    produce: "Mango",
    origin: "Farm A, Ratnagiri",
    harvestDate: "2026-08-01",
    quantityKg: 1000,
    freshness: 62,
    shelfLifeDays: 1.8,
    spoilageRisk: 31,
    confidence: "High",
    action: "Sell locally",
    imageKey: "mango-118",
  },
  {
    id: "TOM-054",
    produce: "Tomato",
    origin: "Farm C, Nashik",
    harvestDate: "2026-08-06",
    quantityKg: 420,
    freshness: 91,
    shelfLifeDays: 5.4,
    spoilageRisk: 8,
    confidence: "High",
    action: "Monitor",
    imageKey: "tomato-054",
  },
  {
    id: "BAN-021",
    produce: "Banana",
    origin: "Farm B, Jalgaon",
    harvestDate: "2026-08-02",
    quantityKg: 610,
    freshness: 45,
    shelfLifeDays: 1.1,
    spoilageRisk: 52,
    confidence: "High",
    action: "Discount now",
    imageKey: "banana-021",
  },
  {
    id: "ONI-009",
    produce: "Onion",
    origin: "Farm D, Nashik",
    harvestDate: "2026-07-28",
    quantityKg: 1400,
    freshness: 88,
    shelfLifeDays: 14,
    spoilageRisk: 6,
    confidence: "Medium",
    action: "Ship to high-demand location",
    imageKey: "onion-009",
  },
  {
    id: "PAP-033",
    produce: "Papaya",
    origin: "Farm E, Sangli",
    harvestDate: "2026-08-05",
    quantityKg: 300,
    freshness: 28,
    shelfLifeDays: 0.6,
    spoilageRisk: 74,
    confidence: "High",
    action: "Redirect to processing",
    imageKey: "papaya-033",
  },
];

export const mockDashboardSummary = {
  totalInventoryKg: 12450,
  atRiskInventoryKg: 1240,
  priorityBatches: 8,
  estimatedWasteAvoidedKg: 84,
  wasteAvoidedValue: 21600,
};

export const mockFreshnessTrend = [
  { day: "Mon", avgFreshness: 84 },
  { day: "Tue", avgFreshness: 81 },
  { day: "Wed", avgFreshness: 79 },
  { day: "Thu", avgFreshness: 76 },
  { day: "Fri", avgFreshness: 74 },
  { day: "Sat", avgFreshness: 78 },
  { day: "Sun", avgFreshness: 80 },
];

export const mockWasteComparison = [
  { week: "Wk 1", withoutAI: 210, withAI: 138 },
  { week: "Wk 2", withoutAI: 240, withAI: 150 },
  { week: "Wk 3", withoutAI: 198, withAI: 121 },
  { week: "Wk 4", withoutAI: 265, withAI: 160 },
];

export const mockRiskBreakdown = [
  { name: "Low", value: 62, tier: "low" },
  { name: "Medium", value: 26, tier: "medium" },
  { name: "High", value: 12, tier: "high" },
];

export const mockRecentActivity = [
  { id: 1, text: "Batch MNG-118 flagged as high priority", time: "12 min ago" },
  { id: 2, text: "AI recommended shipping ONI-009 to Pune outlet", time: "38 min ago" },
  { id: 3, text: "New inspection completed for PAP-033", time: "1 hr ago" },
  { id: 4, text: "Batch TOM-054 passed quality check", time: "3 hr ago" },
];

export const mockRecommendations = [
  {
    id: "rec-1",
    batchId: "PAP-033",
    produce: "Papaya",
    action: "Redirect to processing",
    urgency: "high",
    reason:
      "Estimated shelf life has dropped to 0.6 days with 74% spoilage risk. Local demand cannot absorb 300 kg in time — processing recovers value before total loss.",
    quantityKg: 300,
  },
  {
    id: "rec-2",
    batchId: "BAN-021",
    produce: "Banana",
    action: "Discount now",
    urgency: "high",
    reason:
      "Freshness score fell to 45/100 overnight. Discounting 610 kg by ~30% clears inventory before spoilage risk crosses 60%.",
    quantityKg: 610,
  },
  {
    id: "rec-3",
    batchId: "MNG-118",
    produce: "Mango",
    action: "Sell locally",
    urgency: "medium",
    reason:
      "1.8 days of shelf life remain with high nearby demand 40 km away. Prioritize 700 kg for local retailers within 24 hours.",
    quantityKg: 1000,
  },
  {
    id: "rec-4",
    batchId: "ONI-009",
    produce: "Onion",
    action: "Ship to high-demand location",
    urgency: "low",
    reason:
      "14-day shelf life and low spoilage risk make this batch safe to travel. Demand in Pune is currently high with a 5-hour transit window.",
    quantityKg: 1400,
  },
];

export const mockPassport = {
  batchId: "MNG-102",
  produce: "Mango",
  stages: [
    { stage: "Farm", date: "2026-08-04", detail: "Harvested at Farm A, Ratnagiri" },
    { stage: "Pack House", date: "2026-08-04", detail: "Graded, 850 kg packed" },
    { stage: "Transport", date: "2026-08-05", detail: "6 hr transit, avg 9.1°C" },
    { stage: "Warehouse", date: "2026-08-05", detail: "Stored at 8.4°C, 82% humidity" },
    { stage: "Retailer", date: "Pending", detail: "Awaiting dispatch" },
  ],
  freshness: 81,
  shelfLifeDays: 3.2,
  spoilageRisk: 18,
};

export const mockAgentSuggestions = [
  "Which batches should we sell first?",
  "Which inventory is at highest risk?",
  "What actions would reduce expected waste this week?",
  "Which batches can safely travel farther?",
];
