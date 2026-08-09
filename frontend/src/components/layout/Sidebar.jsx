import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ScanLine,
  Boxes,
  ListChecks,
  QrCode,
  Sparkles,
} from "lucide-react";
import { NAV_ITEMS } from "../../utils/constants";
import appleLogo from "../../assets/produce/green_apple.jpg";
import { Bell } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

const iconMap = {
  LayoutDashboard,
  ScanLine,
  Boxes,
  ListChecks,
  QrCode,
  Sparkles,
};

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <header className="w-full bg-brand-900 border-b border-white/10 flex items-center justify-between px-6 py-3">

  {/* Left Logo */}
  <div className="flex items-center gap-3">
    <img
      src={appleLogo}
      alt="Taza Logo"
      className="w-10 h-10 rounded-full object-cover"
    />

    <div>
      <h1 className="text-white font-bold text-lg">Taza</h1>
      <p className="text-brand-100/70 text-xs">
        Fresh Intelligence
      </p>
    </div>
  </div>

  {/* Center Navigation */}
  <nav className="flex items-center gap-2">
    {NAV_ITEMS.map((item) => {
      const Icon = iconMap[item.icon];
      const isActive =
        item.path === "/"
          ? location.pathname === "/"
          : location.pathname.startsWith(item.path);

      return (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === "/"}
          className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/10"
        >
          {isActive && (
            <motion.div
              layoutId="navbar-active-pill"
              className="absolute inset-0 bg-white/15 rounded-lg"
            />
          )}

          <span
            className={`relative flex items-center gap-2 ${
              isActive
                ? "text-white"
                : "text-brand-100/70 hover:text-white"
            }`}
          >
            <Icon size={17} />
            {t(item.labelKey)}
          </span>
        </NavLink>
      );
    })}
  </nav>

  {/* Right Controls */}
  <div className="flex items-center gap-3">
    <LanguageSwitcher />

    <button className="relative w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
      <Bell size={16} />
      <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full bg-red-500" />
    </button>

    <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold text-sm">
      OP
    </div>
  </div>

</header>
  );
}