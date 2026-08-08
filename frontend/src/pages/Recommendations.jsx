import PageContainer from "../components/layout/PageContainer";
import RecommendationCard from "../components/recommendations/RecommendationCard";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import { ListChecks } from "lucide-react";
import { useRecommendations } from "../hooks/useRecommendations";

export default function Recommendations() {
  const { recommendations, loading } = useRecommendations();

  return (
    <PageContainer title="Recommendations" subtitle="AI-generated actions to reduce waste">
      {loading && <Loader label="Generating recommendations..." />}

      {!loading && recommendations.length === 0 && (
        <EmptyState
          icon={ListChecks}
          title="No recommendations right now"
          description="All batches are within healthy freshness and risk ranges."
        />
      )}

      {!loading && recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} rec={rec} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
