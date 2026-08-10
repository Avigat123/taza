import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Languages, Check } from "lucide-react";
import { LANGUAGES } from "../../i18n";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (
        ref.current &&
        !ref.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClick
      );
    };
  }, []);

  const current =
    LANGUAGES.find(
      (language) => language.code === i18n.language
    ) || LANGUAGES[0];

  return (
    <div
      ref={ref}
      className="relative"
      style={{ zIndex: 99999 }}
    >

      {/* LANGUAGE BUTTON */}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="
          flex
          items-center
          justify-center
          w-10
          h-10
          rounded-full
          bg-white
          border
          border-border
          text-muted
          hover:text-ink
          hover:bg-bg
          transition-colors
          cursor-pointer
        "
        aria-label="Change language"
        aria-expanded={open}
      >
        <Languages size={18} />
      </button>


      {/* DROPDOWN */}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              y: -5,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: -5,
              scale: 0.97,
            }}
            transition={{ duration: 0.15 }}
            className="
              absolute
              right-0
              top-full
              mt-2
              w-48
              rounded-xl
              border
              border-border
              bg-white
              shadow-lg
              py-2
            "
            style={{
              zIndex: 100000,
            }}
          >

            {/* TITLE */}

            <div className="px-3 py-2">
              <div className="text-xs font-semibold text-muted uppercase">
                Select Language
              </div>
            </div>


            {/* LANGUAGE OPTIONS */}

            {LANGUAGES.map((lang) => {
              const selected =
                current.code === lang.code;

              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    i18n.changeLanguage(lang.code);
                    setOpen(false);
                  }}
                  className={`
                    w-full
                    flex
                    items-center
                    justify-between
                    px-3
                    py-3
                    text-left
                    text-sm
                    cursor-pointer
                    transition-colors
                    ${
                      selected
                        ? "bg-brand-100 text-brand-700"
                        : "text-ink hover:bg-bg"
                    }
                  `}
                >
                  <span>{lang.nativeLabel}</span>

                  {selected && (
                    <Check
                      size={16}
                      className="text-brand-700"
                    />
                  )}
                </button>
              );
            })}

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}