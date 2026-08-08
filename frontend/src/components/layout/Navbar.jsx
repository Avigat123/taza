import { Search, Bell } from "lucide-react";

export default function Navbar({ title, subtitle }) {
  return (
    <header className="h-16 border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-10 flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold text-ink font-display">{title}</h1>
        {subtitle && <p className="text-xs text-muted -mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 bg-bg border border-border rounded-lg px-3 py-1.5 w-64">
          <Search size={15} className="text-muted" />
          <input
            type="text"
            placeholder="Search batch ID..."
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted"
          />
        </div>
        <button className="relative w-9 h-9 rounded-full bg-bg border border-border flex items-center justify-center text-muted hover:text-ink">
          <Bell size={16} />
          <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-risk-high" />
        </button>
        {/* PHOTO PLACEHOLDER: user avatar — see PHOTO_PLACEHOLDERS.txt */}
        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold font-mono">
          OP
        </div>
      </div>
    </header>
  );
}
