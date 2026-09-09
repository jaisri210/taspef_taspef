// server/src/routes/users.js
import express from "express";
import { listUsers, createUser, updateUser } from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/auth.js";
const router = express.Router();

router.use(protect, adminOnly);

router.get("/", listUsers);
router.post("/", createUser);
router.put("/:id", updateUser);

export default router;
