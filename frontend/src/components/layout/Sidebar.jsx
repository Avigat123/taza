import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ScanLine,
  Boxes,
  ListChecks,
  QrCode,
  Sparkles,
  Leaf,
} from "lucide-react";
import { NAV_ITEMS } from "../../utils/constants";

const iconMap = {
  LayoutDashboard,
  ScanLine,
  Boxes,
  ListChecks,
  QrCode,
  Sparkles,
};

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-brand-900 text-white flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-brand-300/90 flex items-center justify-center">
          <Leaf size={16} className="text-brand-900" />
        </div>
        <div>
          <div className="font-display text-lg leading-none">Taza</div>
          <div className="text-[10px] text-brand-300 tracking-wide uppercase mt-0.5">
            Fresh Intelligence
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-brand-100/70 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={17} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-white/10 text-xs text-brand-100/60">
        <p>PHOTO PLACEHOLDER</p>
        <p className="text-brand-100/40">Warehouse partner logo — see PHOTO_PLACEHOLDERS.txt</p>
      </div>
    </aside>
  );
}
