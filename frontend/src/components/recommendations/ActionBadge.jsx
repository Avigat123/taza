import { useTranslation } from "react-i18next";
import { ArrowRightCircle, Truck, Tag, Recycle, Eye } from "lucide-react";

const ACTION_META = {
  "Sell locally": { icon: ArrowRightCircle, tone: "text-brand-700 bg-brand-50" },
  "Ship to high-demand location": { icon: Truck, tone: "text-brand-700 bg-brand-50" },
  "Discount now": { icon: Tag, tone: "text-risk-medium bg-[#FBF1DF]" },
  "Redirect to processing": { icon: Recycle, tone: "text-risk-high bg-[#FBEAE6]" },
  Monitor: { icon: Eye, tone: "text-muted bg-bg" },
};

export default function ActionBadge({ action }) {
  const { t } = useTranslation();
  const meta = ACTION_META[action] || ACTION_META.Monitor;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta.tone}`}>
      <Icon size={13} />
      {t(`common.actions.${action}`, action)}
    </span>
  );
}
