
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  CloudUpload,
  Droplets,
  Image as ImageIcon,
  Leaf,
  MapPin,
  Package,
  ScanLine,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Tag,
  Thermometer,
  TrendingDown,
  Truck,
  X,
  Zap,
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

import { motion, AnimatePresence } from "framer-motion";

import PageContainer from "../components/layout/PageContainer";
import Card, { CardHeader } from "../components/ui/Card";
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
  return new URLSearchParams(search).get("batch");
}

function calculateDaysSinceHarvest(harvestDate) {
  if (!harvestDate) return "";
  const harvest = new Date(harvestDate);
  if (Number.isNaN(harvest.getTime())) return "";
  const diff = new Date().getTime() - harvest.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || value === "") return "—";
  return Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: decimals,
  });
}

function formatCurrency(value) {
  if (value === null || value === undefined) return "—";
  return `₹ ${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function getRiskLevel(percentage) {
  if (percentage == null) return "UNKNOWN";
  if (percentage >= 70) return "HIGH";
  if (percentage >= 35) return "MEDIUM";
  return "LOW";
}

function getRiskClasses(level) {
  switch (String(level || "").toUpperCase()) {
    case "HIGH":
    case "CRITICAL":
      return {
        wrapper: "border-red-200 bg-red-50",
        text: "text-red-700",
        dot: "bg-red-500",
        badge: "bg-red-100 text-red-700 border-red-200",
      };
    case "MEDIUM":
      return {
        wrapper: "border-amber-200 bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-400",
        badge: "bg-amber-100 text-amber-700 border-amber-200",
      };
    case "LOW":
      return {
        wrapper: "border-emerald-200 bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    default:
      return {
        wrapper: "border-border bg-bg",
        text: "text-muted",
        dot: "bg-gray-400",
        badge: "bg-gray-100 text-muted border-border",
      };
  }
}

function getActionConfig(action) {
  const a = String(action || "").toUpperCase();
  switch (a) {
    case "SELL":
      return {
        icon: ShoppingCart,
        color: "text-emerald-700",
        bg: "bg-emerald-50 border-emerald-200",
        badge: "bg-emerald-100 text-emerald-800",
        label: "Sell",
      };
    case "DISCOUNT":
      return {
        icon: Tag,
        color: "text-amber-700",
        bg: "bg-amber-50 border-amber-200",
        badge: "bg-amber-100 text-amber-800",
        label: "Discount",
      };
    case "REDISTRIBUTE":
      return {
        icon: Truck,
        color: "text-blue-700",
        bg: "bg-blue-50 border-blue-200",
        badge: "bg-blue-100 text-blue-800",
        label: "Redistribute",
      };
    case "RESCUE":
      return {
        icon: ShieldAlert,
        color: "text-red-700",
        bg: "bg-red-50 border-red-200",
        badge: "bg-red-100 text-red-800",
        label: "Rescue",
      };
    default:
      return {
        icon: Package,
        color: "text-muted",
        bg: "bg-bg border-border",
        badge: "bg-gray-100 text-muted",
        label: action || "Unknown",
      };
  }
}

function getUrgencyBadge(urgency) {
  const u = String(urgency || "").toUpperCase();
  if (u === "HIGH") return "bg-red-100 text-red-700 border border-red-200";
  if (u === "MEDIUM") return "bg-amber-100 text-amber-700 border border-amber-200";
  if (u === "LOW") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  return "bg-gray-100 text-muted border border-border";
}


// ============================================================
// IMAGE PREVIEW
// ============================================================

function ImagePreview({ file, onRemove }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="relative aspect-square rounded-xl overflow-hidden border border-border bg-bg group">
      {preview && (
        <img
          src={preview}
          alt={file.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
        aria-label="Remove image"
      >
        <X size={13} />
      </button>
    </div>
  );
}


// ============================================================
// FIELD
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
        {Icon && <Icon size={13} />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children || (
        <div className="relative">
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
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
// STAT TILE
// ============================================================

function StatTile({ label, value, suffix, subtext, className = "", children }) {
  return (
    <div className={`rounded-xl border border-border p-5 ${className}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-4xl font-semibold font-mono text-ink mt-2">
        {value}
        {suffix && (
          <span className="text-base font-normal text-muted ml-1">{suffix}</span>
        )}
      </p>
      {subtext && <p className="text-xs text-muted mt-1">{subtext}</p>}
      {children}
    </div>
  );
}


// ============================================================
// ALLOCATION ROW
// ============================================================

function AllocationRow({ allocation, index }) {
  const cfg = getActionConfig(allocation.action);
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`rounded-xl border p-4 ${cfg.bg}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${cfg.bg}`}>
          <Icon size={16} className={cfg.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-semibold text-ink">
              {allocation.destination}
            </p>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            <div>
              <p className="text-[10px] text-muted">Quantity</p>
              <p className="text-sm font-medium text-ink">
                {formatNumber(allocation.quantity_kg, 1)} kg
              </p>
            </div>
            {allocation.unit_price != null && (
              <div>
                <p className="text-[10px] text-muted">Unit price</p>
                <p className="text-sm font-medium text-ink">
                  {formatCurrency(allocation.unit_price)}/kg
                </p>
              </div>
            )}
            {allocation.gross_revenue != null && (
              <div>
                <p className="text-[10px] text-muted">Gross revenue</p>
                <p className="text-sm font-medium text-ink">
                  {formatCurrency(allocation.gross_revenue)}
                </p>
              </div>
            )}
            {allocation.net_recovered_value != null && (
              <div>
                <p className="text-[10px] text-muted">Net value</p>
                <p className="text-sm font-semibold text-emerald-700">
                  {formatCurrency(allocation.net_recovered_value)}
                </p>
              </div>
            )}
            {allocation.transport_hours != null && (
              <div>
                <p className="text-[10px] text-muted">Transport</p>
                <p className="text-sm font-medium text-ink">
                  {allocation.transport_hours}h
                </p>
              </div>
            )}
          </div>

          {allocation.reason && (
            <p className="text-xs text-muted mt-2 leading-5">{allocation.reason}</p>
          )}

          {allocation.within_shelf_life_window != null && (
            <div className="flex items-center gap-1.5 mt-2">
              {allocation.within_shelf_life_window ? (
                <CheckCircle2 size={12} className="text-emerald-600" />
              ) : (
                <AlertTriangle size={12} className="text-amber-500" />
              )}
              <span className="text-[11px] text-muted">
                {allocation.within_shelf_life_window
                  ? "Within shelf-life window"
                  : "Outside safe transport window"}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}


// ============================================================
// RESULT PANEL
// ============================================================

function PredictionResult({ result, onAnalyzeAgain }) {
  if (!result) return null;

  const risk = result.spoilageRisk;
  const riskLevel = result.riskLevel || getRiskLevel(risk);
  const riskClasses = getRiskClasses(riskLevel);

  // Decision model data — normalise snake_case from Prediction document
  const decision = result.decision || {};
  const recommendation = decision.recommendation || {};
  const primaryAction = recommendation.primary_action || decision.action || null;
  const urgency = recommendation.urgency || null;
  const decisionConfidence = recommendation.confidence || null;
  const allocations = Array.isArray(decision.allocations) ? decision.allocations : [];
  const unallocated = decision.unallocated || null;
  const impact = decision.impact || null;
  const reasoning = decision.reasoning || result.reasoning || null;
  const missingInfo = Array.isArray(decision.missing_information) ? decision.missing_information : [];
  const constraints = Array.isArray(decision.constraints) ? decision.constraints : [];

  // CV class distribution
  const classDist = result._raw?.classDistribution || result.classDistribution || null;
  const shelfLifeAssessment = result._raw?.shelfLifeAssessment || null;
  const conditionLabel =
    shelfLifeAssessment?.condition?.batch_condition ||
    result.visualClass ||
    result.batchCondition ||
    null;

  const actionCfg = getActionConfig(primaryAction);
  const ActionIcon = actionCfg.icon;

  return (
    <div className="space-y-5">

      {/* ── PRIMARY METRICS ─────────────────────────────────── */}
      <Card>
        <CardHeader
          title="AI analysis result"
          subtitle="Freshness, shelf life and spoilage risk from the ML pipeline"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Freshness */}
          <StatTile
            label="Freshness score"
            value={
              result.freshness != null
                ? Math.round(Number(result.freshness))
                : "—"
            }
            suffix="/100"
          >
            {result.freshness != null && (
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.round(Number(result.freshness)))}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      result.freshness >= 70
                        ? "bg-emerald-500"
                        : result.freshness >= 40
                        ? "bg-amber-400"
                        : "bg-red-500"
                    }`}
                  />
                </div>
              </div>
            )}
          </StatTile>

          {/* Shelf life */}
          <StatTile
            label="Remaining shelf life"
            value={result.shelfLifeDays ?? "—"}
            suffix="days"
            subtext={
              result.shelfLifeRange
                ? `Range: ${Array.isArray(result.shelfLifeRange)
                    ? `${result.shelfLifeRange[0]}–${result.shelfLifeRange[1]} days`
                    : result.shelfLifeRange}`
                : shelfLifeAssessment?.assessment?.estimate_range_days
                ? `Range: ${shelfLifeAssessment.assessment.estimate_range_days[0]}–${shelfLifeAssessment.assessment.estimate_range_days[1]} days`
                : null
            }
          />

          {/* Spoilage risk */}
          <div className={`rounded-xl border p-5 ${riskClasses.wrapper}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">Spoilage risk</p>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${riskClasses.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${riskClasses.dot}`} />
                {riskLevel}
              </span>
            </div>
            <p className="text-4xl font-semibold font-mono text-ink mt-2">
              {risk != null ? `${Math.round(Number(risk))}%` : "—"}
            </p>
            {urgency && (
              <div className="mt-3">
                <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${getUrgencyBadge(urgency)}`}>
                  Urgency: {urgency}
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Confidence */}
        {result.confidence != null && (
          <div className="mt-4 rounded-lg border border-border px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted">Model confidence</span>
            <span className="text-sm font-mono font-semibold text-ink">
              {typeof result.confidence === "number"
                ? `${Math.round(
                    result.confidence <= 1
                      ? result.confidence * 100
                      : result.confidence
                  )}%`
                : result.confidence}
            </span>
          </div>
        )}
      </Card>


      {/* ── DECISION ENGINE ──────────────────────────────────── */}
      {(primaryAction || reasoning) && (
        <Card>
          <CardHeader
            title="Decision engine"
            subtitle="Deterministic action plan — zero LLM-invented numbers"
          />

          {/* Primary action banner */}
          {primaryAction && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl border p-4 mb-4 ${actionCfg.bg}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${actionCfg.bg}`}>
                  <ActionIcon size={20} className={actionCfg.color} />
                </div>
                <div>
                  <p className="text-xs text-muted">Recommended action</p>
                  <p className={`text-lg font-bold ${actionCfg.color}`}>
                    {actionCfg.label}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  {decisionConfidence != null && (
                    <>
                      <p className="text-xs text-muted">Engine confidence</p>
                      <p className="text-sm font-mono font-semibold text-ink">
                        {Math.round(decisionConfidence * 100)}%
                      </p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Condition */}
          {conditionLabel && (
            <div className="rounded-xl bg-bg p-4 mb-4">
              <p className="text-xs font-medium text-muted">Batch condition</p>
              <p className="text-base font-semibold text-ink mt-1">{conditionLabel}</p>
            </div>
          )}

          {/* Reasoning */}
          {reasoning && (
            <div className="rounded-xl border border-border bg-bg p-4 mb-4">
              <p className="text-xs font-medium text-muted mb-2 flex items-center gap-1.5">
                <Brain size={12} />
                Engine reasoning
              </p>
              <p className="text-sm text-muted leading-6">{reasoning}</p>
            </div>
          )}

          {/* Constraints / missing info */}
          {(constraints.length > 0 || missingInfo.length > 0) && (
            <div className="space-y-2 mb-4">
              {constraints.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  {c}
                </div>
              ))}
              {missingInfo.map((m, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted bg-bg border border-border rounded-lg px-3 py-2">
                  <ScanLine size={12} className="shrink-0 mt-0.5" />
                  Missing: {m}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}


      {/* ── IMPACT SUMMARY ───────────────────────────────────── */}
      {impact && (
        <Card>
          <CardHeader
            title="Impact summary"
            subtitle="Transparent, Python-computed figures — no fabricated baseline"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted">Total batch</p>
              <p className="text-2xl font-semibold font-mono text-ink mt-1">
                {formatNumber(impact.total_batch_kg, 1)}
                <span className="text-sm font-normal text-muted ml-1">kg</span>
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs text-muted">Allocated</p>
              <p className="text-2xl font-semibold font-mono text-emerald-700 mt-1">
                {formatNumber(impact.allocated_kg, 1)}
                <span className="text-sm font-normal text-emerald-600 ml-1">kg</span>
              </p>
              {impact.total_batch_kg > 0 && (
                <p className="text-xs text-emerald-600 mt-1">
                  {Math.round((impact.allocated_kg / impact.total_batch_kg) * 100)}% of batch
                </p>
              )}
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs text-muted">Expected waste</p>
              <p className="text-2xl font-semibold font-mono text-amber-700 mt-1">
                {formatNumber(impact.expected_waste_kg, 1)}
                <span className="text-sm font-normal text-amber-600 ml-1">kg</span>
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs text-muted">Estimated recovered value</p>
              <p className="text-2xl font-semibold font-mono text-emerald-700 mt-1">
                {formatCurrency(impact.estimated_recovered_value)}
              </p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted">Est. transport cost</p>
              <p className="text-2xl font-semibold font-mono text-ink mt-1">
                {formatCurrency(impact.estimated_transport_cost)}
              </p>
            </div>
            {impact.waste_prevented_kg != null && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs text-muted">Waste prevented</p>
                <p className="text-2xl font-semibold font-mono text-emerald-700 mt-1">
                  {formatNumber(impact.waste_prevented_kg, 1)}
                  <span className="text-sm font-normal text-emerald-600 ml-1">kg</span>
                </p>
              </div>
            )}
          </div>
        </Card>
      )}


      {/* ── ALLOCATIONS ──────────────────────────────────────── */}
      {(allocations.length > 0 || unallocated) && (
        <Card>
          <CardHeader
            title="Market allocations"
            subtitle="Per-destination breakdown from the deterministic optimizer"
          />
          <div className="space-y-3">
            {allocations.map((alloc, i) => (
              <AllocationRow key={i} allocation={alloc} index={i} />
            ))}
            {unallocated && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: allocations.length * 0.06 }}
                className={`rounded-xl border p-4 ${getActionConfig(unallocated.recommended_action).bg}`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-ink">
                    Unallocated: {formatNumber(unallocated.quantity_kg, 1)} kg
                  </p>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${getActionConfig(unallocated.recommended_action).badge}`}>
                    {getActionConfig(unallocated.recommended_action).label}
                  </span>
                </div>
                <p className="text-xs text-muted mt-2 leading-5">{unallocated.reason}</p>
              </motion.div>
            )}
          </div>
        </Card>
      )}


      {/* ── CV CLASS DISTRIBUTION ────────────────────────────── */}
      {classDist && Object.keys(classDist).length > 0 && (
        <Card>
          <CardHeader
            title="Visual classification"
            subtitle="Per-class confidence distribution from the CV model"
          />
          <div className="space-y-2">
            {Object.entries(classDist)
              .sort(([, a], [, b]) => b - a)
              .map(([cls, conf]) => {
                const pct = Math.round(Number(conf) * 100);
                const isRotten = cls.toLowerCase().includes("rotten") || cls.toLowerCase().includes("spoiled");
                return (
                  <div key={cls} className="flex items-center gap-3">
                    <p className="text-xs text-muted w-32 shrink-0 truncate capitalize">
                      {cls.replace(/_/g, " ")}
                    </p>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className={`h-full rounded-full ${isRotten ? "bg-red-400" : "bg-emerald-500"}`}
                      />
                    </div>
                    <p className="text-xs font-mono text-ink w-10 text-right">{pct}%</p>
                  </div>
                );
              })}
          </div>
        </Card>
      )}


      {/* ── ACTIONS ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {result.batchId && (
          <Link to={`/batches/${result.batchId}`}>
            <Button variant="secondary" icon={ArrowRight}>
              View batch details
            </Button>
          </Link>
        )}
        <Button variant="secondary" onClick={onAnalyzeAgain} icon={ScanLine}>
          Analyze again
        </Button>
      </div>

    </div>
  );
}


// ============================================================
// LOADING OVERLAY
// ============================================================

function AnalysisLoader() {
  const steps = [
    { icon: ScanLine, label: "Running CV freshness classification…" },
    { icon: Brain, label: "Assessing shelf life with RAG model…" },
    { icon: Zap, label: "Running deterministic decision engine…" },
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const Icon = steps[step].icon;

  return (
    <Card>
      <div className="py-12 flex flex-col items-center gap-4">
        <motion.div
          key={step}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center"
        >
          <Icon size={28} />
        </motion.div>
        <div className="text-center">
          <p className="text-sm font-semibold text-ink">Analyzing produce…</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-xs text-muted mt-1"
            >
              {steps[step].label}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === step ? 20 : 6 }}
              className={`h-1.5 rounded-full transition-colors ${i === step ? "bg-brand-600" : "bg-gray-200"}`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}


// ============================================================
// MAIN PAGE
// ============================================================

export default function InspectProduce() {
  const location = useLocation();
  const navigate = useNavigate();

  const { batches, loading: batchesLoading, error: batchesError } = useBatches();

  const {
    result,
    loading: analysisLoading,
    error: analysisError,
    runInspection,
    reset,
  } = usePrediction();

  const fileInputRef = useRef(null);

  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [selectedBatchId, setSelectedBatchId] = useState(
    getQueryBatchId(location.search) || ""
  );
  const [files, setFiles] = useState([]);
  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [storageType, setStorageType] = useState("");
  const [storageLocation, setStorageLocation] = useState("");
  const [transportDurationHours, setTransportDurationHours] = useState("");
  const [daysSinceHarvest, setDaysSinceHarvest] = useState("");

  // ==========================================================
  // SELECTED BATCH
  // ==========================================================

  const selectedBatch = useMemo(
    () => batches.find((b) => String(b.id) === String(selectedBatchId)) || null,
    [batches, selectedBatchId]
  );

  useEffect(() => {
    if (!selectedBatch) {
      setDaysSinceHarvest("");
      return;
    }
    const days = calculateDaysSinceHarvest(selectedBatch.harvestDate);
    setDaysSinceHarvest(days === "" ? "" : String(days));
  }, [selectedBatch]);

  // ==========================================================
  // FILE HANDLING
  // ==========================================================

  function handleFiles(selectedFiles) {
    const incoming = Array.from(selectedFiles || []).filter((f) =>
      f.type.startsWith("image/")
    );
    setFiles((cur) => [...cur, ...incoming].slice(0, MAX_IMAGES));
  }

  function removeFile(index) {
    setFiles((cur) => cur.filter((_, i) => i !== index));
  }

  function handleDrop(event) {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  }

  function handleFileInput(event) {
    handleFiles(event.target.files);
    event.target.value = "";
  }

  // ==========================================================
  // BATCH CHANGE
  // ==========================================================

  function handleBatchChange(batchId) {
    setSelectedBatchId(batchId);
    reset();
    const batch = batches.find((b) => String(b.id) === String(batchId));
    if (batch) {
      const days = calculateDaysSinceHarvest(batch.harvestDate);
      setDaysSinceHarvest(days === "" ? "" : String(days));
    }
    navigate(batchId ? `/analyze?batch=${batchId}` : "/analyze", {
      replace: true,
    });
  }

  // ==========================================================
  // ANALYZE
  // ==========================================================

  async function handleAnalyze(event) {
    event.preventDefault();
    if (!selectedBatchId || files.length === 0) return;

    // --------------------------------------------------------
    // IMPORTANT: Field names must match what the backend
    // analysis.controller.js reads.
    //
    // The controller now accepts BOTH the canonical names
    // (temperatureC, humidityPercent, harvestAgeDays) AND the
    // frontend aliases (temperature, humidity, daysSinceHarvest).
    // We send the frontend aliases here — the controller resolves them.
    // --------------------------------------------------------
    const input = {
      temperature: temperature === "" ? undefined : Number(temperature),
      humidity: humidity === "" ? undefined : Number(humidity),
      storageType: storageType || undefined,
      storageLocation: storageLocation || undefined,
      transportDurationHours:
        transportDurationHours === "" ? undefined : Number(transportDurationHours),
      daysSinceHarvest:
        daysSinceHarvest === "" ? undefined : Number(daysSinceHarvest),
    };

    await runInspection(selectedBatchId, files, input);
  }

  // ==========================================================
  // RESET
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
      const days = calculateDaysSinceHarvest(selectedBatch.harvestDate);
      setDaysSinceHarvest(days === "" ? "" : String(days));
    }
  }

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const canAnalyze =
    Boolean(selectedBatchId) && files.length > 0 && !analysisLoading;

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <PageContainer
      title="Analyze Produce"
      subtitle="Upload produce images and provide conditions for the AI pipeline — CV → shelf life → decision engine."
    >
      <div className="max-w-6xl mx-auto space-y-5">

        {/* INTRO BANNER */}
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white text-brand-700 flex items-center justify-center shrink-0">
              <ScanLine size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">
                3-layer AI freshness analysis
              </p>
              <p className="text-xs text-muted mt-1 leading-5">
                Images run through <strong>CV classification → RAG-grounded shelf-life assessment →
                deterministic decision engine</strong>. All numbers are Python-computed; no values are
                invented by the LLM.
              </p>
            </div>
          </div>
        </div>


        {/* STEP 1 — BATCH SELECTION */}
        <Card>
          <CardHeader
            title="1. Select batch"
            subtitle="Choose the inventory batch to analyze."
          />

          {batchesLoading && batches.length === 0 ? (
            <div className="py-8 flex justify-center">
              <Loader label="Loading batches…" />
            </div>
          ) : batchesError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs text-red-700">Unable to load batches.</p>
            </div>
          ) : batches.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm font-medium text-ink">No batches available</p>
              <p className="text-xs text-muted mt-1">
                Create a batch before running AI analysis.
              </p>
              <Link to="/batches" className="inline-block mt-4">
                <Button>Create batch</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">
                  Batch
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500"
                >
                  <option value="">Select a batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.id} — {batch.produce} —{" "}
                      {formatNumber(batch.quantityKg, 1)} kg
                    </option>
                  ))}
                </select>
              </div>

              {selectedBatch && (
                <div className="rounded-lg bg-bg p-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-muted" />
                    <p className="text-xs text-muted">Current location</p>
                  </div>
                  <p className="text-sm font-medium text-ink mt-1">
                    {selectedBatch.currentLocation ||
                      selectedBatch.origin ||
                      "Not available"}
                  </p>
                  {selectedBatch.produceType && (
                    <p className="text-xs text-muted mt-1">
                      {selectedBatch.produceType}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>


        {/* STEP 2 — IMAGE UPLOAD */}
        <Card>
          <CardHeader
            title="2. Upload produce images"
            subtitle={`Add up to ${MAX_IMAGES} clear images of the produce. At least one is required.`}
          />

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50/40 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFileInput}
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
              JPG, PNG, WEBP · max {MAX_IMAGES} images
            </p>
          </div>

          {files.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-ink">
                  Selected images
                </p>
                <p className="text-[11px] text-muted">
                  {files.length}/{MAX_IMAGES}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {files.map((file, index) => (
                  <ImagePreview
                    key={`${file.name}-${index}`}
                    file={file}
                    onRemove={() => removeFile(index)}
                  />
                ))}
              </div>
            </div>
          )}
        </Card>


        {/* STEP 3 — CONDITIONS */}
        <Card>
          <CardHeader
            title="3. Storage & transport conditions"
            subtitle="Provide available conditions. Leave unknown values blank — the model will note missing data."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            <Field
              label="Temperature"
              icon={Thermometer}
              value={temperature}
              onChange={setTemperature}
              type="number"
              placeholder="e.g. 4"
              suffix="°C"
              step="0.1"
            />

            <Field
              label="Humidity"
              icon={Droplets}
              value={humidity}
              onChange={setHumidity}
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
              value={transportDurationHours}
              onChange={setTransportDurationHours}
              type="number"
              placeholder="e.g. 8"
              suffix="hours"
              min="0"
              step="0.5"
            />

            <Field label="Storage type" icon={MapPin} value={storageType} onChange={setStorageType}>
              <select
                value={storageType}
                onChange={(e) => setStorageType(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-500"
              >
                <option value="">Select if known</option>
                {STORAGE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Storage location"
              icon={MapPin}
              value={storageLocation}
              onChange={setStorageLocation}
              placeholder="e.g. Cold room A"
            />

            <Field
              label="Days since harvest"
              icon={Leaf}
              value={daysSinceHarvest}
              onChange={setDaysSinceHarvest}
              type="number"
              placeholder="Auto-filled from batch"
              suffix="days"
              min="0"
            />

          </div>

          {selectedBatch?.harvestDate && (
            <div className="mt-4 rounded-lg border border-border bg-bg p-3">
              <p className="text-[11px] text-muted">Harvest date</p>
              <p className="text-sm font-medium text-ink mt-1">
                {selectedBatch.harvestDate}
              </p>
              <p className="text-[11px] text-muted mt-2">
                Days since harvest is auto-calculated from this date. You can
                adjust it if the recorded date differs.
              </p>
            </div>
          )}
        </Card>


        {/* ANALYZE ACTION */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">Ready to analyze?</p>
              <p className="text-xs text-muted mt-1">
                Images and conditions will be sent through the full AI pipeline:
                CV → shelf life → decision engine.
              </p>
            </div>
            <Button
              icon={ScanLine}
              disabled={!canAnalyze}
              onClick={handleAnalyze}
              size="lg"
            >
              {analysisLoading ? "Analyzing…" : "Run AI analysis"}
            </Button>
          </div>

          {!selectedBatchId && (
            <p className="text-[11px] text-muted mt-3">Select a batch first.</p>
          )}
          {selectedBatchId && files.length === 0 && (
            <p className="text-[11px] text-muted mt-3">
              Upload at least one produce image.
            </p>
          )}
        </Card>


        {/* LOADING */}
        {analysisLoading && <AnalysisLoader />}


        {/* ERROR */}
        {analysisError && !analysisLoading && (
          <Card>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Analysis failed</p>
                <p className="text-xs text-muted mt-1 leading-5">
                  {analysisError.message ||
                    "The AI analysis could not be completed. Make sure the backend and Python AI service are running."}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => reset()}
                >
                  Try again
                </Button>
              </div>
            </div>
          </Card>
        )}


        {/* RESULTS */}
        {result && !analysisLoading && (
          <>
            {/* Success banner */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    Analysis completed
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Results returned from the full AI pipeline below.
                  </p>
                </div>
              </div>
            </motion.div>

            <PredictionResult result={result} onAnalyzeAgain={resetAnalysis} />
          </>
        )}

      </div>
    </PageContainer>
  );
}
