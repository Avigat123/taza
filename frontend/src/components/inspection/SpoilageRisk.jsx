import Card, { CardHeader } from "../ui/Card";
import Badge from "../ui/Badge";
import { spoilageTier, tierLabel, tierColor } from "../../utils/risk";

const FACTOR_LABELS = {
  visualDefectRisk: "Visual defect risk",
  temperatureStress: "Temperature stress",
  ageRisk: "Age risk",
  storageRisk: "Storage risk",
};

export default function SpoilageRisk({ risk, factors }) {
  const tier = spoilageTier(risk);
  return (
    <Card>
      <CardHeader
        title="Spoilage risk"
        action={<Badge tone={tier}>{tierLabel[tier]}</Badge>}
      />
      <p className="text-3xl font-mono font-semibold text-ink mb-4">{risk}%</p>
      <div className="space-y-2.5">
        {Object.entries(factors).map(([key, value]) => (
          <div key={key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted">{FACTOR_LABELS[key] || key}</span>
              <span className="font-mono text-ink">{value}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-bg overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${value}%`, background: tierColor[spoilageTier(value)] }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
