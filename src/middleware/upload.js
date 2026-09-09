// server/src/middleware/upload.js
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload directory (configurable via .env)
const uploadDir = process.env.UPLOAD_PATH || "uploads";
const uploadsPath = path.resolve(process.cwd(), uploadDir);

// Ensure uploads directory exists
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log(`✅ Created uploads directory: ${uploadsPath}`);
}

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath);
  },
  filename: (req, file, cb) => {
    const sanitized = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/_{2,}/g, "_");
    const ext = path.extname(sanitized);
    const base = path.basename(sanitized, ext).slice(0, 120);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}-${unique}${ext}`);
  },
});

// File filter and limits
const allowed = (
  process.env.ALLOWED_FILE_TYPES || "application/pdf,image/jpeg,image/png"
).split(",");
const fileFilter = (req, file, cb) => {
  if (allowed.includes(file.mimetype)) return cb(null, true);
  return cb(
    new Error(`Invalid file type. Allowed: ${allowed.join(", ")}`),
    false
  );
};

const limits = {
  fileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10), // default 10MB
};

const upload = multer({ storage, fileFilter, limits });

// Multer error handler middleware (use after upload in route)
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({
          success: false,
          error: { code: "FILE_TOO_LARGE", message: "File size exceeds limit" },
        });
    }
    return res
      .status(400)
      .json({
        success: false,
        error: { code: "UPLOAD_ERROR", message: err.message },
      });
  }
  if (err)
    return res
      .status(400)
      .json({
        success: false,
        error: { code: "INVALID_FILE", message: err.message },
      });
  next();
};

// Builds the public URL path for an uploaded file. Deliberately ignores
// req.file.path (an absolute filesystem path) — it would leak server
// directory structure and doesn't resolve to anything over HTTP. The
// static mount is always at "/uploads" regardless of UPLOAD_PATH's actual
// value on disk, so that's what every stored fileUrl should start with.
export const toUploadUrl = (file) => (file ? `uploads/${file.filename}` : undefined);

export default upload;
