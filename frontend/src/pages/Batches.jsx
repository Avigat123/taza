import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, List, Plus } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import BatchCard from "../components/batches/BatchCard";
import BatchTable from "../components/batches/BatchTable";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { useBatches } from "../hooks/useBatches";
import { PRODUCE_TYPES } from "../utils/constants";
import { createBatch } from "../api/batches";

const emptyForm = { produce: "", origin: "", harvestDate: "", quantityKg: "" };

export default function Batches() {
  const { t } = useTranslation();
  const { batches, loading, refresh } = useBatches();
  const [view, setView] = useState("grid");
  const [produceFilter, setProduceFilter] = useState("All");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const canSubmit = form.produce && form.origin && form.harvestDate && form.quantityKg;

  async function handleCreate(e) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await createBatch({
        produce: form.produce,
        origin: form.origin,
        harvestDate: form.harvestDate,
        quantityKg: Number(form.quantityKg),
      });
      setForm(emptyForm);
      setShowCreate(false);
      await refresh();
    } catch (err) {
      setFormError(err?.response?.data?.message || "Failed to create batch. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    if (produceFilter === "All") return batches;
    return batches.filter((b) => b.produce === produceFilter);
  }, [batches, produceFilter]);

  return (
    <PageContainer title={t("batches.title")} subtitle={`${filtered.length} ${t("batches.activeBatches")}`}>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {["All", ...PRODUCE_TYPES].map((p) => (
            <button
              key={p}
              onClick={() => setProduceFilter(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                produceFilter === p
                  ? "bg-brand-700 text-white border-brand-700"
                  : "bg-surface text-muted border-border hover:text-ink"
              }`}
            >
              {p === "All" ? t("batches.all") : p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
            <button
              onClick={() => setView("grid")}
              className={`p-1.5 rounded-md transition-colors ${view === "grid" ? "bg-brand-50 text-brand-700" : "text-muted"}`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView("table")}
              className={`p-1.5 rounded-md transition-colors ${view === "table" ? "bg-brand-50 text-brand-700" : "text-muted"}`}
            >
              <List size={15} />
            </button>
          </div>
          <Button icon={Plus} onClick={() => setShowCreate(true)}>
            Create Batch
          </Button>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Batch">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Produce</label>
            <select
              value={form.produce}
              onChange={(e) => setForm((f) => ({ ...f, produce: e.target.value }))}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-white"
              required
            >
              <option value="" disabled>
                Select produce
              </option>
              {PRODUCE_TYPES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Origin</label>
            <input
              type="text"
              value={form.origin}
              onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
              placeholder="e.g. Nashik, Maharashtra"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Harvest Date</label>
            <input
              type="date"
              value={form.harvestDate}
              onChange={(e) => setForm((f) => ({ ...f, harvestDate: e.target.value }))}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Quantity (kg)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.quantityKg}
              onChange={(e) => setForm((f) => ({ ...f, quantityKg: e.target.value }))}
              placeholder="e.g. 120"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              required
            />
          </div>

          {formError && <p className="text-sm text-risk-high">{formError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || submitting}>
              {submitting ? "Creating…" : "Create Batch"}
            </Button>
          </div>
        </form>
      </Modal>

      {loading && <Loader label={t("common.loading")} />}

      {!loading && filtered.length === 0 && (
        <EmptyState title={t("batches.noBatchesTitle")} description={t("batches.noBatchesDesc")} />
      )}

      <AnimatePresence mode="wait">
        {!loading && filtered.length > 0 && view === "grid" && (
          <motion.div
            key="grid"
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            {filtered.map((b) => (
              <motion.div
                key={b.id}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.3 }}
              >
                <BatchCard batch={b} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && filtered.length > 0 && view === "table" && (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BatchTable batches={filtered} />
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}