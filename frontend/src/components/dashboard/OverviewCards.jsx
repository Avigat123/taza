import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Package, AlertTriangle, ListChecks, Leaf } from "lucide-react";
import Card from "../ui/Card";
import AnimatedCounter from "../ui/AnimatedCounter";
import { formatCurrency } from "../../utils/formatting";

export default function OverviewCards({ summary }) {
  const { t } = useTranslation();
  if (!summary) return null;

  const stats = [
    {
      label: t("dashboard.totalInventory"),
      value: summary.totalInventoryKg,
      suffix: " kg",
      icon: Package,
      tone: "text-brand-700 bg-brand-50",
    },
    {
      label: t("dashboard.atRiskInventory"),
      value: summary.atRiskInventoryKg,
      suffix: " kg",
      icon: AlertTriangle,
      tone: "text-risk-high bg-[#FBEAE6]",
    },
    {
      label: t("dashboard.priorityBatchesStat"),
      value: summary.priorityBatches,
      suffix: "",
      icon: ListChecks,
      tone: "text-risk-medium bg-[#FBF1DF]",
    },
    {
      label: t("dashboard.wasteAvoided"),
      value: summary.estimatedWasteAvoidedKg,
      suffix: ` kg · ${formatCurrency(summary.wasteAvoidedValue)}`,
      icon: Leaf,
      tone: "text-brand-700 bg-brand-50",
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {stats.map((s) => (
        <motion.div
          key={s.label}
          variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Card className="flex items-start justify-between hover:shadow-pop hover:-translate-y-0.5 transition-all duration-200">
            <div>
              <p className="text-xs text-muted">{s.label}</p>
              <p className="text-xl font-semibold font-mono mt-1.5 text-ink">
                <AnimatedCounter value={s.value} />
                {s.suffix}
              </p>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.tone}`}>
              <s.icon size={17} />
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
