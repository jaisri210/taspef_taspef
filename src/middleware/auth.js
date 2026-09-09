// server/src/middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, token missing" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user)
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    if (user.isActive === false)
      return res.status(403).json({ message: "Account is deactivated" });
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth protect error:", err);
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authorized" });
  if (req.user.role !== "admin")
    return res.status(403).json({ message: "Admin only" });
  next();
};
