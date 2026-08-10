/**
 * Upload Middleware
 *
 * Multer config for produce-image uploads used by the "Analyze Batch"
 * flow. Uses memory storage (no disk writes) since images are streamed
 * straight through to the Python AI service — Express never needs to
 * persist them.
 */
import multer from "multer";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per image
const MAX_FILES = 8;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
        return cb(new Error(`Unsupported file type '${file.mimetype}' — images only.`));
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE_BYTES, files: MAX_FILES },
});

// Field name "images" matches what the frontend ImageUploader / analyzeBatch
// FormData appends, and what mlProxy.service.js forwards to Python's
// `images: List[UploadFile] = File(...)` parameter.
export const uploadBatchImages = upload.array("images", MAX_FILES);

export default upload;
