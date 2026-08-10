import { useCallback, useEffect, useState } from "react";
import { getBatches } from "../api/batches";

export function useBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    setLoading(true);
    return getBatches()
      .then((data) => setBatches(data))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    getBatches()
      .then((data) => {
        if (active) setBatches(data);
      })
      .catch((err) => active && setError(err))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { batches, loading, error, refresh };
}