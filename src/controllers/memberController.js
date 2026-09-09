// server/src/controllers/memberController.js
import Member from "../models/Member.js";
import { toUploadUrl } from "../middleware/upload.js";

export const listMembers = async (req, res, next) => {
  try {
    const members = await Member.find({}).sort({ createdAt: -1 });
    res.json(members);
  } catch (err) {
    next(err);
  }
};

export const getMember = async (req, res, next) => {
  try {
    const m = await Member.findById(req.params.id);
    if (!m) return res.status(404).json({ message: "Member not found" });
    res.json(m);
  } catch (err) {
    next(err);
  }
};

export const createMember = async (req, res, next) => {
  try {
    const m = await Member.create({
      name: req.body.name,
      designation: req.body.designation,
      bio: req.body.bio,
      photo: toUploadUrl(req.file),
      contact: req.body.contact,
    });
    res.status(201).json(m);
  } catch (err) {
    next(err);
  }
};

export const updateMember = async (req, res, next) => {
  try {
    const m = await Member.findById(req.params.id);
    if (!m) return res.status(404).json({ message: "Member not found" });
    Object.assign(m, req.body);
    if (req.file) m.photo = toUploadUrl(req.file);
    await m.save();
    res.json(m);
  } catch (err) {
    next(err);
  }
};

export const deleteMember = async (req, res, next) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};
