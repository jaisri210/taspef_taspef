// server/src/controllers/registerMemberController.js
import RegisterMember from "../models/RegisterMember.js";

export const listRegisterMembers = async (req, res, next) => {
  try {
    const members = await RegisterMember.find({}).sort({ order: 1, name: 1 });
    res.json(members);
  } catch (err) {
    next(err);
  }
};

export const getRegisterMember = async (req, res, next) => {
  try {
    const m = await RegisterMember.findById(req.params.id);
    if (!m) return res.status(404).json({ message: "Member not found" });
    res.json(m);
  } catch (err) {
    next(err);
  }
};

export const createRegisterMember = async (req, res, next) => {
  try {
    const m = await RegisterMember.create({
      name: req.body.name,
      designation: req.body.designation,
      joiningDate: req.body.joiningDate,
      phone: req.body.phone,
      subscription: req.body.subscription ? Number(req.body.subscription) : undefined,
      order: req.body.order ? Number(req.body.order) : 0,
      createdBy: req.user?._id,
    });
    res.status(201).json(m);
  } catch (err) {
    next(err);
  }
};

export const updateRegisterMember = async (req, res, next) => {
  try {
    const m = await RegisterMember.findById(req.params.id);
    if (!m) return res.status(404).json({ message: "Member not found" });
    const { subscription, order, ...rest } = req.body;
    Object.assign(m, rest);
    if (subscription !== undefined) m.subscription = Number(subscription);
    if (order !== undefined) m.order = Number(order);
    await m.save();
    res.json(m);
  } catch (err) {
    next(err);
  }
};

export const deleteRegisterMember = async (req, res, next) => {
  try {
    await RegisterMember.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};
