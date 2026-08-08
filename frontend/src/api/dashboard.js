import apiClient from "./client";
import {
  mockDashboardSummary,
  mockFreshnessTrend,
  mockWasteComparison,
  mockRiskBreakdown,
  mockRecentActivity,
} from "../data/mockData";

const USE_MOCK = true; // BACKEND TEAM: flip once /dashboard endpoints exist

export async function getDashboardSummary() {
  if (USE_MOCK) return Promise.resolve(mockDashboardSummary);
  const { data } = await apiClient.get("/dashboard/summary");
  return data;
  // GET /api/dashboard/summary -> { totalInventoryKg, atRiskInventoryKg, priorityBatches, estimatedWasteAvoidedKg, wasteAvoidedValue }
}

export async function getFreshnessTrend() {
  if (USE_MOCK) return Promise.resolve(mockFreshnessTrend);
  const { data } = await apiClient.get("/dashboard/freshness-trend");
  return data;
}

export async function getWasteComparison() {
  if (USE_MOCK) return Promise.resolve(mockWasteComparison);
  const { data } = await apiClient.get("/dashboard/waste-comparison");
  return data;
}

export async function getRiskBreakdown() {
  if (USE_MOCK) return Promise.resolve(mockRiskBreakdown);
  const { data } = await apiClient.get("/dashboard/risk-breakdown");
  return data;
}

export async function getRecentActivity() {
  if (USE_MOCK) return Promise.resolve(mockRecentActivity);
  const { data } = await apiClient.get("/dashboard/activity");
  return data;
}
