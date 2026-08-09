import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ListChecks } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import RecommendationCard from "../components/recommendations/RecommendationCard";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import { useRecommendations } from "../hooks/useRecommendations";

export default function Recommendations() {
  const { t } = useTranslation();
  const { recommendations, loading } = useRecommendations();

  return (
    <PageContainer title={t("recommendations.title")} subtitle={t("recommendations.subtitle")}>
      {loading && <Loader label={t("recommendations.generating")} />}

      {!loading && recommendations.length === 0 && (
        <EmptyState
          icon={ListChecks}
          title={t("recommendations.noRecsTitle")}
          description={t("recommendations.noRecsDesc")}
        />
      )}

      {!loading && recommendations.length > 0 && (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {recommendations.map((rec) => (
            <motion.div
              key={rec.id}
              variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.35 }}
            >
              <RecommendationCard rec={rec} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </PageContainer>
  );
}
