// server/src/index.js
import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";

// Routes (existing)
import authRoutes from "./routes/auth.js";
import postsRoutes from "./routes/posts.js";
import eventsRoutes from "./routes/events.js";
import reportsRoutes from "./routes/reports.js";
import membersRoutes from "./routes/members.js";
import filesRoutes from "./routes/files.js";

// E-Magazine route
import emagRoutes from "./routes/emagazines.js";

// Admin panel routes
import galleryRoutes from "./routes/gallery.js";
import registerMembersRoutes from "./routes/registerMembers.js";
import usersRoutes from "./routes/users.js";
import dashboardRoutes from "./routes/dashboard.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect DB
connectDB();

// Security + parsing + logging
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        frameSrc: ["'self'"],
      },
    },
  }),
);

const clientOrigins = (process.env.CLIENT_URL || "http://localhost:5174").split(
  ",",
);
app.use(cors({ origin: clientOrigins, credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));

// ✅ Serve uploaded PDFs & images publicly (used by E-Magazines)
app.use(
  "/uploads",
  express.static(
    path.join(process.cwd(), process.env.UPLOAD_PATH || "uploads"),
  ),
);

// Mount all API routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/agm-reports", reportsRoutes);
app.use("/api/members", membersRoutes);
app.use("/api/emagazines", emagRoutes);
app.use("/api/files", filesRoutes);

// Admin panel routes
app.use("/api/gallery", galleryRoutes);
app.use("/api/register-members", registerMembersRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true, ts: Date.now() }));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Endpoint not found",
      path: req.originalUrl,
    },
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || "SERVER_ERROR",
      message: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
    },
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Uploads served at /uploads`);
  console.log(`📚 E-Magazines route active at /api/emagazines`);
});
