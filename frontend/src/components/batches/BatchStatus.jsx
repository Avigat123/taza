import Badge from "../ui/Badge";
import { spoilageTier, tierLabel } from "../../utils/risk";

export default function BatchStatus({ spoilageRisk }) {
  const tier = spoilageTier(spoilageRisk);
  return <Badge tone={tier}>{tierLabel[tier]}</Badge>;
}
