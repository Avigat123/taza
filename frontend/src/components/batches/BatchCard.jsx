import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Card from "../ui/Card";
import FreshnessRing from "../ui/FreshnessRing";
import BatchStatus from "./BatchStatus";
import { formatKg, formatDays } from "../../utils/formatting";
import { getProduceImage } from "../../data/produceImages";

export default function BatchCard({ batch }) {
  const { t } = useTranslation();
  const image = getProduceImage(batch.produce);

  return (
    <Link to={`/batches/${batch.id}`}>
      <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className="h-full">
        <Card className="hover:shadow-pop transition-shadow h-full flex flex-col">
          <div className="w-full h-28 rounded-lg overflow-hidden mb-4 bg-brand-50">
            {image ? (
              <img src={image} alt={batch.produce} className="w-full h-full object-cover" />
            ) : (
              // PHOTO PLACEHOLDER: no photo registered yet for "{batch.produce}" —
              // drop one in src/assets/produce/ and add it to src/data/produceImages.js
              <div className="w-full h-full flex items-center justify-center text-brand-300 text-xs font-mono">
                {batch.imageKey}
              </div>
            )}
          </div>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-sm font-semibold text-ink">{batch.id}</p>
              <p className="text-xs text-muted">{batch.produce} · {formatKg(batch.quantityKg)}</p>
            </div>
            <FreshnessRing score={batch.freshness} size={48} strokeWidth={5} />
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <span className="text-xs text-muted">
              {formatDays(batch.shelfLifeDays)} {t("common.daysLeft")}
            </span>
            <BatchStatus spoilageRisk={batch.spoilageRisk} />
          </div>
        </Card>
      </motion.div>
    </Link>
  );
}
