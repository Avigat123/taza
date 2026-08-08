const tones = {
  low: "bg-brand-50 text-brand-700 border-brand-100",
  medium: "bg-[#FBF1DF] text-[#8A5F14] border-[#F0DDAF]",
  high: "bg-[#FBEAE6] text-risk-high border-[#F3CFC6]",
  neutral: "bg-bg text-muted border-border",
  brand: "bg-brand-700 text-white border-brand-700",
};

export default function Badge({ children, tone = "neutral", className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
