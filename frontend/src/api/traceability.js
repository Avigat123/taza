import apiClient from "./client";
import { mockPassport } from "../data/mockData";

const USE_MOCK = true; // BACKEND TEAM: flip once /traceability endpoints exist

export async function getBatchPassport(batchId) {
  if (USE_MOCK) return Promise.resolve({ ...mockPassport, batchId });
  const { data } = await apiClient.get(`/traceability/${batchId}`);
  return data;
  // GET /api/traceability/:batchId -> full QR passport history (see docs/api.md)
}
