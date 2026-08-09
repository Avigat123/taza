import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { QrCode, Search } from "lucide-react";
import Card, { CardHeader } from "../ui/Card";
import Button from "../ui/Button";

// SCANNER NOTE: this is a manual batch-ID lookup stand-in for a real camera
// QR scanner (e.g. a react-qr-reader / html5-qrcode integration). Swap the
// input form below for a live camera view once that library is added —
// keep the onScan(batchId) contract the same so BatchPassport doesn't change.
export default function QRScanner({ onScan }) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");

  return (
    <Card className="flex flex-col items-center text-center gap-3">
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center text-brand-700"
      >
        <QrCode size={22} />
      </motion.div>
      <CardHeader title={t("traceability.scanTitle")} subtitle={t("traceability.scanSubtitle")} />
      <div className="flex gap-2 w-full max-w-xs">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("traceability.placeholder")}
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-mono outline-none focus:border-brand-500 transition-colors"
        />
        <Button size="md" icon={Search} onClick={() => value && onScan(value.trim().toUpperCase())}>
          {t("traceability.go")}
        </Button>
      </div>
    </Card>
  );
}
