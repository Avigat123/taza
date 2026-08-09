import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import Card, { CardHeader } from "../components/ui/Card";
import FreshnessRing from "../components/ui/FreshnessRing";
import ActionBadge from "../components/recommendations/ActionBadge";
import Loader from "../components/ui/Loader";
import { getBatchById } from "../api/batches";
import { formatKg, formatDays, formatDate } from "../utils/formatting";
import { spoilageTier } from "../utils/risk";
import { getProduceImage } from "../data/produceImages";

export default function BatchDetails() {
  const { id } = useParams();
  const { t } = useTranslation();
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
      <PageContainer title={t("nav.batches")}>
        <Loader label={t("common.loading")} />
      </PageContainer>
    );
  }

  if (!batch) {
    return (
      <PageContainer title={t("nav.batches")}>
        <Link to="/batches" className="text-brand-700 text-sm hover:underline">
          ← {t("common.backToBatches")}
        </Link>
      </PageContainer>
    );
  }

  const tier = spoilageTier(batch.spoilageRisk);

  return (
    <PageContainer title={batch.id} subtitle={`${batch.produce} · ${formatKg(batch.quantityKg)}`}>
      <Link to="/batches" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-5">
        <ArrowLeft size={14} /> {t("common.backToBatches")}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card className="h-full flex flex-col items-center text-center">
            <div className="w-full h-40 rounded-lg overflow-hidden mb-4 bg-brand-50">
              {getProduceImage(batch.produce) ? (
                <img
                  src={getProduceImage(batch.produce)}
                  alt={batch.produce}
                  className="w-full h-full object-cover"
                />
              ) : (
                // PHOTO PLACEHOLDER: no photo registered yet for "{batch.produce}" —
                // drop one in src/assets/produce/ and add it to src/data/produceImages.js
                <div className="w-full h-full flex items-center justify-center text-brand-300 text-xs font-mono">
                  {batch.imageKey}
                </div>
              )}
            </div>
            <FreshnessRing score={batch.freshness} size={110} strokeWidth={9} sublabel={t(`common.risk.${tier}`)} />
            <div className="mt-4">
              <ActionBadge action={batch.action} />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="lg:col-span-2 space-y-5"
        >
          <Card>
            <CardHeader title={t("batchDetails.batchInfo")} />
            <dl className="grid grid-cols-2 gap-y-4 gap-x-4">
              <Info label={t("batchDetails.origin")} value={batch.origin} icon={MapPin} />
              <Info label={t("batchDetails.harvestDate")} value={formatDate(batch.harvestDate)} icon={Calendar} />
              <div>
                <dt className="text-xs text-muted">{t("batchDetails.quantity")}</dt>
                <dd className="text-sm font-mono font-medium text-ink mt-0.5">{formatKg(batch.quantityKg)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">{t("common.confidence")}</dt>
                <dd className="text-sm font-medium text-ink mt-0.5">{batch.confidence}</dd>
              </div>
            </dl>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Card className="text-center hover:shadow-pop transition-shadow">
              <p className="text-xs text-muted">{t("batchDetails.freshness")}</p>
              <p className="text-2xl font-mono font-semibold text-ink mt-1">{batch.freshness}</p>
            </Card>
            <Card className="text-center hover:shadow-pop transition-shadow">
              <p className="text-xs text-muted">{t("batchDetails.shelfLife")}</p>
              <p className="text-2xl font-mono font-semibold text-ink mt-1">{formatDays(batch.shelfLifeDays)}</p>
            </Card>
            <Card className="text-center hover:shadow-pop transition-shadow">
              <p className="text-xs text-muted">{t("batchDetails.spoilageRisk")}</p>
              <p className="text-2xl font-mono font-semibold text-ink mt-1">{batch.spoilageRisk}%</p>
            </Card>
          </div>

          <Card className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">{t("batchDetails.fullTraceability")}</p>
              <p className="text-xs text-muted">{t("batchDetails.fullTraceabilityDesc")}</p>
            </div>
            <Link
              to={`/traceability?batch=${batch.id}`}
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              {t("batchDetails.openPassport")} →
            </Link>
          </Card>
        </motion.div>
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
