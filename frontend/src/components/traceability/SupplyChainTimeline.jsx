import { motion } from "framer-motion";
import { Check, Clock } from "lucide-react";

export default function SupplyChainTimeline({ stages }) {
  return (
    <motion.ol
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.12 } } }}
      className="relative border-l border-border ml-3 space-y-6"
    >
      {stages.map((s) => {
        const pending = s.date === "Pending";
        return (
          <motion.li
            key={s.stage}
            variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
            transition={{ duration: 0.3 }}
            className="ml-6"
          >
            <span
              className={`absolute -left-[13px] w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                pending ? "bg-bg border-border text-muted" : "bg-brand-700 border-brand-700 text-white"
              }`}
            >
              {pending ? <Clock size={12} /> : <Check size={12} />}
            </span>
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold text-ink">{s.stage}</p>
              <span className="text-xs font-mono text-muted">{s.date === "Pending" ? "Pending" : s.date}</span>
            </div>
            <p className="text-xs text-muted mt-0.5">{s.detail}</p>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}
