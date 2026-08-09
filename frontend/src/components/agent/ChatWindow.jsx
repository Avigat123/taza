import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Send } from "lucide-react";
import Card from "../ui/Card";
import Message from "./Message";
import SuggestedQuestions from "./SuggestedQuestions";
import { mockAgentSuggestions, mockBatches } from "../../data/mockData";

// AGENT INTEGRATION NOTE: replace mockReply() below with a real call to
// POST /api/agent/query (see agent/agent.js + agent/workflow/operations.graph.js
// in the backend). Keep the same { role, text } message shape so this
// component doesn't need to change when the real agent is wired in.
function mockReply(question) {
  const lower = question.toLowerCase();
  if (lower.includes("sell first") || lower.includes("highest risk") || lower.includes("priority")) {
    const worst = [...mockBatches].sort((a, b) => a.shelfLifeDays - b.shelfLifeDays)[0];
    return `${worst.produce} batch ${worst.id} should be prioritized — it has ${worst.shelfLifeDays} days of estimated shelf life remaining and a ${worst.spoilageRisk}% spoilage risk.`;
  }
  if (lower.includes("travel") || lower.includes("ship")) {
    return "Onion batch ONI-009 is the safest to send farther — 14 days of shelf life and only 6% spoilage risk.";
  }
  if (lower.includes("waste")) {
    return "Discounting BAN-021 now and redirecting PAP-033 to processing today would prevent an estimated 45 kg of avoidable waste this week.";
  }
  return "Based on current inventory, I'd focus on batches with shelf life under 2 days first — PAP-033 and BAN-021 need action today.";
}

export default function ChatWindow() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([{ role: "agent", text: t("agent.greeting") }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  function send(text) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "agent", text: mockReply(text) }]);
      setThinking(false);
    }, 900);
  }

  return (
    <Card className="flex flex-col h-[560px]" padded={false}>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Message role={m.role} text={m.text} />
            </motion.div>
          ))}
          {thinking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Message role="agent" text={t("agent.checking")} />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
      <div className="p-4 border-t border-border space-y-3">
        <SuggestedQuestions questions={mockAgentSuggestions} onSelect={send} />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("agent.inputPlaceholder")}
            className="flex-1 rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 transition-colors"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-10 h-10 rounded-lg bg-brand-700 text-white flex items-center justify-center hover:bg-brand-900 shrink-0"
          >
            <Send size={16} />
          </motion.button>
        </form>
      </div>
    </Card>
  );
}
