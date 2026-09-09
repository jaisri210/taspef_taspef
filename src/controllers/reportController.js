// server/src/controllers/reportController.js
import Report from "../models/Report.js";
import mongoose from "mongoose";
import { toUploadUrl } from "../middleware/upload.js";

// officials/members/additionalMembers/agenda arrive JSON-encoded (the admin
// form sends them that way regardless of whether the request is multipart,
// since FormData can't carry real arrays/objects).
const JSON_FIELDS = ["officials", "members", "additionalMembers", "agenda"];
const parseListFields = (body) => {
  const out = { ...body };
  for (const field of JSON_FIELDS) {
    if (typeof out[field] === "string") {
      try {
        out[field] = JSON.parse(out[field]);
      } catch {
        out[field] = [];
      }
    }
  }
  return out;
};

export const listReports = async (req, res, next) => {
  try {
    const reports = await Report.find({}).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    next(err);
  }
};

export const getReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    let r = null;
    if (mongoose.Types.ObjectId.isValid(id)) r = await Report.findById(id);
    if (!r) r = await Report.findOne({ slug: id });
    if (!r) return res.status(404).json({ message: "Report not found" });
    res.json(r);
  } catch (err) {
    next(err);
  }
};

export const createReport = async (req, res, next) => {
  try {
    const body = parseListFields(req.body);
    const r = await Report.create({
      title: body.title,
      date: body.date,
      time: body.time,
      venue: body.venue,
      summary: body.summary,
      content: body.content,
      officials: body.officials,
      members: body.members,
      additionalMembers: body.additionalMembers,
      agenda: body.agenda,
      fileUrl: toUploadUrl(req.file),
      originalName: req.file?.originalname,
      slug: body.slug,
      createdBy: req.user?._id,
    });
    res.status(201).json(r);
  } catch (err) {
    next(err);
  }
};

export const updateReport = async (req, res, next) => {
  try {
    const r = await Report.findById(req.params.id);
    if (!r) return res.status(404).json({ message: "Report not found" });
    Object.assign(r, parseListFields(req.body));
    if (req.file) {
      r.fileUrl = toUploadUrl(req.file);
      r.originalName = req.file.originalname;
    }
    await r.save();
    res.json(r);
  } catch (err) {
    next(err);
  }
};

export const deleteReport = async (req, res, next) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};
