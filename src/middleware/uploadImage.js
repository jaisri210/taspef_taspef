// server/src/middleware/uploadImage.js
// Separate multer config for image-only uploads (gallery, covers) with a
// tighter size cap than the general PDF/document upload in upload.js.
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = process.env.UPLOAD_PATH || "uploads";
const uploadsPath = path.resolve(process.cwd(), uploadDir);

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

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

const allowedImageTypes = (
  process.env.ALLOWED_IMAGE_TYPES || "image/jpeg,image/png,image/jpg,image/webp"
).split(",");

const fileFilter = (req, file, cb) => {
  if (allowedImageTypes.includes(file.mimetype)) return cb(null, true);
  return cb(
    new Error(`Invalid file type. Allowed: ${allowedImageTypes.join(", ")}`),
    false
  );
};

const limits = {
  fileSize: parseInt(process.env.IMAGE_MAX_FILE_SIZE || "5242880", 10), // default 5MB
};

const uploadImage = multer({ storage, fileFilter, limits });

export default uploadImage;
