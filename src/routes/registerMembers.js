// server/src/routes/registerMembers.js
import express from "express";
import {
  listRegisterMembers,
  getRegisterMember,
  createRegisterMember,
  updateRegisterMember,
  deleteRegisterMember,
} from "../controllers/registerMemberController.js";
import { protect, adminOnly } from "../middleware/auth.js";
const router = express.Router();

router.get("/", listRegisterMembers);
router.get("/:id", getRegisterMember);
router.post("/", protect, adminOnly, createRegisterMember);
router.put("/:id", protect, adminOnly, updateRegisterMember);
router.delete("/:id", protect, adminOnly, deleteRegisterMember);

export default router;
