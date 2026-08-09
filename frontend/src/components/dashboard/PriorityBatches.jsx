import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Card, { CardHeader } from "../ui/Card";
import FreshnessRing from "../ui/FreshnessRing";
import Badge from "../ui/Badge";
import { formatDays, formatKg } from "../../utils/formatting";
import { spoilageTier } from "../../utils/risk";

export default function PriorityBatches({ batches }) {
  const { t } = useTranslation();
  const priority = [...batches].sort((a, b) => a.shelfLifeDays - b.shelfLifeDays).slice(0, 4);

  return (
    <Card>
      <CardHeader
        title={t("dashboard.priorityBatchesTitle")}
        subtitle={t("dashboard.priorityBatchesSubtitle")}
        action={
          <Link to="/batches" className="text-xs font-medium text-brand-700 flex items-center gap-1 hover:underline">
            {t("common.viewAll")} <ArrowRight size={12} />
          </Link>
        }
      />
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        className="divide-y divide-border"
      >
        {priority.map((b) => (
          <motion.div
            key={b.id}
            variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
          >
            <Link
              to={`/batches/${b.id}`}
              className="flex items-center gap-4 py-3 first:pt-0 last:pb-0 hover:bg-bg/60 -mx-2 px-2 rounded-lg transition-colors"
            >
              <FreshnessRing score={b.freshness} size={44} strokeWidth={5} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ink font-mono">{b.id}</p>
                  <span className="text-xs text-muted">{b.produce}</span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {formatKg(b.quantityKg)} · {formatDays(b.shelfLifeDays)} {t("common.daysLeft")}
                </p>
              </div>
              <Badge tone={spoilageTier(b.spoilageRisk)}>{t(`common.risk.${spoilageTier(b.spoilageRisk)}`)}</Badge>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </Card>
  );
}
