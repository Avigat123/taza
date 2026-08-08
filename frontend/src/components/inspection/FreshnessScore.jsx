import Card, { CardHeader } from "../ui/Card";
import FreshnessRing from "../ui/FreshnessRing";
import { freshnessTier, tierLabel } from "../../utils/risk";

export default function FreshnessScore({ score }) {
  const tier = freshnessTier(score);
  return (
    <Card className="flex flex-col items-center text-center">
      <CardHeader title="Multimodal freshness score" />
      <FreshnessRing score={score} size={120} strokeWidth={10} sublabel={tierLabel[tier]} />
      <p className="text-xs text-muted mt-4 max-w-[220px]">
        Combines image quality, storage conditions, and batch age into a single estimate.
      </p>
    </Card>
  );
}
