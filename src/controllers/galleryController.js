// server/src/controllers/galleryController.js
import GalleryImage from "../models/GalleryImage.js";
import { toUploadUrl } from "../middleware/upload.js";

const withUrl = (doc) => ({
  ...doc,
  imageUrl: doc.imageUrl?.startsWith("http") ? doc.imageUrl : `/${doc.imageUrl}`,
});

export const listGalleryImages = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const items = await GalleryImage.find(filter)
      .sort({ category: 1, order: 1, createdAt: -1 })
      .lean();
    res.json(items.map(withUrl));
  } catch (err) {
    next(err);
  }
};

export const getGalleryImage = async (req, res, next) => {
  try {
    const item = await GalleryImage.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(withUrl(item));
  } catch (err) {
    next(err);
  }
};

export const createGalleryImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }
    const doc = await GalleryImage.create({
      imageUrl: toUploadUrl(req.file),
      category: req.body.category,
      caption: req.body.caption,
      order: req.body.order ? Number(req.body.order) : 0,
      uploadedBy: req.user?._id,
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

export const updateGalleryImage = async (req, res, next) => {
  try {
    const doc = await GalleryImage.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (req.body.category !== undefined) doc.category = req.body.category;
    if (req.body.caption !== undefined) doc.caption = req.body.caption;
    if (req.body.order !== undefined) doc.order = Number(req.body.order);
    if (req.file) doc.imageUrl = toUploadUrl(req.file);
    await doc.save();
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

export const deleteGalleryImage = async (req, res, next) => {
  try {
    await GalleryImage.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};

// body: { order: [{ id, order }, ...] } — bulk update sort position within a category
export const reorderGalleryImages = async (req, res, next) => {
  try {
    const updates = Array.isArray(req.body.order) ? req.body.order : [];
    await Promise.all(
      updates.map(({ id, order }) =>
        GalleryImage.findByIdAndUpdate(id, { order })
      )
    );
    res.json({ message: "Reordered" });
  } catch (err) {
    next(err);
  }
};
