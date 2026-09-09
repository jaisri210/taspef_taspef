// server/src/routes/emagazines.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  listEmags,
  getEmag,
  createEmag,
  updateEmag,
  deleteEmag,
} from "../controllers/emagazineController.js";
import { handleMulterError } from "../middleware/upload.js";
import { protect, adminOnly } from "../middleware/auth.js";
const router = express.Router();

// An issue submit carries a PDF (`file`) and an optional cover image
// (`cover`) in one request — validate each field against its own allowed
// MIME types instead of sharing one filter across both.
const uploadDir = process.env.UPLOAD_PATH || "uploads";
const uploadsPath = path.resolve(process.cwd(), uploadDir);
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsPath),
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

const allowedDocTypes = (process.env.ALLOWED_FILE_TYPES || "application/pdf").split(",");
const allowedImageTypes = (
  process.env.ALLOWED_IMAGE_TYPES || "image/jpeg,image/png,image/jpg,image/webp"
).split(",");

const emagUpload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10) },
  fileFilter: (req, file, cb) => {
    const allowed = file.fieldname === "cover" ? allowedImageTypes : allowedDocTypes;
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(new Error(`Invalid file type for "${file.fieldname}". Allowed: ${allowed.join(", ")}`), false);
  },
}).fields([
  { name: "file", maxCount: 1 },
  { name: "cover", maxCount: 1 },
]);

router.get("/", listEmags);
router.get("/:id", getEmag);
router.post("/", protect, adminOnly, emagUpload, handleMulterError, createEmag);
router.put("/:id", protect, adminOnly, emagUpload, handleMulterError, updateEmag);
router.delete("/:id", protect, adminOnly, deleteEmag);

export default router;
