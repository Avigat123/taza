import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, Bell } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar({ title, subtitle }) {
  const { t } = useTranslation();

  return (
    <header className="flex flex-col gap-4 p-4 bg-white border-b border-border">

      {/* Top Section */}
      <motion.div
        key={title}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <h1 className="text-2xl font-bold text-ink">{title}</h1>

        {subtitle && (
          <p className="text-sm text-muted mt-1">
            {subtitle}
          </p>
        )}
      </motion.div>

      {/* Bottom Section */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        {/* Search */}
        <div className="flex items-center gap-2 bg-bg border border-border rounded-lg px-3 py-2 w-full sm:w-72 transition-colors focus-within:border-brand-300">
          <Search size={15} className="text-muted" />
          <input
            type="text"
            placeholder={t("common.searchPlaceholder")}
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted"
          />
        </div>

        {/* Right Controls */}
       

      </div>
    </header>
  );
}