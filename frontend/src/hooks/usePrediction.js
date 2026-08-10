import { useState } from "react";
import { analyzeBatchImages, getBatchAiInsights } from "../api/predictions";

export function usePrediction() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState(null);

  async function runInspection(batchId, files, storage) {
    setLoading(true);
    setError(null);
    setResult(null);
    setInsights(null);
    try {
      const data = await analyzeBatchImages(batchId, files, storage);
      setResult(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function requestInsights(batchId) {
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const data = await getBatchAiInsights(batchId);
      setInsights(data);
    } catch (err) {
      setInsightsError(err);
    } finally {
      setInsightsLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setInsights(null);
    setInsightsError(null);
  }

  return {
    result,
    loading,
    error,
    runInspection,
    reset,
    insights,
    insightsLoading,
    insightsError,
    requestInsights,
  };
}
