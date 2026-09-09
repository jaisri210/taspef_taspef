// server/src/models/EMagazine.js
import mongoose from "mongoose";

const EMagazineSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    date: { type: String },
    issueNumber: { type: Number },
    isLatest: { type: Boolean, default: false },
    summary: { type: String },
    fileUrl: { type: String }, // e.g. "uploads/mag-01.pdf"
    coverUrl: { type: String }, // optional: "uploads/covers/mag-01.jpg"
    originalName: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.EMagazine ||
  mongoose.model("EMagazine", EMagazineSchema);
