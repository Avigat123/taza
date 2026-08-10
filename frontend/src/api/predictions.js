
import apiClient from "./client";


// ============================================================
// HELPERS
// ============================================================

function unwrapResponse(response) {
  return (
    response?.data?.data ??
    response?.data ??
    null
  );
}


function normalizePercentage(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return null;
  }

  // Some APIs return probability as 0–1,
  // while the frontend displays percentage 0–100.
  if (
    number >= 0 &&
    number <= 1
  ) {
    return number * 100;
  }

  return number;
}


function normalizePrediction(data) {
  if (!data) {
    return null;
  }

  // Some backend responses wrap prediction
  // inside { prediction: {...} }.
  const prediction =
    data.prediction ??
    data.result ??
    data;


  const spoilageRisk =
    prediction.spoilageRisk ??
    prediction.spoilage_risk ??
    normalizePercentage(
      prediction.spoilageProbability ??
      prediction.spoilage_probability
    );


  const decision =
    prediction.decision ??
    prediction.recommendation ??
    null;


  const inputSignals =
    prediction.inputSignals ??
    prediction.input_signals ??
    prediction.inputs ??
    {};


  return {
    // --------------------------------------------------------
    // Identity
    // --------------------------------------------------------

    id:
      prediction.id ??
      prediction._id ??
      prediction.predictionId,

    batchId:
      prediction.batchId ??
      prediction.batch_id,


    // --------------------------------------------------------
    // Visual / CV result
    // --------------------------------------------------------

    visualClass:
      prediction.visualClass ??
      prediction.visual_class ??
      prediction.className ??
      prediction.class_name ??
      prediction.predictedClass ??
      prediction.predicted_class ??
      null,

    freshness:
      prediction.freshness ??
      prediction.freshnessScore ??
      prediction.freshness_score ??
      null,


    // --------------------------------------------------------
    // Shelf life
    // --------------------------------------------------------

    shelfLifeDays:
      prediction.shelfLifeDays ??
      prediction.shelf_life_days ??
      prediction.predictedShelfLife ??
      prediction.predicted_shelf_life ??
      null,

    shelfLifeRange:
      prediction.shelfLifeRange ??
      prediction.shelf_life_range ??
      null,


    // --------------------------------------------------------
    // Spoilage
    // --------------------------------------------------------

    spoilageRisk,

    spoilageProbability:
      prediction.spoilageProbability ??
      prediction.spoilage_probability ??
      null,


    // --------------------------------------------------------
    // Risk / confidence
    // --------------------------------------------------------

    riskLevel:
      prediction.riskLevel ??
      prediction.risk_level ??
      (
        spoilageRisk == null
          ? null
          : spoilageRisk >= 70
          ? "HIGH"
          : spoilageRisk >= 35
          ? "MEDIUM"
          : "LOW"
      ),

    confidence:
      prediction.confidence ??
      prediction.modelConfidence ??
      prediction.model_confidence ??
      null,


    // --------------------------------------------------------
    // Condition / urgency
    // --------------------------------------------------------

    batchCondition:
      prediction.batchCondition ??
      prediction.batch_condition ??
      null,

    urgency:
      prediction.urgency ??
      prediction.priority ??
      null,


    // --------------------------------------------------------
    // Reasoning
    // --------------------------------------------------------

    reasoning:
      prediction.reasoning ??
      prediction.explanation ??
      prediction.explanationText ??
      prediction.explanation_text ??
      null,


    // --------------------------------------------------------
    // Decision engine
    // --------------------------------------------------------

    decision: {
      action:
        decision?.action ??
        decision?.recommendedAction ??
        decision?.recommended_action ??
        prediction.action ??
        prediction.recommendedAction ??
        prediction.recommended_action ??
        null,

      reasoning:
        decision?.reasoning ??
        decision?.explanation ??
        prediction.decisionReasoning ??
        prediction.decision_reasoning ??
        null,

      priority:
        decision?.priority ??
        prediction.priority ??
        null,
    },


    // --------------------------------------------------------
    // Impact
    // --------------------------------------------------------

    impact:
      prediction.impact ??
      prediction.estimatedImpact ??
      prediction.estimated_impact ??
      null,


    // --------------------------------------------------------
    // Factors
    // --------------------------------------------------------

    factors:
      Array.isArray(
        prediction.factors
      )
        ? prediction.factors
        : Array.isArray(
            prediction.riskFactors
          )
        ? prediction.riskFactors
        : [],


    // --------------------------------------------------------
    // RAG evidence
    // --------------------------------------------------------

    evidence:
      Array.isArray(
        prediction.evidence
      )
        ? prediction.evidence
        : Array.isArray(
            prediction.sources
          )
        ? prediction.sources
        : [],


    // --------------------------------------------------------
    // Allocation / redistribution
    // --------------------------------------------------------

    allocations:
      Array.isArray(
        prediction.allocations
      )
        ? prediction.allocations
        : Array.isArray(
            prediction.recommendedAllocations
          )
        ? prediction.recommendedAllocations
        : [],


    // --------------------------------------------------------
    // Input signals
    // --------------------------------------------------------

    inputSignals: {
      temperature:
        inputSignals.temperature ??
        inputSignals.temperatureC ??
        inputSignals.temperature_c ??
        null,

      humidity:
        inputSignals.humidity ??
        inputSignals.humidityPercent ??
        inputSignals.humidity_percent ??
        null,

      daysSinceHarvest:
        inputSignals.daysSinceHarvest ??
        inputSignals.days_since_harvest ??
        null,

      transportDurationHours:
        inputSignals.transportDurationHours ??
        inputSignals.transport_duration_hours ??
        null,

      storageType:
        inputSignals.storageType ??
        inputSignals.storage_type ??
        null,

      storageLocation:
        inputSignals.storageLocation ??
        inputSignals.storage_location ??
        null,
    },


    // --------------------------------------------------------
    // Metadata
    // --------------------------------------------------------

    source:
      prediction.source ??
      prediction.model ??
      null,

    createdAt:
      prediction.createdAt ??
      prediction.created_at ??
      null,

    updatedAt:
      prediction.updatedAt ??
      prediction.updated_at ??
      null,


    // Keep original response available.
    _raw: prediction,
  };
}


// ============================================================
// ANALYZE BATCH IMAGES
// ============================================================
//
// This function sends the images + batch conditions to the
// EXISTING AI/backend pipeline.
//
// The AI service itself is NOT changed.
//
// Expected frontend flow:
//
// Analyze page
//      ↓
// runInspection()
//      ↓
// analyzeBatchImages()
//      ↓
// POST /api/predictions/:batchId/analyze
//      ↓
// Existing backend / AI service
//      ↓
// Prediction
// ============================================================

export async function analyzeBatchImages(
  batchId,
  files,
  input = {}
) {
  if (!batchId) {
    throw new Error(
      "Batch ID is required."
    );
  }


  if (
    !files ||
    files.length === 0
  ) {
    throw new Error(
      "At least one produce image is required."
    );
  }


  const formData =
    new FormData();


  // ----------------------------------------------------------
  // Images
  //
  // Use "images" as the primary field.
  // The backend can receive multiple images.
  // ----------------------------------------------------------

  files.forEach((file) => {
    if (file) {
      formData.append(
        "images",
        file
      );
    }
  });


  // ----------------------------------------------------------
  // Additional AI inputs
  //
  // Only append values that actually exist.
  // This prevents empty frontend fields from overwriting
  // backend defaults.
  // ----------------------------------------------------------

  const appendIfPresent = (
    key,
    value
  ) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      formData.append(
        key,
        String(value)
      );
    }
  };


  appendIfPresent(
    "temperature",
    input.temperature
  );

  appendIfPresent(
    "humidity",
    input.humidity
  );

  appendIfPresent(
    "storageType",
    input.storageType
  );

  appendIfPresent(
    "storageLocation",
    input.storageLocation
  );

  appendIfPresent(
    "transportDurationHours",
    input.transportDurationHours
  );

  appendIfPresent(
    "daysSinceHarvest",
    input.daysSinceHarvest
  );


  // ----------------------------------------------------------
  // Send request
  // ----------------------------------------------------------

  const response =
    await apiClient.post(
      `/batches/${batchId}/analyze`,
      formData,
      {
        headers: {
          "Content-Type":
            "multipart/form-data",
        },
      }
    );


  const data =
    unwrapResponse(
      response
    );


  return normalizePrediction(
    data
  );
}


// ============================================================
// GET LATEST PREDICTION
// ============================================================
//
// Backend:
// GET /api/predictions/:batchId
//
// Used by BatchDetails.jsx.
// ============================================================

export async function getLatestPrediction(
  batchId
) {
  if (!batchId) {
    throw new Error(
      "Batch ID is required."
    );
  }


  const response =
    await apiClient.get(
      `/predictions/${batchId}`
    );


  const data =
    unwrapResponse(
      response
    );


  // Backend may return:
//
// {
//   prediction: {...}
// }
//
// or directly:
//
// {
//   freshness: 82,
//   ...
// }

  return normalizePrediction(
    data
  );
}


// ============================================================
// GET PREDICTION HISTORY
// ============================================================
//
// Kept separate from latest prediction so the frontend can
// later display historical model runs without changing the
// analysis flow.
// ============================================================

export async function getPredictionHistory(
  batchId
) {
  if (!batchId) {
    throw new Error(
      "Batch ID is required."
    );
  }


  const response =
    await apiClient.get(
      `/predictions/${batchId}/history`
    );


  const data =
    unwrapResponse(
      response
    );


  const predictions =
    Array.isArray(data)
      ? data
      : Array.isArray(
          data?.predictions
        )
      ? data.predictions
      : [];


  return predictions.map(
    normalizePrediction
  );
}


// ============================================================
// AI INSIGHTS
// ============================================================
//
// Optional explanation endpoint.
//
// If your backend exposes this endpoint, the frontend can
// request a natural-language explanation after prediction.
//
// This does NOT replace the actual ML prediction.
// ============================================================

export async function getBatchAiInsights(
  batchId
) {
  if (!batchId) {
    throw new Error(
      "Batch ID is required."
    );
  }


  const response =
    await apiClient.get(
      `/predictions/${batchId}/insights`
    );


  return unwrapResponse(
    response
  );
}


// ============================================================
// EXPORT
// ============================================================

export {
  normalizePrediction,
};

