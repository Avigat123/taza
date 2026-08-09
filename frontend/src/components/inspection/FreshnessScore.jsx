import { useTranslation } from "react-i18next";
import Card, { CardHeader } from "../ui/Card";
import FreshnessRing from "../ui/FreshnessRing";
import { freshnessTier } from "../../utils/risk";

export default function FreshnessScore({ score }) {
  const { t } = useTranslation();
  const tier = freshnessTier(score);
  return (
    <Card className="flex flex-col items-center text-center">
      <CardHeader title={t("inspect.freshnessScoreTitle")} />
      <FreshnessRing score={score} size={120} strokeWidth={10} sublabel={t(`common.risk.${tier}`)} />
      <p className="text-xs text-muted mt-4 max-w-[220px]">{t("inspect.freshnessScoreDesc")}</p>
    </Card>
  );
}
