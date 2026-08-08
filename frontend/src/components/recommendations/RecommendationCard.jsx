import { Link } from "react-router-dom";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import ActionBadge from "./ActionBadge";
import { formatKg } from "../../utils/formatting";

export default function RecommendationCard({ rec }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <Link to={`/batches/${rec.batchId}`} className="font-mono text-sm font-semibold text-ink hover:underline">
            {rec.batchId}
          </Link>
          <p className="text-xs text-muted">{rec.produce} · {formatKg(rec.quantityKg)}</p>
        </div>
        <Badge tone={rec.urgency}>{rec.urgency === "high" ? "Urgent" : rec.urgency === "medium" ? "Soon" : "Routine"}</Badge>
      </div>
      <ActionBadge action={rec.action} />
      <p className="text-sm text-muted leading-relaxed">{rec.reason}</p>
    </Card>
  );
}
