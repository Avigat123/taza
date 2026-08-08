import apiClient from "./client";

const USE_MOCK = true; // ML TEAM: flip to false once the inference server (ml/inference/server.py) is reachable

// Simulates the full pipeline response: vision detection + freshness +
// shelf-life + spoilage, as described in section 16 of the project doc.
function buildMockPrediction() {
  const freshness = Math.floor(60 + Math.random() * 35);
  const shelfLifeDays = +(1 + Math.random() * 5).toFixed(1);
  const spoilageRisk = Math.floor(5 + Math.random() * 40);
  return {
    produce: "Mango",
    ripeness: Math.floor(65 + Math.random() * 30),
    visibleDefects: Math.floor(Math.random() * 4),
    surfaceQuality: "Good",
    visualQualityScore: Math.floor(75 + Math.random() * 20),
    freshness,
    shelfLifeDays,
    spoilageRisk,
    confidence: "Medium",
    riskFactors: {
      visualDefectRisk: Math.floor(Math.random() * 20),
      temperatureStress: Math.floor(Math.random() * 25),
      ageRisk: Math.floor(Math.random() * 15),
      storageRisk: Math.floor(Math.random() * 15),
    },
  };
}

export async function inspectImage(file, qualityParams = {}) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1400)); // simulate inference latency
    return buildMockPrediction();
  }
  const form = new FormData();
  form.append("image", file);
  Object.entries(qualityParams).forEach(([k, v]) => form.append(k, v));
  const { data } = await apiClient.post("/predictions/inspect", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
  // POST /api/predictions/inspect (multipart)
  // -> proxies to ml/inference/server.py: vision + freshness + shelf-life + spoilage models
}
