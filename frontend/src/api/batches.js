
import apiClient from "./client";


// ============================================================
// HELPERS
// ============================================================

function normalizeBatch(batch) {
  if (!batch) {
    return null;
  }

  // Backend may return either _id or id.
  const id =
    batch.id ??
    batch._id ??
    batch.batchId;

  // ----------------------------------------------------------
  // IMPORTANT:
  //
  // Do NOT invent ML values here.
  //
  // If the batch has not been analyzed, these stay null.
  // This allows the frontend to correctly display:
  //
  // "Not analyzed"
  //
  // instead of showing fake freshness/spoilage values.
  // ----------------------------------------------------------

  const prediction =
    batch.prediction ??
    batch.latestPrediction ??
    batch.aiPrediction ??
    null;


  return {
    id,

    // --------------------------------------------------------
    // Product information
    // --------------------------------------------------------

    produce:
      batch.produce ??
      batch.produceType ??
      batch.productName ??
      "Unknown",

    productName:
      batch.productName ??
      batch.produce ??
      batch.produceType ??
      "Unknown",

    produceType:
      batch.produceType ??
      batch.produce ??
      null,


    // --------------------------------------------------------
    // Quantity
    // --------------------------------------------------------

    quantityKg:
      batch.quantityKg ??
      batch.quantity ??
      0,

    unit:
      batch.unit ??
      "kg",


    // --------------------------------------------------------
    // Supply-chain information
    // --------------------------------------------------------

    origin:
      batch.origin ??
      batch.source ??
      null,

    currentLocation:
      batch.currentLocation ??
      batch.location ??
      null,

    harvestDate:
      batch.harvestDate ??
      null,

    arrivalDate:
      batch.arrivalDate ??
      null,


    // --------------------------------------------------------
    // Prediction
    // --------------------------------------------------------

    freshness:
      prediction?.freshness ??
      prediction?.freshnessScore ??
      batch.freshness ??
      batch.freshnessScore ??
      null,

    shelfLifeDays:
      prediction?.shelfLifeDays ??
      prediction?.shelf_life_days ??
      batch.shelfLifeDays ??
      batch.shelf_life_days ??
      null,

    spoilageRisk:
      prediction?.spoilageRisk ??
      prediction?.spoilageProbability != null
        ? Number(
            prediction.spoilageProbability
          ) * 100
        : batch.spoilageRisk ??
          batch.spoilageProbability != null
        ? Number(
            batch.spoilageProbability
          ) * 100
        : null,


    // --------------------------------------------------------
    // Prediction metadata
    // --------------------------------------------------------

    confidence:
      prediction?.confidence ??
      null,

    riskLevel:
      prediction?.riskLevel ??
      null,

    action:
      prediction?.decision?.action ??
      prediction?.action ??
      null,

    lastPredictedAt:
      prediction?.createdAt ??
      prediction?.updatedAt ??
      batch.lastPredictedAt ??
      null,


    // --------------------------------------------------------
    // Database metadata
    // --------------------------------------------------------

    createdAt:
      batch.createdAt ??
      null,

    updatedAt:
      batch.updatedAt ??
      null,


    // Keep original backend response available.
    _raw: batch,
  };
}


// ============================================================
// GET ALL BATCHES
// ============================================================
//
// Backend:
// GET /api/batches
// ============================================================

export async function getBatches() {
  const response =
    await apiClient.get(
      "/batches"
    );

  const data =
    response?.data?.data ??
    response?.data;


  if (Array.isArray(data)) {
    return data.map(
      normalizeBatch
    );
  }


  // Some APIs return:
  //
  // {
  //   batches: [...]
  // }
  //

  if (
    Array.isArray(
      data?.batches
    )
  ) {
    return data.batches.map(
      normalizeBatch
    );
  }


  if (
    Array.isArray(
      data?.items
    )
  ) {
    return data.items.map(
      normalizeBatch
    );
  }


  return [];
}


// ============================================================
// GET SINGLE BATCH
// ============================================================
//
// Backend:
// GET /api/batches/:id
// ============================================================

export async function getBatchById(
  batchId
) {
  if (!batchId) {
    throw new Error(
      "Batch ID is required."
    );
  }

  const response =
    await apiClient.get(
      `/batches/${batchId}`
    );

  const data =
    response?.data?.data ??
    response?.data;


  // Backend may return:
//
// {
//   data: {
//     batch: {...}
//   }
// }

  const batch =
    data?.batch ??
    data;


  return normalizeBatch(
    batch
  );
}


// ============================================================
// CREATE BATCH
// ============================================================
//
// The AI service is NOT touched here.
//
// This only creates the inventory record.
// AI analysis happens later through the
// prediction/analyze endpoint.
// ============================================================

export async function createBatch(
  input
) {
  if (!input) {
    throw new Error(
      "Batch information is required."
    );
  }


  const payload = {
    productName:
      input.productName ??
      input.produce ??
      input.produceType,

    produceType:
      input.produceType ??
      input.produce ??
      input.productName,

    quantity:
      Number(
        input.quantity ??
        input.quantityKg ??
        0
      ),

    origin:
      input.origin,

    harvestDate:
      input.harvestDate,

    arrivalDate:
      input.arrivalDate,

    currentLocation:
      input.currentLocation,
  };


  if (
    !payload.productName ||
    !payload.produceType
  ) {
    throw new Error(
      "Produce type is required."
    );
  }


  if (
    !payload.quantity ||
    payload.quantity <= 0
  ) {
    throw new Error(
      "Quantity must be greater than zero."
    );
  }


  const response =
    await apiClient.post(
      "/batches",
      payload
    );


  const data =
    response?.data?.data ??
    response?.data;


  const batch =
    data?.batch ??
    data;


  return normalizeBatch(
    batch
  );
}


// ============================================================
// UPDATE BATCH
// ============================================================
//
// Used for changing inventory metadata.
//
// It does NOT trigger AI prediction.
// ============================================================

export async function updateBatch(
  batchId,
  updates
) {
  if (!batchId) {
    throw new Error(
      "Batch ID is required."
    );
  }


  if (!updates) {
    throw new Error(
      "Update data is required."
    );
  }


  const payload = {};


  if (
    updates.productName !==
      undefined
  ) {
    payload.productName =
      updates.productName;
  }


  if (
    updates.produceType !==
      undefined
  ) {
    payload.produceType =
      updates.produceType;
  }


  if (
    updates.quantity !==
      undefined ||
    updates.quantityKg !==
      undefined
  ) {
    payload.quantity =
      Number(
        updates.quantity ??
        updates.quantityKg
      );
  }


  if (
    updates.origin !==
      undefined
  ) {
    payload.origin =
      updates.origin;
  }


  if (
    updates.harvestDate !==
      undefined
  ) {
    payload.harvestDate =
      updates.harvestDate;
  }


  if (
    updates.arrivalDate !==
      undefined
  ) {
    payload.arrivalDate =
      updates.arrivalDate;
  }


  if (
    updates.currentLocation !==
      undefined
  ) {
    payload.currentLocation =
      updates.currentLocation;
  }


  const response =
    await apiClient.patch(
      `/batches/${batchId}`,
      payload
    );


  const data =
    response?.data?.data ??
    response?.data;


  return normalizeBatch(
    data?.batch ??
    data
  );
}


// ============================================================
// DELETE BATCH
// ============================================================

export async function deleteBatch(
  batchId
) {
  if (!batchId) {
    throw new Error(
      "Batch ID is required."
    );
  }

  const response =
    await apiClient.delete(
      `/batches/${batchId}`
    );

  return (
    response?.data?.data ??
    response?.data
  );
}


// ============================================================
// EXPORT NORMALIZER
// ============================================================

export {
  normalizeBatch,
};
