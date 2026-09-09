// server/src/models/RegisterMember.js
// Backs the public "Register of Members" table (FORM NO VI). Distinct from
// Member.js, which models office-bearer profiles (photo/bio) and isn't yet
// wired to any public page.
import mongoose from "mongoose";

const registerMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    designation: { type: String },
    joiningDate: { type: String }, // stored as entered, e.g. "6/5/2023"
    phone: { type: String },
    subscription: { type: Number },
    order: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.RegisterMember ||
  mongoose.model("RegisterMember", registerMemberSchema);
