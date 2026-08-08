import { useState } from "react";
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
import { usePrediction } from "../hooks/usePrediction";

export default function InspectProduce() {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState({ brix: "", temperature: "", humidity: "" });
  const { result, loading, runInspection, reset } = usePrediction();

  function handleSubmit() {
    if (!file) return;
    runInspection(file, quality);
  }

  return (
    <PageContainer title="Inspect produce" subtitle="Upload an image to run the full AI pipeline">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Produce image" />
            <ImageUploader
              onFileSelected={(f) => {
                setFile(f);
                reset();
              }}
              disabled={loading}
            />
          </Card>

          <Card>
            <CardHeader title="Quality parameters" subtitle="Optional — improves prediction accuracy" />
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "brix", label: "Brix (°)" },
                { key: "temperature", label: "Temp (°C)" },
                { key: "humidity", label: "Humidity (%)" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-muted">{f.label}</label>
                  <input
                    type="number"
                    value={quality[f.key]}
                    onChange={(e) => setQuality((q) => ({ ...q, [f.key]: e.target.value }))}
                    className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm font-mono outline-none focus:border-brand-500"
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
            {loading ? "Running AI pipeline..." : "Run inspection"}
          </Button>
        </div>

        <div>
          {loading && (
            <Card className="h-full flex items-center justify-center">
              <Loader label="Analyzing image, freshness, shelf life, and risk..." />
            </Card>
          )}

          {!loading && !result && (
            <Card className="h-full flex items-center justify-center">
              <EmptyState
                icon={ScanLine}
                title="No inspection yet"
                description="Upload a produce image and run the pipeline to see freshness, shelf-life, and spoilage results here."
              />
            </Card>
          )}

          {!loading && result && (
            <div className="space-y-5">
              <DetectionResults result={result} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FreshnessScore score={result.freshness} />
                <ShelfLife days={result.shelfLifeDays} confidence={result.confidence} />
              </div>
              <SpoilageRisk risk={result.spoilageRisk} factors={result.riskFactors} />
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
