export default function Loader({ label = "Loading" }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted gap-3">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 rounded-full border-2 border-brand-100" />
        <div className="absolute inset-0 rounded-full border-2 border-brand-700 border-t-transparent animate-spin" />
      </div>
      <span className="text-sm">{label}</span>
    </div>
  );
}
