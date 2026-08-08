import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PageContainer from "../components/layout/PageContainer";
import QRScanner from "../components/traceability/QRScanner";
import BatchPassport from "../components/traceability/BatchPassport";
import Loader from "../components/ui/Loader";
import { getBatchPassport } from "../api/traceability";

export default function Traceability() {
  const [searchParams] = useSearchParams();
  const initialBatch = searchParams.get("batch");
  const [passport, setPassport] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleScan(batchId) {
    setLoading(true);
    const data = await getBatchPassport(batchId);
    setPassport(data);
    setLoading(false);
  }

  useEffect(() => {
    if (initialBatch) handleScan(initialBatch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer title="Traceability" subtitle="Scan a batch's digital passport">
      <div className="space-y-5">
        <QRScanner onScan={handleScan} />
        {loading && <Loader label="Fetching batch passport..." />}
        {!loading && passport && <BatchPassport passport={passport} />}
      </div>
    </PageContainer>
  );
}
