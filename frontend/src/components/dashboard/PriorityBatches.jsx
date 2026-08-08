import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Card, { CardHeader } from "../ui/Card";
import FreshnessRing from "../ui/FreshnessRing";
import Badge from "../ui/Badge";
import { formatDays, formatKg } from "../../utils/formatting";
import { spoilageTier, tierLabel } from "../../utils/risk";

export default function PriorityBatches({ batches }) {
  const priority = [...batches].sort((a, b) => a.shelfLifeDays - b.shelfLifeDays).slice(0, 4);

  return (
    <Card>
      <CardHeader
        title="Priority batches"
        subtitle="Lowest remaining shelf life first"
        action={
          <Link to="/batches" className="text-xs font-medium text-brand-700 flex items-center gap-1 hover:underline">
            View all <ArrowRight size={12} />
          </Link>
        }
      />
      <div className="divide-y divide-border">
        {priority.map((b) => (
          <Link
            key={b.id}
            to={`/batches/${b.id}`}
            className="flex items-center gap-4 py-3 first:pt-0 last:pb-0 hover:bg-bg/60 -mx-2 px-2 rounded-lg transition-colors"
          >
            <FreshnessRing score={b.freshness} size={44} strokeWidth={5} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-ink font-mono">{b.id}</p>
                <span className="text-xs text-muted">{b.produce}</span>
              </div>
              <p className="text-xs text-muted mt-0.5">{formatKg(b.quantityKg)} · {formatDays(b.shelfLifeDays)} left</p>
            </div>
            <Badge tone={spoilageTier(b.spoilageRisk)}>{tierLabel[spoilageTier(b.spoilageRisk)]}</Badge>
          </Link>
        ))}
      </div>
    </Card>
  );
}
