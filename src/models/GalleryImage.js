// server/src/models/GalleryImage.js
import mongoose from "mongoose";

const galleryImageSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true }, // path under /uploads
    category: { type: String, required: true, index: true }, // e.g. wild_life, meetings, new_arrivals
    caption: { type: String },
    order: { type: Number, default: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.GalleryImage ||
  mongoose.model("GalleryImage", galleryImageSchema);
