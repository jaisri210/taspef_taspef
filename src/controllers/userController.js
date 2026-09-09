// server/src/controllers/userController.js
import User from "../models/User.js";

export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

// Admin-only creation of another admin/editor account. There is no public
// self-service registration route for this project.
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });
    const user = await User.create({
      name,
      email,
      password,
      role: role === "admin" ? "admin" : "user",
    });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (err) {
    next(err);
  }
};

// Toggle role / active status. Password changes are out of scope here —
// use a dedicated reset flow if that's needed later.
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.role !== undefined) {
      user.role = req.body.role === "admin" ? "admin" : "user";
    }
    if (req.body.isActive !== undefined) {
      if (String(user._id) === String(req.user._id) && req.body.isActive === false) {
        return res.status(400).json({ message: "You cannot deactivate your own account" });
      }
      user.isActive = !!req.body.isActive;
    }
    await user.save();
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
  } catch (err) {
    next(err);
  }
};
