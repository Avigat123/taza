import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import PageContainer from "../components/layout/PageContainer";
import QRScanner from "../components/traceability/QRScanner";
import BatchPassport from "../components/traceability/BatchPassport";
import Loader from "../components/ui/Loader";
import { getBatchPassport } from "../api/traceability";

export default function Traceability() {
  const { t } = useTranslation();
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
    <PageContainer title={t("traceability.title")} subtitle={t("traceability.subtitle")}>
      <div className="space-y-5">
        <QRScanner onScan={handleScan} />
        {loading && <Loader label={t("traceability.fetching")} />}
        <AnimatePresence>
          {!loading && passport && (
            <motion.div
              key={passport.batchId}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <BatchPassport passport={passport} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageContainer>
  );
}
