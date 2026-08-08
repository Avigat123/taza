import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import Card, { CardHeader } from "../ui/Card";

export default function WasteChart({ data }) {
  return (
    <Card>
      <CardHeader title="Waste avoided" subtitle="Expected waste with vs. without AI recommendations (kg)" />
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ left: -20, right: 10 }}>
          <CartesianGrid stroke="#E3E7DC" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#5B6B60" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#5B6B60" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E3E7DC", fontSize: 13 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="withoutAI" name="Without AI" fill="#E3E7DC" radius={[4, 4, 0, 0]} />
          <Bar dataKey="withAI" name="With Taza" fill="#2F7D5A" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
