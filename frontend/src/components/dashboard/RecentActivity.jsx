import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Card, { CardHeader } from "../ui/Card";

export default function RecentActivity({ items }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader title={t("dashboard.recentActivityTitle")} />
      <motion.ul
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="space-y-3.5"
      >
        {items.map((item) => (
          <motion.li
            key={item.id}
            variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
            className="flex gap-3 text-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
            <div>
              <p className="text-ink">{item.text}</p>
              <p className="text-xs text-muted mt-0.5">{item.time}</p>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </Card>
  );
}
