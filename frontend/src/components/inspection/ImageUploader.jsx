import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  Camera,
  X,
  Image as ImageIcon,
  Plus,
} from "lucide-react";

import Button from "../ui/Button";


// ============================================================
// IMAGE UPLOADER
// ============================================================
//
// Supports:
// - Multiple images
// - Drag & drop
// - File picker
// - Camera capture on supported devices
// - Image previews
// - Individual image removal
//
// The parent receives:
// onFileSelected(file)
//
// The parent is responsible for storing the files.
// ============================================================

export default function ImageUploader({
  onFileSelected,
  disabled = false,
  maxFiles = 8,
}) {
  const inputRef = useRef(null);
  const cameraRef = useRef(null);

  const [previews, setPreviews] = useState([]);
  const [dragging, setDragging] = useState(false);


  // ==========================================================
  // CLEAN UP OBJECT URLS
  // ==========================================================

  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        if (preview.url) {
          URL.revokeObjectURL(
            preview.url
          );
        }
      });
    };
  }, [previews]);


  // ==========================================================
  // ADD FILES
  // ==========================================================

  function addFiles(fileList) {
    if (!fileList || disabled) {
      return;
    }

    const incomingFiles =
      Array.from(fileList).filter(
        (file) =>
          file.type?.startsWith("image/")
      );

    if (incomingFiles.length === 0) {
      return;
    }

    const availableSlots =
      maxFiles - previews.length;

    if (availableSlots <= 0) {
      return;
    }

    const filesToAdd =
      incomingFiles.slice(
        0,
        availableSlots
      );

    filesToAdd.forEach((file) => {
      const preview = {
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        url: URL.createObjectURL(file),
      };

      setPreviews((current) => [
        ...current,
        preview,
      ]);

      onFileSelected?.(file);
    });
  }


  // ==========================================================
  // REMOVE IMAGE
  // ==========================================================

  function removeImage(id) {
    if (disabled) {
      return;
    }

    setPreviews((current) => {
      const item = current.find(
        (preview) =>
          preview.id === id
      );

      if (item?.url) {
        URL.revokeObjectURL(
          item.url
        );
      }

      return current.filter(
        (preview) =>
          preview.id !== id
      );
    });

    // The parent controls the actual files.
    // Existing parent implementation handles
    // individual removal separately.
  }


  // ==========================================================
  // DROP
  // ==========================================================

  function handleDrop(event) {
    event.preventDefault();

    if (disabled) {
      return;
    }

    setDragging(false);

    addFiles(
      event.dataTransfer.files
    );
  }


  // ==========================================================
  // DRAG OVER
  // ==========================================================

  function handleDragOver(event) {
    event.preventDefault();

    if (!disabled) {
      setDragging(true);
    }
  }


  // ==========================================================
  // DRAG LEAVE
  // ==========================================================

  function handleDragLeave(event) {
    event.preventDefault();

    setDragging(false);
  }


  // ==========================================================
  // FILE PICKER
  // ==========================================================

  function openFilePicker() {
    if (disabled) {
      return;
    }

    inputRef.current?.click();
  }


  // ==========================================================
  // CAMERA
  // ==========================================================

  function openCamera() {
    if (disabled) {
      return;
    }

    cameraRef.current?.click();
  }


  // ==========================================================
  // INPUT CHANGE
  // ==========================================================

  function handleInputChange(event) {
    addFiles(event.target.files);

    // Allow selecting the same file again later.
    event.target.value = "";
  }


  const canAddMore =
    previews.length < maxFiles;


  return (
    <div className="space-y-4">

      {/* =====================================================
          DROP ZONE
      ===================================================== */}

      {canAddMore && (
        <motion.div
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative
            rounded-xl
            border-2
            border-dashed
            min-h-[250px]
            flex
            flex-col
            items-center
            justify-center
            gap-4
            px-6
            py-8
            transition-all
            duration-200
            ${
              dragging
                ? "border-brand-500 bg-brand-50 scale-[1.01]"
                : "border-border bg-bg hover:border-brand-300"
            }
            ${
              disabled
                ? "opacity-60 cursor-not-allowed"
                : ""
            }
          `}
        >

          {/* Icon */}

          <div
            className={`
              w-14
              h-14
              rounded-full
              flex
              items-center
              justify-center
              transition-colors
              ${
                dragging
                  ? "bg-brand-100 text-brand-700"
                  : "bg-brand-50 text-brand-700"
              }
            `}
          >
            {dragging ? (
              <ImageIcon size={24} />
            ) : (
              <UploadCloud size={24} />
            )}
          </div>


          {/* Text */}

          <div className="text-center">
            <p className="text-sm font-semibold text-ink">
              {dragging
                ? "Drop your images here"
                : "Upload produce images"}
            </p>

            <p className="text-xs text-muted mt-1 max-w-sm">
              Add one or more clear images of the
              produce. Multiple angles can improve
              the visual assessment.
            </p>
          </div>


          {/* Buttons */}

          <div className="flex flex-wrap justify-center gap-2">

            <Button
              type="button"
              size="sm"
              variant="secondary"
              icon={UploadCloud}
              disabled={disabled}
              onClick={openFilePicker}
            >
              Browse files
            </Button>

            <Button
              type="button"
              size="sm"
              variant="secondary"
              icon={Camera}
              disabled={disabled}
              onClick={openCamera}
            >
              Use camera
            </Button>

          </div>


          {/* File information */}

          <p className="text-[11px] text-muted">
            JPG, JPEG, PNG, WEBP · Up to{" "}
            {maxFiles} images
          </p>


          {/* Normal file input */}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={disabled}
            onChange={handleInputChange}
          />


          {/* Camera input */}

          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={disabled}
            onChange={handleInputChange}
          />

        </motion.div>
      )}


      {/* =====================================================
          SELECTED IMAGE COUNT
      ===================================================== */}

      {previews.length > 0 && (
        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-brand-50 text-brand-700 flex items-center justify-center">
              <ImageIcon size={14} />
            </div>

            <div>
              <p className="text-xs font-medium text-ink">
                Images selected
              </p>

              <p className="text-[11px] text-muted">
                {previews.length} of{" "}
                {maxFiles}
              </p>
            </div>
          </div>

          {canAddMore && (
            <button
              type="button"
              onClick={openFilePicker}
              disabled={disabled}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800 disabled:opacity-50"
            >
              <Plus size={13} />
              Add more
            </button>
          )}

        </div>
      )}


      {/* =====================================================
          IMAGE GRID
      ===================================================== */}

      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

          <AnimatePresence>
            {previews.map(
              (preview, index) => (
                <motion.div
                  key={preview.id}
                  initial={{
                    opacity: 0,
                    scale: 0.95,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                  className="relative group aspect-square rounded-xl overflow-hidden border border-border bg-bg"
                >

                  {/* Image */}

                  <img
                    src={preview.url}
                    alt={`Produce image ${
                      index + 1
                    }`}
                    className="w-full h-full object-cover"
                  />


                  {/* Overlay */}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />


                  {/* Image number */}

                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/50 text-white text-[10px] font-medium flex items-center justify-center backdrop-blur-sm">
                    {index + 1}
                  </div>


                  {/* Remove */}

                  <button
                    type="button"
                    onClick={() =>
                      removeImage(
                        preview.id
                      )
                    }
                    disabled={disabled}
                    aria-label={`Remove image ${
                      index + 1
                    }`}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-risk-high disabled:opacity-50"
                  >
                    <X size={14} />
                  </button>


                  {/* Filename */}

                  <div className="absolute bottom-0 left-0 right-0 px-2 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white truncate">
                      {preview.file.name}
                    </p>
                  </div>

                </motion.div>
              )
            )}
          </AnimatePresence>

        </div>
      )}


      {/* =====================================================
          MAX FILE NOTICE
      ===================================================== */}

      {!canAddMore && (
        <div className="rounded-lg bg-bg border border-border px-3 py-2.5">
          <p className="text-xs text-muted text-center">
            Maximum of {maxFiles} images reached.
          </p>
        </div>
      )}

    </div>
  );
}