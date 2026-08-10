
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Boxes,
  CalendarDays,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import PageContainer from "../components/layout/PageContainer";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import Modal from "../components/ui/Modal";

import { useBatches } from "../hooks/useBatches";
import { createBatch } from "../api/batches";
import { PRODUCE_TYPES } from "../utils/constants";


// ============================================================
// DEFAULT FORM
// ============================================================

const EMPTY_FORM = {
  produce: "",
  origin: "",
  harvestDate: "",
  arrivalDate: "",
  currentLocation: "",
  quantityKg: "",
};


// ============================================================
// HELPERS
// ============================================================

function formatNumber(value, decimals = 0) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: decimals,
  });
}


function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}


function riskClasses(risk) {
  const value = String(risk ?? "").toUpperCase();

  if (
    value === "HIGH" ||
    value === "CRITICAL"
  ) {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (value === "MEDIUM") {
    return "bg-yellow-50 text-yellow-700 border-yellow-100";
  }

  if (value === "LOW") {
    return "bg-green-50 text-green-700 border-green-100";
  }

  return "bg-bg text-muted border-border";
}


function riskLabel(risk) {
  if (
    risk === null ||
    risk === undefined
  ) {
    return "Not analyzed";
  }

  const percentage = Number(risk);

  if (percentage >= 70) {
    return "High risk";
  }

  if (percentage >= 35) {
    return "Medium risk";
  }

  return "Low risk";
}


// ============================================================
// BATCH CARD
// ============================================================

function BatchItem({ batch }) {
  const hasPrediction =
    batch.freshness !== null &&
    batch.freshness !== undefined;

  const risk =
    batch.spoilageRisk !== null &&
    batch.spoilageRisk !== undefined
      ? batch.spoilageRisk
      : null;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.25,
      }}
    >
      <Card className="h-full hover:shadow-pop transition-shadow">

        {/* Header */}

        <div className="flex items-start justify-between gap-3">

          <div className="min-w-0">

            <p className="font-mono text-sm font-semibold text-ink truncate">
              {batch.id}
            </p>

            <p className="text-sm font-medium text-ink mt-1">
              {batch.produce || "Unknown produce"}
            </p>

            <p className="text-xs text-muted mt-0.5">
              {formatNumber(batch.quantityKg, 1)} kg
            </p>

          </div>

          <div
            className={`shrink-0 px-2.5 py-1 rounded-full border text-[11px] font-medium ${riskClasses(
              risk === null
                ? null
                : risk >= 70
                ? "HIGH"
                : risk >= 35
                ? "MEDIUM"
                : "LOW"
            )}`}
          >
            {riskLabel(risk)}
          </div>

        </div>


        {/* AI STATUS */}

        <div className="mt-5 rounded-lg bg-bg p-3">

          <div className="flex items-center justify-between mb-3">

            <div className="flex items-center gap-2">

              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center ${
                  hasPrediction
                    ? "bg-green-50 text-green-700"
                    : "bg-brand-50 text-brand-700"
                }`}
              >
                <ScanLine size={14} />
              </div>

              <div>

                <p className="text-xs font-medium text-ink">
                  AI analysis
                </p>

                <p className="text-[11px] text-muted">
                  {hasPrediction
                    ? "Prediction available"
                    : "Not analyzed yet"}
                </p>

              </div>

            </div>

            {hasPrediction && (
              <p className="text-sm font-mono font-semibold text-ink">
                {Math.round(Number(batch.freshness))}
                /100
              </p>
            )}

          </div>


          {hasPrediction ? (
            <div className="grid grid-cols-2 gap-3">

              <div>

                <p className="text-[11px] text-muted">
                  Shelf life
                </p>

                <p className="text-sm font-semibold text-ink mt-1">
                  {batch.shelfLifeDays != null
                    ? `${batch.shelfLifeDays} days`
                    : "—"}
                </p>

              </div>

              <div>

                <p className="text-[11px] text-muted">
                  Spoilage
                </p>

                <p className="text-sm font-semibold text-ink mt-1">
                  {risk !== null
                    ? `${Math.round(risk)}%`
                    : "—"}
                </p>

              </div>

            </div>
          ) : (
            <p className="text-xs text-muted leading-5">
              Upload produce images and run AI
              analysis to calculate freshness,
              shelf life and spoilage risk.
            </p>
          )}

        </div>


        {/* BATCH INFO */}

        <div className="mt-4 space-y-2">

          <div className="flex items-center gap-2 text-xs text-muted">
            <MapPin size={13} />

            <span className="truncate">
              {batch.origin || "Origin not available"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted">
            <CalendarDays size={13} />

            <span>
              Harvested {formatDate(batch.harvestDate)}
            </span>
          </div>

        </div>


        {/* ACTIONS */}

        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border">

          <Link
            to={`/batches/${batch.id}`}
            className="flex-1"
          >
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-center"
            >
              View batch
            </Button>
          </Link>

          <Link
            to={`/analyze?batch=${batch.id}`}
          >
            <Button
              size="sm"
              icon={ScanLine}
            >
              Analyze
            </Button>
          </Link>

        </div>

      </Card>
    </motion.div>
  );
}


// ============================================================
// CREATE BATCH MODAL
// ============================================================

function CreateBatchModal({
  open,
  onClose,
  onCreated,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState(null);


  const canSubmit =
    form.produce &&
    form.origin &&
    form.harvestDate &&
    form.arrivalDate &&
    form.currentLocation &&
    form.quantityKg &&
    Number(form.quantityKg) > 0;


  function update(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError(null);
  }


  async function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await createBatch({
        produce: form.produce,
        origin: form.origin,
        harvestDate: form.harvestDate,
        arrivalDate: form.arrivalDate,
        currentLocation: form.currentLocation,
        quantityKg: Number(form.quantityKg),
      });

      setForm(EMPTY_FORM);

      onCreated?.(created);

      onClose();

    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create batch."
      );

    } finally {
      setSubmitting(false);
    }
  }


  return (
    <Modal
      open={open}
      onClose={() => {
        if (!submitting) {
          onClose();
        }
      }}
      title="Create produce batch"
    >

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >

        {/* Produce */}

        <div>

          <label className="block text-xs font-medium text-muted mb-1.5">
            Produce
            <span className="text-red-500 ml-1">
              *
            </span>
          </label>

          <select
            value={form.produce}
            onChange={(event) =>
              update(
                "produce",
                event.target.value
              )
            }
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            required
          >

            <option value="">
              Select produce
            </option>

            {PRODUCE_TYPES.map((produce) => (
              <option
                key={produce}
                value={produce}
              >
                {produce}
              </option>
            ))}

          </select>

        </div>


        {/* Quantity */}

        <div>

          <label className="block text-xs font-medium text-muted mb-1.5">
            Quantity
            <span className="text-red-500 ml-1">
              *
            </span>
          </label>

          <div className="relative">

            <input
              type="number"
              min="0"
              step="0.1"
              value={form.quantityKg}
              onChange={(event) =>
                update(
                  "quantityKg",
                  event.target.value
                )
              }
              placeholder="e.g. 120"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 pr-12 text-sm outline-none focus:border-brand-500"
              required
            />

            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
              kg
            </span>

          </div>

        </div>


        {/* Origin */}

        <div>

          <label className="block text-xs font-medium text-muted mb-1.5">
            Origin
            <span className="text-red-500 ml-1">
              *
            </span>
          </label>

          <input
            type="text"
            value={form.origin}
            onChange={(event) =>
              update(
                "origin",
                event.target.value
              )
            }
            placeholder="e.g. Nashik, Maharashtra"
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            required
          />

        </div>


        {/* Dates */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>

            <label className="block text-xs font-medium text-muted mb-1.5">
              Harvest date
              <span className="text-red-500 ml-1">
                *
              </span>
            </label>

            <input
              type="date"
              value={form.harvestDate}
              onChange={(event) =>
                update(
                  "harvestDate",
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              required
            />

          </div>


          <div>

            <label className="block text-xs font-medium text-muted mb-1.5">
              Arrival date
              <span className="text-red-500 ml-1">
                *
              </span>
            </label>

            <input
              type="date"
              value={form.arrivalDate}
              onChange={(event) =>
                update(
                  "arrivalDate",
                  event.target.value
                )
              }
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              required
            />

          </div>

        </div>


        {/* Current location */}

        <div>

          <label className="block text-xs font-medium text-muted mb-1.5">
            Current location
            <span className="text-red-500 ml-1">
              *
            </span>
          </label>

          <input
            type="text"
            value={form.currentLocation}
            onChange={(event) =>
              update(
                "currentLocation",
                event.target.value
              )
            }
            placeholder="e.g. Gurgaon warehouse"
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            required
          />

        </div>


        {/* Error */}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">

            <p className="text-xs text-red-700">
              {error}
            </p>

          </div>
        )}


        {/* Actions */}

        <div className="flex justify-end gap-2 pt-2">

          <Button
            type="button"
            variant="secondary"
            disabled={submitting}
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={!canSubmit || submitting}
            icon={Plus}
          >
            {submitting
              ? "Creating..."
              : "Create batch"}
          </Button>

        </div>

      </form>

    </Modal>
  );
}


// ============================================================
// MAIN PAGE
// ============================================================

export default function Batches() {
  const {
    batches,
    loading,
    error,
    refresh,
  } = useBatches();

  const [view, setView] =
    useState("grid");

  const [produceFilter, setProduceFilter] =
    useState("All");

  const [riskFilter, setRiskFilter] =
    useState("All");

  const [search, setSearch] =
    useState("");

  const [showCreate, setShowCreate] =
    useState(false);


  // ==========================================================
  // FILTER
  // ==========================================================

  const filteredBatches = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return batches.filter((batch) => {

      const matchesProduce =
        produceFilter === "All" ||
        batch.produce === produceFilter;


      const risk =
        batch.spoilageRisk;


      const matchesRisk =
        riskFilter === "All" ||

        (
          riskFilter === "Analyzed" &&
          risk !== null &&
          risk !== undefined
        ) ||

        (
          riskFilter === "Unanalyzed" &&
          (
            risk === null ||
            risk === undefined
          )
        ) ||

        (
          riskFilter === "High" &&
          risk >= 70
        ) ||

        (
          riskFilter === "Medium" &&
          risk >= 35 &&
          risk < 70
        ) ||

        (
          riskFilter === "Low" &&
          risk < 35
        );


      const searchable = [
        batch.id,
        batch.produce,
        batch.origin,
        batch.currentLocation,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();


      const matchesSearch =
        !query ||
        searchable.includes(query);


      return (
        matchesProduce &&
        matchesRisk &&
        matchesSearch
      );
    });
  }, [
    batches,
    produceFilter,
    riskFilter,
    search,
  ]);


  // ==========================================================
  // STATS
  // ==========================================================

  const analyzedCount =
    batches.filter(
      (batch) =>
        batch.freshness !== null &&
        batch.freshness !== undefined
    ).length;


  const highRiskCount =
    batches.filter(
      (batch) =>
        batch.spoilageRisk != null &&
        batch.spoilageRisk >= 70
    ).length;


  const totalKg =
    batches.reduce(
      (sum, batch) =>
        sum +
        Number(
          batch.quantityKg || 0
        ),
      0
    );


  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading &&
    batches.length === 0
  ) {
    return (
      <PageContainer
        title="Batches"
        subtitle="Manage produce batches and run AI freshness analysis."
      >
        <div className="min-h-[450px] flex items-center justify-center">
          <Loader label="Loading batches..." />
        </div>
      </PageContainer>
    );
  }


  return (
    <PageContainer
      title="Batches"
      subtitle="Manage inventory and send batches to the AI analysis pipeline."
    >

      <div className="space-y-5">

        {/* ==================================================
            STATS
        ================================================== */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          <Card>

            <p className="text-xs text-muted">
              Total batches
            </p>

            <p className="text-xl font-semibold font-mono text-ink mt-2">
              {formatNumber(batches.length)}
            </p>

          </Card>


          <Card>

            <p className="text-xs text-muted">
              Inventory
            </p>

            <p className="text-xl font-semibold font-mono text-ink mt-2">
              {formatNumber(totalKg, 1)} kg
            </p>

          </Card>


          <Card>

            <p className="text-xs text-muted">
              AI analyzed
            </p>

            <p className="text-xl font-semibold font-mono text-ink mt-2">
              {formatNumber(analyzedCount)}
            </p>

            <p className="text-[11px] text-muted mt-1">
              {batches.length > 0
                ? `${Math.round(
                    (analyzedCount /
                      batches.length) *
                      100
                  )}% coverage`
                : "0% coverage"}
            </p>

          </Card>


          <Card>

            <p className="text-xs text-muted">
              High risk
            </p>

            <p className="text-xl font-semibold font-mono text-ink mt-2">
              {formatNumber(highRiskCount)}
            </p>

            <p className="text-[11px] text-muted mt-1">
              Requires attention
            </p>

          </Card>

        </div>


        {/* ==================================================
            TOOLBAR
        ================================================== */}

        <div className="flex flex-col gap-3">

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">

            {/* Search */}

            <div className="relative w-full lg:max-w-sm">

              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search batch, produce or location..."
                className="w-full rounded-lg border border-border bg-white pl-9 pr-9 py-2.5 text-sm outline-none focus:border-brand-500"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  <X size={14} />
                </button>
              )}

            </div>


            {/* Actions */}

            <div className="flex items-center gap-2">

              <Button
                size="sm"
                variant="secondary"
                icon={RefreshCw}
                disabled={loading}
                onClick={refresh}
              >
                Refresh
              </Button>

              <Button
                size="sm"
                icon={Plus}
                onClick={() =>
                  setShowCreate(true)
                }
              >
                Create batch
              </Button>

            </div>

          </div>


          {/* Filters */}

          <div className="flex flex-wrap items-center justify-between gap-3">

            <div className="flex gap-2 flex-wrap">

              {[
                "All",
                ...PRODUCE_TYPES,
              ].map((produce) => (
                <button
                  key={produce}
                  type="button"
                  onClick={() =>
                    setProduceFilter(
                      produce
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    produceFilter === produce
                      ? "bg-brand-700 text-white border-brand-700"
                      : "bg-white text-muted border-border hover:text-ink"
                  }`}
                >
                  {produce}
                </button>
              ))}

            </div>


            <div className="flex items-center gap-2">

              <select
                value={riskFilter}
                onChange={(event) =>
                  setRiskFilter(
                    event.target.value
                  )
                }
                className="rounded-lg border border-border bg-white px-3 py-2 text-xs text-ink outline-none"
              >

                <option value="All">
                  All analysis states
                </option>

                <option value="Analyzed">
                  Analyzed
                </option>

                <option value="Unanalyzed">
                  Not analyzed
                </option>

                <option value="High">
                  High risk
                </option>

                <option value="Medium">
                  Medium risk
                </option>

                <option value="Low">
                  Low risk
                </option>

              </select>


              <div className="flex gap-1 bg-white border border-border rounded-lg p-1">

                <button
                  type="button"
                  onClick={() =>
                    setView("grid")
                  }
                  className={`p-1.5 rounded-md ${
                    view === "grid"
                      ? "bg-brand-50 text-brand-700"
                      : "text-muted"
                  }`}
                  aria-label="Grid view"
                >
                  <LayoutGrid size={15} />
                </button>


                <button
                  type="button"
                  onClick={() =>
                    setView("table")
                  }
                  className={`p-1.5 rounded-md ${
                    view === "table"
                      ? "bg-brand-50 text-brand-700"
                      : "text-muted"
                  }`}
                  aria-label="List view"
                >
                  <List size={15} />
                </button>

              </div>

            </div>

          </div>

        </div>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">

            <p className="text-sm font-medium text-red-800">
              Unable to load batches
            </p>

            <p className="text-xs text-red-700 mt-1">
              {error?.response?.data?.message ||
                error?.message ||
                "Please try again."}
            </p>

          </div>
        )}


        {/* ==================================================
            RESULT COUNT
        ================================================== */}

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">

            <Boxes
              size={16}
              className="text-muted"
            />

            <p className="text-xs text-muted">
              Showing{" "}
              <span className="font-medium text-ink">
                {filteredBatches.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-ink">
                {batches.length}
              </span>{" "}
              batches
            </p>

          </div>


          {filteredBatches.length > 0 && (
            <Link
              to="/analyze"
              className="text-xs font-medium text-brand-700 inline-flex items-center gap-1 hover:text-brand-900"
            >
              Analyze a batch
              <ArrowRight size={13} />
            </Link>
          )}

        </div>


        {/* ==================================================
            EMPTY
        ================================================== */}

        {!loading &&
          filteredBatches.length === 0 && (
            <Card>

              <EmptyState
                icon={Boxes}
                title={
                  batches.length === 0
                    ? "No batches yet"
                    : "No matching batches"
                }
                description={
                  batches.length === 0
                    ? "Create your first produce batch, then upload its images for AI freshness analysis."
                    : "Try changing your search or filters."
                }
              />

              {batches.length === 0 && (
                <div className="flex justify-center mt-5">

                  <Button
                    icon={Plus}
                    onClick={() =>
                      setShowCreate(true)
                    }
                  >
                    Create first batch
                  </Button>

                </div>
              )}

            </Card>
          )}


        {/* ==================================================
            BATCH GRID
        ================================================== */}

        <AnimatePresence mode="wait">

          {filteredBatches.length > 0 &&
            view === "grid" && (
              <motion.div
                key="grid"
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
              >

                {filteredBatches.map(
                  (batch) => (
                    <BatchItem
                      key={batch.id}
                      batch={batch}
                    />
                  )
                )}

              </motion.div>
            )}


          {/* =================================================
              TABLE
          ================================================= */}

          {filteredBatches.length > 0 &&
            view === "table" && (
              <motion.div
                key="table"
                initial={{
                  opacity: 0,
                }}
                animate={{
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                className="overflow-x-auto rounded-xl border border-border bg-white"
              >

                <table className="w-full text-sm">

                  <thead>

                    <tr className="border-b border-border text-left text-xs text-muted">

                      <th className="px-4 py-3 font-medium">
                        Batch
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Produce
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Quantity
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Location
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Freshness
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Shelf life
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Risk
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Action
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {filteredBatches.map(
                      (batch) => (
                        <tr
                          key={batch.id}
                          className="border-b border-border last:border-0 hover:bg-bg/60 transition-colors"
                        >

                          <td className="px-4 py-3">

                            <Link
                              to={`/batches/${batch.id}`}
                              className="font-mono font-medium text-ink hover:text-brand-700"
                            >
                              {batch.id}
                            </Link>

                          </td>


                          <td className="px-4 py-3 text-muted">
                            {batch.produce || "—"}
                          </td>


                          <td className="px-4 py-3 font-mono text-ink">
                            {formatNumber(
                              batch.quantityKg,
                              1
                            )}{" "}
                            kg
                          </td>


                          <td className="px-4 py-3 text-muted max-w-[180px] truncate">
                            {batch.currentLocation ||
                              batch.origin ||
                              "—"}
                          </td>


                          <td className="px-4 py-3 font-mono text-ink">
                            {batch.freshness != null
                              ? `${Math.round(
                                  Number(
                                    batch.freshness
                                  )
                                )}/100`
                              : "—"}
                          </td>


                          <td className="px-4 py-3 font-mono text-ink">
                            {batch.shelfLifeDays != null
                              ? `${batch.shelfLifeDays} d`
                              : "—"}
                          </td>


                          <td className="px-4 py-3">

                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full border text-[11px] font-medium ${riskClasses(
                                batch.spoilageRisk == null
                                  ? null
                                  : batch.spoilageRisk >= 70
                                  ? "HIGH"
                                  : batch.spoilageRisk >= 35
                                  ? "MEDIUM"
                                  : "LOW"
                              )}`}
                            >
                              {riskLabel(
                                batch.spoilageRisk
                              )}
                            </span>

                          </td>


                          <td className="px-4 py-3">

                            <Link
                              to={`/analyze?batch=${batch.id}`}
                              className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-900"
                            >
                              Analyze
                              <ArrowRight size={13} />
                            </Link>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </motion.div>
            )}

        </AnimatePresence>


        {/* ==================================================
            CREATE MODAL
        ================================================== */}

        <CreateBatchModal
          open={showCreate}
          onClose={() =>
            setShowCreate(false)
          }
          onCreated={() =>
            refresh()
          }
        />

      </div>

    </PageContainer>
  );
}

