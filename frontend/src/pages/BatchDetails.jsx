import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import Card, { CardHeader } from "../components/ui/Card";
import FreshnessRing from "../components/ui/FreshnessRing";
import ActionBadge from "../components/recommendations/ActionBadge";
import Loader from "../components/ui/Loader";
import { getBatchById } from "../api/batches";
import { formatKg, formatDays, formatDate } from "../utils/formatting";
import { spoilageTier, tierLabel } from "../utils/risk";

export default function BatchDetails() {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getBatchById(id).then((data) => {
      if (active) {
        setBatch(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <PageContainer title="Batch details">
        <Loader label="Loading batch..." />
      </PageContainer>
    );
  }

  if (!batch) {
    return (
      <PageContainer title="Batch not found">
        <Link to="/batches" className="text-brand-700 text-sm hover:underline">
          ← Back to batches
        </Link>
      </PageContainer>
    );
  }

  const tier = spoilageTier(batch.spoilageRisk);

  return (
    <PageContainer title={batch.id} subtitle={`${batch.produce} · ${formatKg(batch.quantityKg)}`}>
      <Link to="/batches" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-5">
        <ArrowLeft size={14} /> Back to batches
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-1 flex flex-col items-center text-center">
          {/* PHOTO PLACEHOLDER: full-size produce photo for {batch.imageKey} — see PHOTO_PLACEHOLDERS.txt */}
          <div className="w-full h-40 rounded-lg bg-brand-50 mb-4 flex items-center justify-center text-brand-300 text-xs font-mono">
            {batch.imageKey}
          </div>
          <FreshnessRing score={batch.freshness} size={110} strokeWidth={9} sublabel={tierLabel[tier]} />
          <div className="mt-4">
            <ActionBadge action={batch.action} />
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader title="Batch info" />
            <dl className="grid grid-cols-2 gap-y-4 gap-x-4">
              <Info label="Origin" value={batch.origin} icon={MapPin} />
              <Info label="Harvest date" value={formatDate(batch.harvestDate)} icon={Calendar} />
              <div>
                <dt className="text-xs text-muted">Quantity</dt>
                <dd className="text-sm font-mono font-medium text-ink mt-0.5">{formatKg(batch.quantityKg)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Confidence</dt>
                <dd className="text-sm font-medium text-ink mt-0.5">{batch.confidence}</dd>
              </div>
            </dl>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Card className="text-center">
              <p className="text-xs text-muted">Freshness</p>
              <p className="text-2xl font-mono font-semibold text-ink mt-1">{batch.freshness}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-muted">Shelf life</p>
              <p className="text-2xl font-mono font-semibold text-ink mt-1">{formatDays(batch.shelfLifeDays)}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-muted">Spoilage risk</p>
              <p className="text-2xl font-mono font-semibold text-ink mt-1">{batch.spoilageRisk}%</p>
            </Card>
          </div>

          <Card className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Full traceability</p>
              <p className="text-xs text-muted">View the farm-to-retailer journey for this batch</p>
            </div>
            <Link
              to={`/traceability?batch=${batch.id}`}
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              Open passport →
            </Link>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

function Info({ label, value, icon: Icon }) {
  return (
    <div>
      <dt className="text-xs text-muted flex items-center gap-1">
        <Icon size={11} /> {label}
      </dt>
      <dd className="text-sm font-medium text-ink mt-0.5">{value}</dd>
    </div>
  );
}
