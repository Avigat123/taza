
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getBatches,
} from "../api/batches";


// ============================================================
// useBatches
// ============================================================
//
// Responsible only for:
//
// 1. Loading batches from the backend
// 2. Managing loading/error state
// 3. Refreshing the list
//
// AI prediction logic is NOT handled here.
// Prediction data is already normalized by api/batches.js.
//
// Flow:
//
// Batches.jsx
//     ↓
// useBatches()
//     ↓
// getBatches()
//     ↓
// GET /api/batches
//     ↓
// normalizeBatch()
//     ↓
// Batches.jsx
//
// ============================================================

export function useBatches({
  autoLoad = true,
} = {}) {
  const [batches, setBatches] =
    useState([]);

  const [loading, setLoading] =
    useState(autoLoad);

  const [error, setError] =
    useState(null);

  const [lastUpdated, setLastUpdated] =
    useState(null);


  // Prevent state updates after
  // component unmount.
  const mountedRef =
    useRef(true);


  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);


  // ==========================================================
  // LOAD BATCHES
  // ==========================================================

  const loadBatches =
    useCallback(
      async ({
        silent = false,
      } = {}) => {

        // ----------------------------------------------------
        // Silent refresh:
        //
        // Keep existing data visible while refreshing.
        // ----------------------------------------------------

        if (!silent) {
          setLoading(true);
        }

        setError(null);


        try {
          const data =
            await getBatches();


          if (
            !mountedRef.current
          ) {
            return data;
          }


          setBatches(
            Array.isArray(data)
              ? data
              : []
          );

          setLastUpdated(
            new Date()
          );


          return data;

        } catch (err) {
          console.error(
            "Failed to load batches:",
            err
          );


          if (
            !mountedRef.current
          ) {
            return [];
          }


          setError(err);

          return [];

        } finally {
          if (
            mountedRef.current
          ) {
            setLoading(false);
          }
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

    loadBatches();
  }, [
    autoLoad,
    loadBatches,
  ]);


  // ==========================================================
  // REFRESH
  // ==========================================================
  //
  // Keeps existing batches visible while the new request
  // is running.
  // ==========================================================

  const refresh =
    useCallback(
      async () => {
        return loadBatches({
          silent: true,
        });
      },
      [loadBatches]
    );


  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    // Data
    batches,

    // Request state
    loading,
    error,

    // Metadata
    lastUpdated,

    // Actions
    loadBatches,
    refresh,

    // Convenience
    hasBatches:
      batches.length > 0,

    isEmpty:
      !loading &&
      batches.length === 0,
  };
}


export default useBatches;

