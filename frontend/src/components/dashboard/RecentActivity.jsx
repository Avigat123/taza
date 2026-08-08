import Card, { CardHeader } from "../ui/Card";

export default function RecentActivity({ items }) {
  return (
    <Card>
      <CardHeader title="Recent activity" />
      <ul className="space-y-3.5">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3 text-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
            <div>
              <p className="text-ink">{item.text}</p>
              <p className="text-xs text-muted mt-0.5">{item.time}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
