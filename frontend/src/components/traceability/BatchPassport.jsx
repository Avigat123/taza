import Card, { CardHeader } from "../ui/Card";
import FreshnessRing from "../ui/FreshnessRing";
import SupplyChainTimeline from "./SupplyChainTimeline";
import { QrCode } from "lucide-react";

export default function BatchPassport({ passport }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card className="lg:col-span-1 flex flex-col items-center text-center">
        <CardHeader title="Digital passport" subtitle={passport.batchId} />
        {/* PHOTO PLACEHOLDER: generated QR code image for this batch's passport URL — see PHOTO_PLACEHOLDERS.txt */}
        <div className="w-40 h-40 rounded-xl bg-bg border border-border flex items-center justify-center text-muted mb-4">
          <QrCode size={64} strokeWidth={1} />
        </div>
        <FreshnessRing score={passport.freshness} size={72} strokeWidth={7} />
        <p className="text-xs text-muted mt-3">
          {passport.shelfLifeDays} days shelf life · {passport.spoilageRisk}% spoilage risk
        </p>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Supply-chain journey" subtitle={`Farm → Retailer for ${passport.produce}`} />
        <SupplyChainTimeline stages={passport.stages} />
      </Card>
    </div>
  );
}
