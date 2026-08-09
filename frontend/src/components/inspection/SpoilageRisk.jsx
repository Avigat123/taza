import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Card, { CardHeader } from "../ui/Card";
import Badge from "../ui/Badge";
import { spoilageTier, tierColor } from "../../utils/risk";

export default function SpoilageRisk({ risk, factors }) {
  const { t } = useTranslation();
  const tier = spoilageTier(risk);
  return (
    <Card>
      <CardHeader
        title={t("inspect.spoilageRiskTitle")}
        action={<Badge tone={tier}>{t(`common.risk.${tier}`)}</Badge>}
      />
      <p className="text-3xl font-mono font-semibold text-ink mb-4">{risk}%</p>
      <div className="space-y-2.5">
        {Object.entries(factors).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted">{t(`inspect.factors.${key}`)}</span>
              <span className="font-mono text-ink">{value}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-bg overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ background: tierColor[spoilageTier(value)] }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
