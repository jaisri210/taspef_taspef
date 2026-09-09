// server/src/controllers/eventController.js
import Event from "../models/Event.js";
import { toUploadUrl } from "../middleware/upload.js";

export const listEvents = async (req, res, next) => {
  try {
    const events = await Event.find({}).sort({ startAt: 1 });
    res.json(events);
  } catch (err) {
    next(err);
  }
};

export const getEvent = async (req, res, next) => {
  try {
    const e = await Event.findById(req.params.id);
    if (!e) return res.status(404).json({ message: "Event not found" });
    res.json(e);
  } catch (err) {
    next(err);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const ev = await Event.create({
      title: req.body.title,
      description: req.body.description,
      startAt: req.body.startAt ? new Date(req.body.startAt) : undefined,
      endAt: req.body.endAt ? new Date(req.body.endAt) : undefined,
      location: req.body.location,
      image: toUploadUrl(req.file),
      createdBy: req.user?._id,
    });
    res.status(201).json(ev);
  } catch (err) {
    next(err);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const e = await Event.findById(req.params.id);
    if (!e) return res.status(404).json({ message: "Event not found" });
    Object.assign(e, req.body);
    if (req.file) e.image = toUploadUrl(req.file);
    await e.save();
    res.json(e);
  } catch (err) {
    next(err);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};
