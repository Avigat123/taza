import apiClient from "./client";
import { mockBatches } from "../data/mockData";

const USE_MOCK = true; // BACKEND TEAM: flip to false once /batches endpoints exist

export async function getBatches() {
  if (USE_MOCK) return Promise.resolve(mockBatches);
  const { data } = await apiClient.get("/batches");
  return data;
  // Expected shape: Batch[] — see models/Batch.js
  // GET /api/batches
}

export async function getBatchById(id) {
  if (USE_MOCK) return Promise.resolve(mockBatches.find((b) => b.id === id));
  const { data } = await apiClient.get(`/batches/${id}`);
  return data;
  // GET /api/batches/:id
}

export async function createBatch(payload) {
  if (USE_MOCK) return Promise.resolve({ ...payload, id: `NEW-${Date.now()}` });
  const { data } = await apiClient.post("/batches", payload);
  return data;
  // POST /api/batches  { produce, origin, harvestDate, quantityKg }
}
