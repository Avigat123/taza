import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, List } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import BatchCard from "../components/batches/BatchCard";
import BatchTable from "../components/batches/BatchTable";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import { useBatches } from "../hooks/useBatches";
import { PRODUCE_TYPES } from "../utils/constants";

export default function Batches() {
  const { t } = useTranslation();
  const { batches, loading } = useBatches();
  const [view, setView] = useState("grid");
  const [produceFilter, setProduceFilter] = useState("All");

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
      </div>

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
