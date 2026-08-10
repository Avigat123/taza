import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, Sparkles } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import ImageUploader from "../components/inspection/ImageUploader";
import DetectionResults from "../components/inspection/DetectionResults";
import FreshnessScore from "../components/inspection/FreshnessScore";
import ShelfLife from "../components/inspection/ShelfLife";
import SpoilageRisk from "../components/inspection/SpoilageRisk";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Loader from "../components/ui/Loader";
import EmptyState from "../components/ui/EmptyState";
import FruitBackdrop from "../components/inspection/FruitBackdrop";
import ActionBadge from "../components/recommendations/ActionBadge";
import { usePrediction } from "../hooks/usePrediction";
import { getBatches } from "../api/batches";
import { formatKg } from "../utils/formatting";

export default function InspectProduce() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState({ temperatureC: "", humidityPercent: "", harvestAgeDays: "" });
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState("");
  const [batchesLoading, setBatchesLoading] = useState(true);
  const {
    result,
    loading,
    error,
    runInspection,
    reset,
    insights,
    insightsLoading,
    requestInsights,
  } = usePrediction();

  useEffect(() => {
    let active = true;
    getBatches()
      .then((data) => {
        if (!active) return;
        setBatches(data);
        if (data.length > 0) setBatchId(data[0].id);
      })
      .finally(() => active && setBatchesLoading(false));
    return () => {
      active = false;
    };
  }, []);

  function handleSubmit() {
    if (!file || !batchId) return;
    runInspection(batchId, [file], quality);
  }

  const qualityFields = [
    { key: "temperatureC", label: "Temp (°C)" },
    { key: "humidityPercent", label: "Humidity (%)" },
    { key: "harvestAgeDays", label: "Days since harvest" },
  ];

  return (
    <PageContainer title={t("inspect.title")} subtitle={t("inspect.subtitle")}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Batch" subtitle="Which batch is this image from?" />
            {batchesLoading ? (
              <Loader label={t("common.loading")} />
            ) : batches.length === 0 ? (
              <p className="text-sm text-muted">
                No batches yet — create one from the Batches page first.
              </p>
            ) : (
              <select
                value={batchId}
                onChange={(e) => {
                  setBatchId(e.target.value);
                  reset();
                }}
                disabled={loading}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand-500 transition-colors"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} · {b.produce} · {formatKg(b.quantityKg)}
                  </option>
                ))}
              </select>
            )}
          </Card>

          <Card>
            <CardHeader title={t("inspect.produceImage")} />
            <ImageUploader
              onFileSelected={(f) => {
                setFile(f);
                reset();
              }}
              disabled={loading}
            />
          </Card>

          <Card>
            <CardHeader title={t("inspect.qualityParams")} subtitle={t("inspect.qualityParamsSub")} />
            <div className="grid grid-cols-3 gap-3">
              {qualityFields.map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-muted">{f.label}</label>
                  <input
                    type="number"
                    value={quality[f.key]}
                    onChange={(e) => setQuality((q) => ({ ...q, [f.key]: e.target.value }))}
                    className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm font-mono outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              ))}
            </div>
          </Card>

          <Button
            size="lg"
            icon={ScanLine}
            className="w-full justify-center"
            disabled={!file || !batchId || loading}
            onClick={handleSubmit}
          >
            {loading ? t("inspect.runningPipeline") : t("inspect.runInspection")}
          </Button>
          {error && (
            <p className="text-sm text-risk-high">
              {error.message || "Analysis failed — check that the AI service is running."}
            </p>
          )}
        </div>

        <div>
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="h-full flex items-center justify-center">
                  <Loader label={t("inspect.analyzing")} />
                </Card>
              </motion.div>
            )}

            {!loading && !result && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Card className="relative h-full flex items-center justify-center overflow-hidden">
                  <FruitBackdrop />
                  <EmptyState
                    icon={ScanLine}
                    title={t("inspect.noInspectionTitle")}
                    description={t("inspect.noInspectionDesc")}
                  />
                </Card>
              </motion.div>
            )}

            {!loading && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-5"
              >
                <DetectionResults result={result} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FreshnessScore score={result.freshness} />
                  <ShelfLife days={result.shelfLifeDays} confidence={result.confidence} />
                </div>
                <SpoilageRisk risk={result.spoilageRisk} factors={result.riskFactors} />

                <Card>
                  <CardHeader
                    title="Recommended action"
                    subtitle="From the deterministic decision engine — no AI guesswork"
                    action={<ActionBadge action={result.decision.action} />}
                  />
                  <p className="text-sm text-ink mb-3">{result.decision.reasoning}</p>
                  <dl className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4">
                    <div>
                      <dt className="text-xs text-muted">Expected waste</dt>
                      <dd className="text-sm font-mono font-medium text-ink mt-0.5">
                        {formatKg(result.decision.impact.expected_waste_kg)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted">Estimated recovered value</dt>
                      <dd className="text-sm font-mono font-medium text-ink mt-0.5">
                        ₹{result.decision.impact.estimated_recovered_value.toFixed(2)}
                      </dd>
                    </div>
                  </dl>

                  {!insights && (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Sparkles}
                      disabled={insightsLoading}
                      onClick={() => requestInsights(batchId)}
                    >
                      {insightsLoading ? "Thinking..." : "✨ Get AI Insights"}
                    </Button>
                  )}
                  {insights && (
                    <div className="mt-2 pt-4 border-t border-border">
                      <p className="text-xs text-muted mb-1">
                        AI explanation ({insights.agent_provider || "AI"})
                      </p>
                      <p className="text-sm text-ink">{insights.agent_explanation}</p>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageContainer>
  );
}
