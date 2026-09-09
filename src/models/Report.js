// server/src/models/Report.js
import mongoose from "mongoose";

const agendaItemSchema = new mongoose.Schema(
  { title: String, resolution: String },
  { _id: false }
);

const reportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, index: true },
  date: String, // display string, e.g. "September 24, 2024"
  time: String,
  venue: String,
  summary: String,
  content: String,
  officials: { type: [String], default: [] },
  members: { type: [String], default: [] },
  additionalMembers: { type: [String], default: [] },
  agenda: { type: [agendaItemSchema], default: [] },
  fileUrl: String, // 'uploads/agm-2024.pdf' or absolute URL
  originalName: String,
  published: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Report", reportSchema);
