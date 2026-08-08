import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Card, { CardHeader } from "../ui/Card";

export default function FreshnessChart({ data }) {
  return (
    <Card>
      <CardHeader title="Average freshness" subtitle="Across all active batches, last 7 days" />
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ left: -20, right: 10 }}>
          <CartesianGrid stroke="#E3E7DC" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#5B6B60" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#5B6B60" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: "1px solid #E3E7DC", fontSize: 13 }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Line
            type="monotone"
            dataKey="avgFreshness"
            stroke="#2F7D5A"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#2F7D5A" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
