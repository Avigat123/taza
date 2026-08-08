import { useMemo, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import BatchCard from "../components/batches/BatchCard";
import BatchTable from "../components/batches/BatchTable";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import { useBatches } from "../hooks/useBatches";
import { PRODUCE_TYPES } from "../utils/constants";

export default function Batches() {
  const { batches, loading } = useBatches();
  const [view, setView] = useState("grid");
  const [produceFilter, setProduceFilter] = useState("All");

  const filtered = useMemo(() => {
    if (produceFilter === "All") return batches;
    return batches.filter((b) => b.produce === produceFilter);
  }, [batches, produceFilter]);

  return (
    <PageContainer title="Batches" subtitle={`${filtered.length} active batches`}>
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
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
          <button
            onClick={() => setView("grid")}
            className={`p-1.5 rounded-md ${view === "grid" ? "bg-brand-50 text-brand-700" : "text-muted"}`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setView("table")}
            className={`p-1.5 rounded-md ${view === "table" ? "bg-brand-50 text-brand-700" : "text-muted"}`}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {loading && <Loader label="Loading batches..." />}

      {!loading && filtered.length === 0 && (
        <EmptyState title="No batches found" description="Try a different produce filter." />
      )}

      {!loading && filtered.length > 0 && view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((b) => (
            <BatchCard key={b.id} batch={b} />
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && view === "table" && <BatchTable batches={filtered} />}
    </PageContainer>
  );
}
