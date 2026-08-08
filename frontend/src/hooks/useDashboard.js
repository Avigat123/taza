import { useEffect, useState } from "react";
import {
  getDashboardSummary,
  getFreshnessTrend,
  getWasteComparison,
  getRiskBreakdown,
  getRecentActivity,
} from "../api/dashboard";

export function useDashboard() {
  const [summary, setSummary] = useState(null);
  const [freshnessTrend, setFreshnessTrend] = useState([]);
  const [wasteComparison, setWasteComparison] = useState([]);
  const [riskBreakdown, setRiskBreakdown] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      getDashboardSummary(),
      getFreshnessTrend(),
      getWasteComparison(),
      getRiskBreakdown(),
      getRecentActivity(),
    ])
      .then(([s, ft, wc, rb, act]) => {
        if (!active) return;
        setSummary(s);
        setFreshnessTrend(ft);
        setWasteComparison(wc);
        setRiskBreakdown(rb);
        setActivity(act);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { summary, freshnessTrend, wasteComparison, riskBreakdown, activity, loading };
}
