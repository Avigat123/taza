import { Package, AlertTriangle, ListChecks, Leaf } from "lucide-react";
import Card from "../ui/Card";
import { formatKg, formatCurrency } from "../../utils/formatting";

export default function OverviewCards({ summary }) {
  if (!summary) return null;

  const stats = [
    {
      label: "Total inventory",
      value: formatKg(summary.totalInventoryKg),
      icon: Package,
      tone: "text-brand-700 bg-brand-50",
    },
    {
      label: "At-risk inventory",
      value: formatKg(summary.atRiskInventoryKg),
      icon: AlertTriangle,
      tone: "text-risk-high bg-[#FBEAE6]",
    },
    {
      label: "Priority batches",
      value: summary.priorityBatches,
      icon: ListChecks,
      tone: "text-risk-medium bg-[#FBF1DF]",
    },
    {
      label: "Waste avoided (est.)",
      value: `${formatKg(summary.estimatedWasteAvoidedKg)} · ${formatCurrency(summary.wasteAvoidedValue)}`,
      icon: Leaf,
      tone: "text-brand-700 bg-brand-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted">{s.label}</p>
            <p className="text-xl font-semibold font-mono mt-1.5 text-ink">{s.value}</p>
          </div>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.tone}`}>
            <s.icon size={17} />
          </div>
        </Card>
      ))}
    </div>
  );
}
