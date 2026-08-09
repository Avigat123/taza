import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { UploadCloud, Camera, X } from "lucide-react";
import Button from "../ui/Button";

export default function ImageUploader({ onFileSelected, disabled }) {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onFileSelected(file);
  }

  function clear() {
    setPreview(null);
    onFileSelected(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (preview) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative rounded-xl overflow-hidden border border-border"
      >
        {/* PHOTO PLACEHOLDER: this renders the user-selected produce photo at runtime — no static asset needed */}
        <img src={preview} alt="Selected produce" className="w-full h-64 object-cover" />
        <button
          onClick={clear}
          disabled={disabled}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-ink/60 text-white flex items-center justify-center hover:bg-ink/80 transition-colors"
        >
          <X size={15} />
        </button>
      </motion.div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center h-64 gap-3 transition-colors ${
        dragging ? "border-brand-500 bg-brand-50" : "border-border bg-bg"
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
        <UploadCloud size={20} className="text-brand-700" />
      </div>
      <div className="text-center">
        <p className="text-sm text-ink font-medium">{t("inspect.dragDrop")}</p>
        <p className="text-xs text-muted mt-0.5">{t("inspect.dragDropSub")}</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" icon={UploadCloud} onClick={() => inputRef.current?.click()}>
          {t("inspect.browseFiles")}
        </Button>
        <Button size="sm" variant="secondary" icon={Camera} onClick={() => inputRef.current?.click()}>
          {t("inspect.useCamera")}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
