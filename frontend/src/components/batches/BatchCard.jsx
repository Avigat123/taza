import { Link } from "react-router-dom";
import Card from "../ui/Card";
import FreshnessRing from "../ui/FreshnessRing";
import BatchStatus from "./BatchStatus";
import { formatKg, formatDays } from "../../utils/formatting";

export default function BatchCard({ batch }) {
  return (
    <Link to={`/batches/${batch.id}`}>
      <Card className="hover:shadow-pop transition-shadow h-full flex flex-col">
        {/* PHOTO PLACEHOLDER: produce thumbnail for {batch.imageKey} — see PHOTO_PLACEHOLDERS.txt */}
        <div className="w-full h-28 rounded-lg bg-brand-50 mb-4 flex items-center justify-center text-brand-300 text-xs font-mono">
          {batch.imageKey}
        </div>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-sm font-semibold text-ink">{batch.id}</p>
            <p className="text-xs text-muted">{batch.produce} · {formatKg(batch.quantityKg)}</p>
          </div>
          <FreshnessRing score={batch.freshness} size={48} strokeWidth={5} />
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <span className="text-xs text-muted">{formatDays(batch.shelfLifeDays)} left</span>
          <BatchStatus spoilageRisk={batch.spoilageRisk} />
        </div>
      </Card>
    </Link>
  );
}
