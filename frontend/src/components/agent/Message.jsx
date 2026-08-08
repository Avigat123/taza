import { Sparkles } from "lucide-react";

export default function Message({ role, text }) {
  const isAgent = role === "agent";
  return (
    <div className={`flex gap-2.5 ${isAgent ? "" : "flex-row-reverse"}`}>
      {isAgent && (
        <div className="w-7 h-7 rounded-full bg-brand-700 text-white flex items-center justify-center shrink-0">
          <Sparkles size={13} />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isAgent ? "bg-bg text-ink rounded-tl-sm" : "bg-brand-700 text-white rounded-tr-sm"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
