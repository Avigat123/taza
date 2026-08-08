import { tierColor, freshnessTier } from "../../utils/risk";

// The recurring visual motif of the app: a radial "ripeness ring" that
// reads like a produce cross-section. Color travels green -> amber -> red
// as freshness drops, giving every score a consistent, at-a-glance read
// whether it's shown large (hero stat) or tiny (table row).
export default function FreshnessRing({ score = 0, size = 88, strokeWidth = 8, label, sublabel }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const tier = freshnessTier(clamped);
  const color = tierColor[tier];

  return (
    <div className="inline-flex flex-col items-center" role="img" aria-label={`Freshness score ${clamped} out of 100`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E3E7DC"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono font-semibold text-ink" style={{ fontSize: size * 0.24 }}>
            {Math.round(clamped)}
          </span>
          {size >= 70 && <span className="text-[10px] text-muted -mt-0.5">/100</span>}
        </div>
      </div>
      {label && <span className="mt-1.5 text-sm font-medium text-ink">{label}</span>}
      {sublabel && <span className="text-xs text-muted">{sublabel}</span>}
    </div>
  );
}
