import apiClient from "./client";

// ============================================================
// HELPERS
// ============================================================

function unwrapResponse(response) {
  return response?.data?.data ?? response?.data ?? null;
}

/**
 * Backend (models/MarketDemand.js) shape uses camelCase field names
 * identical to what we use here — location/demandKg/pricePerKg for
 * markets, destination/transportHours/transportCost for routes.
 * Express itself converts these to the Python snake_case DecisionRequest
 * shape (mlProxy.service.js#getDecision) — the frontend never needs to
 * know about demand_kg / price_per_kg / etc.
 */
function normalizeMarket(m) {
  if (!m) return null;
  return {
    location: m.location ?? "",
    demandKg:
      m.demandKg ?? m.demand_kg ?? (m.demandKg === 0 ? 0 : null),
    pricePerKg:
      m.pricePerKg ?? m.price_per_kg ?? (m.pricePerKg === 0 ? 0 : null),
  };
}

function normalizeRoute(r) {
  if (!r) return null;
  return {
    destination: r.destination ?? "",
    transportHours: r.transportHours ?? r.transport_hours ?? null,
    transportCost: r.transportCost ?? r.transport_cost ?? null,
  };
}

function normalizeMarketData(data) {
  if (!data) return { markets: [], routes: [], localMarket: null };
  return {
    markets: Array.isArray(data.markets) ? data.markets.map(normalizeMarket) : [],
    routes: Array.isArray(data.routes) ? data.routes.map(normalizeRoute) : [],
    localMarket: data.localMarket ? normalizeMarket(data.localMarket) : null,
  };
}

// ============================================================
// GET STORED MARKET/ROUTE DATA FOR A BATCH
// ============================================================
// GET /api/batches/:batchId/market-data

export async function getMarketData(batchId) {
  if (!batchId) throw new Error("Batch ID is required.");
  const response = await apiClient.get(`/batches/${batchId}/market-data`);
  const data = unwrapResponse(response);
  return normalizeMarketData(data);
}

// ============================================================
// SAVE (CREATE/UPDATE) MARKET/ROUTE DATA FOR A BATCH
// ============================================================
// PUT /api/batches/:batchId/market-data
// Body: { markets: [{location,demandKg,pricePerKg}],
//         routes: [{destination,transportHours,transportCost}],
//         localMarket: {location,demandKg,pricePerKg} | null }

export async function saveMarketData(batchId, { markets = [], routes = [], localMarket = null }) {
  if (!batchId) throw new Error("Batch ID is required.");

  const payload = {
    markets: markets.map((m) => ({
      location: m.location,
      demandKg: Number(m.demandKg),
      pricePerKg: Number(m.pricePerKg),
    })),
    routes: routes.map((r) => ({
      destination: r.destination,
      transportHours: Number(r.transportHours),
      transportCost: Number(r.transportCost),
    })),
    localMarket: localMarket
      ? {
          location: localMarket.location,
          demandKg: Number(localMarket.demandKg),
          pricePerKg: Number(localMarket.pricePerKg),
        }
      : null,
  };

  const response = await apiClient.put(`/batches/${batchId}/market-data`, payload);
  const data = unwrapResponse(response);
  return normalizeMarketData(data);
}

// ============================================================
// RUN THE DETERMINISTIC PYTHON DECISION ENGINE ONLY
// ============================================================
// POST /api/batches/:batchId/decision
//
// Uses the batch's most recent shelf-life assessment (from a prior
// Analyze Batch run) plus either the stored market/route data or, if
// provided here, ad-hoc market/route data for this call only.
// Returns the raw DecisionResult from ai/decision/schema.py, unmodified.

export async function runDecision(batchId, { markets, routes, localMarket } = {}) {
  if (!batchId) throw new Error("Batch ID is required.");

  const body = {};
  if (markets !== undefined) {
    body.markets = markets.map((m) => ({
      location: m.location,
      demandKg: Number(m.demandKg),
      pricePerKg: Number(m.pricePerKg),
    }));
  }
  if (routes !== undefined) {
    body.routes = routes.map((r) => ({
      destination: r.destination,
      transportHours: Number(r.transportHours),
      transportCost: Number(r.transportCost),
    }));
  }
  if (localMarket !== undefined) {
    body.localMarket = localMarket
      ? {
          location: localMarket.location,
          demandKg: Number(localMarket.demandKg),
          pricePerKg: Number(localMarket.pricePerKg),
        }
      : null;
  }

  const response = await apiClient.post(`/batches/${batchId}/decision`, body);
  // sendSuccess wraps as { success, message, data, meta }. `data` here IS
  // the raw Python DecisionResult — pass it through unchanged so it's
  // interchangeable with prediction.decision from api/predictions.js.
  return unwrapResponse(response);
}
