export default function SuggestedQuestions({ questions, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((q) => (
        <button
          key={q}
          onClick={() => onSelect(q)}
          className="text-xs px-3 py-1.5 rounded-full border border-border bg-surface text-muted hover:text-brand-700 hover:border-brand-300 transition-colors"
        >
          {q}
        </button>
      ))}
    </div>
  );
}
