// server/src/scripts/seedRegisterMembers.js
// One-time import of the existing client-side members.json register into
// MongoDB, so the admin panel has real starting data instead of an empty
// list. Safe to re-run — upserts by name, doesn't duplicate.
// Usage: npm run seed:members
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import connectDB from "../config/db.js";
import RegisterMember from "../models/RegisterMember.js";

dotenv.config();

const DEFAULT_SOURCE = path.resolve(
  process.cwd(),
  "../taspef_client/taspef_client/src/data/members.json"
);
const sourcePath = process.env.MEMBERS_JSON_PATH || DEFAULT_SOURCE;

const run = async () => {
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    console.error(
      "Set MEMBERS_JSON_PATH to the members.json file if your folders are laid out differently."
    );
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));
  await connectDB();

  let created = 0;
  let updated = 0;

  for (const [index, m] of raw.entries()) {
    const result = await RegisterMember.findOneAndUpdate(
      { name: m.name },
      {
        name: m.name,
        designation: m.designation,
        joiningDate: m.joining_date || m.joiningDate,
        phone: m.phone ? String(m.phone) : undefined,
        subscription: m.subscription,
        order: m.id ?? index,
      },
      { upsert: true, new: true, includeResultMetadata: true }
    );
    if (result.lastErrorObject?.updatedExisting) updated += 1;
    else created += 1;
  }

  console.log(`✅ Import complete — ${created} created, ${updated} updated.`);
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
