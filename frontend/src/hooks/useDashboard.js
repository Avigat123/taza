import { useCallback, useEffect, useState } from "react";

import {
  getDashboardOverview,
  getUrgentBatches,
} from "../api/dashboard";


// ============================================================
// useDashboard
// ============================================================
//
// Real data flow:
//
//   Express
//      │
//      ├── GET /api/dashboard/overview
//      │
//      └── GET /api/dashboard/urgent
//              │
//              ▼
//        Dashboard UI
//
// No mock dashboard data is generated here.
// ============================================================

export default function useDashboard({
  autoLoad = true,
} = {}) {
  const [overview, setOverview] =
    useState(null);

  const [urgentBatches, setUrgentBatches] =
    useState([]);

  const [loading, setLoading] =
    useState(autoLoad);

  const [error, setError] =
    useState(null);

  const [lastUpdated, setLastUpdated] =
    useState(null);


  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  const loadDashboard = useCallback(
    async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          overviewData,
          urgentData,
        ] = await Promise.all([
          getDashboardOverview(),
          getUrgentBatches(),
        ]);

        setOverview(
          overviewData
        );

        setUrgentBatches(
          urgentData
        );

        setLastUpdated(
          new Date()
        );

        return {
          overview:
            overviewData,
          urgentBatches:
            urgentData,
        };
      } catch (err) {
        console.error(
          "Failed to load dashboard:",
          err
        );

        setError(err);

        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    loadDashboard().catch(
      () => {}
    );
  }, [
    autoLoad,
    loadDashboard,
  ]);


  // ==========================================================
  // DERIVED METRICS
  // ==========================================================

  const metrics = {
    totalBatches:
      overview?.totalBatches ?? 0,

    totalInventoryKg:
      overview?.totalInventoryKg ?? 0,

    atRiskBatchCount:
      overview?.atRiskBatchCount ?? 0,

    atRiskInventoryKg:
      overview?.atRiskInventoryKg ?? 0,

    criticalBatchCount:
      overview?.criticalBatchCount ?? 0,

    estimatedSpoilageKg:
      overview?.estimatedSpoilageKg ?? 0,

    estimatedSpoilagePercent:
      overview?.estimatedSpoilagePercent ?? 0,

    estimatedValueAtRisk:
      overview?.estimatedValueAtRisk ??
      null,

    batchesWithPredictions:
      overview?.batchesWithPredictions ??
      0,

    batchesWithoutPredictions:
      overview?.batchesWithoutPredictions ??
      0,

    predictionCoverage:
      overview?.predictionCoverage ?? 0,
  };


  // ==========================================================
  // STATUS
  // ==========================================================

  const hasData =
    Boolean(overview);

  const hasUrgentBatches =
    urgentBatches.length > 0;


  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    // Raw data
    overview,
    urgentBatches,

    // Derived metrics
    metrics,

    // State
    loading,
    error,
    hasData,
    hasUrgentBatches,
    lastUpdated,

    // Actions
    reload: loadDashboard,

    refresh: loadDashboard,
  };
}