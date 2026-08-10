
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CloudUpload,
  Droplets,
  Image as ImageIcon,
  MapPin,
  ScanLine,
  Thermometer,
  Truck,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import PageContainer from "../components/layout/PageContainer";
import Card, {
  CardHeader,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import Loader from "../components/ui/Loader";

import { useBatches } from "../hooks/useBatches";
import { usePrediction } from "../hooks/usePrediction";


// ============================================================
// CONSTANTS
// ============================================================

const MAX_IMAGES = 5;

const STORAGE_TYPES = [
  "Cold storage",
  "Refrigerated",
  "Controlled atmosphere",
  "Ambient",
  "Open storage",
  "Transport vehicle",
];


// ============================================================
// HELPERS
// ============================================================

function getQueryBatchId(search) {
  const params =
    new URLSearchParams(search);

  return params.get("batch");
}


function calculateDaysSinceHarvest(
  harvestDate
) {
  if (!harvestDate) {
    return "";
  }

  const harvest =
    new Date(harvestDate);

  if (
    Number.isNaN(
      harvest.getTime()
    )
  ) {
    return "";
  }

  const now = new Date();

  const difference =
    now.getTime() -
    harvest.getTime();

  return Math.max(
    0,
    Math.floor(
      difference /
        (1000 * 60 * 60 * 24)
    )
  );
}


function formatNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return Number(value).toLocaleString(
    "en-IN"
  );
}


function getRiskLevel(
  percentage
) {
  if (percentage == null) {
    return "UNKNOWN";
  }

  if (percentage >= 70) {
    return "HIGH";
  }

  if (percentage >= 35) {
    return "MEDIUM";
  }

  return "LOW";
}


function getRiskClasses(level) {
  switch (
    String(level || "").toUpperCase()
  ) {
    case "HIGH":
    case "CRITICAL":
      return {
        wrapper:
          "border-red-200 bg-red-50",
        text: "text-red-700",
        dot: "bg-red-500",
      };

    case "MEDIUM":
      return {
        wrapper:
          "border-yellow-200 bg-yellow-50",
        text: "text-yellow-700",
        dot: "bg-yellow-500",
      };

    case "LOW":
      return {
        wrapper:
          "border-green-200 bg-green-50",
        text: "text-green-700",
        dot: "bg-green-500",
      };

    default:
      return {
        wrapper:
          "border-border bg-bg",
        text: "text-muted",
        dot: "bg-gray-400",
      };
  }
}


// ============================================================
// IMAGE PREVIEW
// ============================================================

function ImagePreview({
  file,
  onRemove,
}) {
  const [preview, setPreview] =
    useState(null);


  useEffect(() => {
    const url =
      URL.createObjectURL(file);

    setPreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);


  return (
    <div className="relative aspect-square rounded-xl overflow-hidden border border-border bg-bg">

      {preview && (
        <img
          src={preview}
          alt={file.name}
          className="w-full h-full object-cover"
        />
      )}

      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black"
        aria-label="Remove image"
      >
        <X size={14} />
      </button>

    </div>
  );
}


// ============================================================
// INPUT FIELD
// ============================================================

function Field({
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
  suffix,
  min,
  max,
  step,
  required = false,
  children,
}) {
  return (
    <div>

      <label className="flex items-center gap-1.5 text-xs font-medium text-muted mb-1.5">

        {Icon && (
          <Icon size={13} />
        )}

        {label}

        {required && (
          <span className="text-red-500">
            *
          </span>
        )}

      </label>


      {children || (
        <div className="relative">

          <input
            type={type}
            value={value}
            onChange={(event) =>
              onChange(
                event.target.value
              )
            }
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            required={required}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />

          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
              {suffix}
            </span>
          )}

        </div>
      )}

    </div>
  );
}


// ============================================================
// RESULT PANEL
// ============================================================

function PredictionResult({
  result,
  onAnalyzeAgain,
}) {
  if (!result) {
    return null;
  }

  const risk =
    result.spoilageRisk;

  const riskLevel =
    result.riskLevel ||
    getRiskLevel(risk);

  const riskClasses =
    getRiskClasses(
      riskLevel
    );


  return (
    <Card>

      <CardHeader
        title="AI analysis result"
        subtitle="Prediction returned by the existing AI pipeline"
      />


      {/* ======================================================
          PRIMARY RESULT
      ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Freshness */}

        <div className="rounded-xl border border-border p-5">

          <p className="text-xs text-muted">
            Freshness score
          </p>

          <p className="text-4xl font-semibold font-mono text-ink mt-2">
            {result.freshness !=
            null
              ? Math.round(
                  Number(
                    result.freshness
                  )
                )
              : "—"}

            <span className="text-base font-normal text-muted">
              /100
            </span>
          </p>

        </div>


        {/* Shelf life */}

        <div className="rounded-xl border border-border p-5">

          <p className="text-xs text-muted">
            Remaining shelf life
          </p>

          <p className="text-4xl font-semibold font-mono text-ink mt-2">
            {result.shelfLifeDays ??
              "—"}

            <span className="text-base font-normal text-muted">
              {" "}
              days
            </span>
          </p>

        </div>


        {/* Spoilage */}

        <div
          className={`rounded-xl border p-5 ${riskClasses.wrapper}`}
        >

          <div className="flex items-center justify-between">

            <p className="text-xs text-muted">
              Spoilage risk
            </p>

            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${riskClasses.text}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${riskClasses.dot}`}
              />

              {riskLevel}
            </span>

          </div>

          <p className="text-4xl font-semibold font-mono text-ink mt-2">
            {risk != null
              ? `${Math.round(
                  Number(risk)
                )}%`
              : "—"}
          </p>

        </div>

      </div>


      {/* ======================================================
          ASSESSMENT
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">

        <div className="rounded-xl bg-bg p-4">

          <p className="text-xs font-medium text-muted">
            Produce assessment
          </p>

          <p className="text-base font-semibold text-ink mt-1">
            {result.visualClass ||
              result.batchCondition ||
              "Assessment available"}
          </p>

          {result.reasoning && (
            <p className="text-sm text-muted mt-2 leading-6">
              {result.reasoning}
            </p>
          )}

        </div>


        <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">

          <p className="text-xs font-medium text-brand-700">
            Recommended action
          </p>

          <p className="text-base font-semibold text-ink mt-1">
            {result.decision
              ?.action ||
              "Review batch"}
          </p>

          {result.decision
            ?.reasoning && (
            <p className="text-sm text-muted mt-2 leading-6">
              {
                result.decision
                  .reasoning
              }
            </p>
          )}

        </div>

      </div>


      {/* ======================================================
          CONFIDENCE
      ====================================================== */}

      {result.confidence !=
        null && (
        <div className="mt-4 rounded-lg border border-border px-4 py-3 flex items-center justify-between">

          <span className="text-xs text-muted">
            Model confidence
          </span>

          <span className="text-sm font-mono font-semibold text-ink">
            {typeof result.confidence ===
            "number"
              ? `${Math.round(
                  result.confidence <=
                    1
                    ? result.confidence *
                        100
                    : result.confidence
                )}%`
              : result.confidence}
          </span>

        </div>
      )}


      {/* ======================================================
          ACTIONS
      ====================================================== */}

      <div className="flex flex-wrap gap-2 mt-5">

        <Link
          to={`/batches/${result.batchId}`}
        >
          <Button
            variant="secondary"
            icon={ArrowRight}
          >
            View batch details
          </Button>
        </Link>

        <Button
          variant="secondary"
          onClick={onAnalyzeAgain}
          icon={ScanLine}
        >
          Analyze again
        </Button>

      </div>

    </Card>
  );
}


// ============================================================
// MAIN PAGE
// ============================================================

export default function InspectProduce() {
  const location =
    useLocation();

  const navigate =
    useNavigate();


  const {
    batches,
    loading: batchesLoading,
    error: batchesError,
  } = useBatches();


  const {
    result,
    loading: analysisLoading,
    error: analysisError,
    runInspection,
    reset,
  } = usePrediction();


  const fileInputRef =
    useRef(null);


  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [selectedBatchId, setSelectedBatchId] =
    useState(
      getQueryBatchId(
        location.search
      ) || ""
    );


  const [files, setFiles] =
    useState([]);


  const [temperature, setTemperature] =
    useState("");


  const [humidity, setHumidity] =
    useState("");


  const [storageType, setStorageType] =
    useState("");


  const [storageLocation, setStorageLocation] =
    useState("");


  const [transportDurationHours, setTransportDurationHours] =
    useState("");


  const [daysSinceHarvest, setDaysSinceHarvest] =
    useState("");


  // ==========================================================
  // SELECTED BATCH
  // ==========================================================

  const selectedBatch =
    useMemo(
      () =>
        batches.find(
          (batch) =>
            String(
              batch.id
            ) ===
            String(
              selectedBatchId
            )
        ) || null,
      [
        batches,
        selectedBatchId,
      ]
    );


  // ==========================================================
  // UPDATE DAYS SINCE HARVEST WHEN BATCH CHANGES
  // ==========================================================

  useEffect(() => {
    if (!selectedBatch) {
      setDaysSinceHarvest("");
      return;
    }

    const days =
      calculateDaysSinceHarvest(
        selectedBatch.harvestDate
      );

    setDaysSinceHarvest(
      days === ""
        ? ""
        : String(days)
    );
  }, [
    selectedBatch,
  ]);


  // ==========================================================
  // FILE HANDLING
  // ==========================================================

  function handleFiles(
    selectedFiles
  ) {
    const incoming =
      Array.from(
        selectedFiles || []
      );

    const imageFiles =
      incoming.filter(
        (file) =>
          file.type.startsWith(
            "image/"
          )
      );


    setFiles((current) => {
      const combined = [
        ...current,
        ...imageFiles,
      ];

      return combined.slice(
        0,
        MAX_IMAGES
      );
    });
  }


  function removeFile(index) {
    setFiles((current) =>
      current.filter(
        (_, fileIndex) =>
          fileIndex !== index
      )
    );
  }


  function handleDrop(event) {
    event.preventDefault();

    handleFiles(
      event.dataTransfer.files
    );
  }


  function handleFileInput(
    event
  ) {
    handleFiles(
      event.target.files
    );

    event.target.value = "";
  }


  // ==========================================================
  // BATCH CHANGE
  // ==========================================================

  function handleBatchChange(
    batchId
  ) {
    setSelectedBatchId(
      batchId
    );

    reset();

    const batch =
      batches.find(
        (item) =>
          String(item.id) ===
          String(batchId)
      );

    if (batch) {
      const days =
        calculateDaysSinceHarvest(
          batch.harvestDate
        );

      setDaysSinceHarvest(
        days === ""
          ? ""
          : String(days)
      );
    }

    navigate(
      batchId
        ? `/analyze?batch=${batchId}`
        : "/analyze",
      {
        replace: true,
      }
    );
  }


  // ==========================================================
  // ANALYZE
  // ==========================================================

  async function handleAnalyze(
    event
  ) {
    event.preventDefault();


    if (
      !selectedBatchId ||
      files.length === 0
    ) {
      return;
    }


    const input = {
      temperature:
        temperature === ""
          ? undefined
          : Number(
              temperature
            ),

      humidity:
        humidity === ""
          ? undefined
          : Number(
              humidity
            ),

      storageType:
        storageType || undefined,

      storageLocation:
        storageLocation || undefined,

      transportDurationHours:
        transportDurationHours === ""
          ? undefined
          : Number(
              transportDurationHours
            ),

      daysSinceHarvest:
        daysSinceHarvest === ""
          ? undefined
          : Number(
              daysSinceHarvest
            ),
    };


    await runInspection(
      selectedBatchId,
      files,
      input
    );
  }


  // ==========================================================
  // RESET FORM
  // ==========================================================

  function resetAnalysis() {
    reset();

    setFiles([]);

    setTemperature("");
    setHumidity("");
    setStorageType("");
    setStorageLocation("");
    setTransportDurationHours("");

    if (selectedBatch) {
      const days =
        calculateDaysSinceHarvest(
          selectedBatch.harvestDate
        );

      setDaysSinceHarvest(
        days === ""
          ? ""
          : String(days)
      );
    }
  }


  // ==========================================================
  // VALIDATION
  // ==========================================================

  const canAnalyze =
    Boolean(
      selectedBatchId
    ) &&
    files.length > 0 &&
    !analysisLoading;


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <PageContainer
      title="Analyze Produce"
      subtitle="Upload produce images and provide the conditions needed by the existing AI prediction pipeline."
    >

      <div className="max-w-6xl mx-auto space-y-5">

        {/* ==================================================
            INTRO
        ================================================== */}

        <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">

          <div className="flex items-start gap-3">

            <div className="w-9 h-9 rounded-lg bg-white text-brand-700 flex items-center justify-center shrink-0">
              <ScanLine size={18} />
            </div>

            <div>

              <p className="text-sm font-semibold text-ink">
                AI freshness analysis
              </p>

              <p className="text-xs text-muted mt-1 leading-5">
                Select an existing batch, upload clear
                produce images and provide the available
                storage and transport conditions. The
                existing AI service will calculate the
                prediction and recommended action.
              </p>

            </div>

          </div>

        </div>


        {/* ==================================================
            BATCH SELECTION
        ================================================== */}

        <Card>

          <CardHeader
            title="1. Select batch"
            subtitle="Choose the inventory batch that you want to analyze."
          />


          {batchesLoading &&
            batches.length === 0 ? (
            <div className="py-8 flex justify-center">
              <Loader label="Loading batches..." />
            </div>
          ) : batchesError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">

              <p className="text-xs text-red-700">
                Unable to load batches.
              </p>

            </div>
          ) : batches.length === 0 ? (
            <div className="py-6">

              <div className="text-center">

                <p className="text-sm font-medium text-ink">
                  No batches available
                </p>

                <p className="text-xs text-muted mt-1">
                  Create a batch before running AI
                  analysis.
                </p>

                <Link
                  to="/batches"
                  className="inline-block mt-4"
                >
                  <Button>
                    Create batch
                  </Button>
                </Link>

              </div>

            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              <div>

                <label className="block text-xs font-medium text-muted mb-1.5">
                  Batch
                  <span className="text-red-500 ml-1">
                    *
                  </span>
                </label>

                <select
                  value={
                    selectedBatchId
                  }
                  onChange={(event) =>
                    handleBatchChange(
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500"
                >

                  <option value="">
                    Select a batch
                  </option>

                  {batches.map(
                    (batch) => (
                      <option
                        key={
                          batch.id
                        }
                        value={
                          batch.id
                        }
                      >
                        {batch.id} —{" "}
                        {batch.produce} —{" "}
                        {formatNumber(
                          batch.quantityKg,
                          1
                        )}{" "}
                        kg
                      </option>
                    )
                  )}

                </select>

              </div>


              {selectedBatch && (
                <div className="rounded-lg bg-bg p-3">

                  <div className="flex items-center gap-2">

                    <MapPin
                      size={14}
                      className="text-muted"
                    />

                    <p className="text-xs text-muted">
                      Current location
                    </p>

                  </div>

                  <p className="text-sm font-medium text-ink mt-1">
                    {selectedBatch.currentLocation ||
                      selectedBatch.origin ||
                      "Not available"}
                  </p>

                </div>
              )}

            </div>
          )}

        </Card>


        {/* ==================================================
            IMAGE UPLOAD
        ================================================== */}

        <Card>

          <CardHeader
            title="2. Upload produce images"
            subtitle={`Add up to ${MAX_IMAGES} clear images of the produce. At least one image is required.`}
          />


          <div
            onDragOver={(event) =>
              event.preventDefault()
            }
            onDrop={handleDrop}
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/40 transition-colors"
          >

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={
                handleFileInput
              }
            />


            <div className="w-12 h-12 mx-auto rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
              <CloudUpload size={24} />
            </div>

            <p className="text-sm font-medium text-ink mt-3">
              Drop produce images here
            </p>

            <p className="text-xs text-muted mt-1">
              or click to browse from your device
            </p>

            <p className="text-[11px] text-muted mt-3">
              JPG, PNG, WEBP · maximum{" "}
              {MAX_IMAGES} images
            </p>

          </div>


          {/* Preview */}

          {files.length > 0 && (
            <div className="mt-4">

              <div className="flex items-center justify-between mb-2">

                <p className="text-xs font-medium text-ink">
                  Selected images
                </p>

                <p className="text-[11px] text-muted">
                  {files.length}/
                  {MAX_IMAGES}
                </p>

              </div>


              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">

                {files.map(
                  (
                    file,
                    index
                  ) => (
                    <ImagePreview
                      key={`${file.name}-${index}`}
                      file={file}
                      onRemove={() =>
                        removeFile(
                          index
                        )
                      }
                    />
                  )
                )}

              </div>

            </div>
          )}

        </Card>


        {/* ==================================================
            CONDITIONS
        ================================================== */}

        <Card>

          <CardHeader
            title="3. Storage & transport conditions"
            subtitle="Provide the conditions available for this batch. Leave unknown values blank."
          />


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            <Field
              label="Temperature"
              icon={Thermometer}
              value={temperature}
              onChange={
                setTemperature
              }
              type="number"
              placeholder="e.g. 4"
              suffix="°C"
              step="0.1"
            />


            <Field
              label="Humidity"
              icon={Droplets}
              value={humidity}
              onChange={
                setHumidity
              }
              type="number"
              placeholder="e.g. 75"
              suffix="%"
              min="0"
              max="100"
              step="1"
            />


            <Field
              label="Transport duration"
              icon={Truck}
              value={
                transportDurationHours
              }
              onChange={
                setTransportDurationHours
              }
              type="number"
              placeholder="e.g. 8"
              suffix="hours"
              min="0"
              step="0.5"
            />


            <Field
              label="Storage type"
              icon={MapPin}
              value={storageType}
              onChange={
                setStorageType
              }
            >

              <select
                value={storageType}
                onChange={(event) =>
                  setStorageType(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500"
              >

                <option value="">
                  Select if known
                </option>

                {STORAGE_TYPES.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  )
                )}

              </select>

            </Field>


            <Field
              label="Storage location"
              icon={MapPin}
              value={
                storageLocation
              }
              onChange={
                setStorageLocation
              }
              placeholder="e.g. Cold room A"
            />


            <Field
              label="Days since harvest"
              icon={ScanLine}
              value={
                daysSinceHarvest
              }
              onChange={
                setDaysSinceHarvest
              }
              type="number"
              placeholder="Auto-filled from batch"
              suffix="days"
              min="0"
            />

          </div>


          {selectedBatch && (
            <div className="mt-4 rounded-lg border border-border bg-bg p-3">

              <p className="text-[11px] text-muted">
                Harvest date
              </p>

              <p className="text-sm font-medium text-ink mt-1">
                {selectedBatch.harvestDate ||
                  "Not available"}
              </p>

              <p className="text-[11px] text-muted mt-2">
                Days since harvest is automatically
                calculated from this date. You can
                adjust it if the recorded date is
                different.
              </p>

            </div>
          )}

        </Card>


        {/* ==================================================
            ANALYZE ACTION
        ================================================== */}

        <Card>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

            <div>

              <p className="text-sm font-semibold text-ink">
                Ready to analyze?
              </p>

              <p className="text-xs text-muted mt-1">
                The images and supplied conditions will
                be sent to the existing prediction
                pipeline.
              </p>

            </div>


            <Button
              icon={ScanLine}
              disabled={!canAnalyze}
              onClick={handleAnalyze}
            >
              {analysisLoading
                ? "Analyzing..."
                : "Run AI analysis"}
            </Button>

          </div>


          {!selectedBatchId && (
            <p className="text-[11px] text-muted mt-3">
              Select a batch first.
            </p>
          )}

          {selectedBatchId &&
            files.length === 0 && (
              <p className="text-[11px] text-muted mt-3">
                Upload at least one produce image.
              </p>
            )}

        </Card>


        {/* ==================================================
            ANALYSIS ERROR
        ================================================== */}

        {analysisError && (
          <Card>

            <div className="flex items-start gap-3">

              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle
                  size={18}
                />
              </div>

              <div>

                <p className="text-sm font-semibold text-ink">
                  Analysis failed
                </p>

                <p className="text-xs text-muted mt-1 leading-5">
                  {analysisError.message ||
                    "The AI analysis could not be completed."}
                </p>

                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  onClick={() =>
                    reset()
                  }
                >
                  Try again
                </Button>

              </div>

            </div>

          </Card>
        )}


        {/* ==================================================
            RESULT
        ================================================== */}

        {result && (
          <PredictionResult
            result={result}
            onAnalyzeAgain={
              resetAnalysis
            }
          />
        )}


        {/* ==================================================
            SUCCESS
        ================================================== */}

        {result && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">

            <div className="flex items-start gap-3">

              <CheckCircle2
                size={18}
                className="text-green-700 shrink-0"
              />

              <div>

                <p className="text-sm font-medium text-green-800">
                  Analysis completed
                </p>

                <p className="text-xs text-green-700 mt-1">
                  The prediction has been returned
                  from the existing AI pipeline.
                </p>

              </div>

            </div>

          </div>
        )}

      </div>

    </PageContainer>
  );
}

