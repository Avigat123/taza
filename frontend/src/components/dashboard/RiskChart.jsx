import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Card, { CardHeader } from "../ui/Card";
import { tierColor } from "../../utils/risk";

export default function RiskChart({ data }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardHeader title={t("dashboard.riskChartTitle")} subtitle={t("dashboard.riskChartSubtitle")} />
      <div className="flex items-center gap-6">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
              {data.map((entry) => (
                <Cell key={entry.tier} fill={tierColor[entry.tier]} stroke="none" />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E3E7DC", fontSize: 13 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2 shrink-0">
          {data.map((entry) => (
            <div key={entry.tier} className="flex items-center gap-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: tierColor[entry.tier] }} />
              <span className="text-muted">{t(`common.risk.${entry.tier}`)}</span>
              <span className="font-mono font-medium text-ink">{entry.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
