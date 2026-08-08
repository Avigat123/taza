import { useEffect, useState } from "react";
import { getRecommendations } from "../api/recommendations";

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getRecommendations()
      .then((data) => active && setRecommendations(data))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { recommendations, loading };
}
