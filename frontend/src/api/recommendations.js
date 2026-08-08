import apiClient from "./client";
import { mockRecommendations } from "../data/mockData";

const USE_MOCK = true; // BACKEND TEAM: flip once decision-engine/recommendation.engine.js is exposed via REST

export async function getRecommendations() {
  if (USE_MOCK) return Promise.resolve(mockRecommendations);
  const { data } = await apiClient.get("/recommendations");
  return data;
  // GET /api/recommendations
}
