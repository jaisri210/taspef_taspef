// server/src/routes/auth.js
import express from "express";
import { login, me } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { loginRateLimit } from "../middleware/rateLimit.js";
const router = express.Router();

// There is no public self-service registration route — admin accounts are
// created via `npm run seed:admin` or by an existing admin through
// POST /api/users.
router.post("/login", loginRateLimit(), login);
router.get("/me", protect, me);

export default router;
