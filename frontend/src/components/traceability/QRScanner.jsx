import { useState } from "react";
import { QrCode, Search } from "lucide-react";
import Card, { CardHeader } from "../ui/Card";
import Button from "../ui/Button";

// SCANNER NOTE: this is a manual batch-ID lookup stand-in for a real camera
// QR scanner (e.g. a react-qr-reader / html5-qrcode integration). Swap the
// input form below for a live camera view once that library is added —
// keep the onScan(batchId) contract the same so BatchPassport doesn't change.
export default function QRScanner({ onScan }) {
  const [value, setValue] = useState("");

  return (
    <Card className="flex flex-col items-center text-center gap-3">
      <div className="w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center text-brand-700">
        <QrCode size={22} />
      </div>
      <CardHeader title="Scan a batch passport" subtitle="Or enter a batch ID manually" />
      <div className="flex gap-2 w-full max-w-xs">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. MNG-102"
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-mono outline-none focus:border-brand-500"
        />
        <Button size="md" icon={Search} onClick={() => value && onScan(value.trim().toUpperCase())}>
          Go
        </Button>
      </div>
    </Card>
  );
}
