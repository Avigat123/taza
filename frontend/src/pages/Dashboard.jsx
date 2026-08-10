import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  IndianRupee,
  RefreshCw,
  ScanLine,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { Link } from "react-router-dom";

import PageContainer from "../components/layout/PageContainer";
import Card, {
  CardHeader,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";

import useDashboard from "../hooks/useDashboard";


// ============================================================
// HELPERS
// ============================================================

function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined) {
    return "—";
  }

  return Number(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: decimals,
    }
  );
}


function formatCurrency(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  return `₹${Number(value).toLocaleString(
    "en-IN"
  )}`;
}


function formatTime(value) {
  if (!value) {
    return "No prediction yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function riskClasses(level) {
  switch (
    String(level || "").toUpperCase()
  ) {
    case "HIGH":
    case "CRITICAL":
      return {
        badge:
          "bg-red-50 text-red-700 border-red-100",
        dot: "bg-red-500",
      };

    case "MEDIUM":
      return {
        badge:
          "bg-yellow-50 text-yellow-700 border-yellow-100",
        dot: "bg-yellow-500",
      };

    case "LOW":
      return {
        badge:
          "bg-green-50 text-green-700 border-green-100",
        dot: "bg-green-500",
      };

    default:
      return {
        badge:
          "bg-bg text-muted border-border",
        dot: "bg-gray-400",
      };
  }
}


function actionLabel(action) {
  const labels = {
    SELL: "Sell locally",
    DISCOUNT: "Discount now",
    REDISTRIBUTE:
      "Ship to high-demand location",
    RESCUE:
      "Redirect to processing",
  };

  return (
    labels[action] ||
    action ||
    "No action recorded"
  );
}


// ============================================================
// METRIC CARD
// ============================================================

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
  tone = "default",
}) {
  const iconClasses = {
    default:
      "bg-brand-50 text-brand-700",

    danger:
      "bg-red-50 text-red-700",

    warning:
      "bg-yellow-50 text-yellow-700",

    good:
      "bg-green-50 text-green-700",
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">

        <div>
          <p className="text-xs text-muted">
            {label}
          </p>

          <p className="text-2xl font-semibold text-ink font-mono mt-2">
            {value}
          </p>

          {description && (
            <p className="text-xs text-muted mt-2 leading-5">
              {description}
            </p>
          )}
        </div>

        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
            iconClasses[tone]
          }`}
        >
          <Icon size={18} />
        </div>

      </div>
    </Card>
  );
}


// ============================================================
// RISK BADGE
// ============================================================

function RiskBadge({ level }) {
  const classes =
    riskClasses(level);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${classes.badge}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${classes.dot}`}
      />

      {String(
        level || "UNKNOWN"
      ).toUpperCase()}
    </span>
  );
}


// ============================================================
// URGENT BATCH CARD
// ============================================================

function UrgentBatchCard({
  batch,
}) {
  const risk =
    batch.riskLevel ||
    "UNKNOWN";

  return (
    <div className="rounded-xl border border-border bg-white p-4">

      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-ink truncate">
              {batch.productName ||
                batch.produce ||
                "Unknown produce"}
            </p>

            <RiskBadge
              level={risk}
            />
          </div>

          <p className="text-xs text-muted mt-1">
            {batch.batchCode ||
              batch.id ||
              "Unknown batch"}
          </p>
        </div>

        <p className="text-sm font-mono font-semibold text-ink whitespace-nowrap">
          {formatNumber(
            batch.quantityKg,
            1
          )}{" "}
          {batch.unit || "kg"}
        </p>

      </div>


      <div className="grid grid-cols-3 gap-3 mt-4">

        <div>
          <p className="text-[11px] text-muted">
            Freshness
          </p>

          <p className="text-sm font-semibold text-ink mt-1">
            {batch.freshness != null
              ? `${Math.round(
                  batch.freshness
                )}/100`
              : "—"}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-muted">
            Shelf life
          </p>

          <p className="text-sm font-semibold text-ink mt-1">
            {batch.shelfLifeDays !=
            null
              ? `${batch.shelfLifeDays} days`
              : "—"}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-muted">
            Spoilage
          </p>

          <p className="text-sm font-semibold text-ink mt-1">
            {batch.spoilageRisk !=
            null
              ? `${batch.spoilageRisk}%`
              : "—"}
          </p>
        </div>

      </div>


      <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-border">

        <div>
          <p className="text-[11px] text-muted">
            Suggested action
          </p>

          <p className="text-xs font-medium text-ink mt-1">
            {batch.action ||
              "Analyze batch"}
          </p>
        </div>

        <Link
          to={`/batches/${batch.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-900"
        >
          View
          <ArrowRight size={13} />
        </Link>

      </div>

    </div>
  );
}


// ============================================================
// RECENT DECISIONS
// ============================================================

function RecentDecisions({
  recommendations,
}) {
  const entries =
    Object.entries(
      recommendations || {}
    );

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No recent AI decisions"
        description="Recommendations will appear here after batches are analyzed."
      />
    );
  }

  return (
    <div className="space-y-3">

      {entries.map(
        ([action, count]) => (
          <div
            key={action}
            className="flex items-center justify-between rounded-lg border border-border p-3"
          >

            <div className="flex items-center gap-3">

              <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
                <Sparkles size={15} />
              </div>

              <div>
                <p className="text-sm font-medium text-ink">
                  {actionLabel(
                    action
                  )}
                </p>

                <p className="text-[11px] text-muted mt-0.5">
                  Last 7 days
                </p>
              </div>

            </div>

            <span className="text-sm font-mono font-semibold text-ink">
              {formatNumber(count)}
            </span>

          </div>
        )
      )}

    </div>
  );
}


// ============================================================
// DASHBOARD
// ============================================================

export default function Dashboard() {
  const {
    overview,
    urgentBatches,
    metrics,
    loading,
    error,
    refresh,
    lastUpdated,
  } = useDashboard();


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading && !overview) {
    return (
      <PageContainer
        title="AI Operations"
        subtitle="Monitor produce freshness, shelf life, spoilage risk and AI decisions."
      >
        <div className="min-h-[500px] flex items-center justify-center">
          <Loader label="Loading AI operations data..." />
        </div>
      </PageContainer>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error && !overview) {
    return (
      <PageContainer
        title="AI Operations"
        subtitle="Monitor produce freshness, shelf life, spoilage risk and AI decisions."
      >
        <Card className="max-w-xl mx-auto mt-10">

          <div className="text-center">

            <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>

            <h2 className="text-base font-semibold text-ink mt-4">
              Dashboard data unavailable
            </h2>

            <p className="text-sm text-muted mt-2 leading-6">
              The frontend could not retrieve
              the current dashboard information
              from the backend.
            </p>

            <Button
              className="mt-5"
              icon={RefreshCw}
              onClick={refresh}
            >
              Try again
            </Button>

          </div>

        </Card>
      </PageContainer>
    );
  }


  return (
    <PageContainer
      title="AI Operations"
      subtitle="Monitor produce freshness, shelf life, spoilage risk and AI decisions."
    >

      <div className="space-y-5">

        {/* ==================================================
            HEADER ACTIONS
        ================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

          <div>
            <p className="text-xs text-muted">
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString(
                    "en-IN",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}`
                : "Live dashboard"}
            </p>
          </div>

          <div className="flex gap-2">

            <Button
              variant="secondary"
              icon={RefreshCw}
              size="sm"
              disabled={loading}
              onClick={refresh}
            >
              Refresh
            </Button>

            <Link to="/analyze">
              <Button
                icon={ScanLine}
                size="sm"
              >
                Analyze Produce
              </Button>
            </Link>

          </div>

        </div>


        {/* ==================================================
            PARTIAL DATA WARNING
        ================================================== */}

        {overview?.isPartial && (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">

            <div className="flex gap-3">

              <AlertTriangle
                size={18}
                className="text-yellow-700 shrink-0"
              />

              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Prediction coverage is incomplete
                </p>

                <p className="text-xs text-yellow-700 mt-1 leading-5">
                  {overview.partialNote ||
                    "Some batches do not have AI predictions yet. Dashboard estimates may therefore be incomplete."}
                </p>
              </div>

            </div>

          </div>
        )}


        {/* ==================================================
            CORE METRICS
        ================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <MetricCard
            icon={Boxes}
            label="Active batches"
            value={formatNumber(
              metrics.totalBatches
            )}
            description={`${formatNumber(
              metrics.totalInventoryKg,
              1
            )} kg total inventory`}
          />

          <MetricCard
            icon={CheckCircle2}
            label="Prediction coverage"
            value={`${formatNumber(
              metrics.predictionCoverage
            )}%`}
            description={`${formatNumber(
              metrics.batchesWithPredictions
            )} of ${formatNumber(
              metrics.totalBatches
            )} batches analyzed`}
            tone={
              metrics.predictionCoverage >=
              80
                ? "good"
                : "warning"
            }
          />

          <MetricCard
            icon={AlertTriangle}
            label="At-risk batches"
            value={formatNumber(
              metrics.atRiskBatchCount
            )}
            description={`${formatNumber(
              metrics.atRiskInventoryKg,
              1
            )} kg currently at risk`}
            tone={
              metrics.atRiskBatchCount > 0
                ? "danger"
                : "good"
            }
          />

          <MetricCard
            icon={TrendingDown}
            label="Estimated spoilage"
            value={`${formatNumber(
              metrics.estimatedSpoilagePercent,
              1
            )}%`}
            description={`${formatNumber(
              metrics.estimatedSpoilageKg,
              1
            )} kg estimated`}
            tone={
              metrics.estimatedSpoilagePercent >=
              20
                ? "danger"
                : metrics.estimatedSpoilagePercent >=
                  10
                ? "warning"
                : "good"
            }
          />

        </div>


        {/* ==================================================
            SECONDARY METRICS
        ================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <MetricCard
            icon={AlertTriangle}
            label="Critical batches"
            value={formatNumber(
              metrics.criticalBatchCount
            )}
            description="Require immediate attention"
            tone={
              metrics.criticalBatchCount > 0
                ? "danger"
                : "good"
            }
          />

          <MetricCard
            icon={TrendingDown}
            label="Inventory at risk"
            value={`${formatNumber(
              metrics.atRiskInventoryKg,
              1
            )} kg`}
            description="Based on latest predictions"
            tone={
              metrics.atRiskInventoryKg > 0
                ? "warning"
                : "good"
            }
          />

          <MetricCard
            icon={IndianRupee}
            label="Estimated value at risk"
            value={formatCurrency(
              metrics.estimatedValueAtRisk
            )}
            description={
              metrics.estimatedValueAtRisk ===
              null
                ? "Procurement cost data unavailable"
                : "Estimated value of predicted spoilage"
            }
            tone={
              metrics.estimatedValueAtRisk
                ? "warning"
                : "default"
            }
          />

        </div>


        {/* ==================================================
            URGENT BATCHES + DECISIONS
        ================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-5">

          {/* ----------------------------------------------
              URGENT BATCHES
          ---------------------------------------------- */}

          <Card>
            <CardHeader
              title="Immediate attention"
              subtitle="Batches with high spoilage risk or very short shelf life"
              action={
                <Link
                  to="/batches"
                  className="text-xs font-medium text-brand-700 hover:text-brand-900 inline-flex items-center gap-1"
                >
                  View all
                  <ArrowRight size={13} />
                </Link>
              }
            />

            {urgentBatches.length ===
            0 ? (
              <div className="py-10">
                <EmptyState
                  icon={CheckCircle2}
                  title="No critical batches"
                  description="There are currently no batches requiring immediate action."
                />
              </div>
            ) : (
              <div className="space-y-3">

                {urgentBatches
                  .slice(0, 5)
                  .map((batch) => (
                    <UrgentBatchCard
                      key={
                        batch.id
                      }
                      batch={
                        batch
                      }
                    />
                  ))}

              </div>
            )}

          </Card>


          {/* ----------------------------------------------
              RECENT DECISIONS
          ---------------------------------------------- */}

          <Card>
            <CardHeader
              title="Recent AI decisions"
              subtitle="Recommendation activity from the last 7 days"
              action={
                <Sparkles
                  size={17}
                  className="text-brand-700"
                />
              }
            />

            <RecentDecisions
              recommendations={
                overview?.recentRecommendations
              }
            />

          </Card>

        </div>


        {/* ==================================================
            INVENTORY STATUS
        ================================================== */}

        <Card>
          <CardHeader
            title="Inventory status"
            subtitle="Current batch distribution by lifecycle status"
          />

          {Object.keys(
            overview?.inventoryByStatus ||
              {}
          ).length === 0 ? (
            <EmptyState
              icon={Boxes}
              title="No inventory data"
              description="Inventory status will appear when batches are created."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

              {Object.entries(
                overview.inventoryByStatus
              ).map(
                ([
                  status,
                  data,
                ]) => (
                  <div
                    key={status}
                    className="rounded-xl border border-border p-4"
                  >

                    <div className="flex items-center justify-between">

                      <p className="text-xs text-muted capitalize">
                        {status.toLowerCase()}
                      </p>

                      <Boxes
                        size={15}
                        className="text-muted"
                      />

                    </div>

                    <p className="text-xl font-semibold font-mono text-ink mt-2">
                      {formatNumber(
                        data?.count
                      )}
                    </p>

                    <p className="text-xs text-muted mt-1">
                      {formatNumber(
                        data?.totalQuantityKg,
                        1
                      )}{" "}
                      kg
                    </p>

                  </div>
                )
              )}

            </div>
          )}

        </Card>


        {/* ==================================================
            PREDICTION COVERAGE
        ================================================== */}

        <Card>
          <CardHeader
            title="AI prediction coverage"
            subtitle="How much of the active inventory has been analyzed"
          />

          <div className="space-y-4">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-ink">
                  {formatNumber(
                    metrics.batchesWithPredictions
                  )}{" "}
                  analyzed
                </p>

                <p className="text-xs text-muted mt-1">
                  {formatNumber(
                    metrics.batchesWithoutPredictions
                  )}{" "}
                  still need analysis
                </p>
              </div>

              <p className="text-lg font-semibold font-mono text-ink">
                {formatNumber(
                  metrics.predictionCoverage
                )}
                %
              </p>

            </div>


            <div className="h-2 rounded-full bg-bg overflow-hidden">

              <div
                className="h-full rounded-full bg-brand-700 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      metrics.predictionCoverage
                    )
                  )}%`,
                }}
              />

            </div>


            {metrics.batchesWithoutPredictions >
              0 && (
              <div className="flex items-center justify-between gap-3">

                <p className="text-xs text-muted">
                  Run AI analysis on unprocessed
                  batches to improve dashboard
                  estimates.
                </p>

                <Link to="/analyze">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={ScanLine}
                  >
                    Analyze
                  </Button>
                </Link>

              </div>
            )}

          </div>

        </Card>


        {/* ==================================================
            DISCLAIMER
        ================================================== */}

        {overview?.disclaimer && (
          <div className="flex gap-2 items-start px-1">

            <Clock3
              size={14}
              className="text-muted mt-0.5 shrink-0"
            />

            <p className="text-[11px] text-muted leading-5">
              {overview.disclaimer}
            </p>

          </div>
        )}

      </div>

    </PageContainer>
  );
}