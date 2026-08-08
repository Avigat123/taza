import Card, { CardHeader } from "../ui/Card";

export default function DetectionResults({ result }) {
  const rows = [
    { label: "Produce type", value: result.produce },
    { label: "Ripeness", value: `${result.ripeness}%` },
    { label: "Visible defects", value: result.visibleDefects },
    { label: "Surface quality", value: result.surfaceQuality },
    { label: "Visual quality score", value: `${result.visualQualityScore}/100` },
  ];

  return (
    <Card>
      <CardHeader title="Computer vision detection" subtitle="From uploaded image" />
      <dl className="grid grid-cols-2 gap-y-3 gap-x-4">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="text-xs text-muted">{r.label}</dt>
            <dd className="text-sm font-medium font-mono text-ink mt-0.5">{r.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
