import { Clock } from "lucide-react";
import Card, { CardHeader } from "../ui/Card";
import { formatDays } from "../../utils/formatting";
import { shelfLifeUrgency, tierColor } from "../../utils/risk";

export default function ShelfLife({ days, confidence }) {
  const urgency = shelfLifeUrgency(days);
  return (
    <Card>
      <CardHeader title="Estimated remaining shelf life" />
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${tierColor[urgency]}1A`, color: tierColor[urgency] }}
        >
          <Clock size={20} />
        </div>
        <div>
          <p className="text-2xl font-mono font-semibold text-ink">{formatDays(days)}</p>
          <p className="text-xs text-muted">Confidence: {confidence}</p>
        </div>
      </div>
    </Card>
  );
}
