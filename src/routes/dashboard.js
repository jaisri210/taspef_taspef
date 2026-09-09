// server/src/routes/dashboard.js
import express from "express";
import { getStats } from "../controllers/dashboardController.js";
import { protect, adminOnly } from "../middleware/auth.js";
const router = express.Router();

router.get("/stats", protect, adminOnly, getStats);

export default router;
