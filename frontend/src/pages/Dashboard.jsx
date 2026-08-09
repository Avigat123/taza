import { useTranslation } from "react-i18next";
import PageContainer from "../components/layout/PageContainer";
import OverviewCards from "../components/dashboard/OverviewCards";
import FreshnessChart from "../components/dashboard/FreshnessChart";
import WasteChart from "../components/dashboard/WasteChart";
import RiskChart from "../components/dashboard/RiskChart";
import PriorityBatches from "../components/dashboard/PriorityBatches";
import RecentActivity from "../components/dashboard/RecentActivity";
import Loader from "../components/ui/Loader";
import { useDashboard } from "../hooks/useDashboard";
import { useBatches } from "../hooks/useBatches";

export default function Dashboard() {
  const { t } = useTranslation();
  const { summary, freshnessTrend, wasteComparison, riskBreakdown, activity, loading } = useDashboard();
  const { batches, loading: batchesLoading } = useBatches();

  if (loading || batchesLoading) {
    return (
      <PageContainer title={t("dashboard.title")} subtitle={t("dashboard.subtitle")}>
        <Loader label={t("dashboard.loading")} />
      </PageContainer>
    );
  }

  return (
    <PageContainer title={t("dashboard.title")} subtitle={t("dashboard.subtitle")}>
      <div className="space-y-5">
        <OverviewCards summary={summary} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 space-y-5">
            <FreshnessChart data={freshnessTrend} />
            <WasteChart data={wasteComparison} />
          </div>
          <div className="space-y-5">
            <RiskChart data={riskBreakdown} />
            <RecentActivity items={activity} />
          </div>
        </div>

        <PriorityBatches batches={batches} />
      </div>
    </PageContainer>
  );
}
