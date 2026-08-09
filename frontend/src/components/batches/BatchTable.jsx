import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import FreshnessRing from "../ui/FreshnessRing";
import BatchStatus from "./BatchStatus";
import { formatKg, formatDays } from "../../utils/formatting";

export default function BatchTable({ batches }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const columns = [
    t("batches.table.batch"),
    t("batches.table.produce"),
    t("batches.table.quantity"),
    t("batches.table.freshness"),
    t("batches.table.shelfLife"),
    t("batches.table.risk"),
    t("batches.table.action"),
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            {columns.map((c) => (
              <th key={c} className="px-4 py-3 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {batches.map((b, i) => (
            <motion.tr
              key={b.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, delay: i * 0.02 }}
              onClick={() => navigate(`/batches/${b.id}`)}
              className="border-b border-border last:border-0 hover:bg-bg/60 cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 font-mono font-medium text-ink">{b.id}</td>
              <td className="px-4 py-3 text-muted">{b.produce}</td>
              <td className="px-4 py-3 font-mono text-ink">{formatKg(b.quantityKg)}</td>
              <td className="px-4 py-3">
                <FreshnessRing score={b.freshness} size={34} strokeWidth={4} />
              </td>
              <td className="px-4 py-3 font-mono text-ink">{formatDays(b.shelfLifeDays)}</td>
              <td className="px-4 py-3">
                <BatchStatus spoilageRisk={b.spoilageRisk} />
              </td>
              <td className="px-4 py-3 text-muted">{t(`common.actions.${b.action}`, b.action)}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
