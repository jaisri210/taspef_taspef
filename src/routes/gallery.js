// server/src/routes/gallery.js
import express from "express";
import {
  listGalleryImages,
  getGalleryImage,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  reorderGalleryImages,
} from "../controllers/galleryController.js";
import uploadImage from "../middleware/uploadImage.js";
import { handleMulterError } from "../middleware/upload.js";
import { protect, adminOnly } from "../middleware/auth.js";
const router = express.Router();

router.get("/", listGalleryImages);
router.put("/reorder", protect, adminOnly, reorderGalleryImages);
router.get("/:id", getGalleryImage);
router.post(
  "/",
  protect,
  adminOnly,
  uploadImage.single("image"),
  handleMulterError,
  createGalleryImage
);
router.put(
  "/:id",
  protect,
  adminOnly,
  uploadImage.single("image"),
  handleMulterError,
  updateGalleryImage
);
router.delete("/:id", protect, adminOnly, deleteGalleryImage);

export default router;
