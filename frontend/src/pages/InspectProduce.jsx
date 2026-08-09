import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine } from "lucide-react";
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
import { usePrediction } from "../hooks/usePrediction";

export default function InspectProduce() {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState({ brix: "", temperature: "", humidity: "" });
  const { result, loading, runInspection, reset } = usePrediction();

  function handleSubmit() {
    if (!file) return;
    runInspection(file, quality);
  }

  const qualityFields = [
    { key: "brix", label: "Brix (°)" },
    { key: "temperature", label: "Temp (°C)" },
    { key: "humidity", label: "Humidity (%)" },
  ];

  return (
    <PageContainer title={t("inspect.title")} subtitle={t("inspect.subtitle")}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
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
            disabled={!file || loading}
            onClick={handleSubmit}
          >
            {loading ? t("inspect.runningPipeline") : t("inspect.runInspection")}
          </Button>
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageContainer>
  );
}
