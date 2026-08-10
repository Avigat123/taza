import { useState, useCallback } from "react";
import { getMarketData, saveMarketData, runDecision } from "../api/marketData";

/**
 * Manages a batch's REAL market/route input data (markets, routes,
 * localMarket) and lets the caller either:
 *   - persist it to MongoDB via saveMarketData (PUT /market-data), or
 *   - run only the deterministic Python decision engine against it
 *     (POST /decision) without re-running CV/shelf-life.
 *
 * Does not fabricate any demand/price/transport values — every field
 * here is exactly what the person typed into the form.
 */
export function useMarketData(batchId) {
  const [markets, setMarkets] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [localMarket, setLocalMarket] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [decision, setDecision] = useState(null);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [decisionError, setDecisionError] = useState(null);

  const load = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMarketData(batchId);
      setMarkets(data.markets);
      setRoutes(data.routes);
      setLocalMarket(data.localMarket);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  const save = useCallback(
    async (payload) => {
      if (!batchId) return null;
      setSaving(true);
      setSaveError(null);
      try {
        const data = await saveMarketData(batchId, payload);
        setMarkets(data.markets);
        setRoutes(data.routes);
        setLocalMarket(data.localMarket);
        return data;
      } catch (err) {
        setSaveError(err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [batchId]
  );

  const decide = useCallback(
    async (payload) => {
      if (!batchId) return null;
      setDecisionLoading(true);
      setDecisionError(null);
      setDecision(null);
      try {
        const result = await runDecision(batchId, payload);
        setDecision(result);
        return result;
      } catch (err) {
        setDecisionError(err);
        throw err;
      } finally {
        setDecisionLoading(false);
      }
    },
    [batchId]
  );

  return {
    markets,
    routes,
    localMarket,
    setMarkets,
    setRoutes,
    setLocalMarket,
    loading,
    error,
    load,
    saving,
    saveError,
    save,
    decision,
    decisionLoading,
    decisionError,
    decide,
  };
}
