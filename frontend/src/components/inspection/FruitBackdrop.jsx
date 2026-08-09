import { motion } from "framer-motion";
import { PRODUCE_GALLERY } from "../../data/produceImages";

// FruitBackdrop — a soft, blurred scatter of real produce photos behind
// empty/loading states, to reinforce "this app identifies fruit" without
// competing with foreground content. Kept low-opacity and blurred so it
// reads as texture, not as competing imagery.
export default function FruitBackdrop() {
  const positions = [
    { top: "6%", left: "8%", size: 92, rotate: -8 },
    { top: "58%", left: "4%", size: 76, rotate: 10 },
    { top: "12%", left: "78%", size: 88, rotate: 6 },
    { top: "62%", left: "80%", size: 100, rotate: -6 },
    { top: "36%", left: "42%", size: 72, rotate: 4 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {PRODUCE_GALLERY.map((item, i) => {
        const pos = positions[i % positions.length];
        return (
          <motion.div
            key={item.name}
            className="absolute rounded-full overflow-hidden opacity-[0.10] blur-[1px]"
            style={{ top: pos.top, left: pos.left, width: pos.size, height: pos.size }}
            initial={{ opacity: 0, rotate: pos.rotate - 4 }}
            animate={{ opacity: 0.1, rotate: pos.rotate }}
            transition={{ duration: 1.2, delay: i * 0.1, ease: "easeOut" }}
          >
            <img src={item.src} alt="" className="w-full h-full object-cover" />
          </motion.div>
        );
      })}
    </div>
  );
}
