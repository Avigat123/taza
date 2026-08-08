import { useState } from "react";
import { inspectImage } from "../api/predictions";

export function usePrediction() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function runInspection(file, qualityParams) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await inspectImage(file, qualityParams);
      setResult(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  return { result, loading, error, runInspection, reset };
}
