import { useTranslation } from "react-i18next";
import Badge from "../ui/Badge";
import { spoilageTier } from "../../utils/risk";

export default function BatchStatus({ spoilageRisk }) {
  const { t } = useTranslation();
  const tier = spoilageTier(spoilageRisk);
  return <Badge tone={tier}>{t(`common.risk.${tier}`)}</Badge>;
}
