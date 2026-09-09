// server/src/scripts/seedReports.js
// One-time import of the existing client-side reports.js mock data into
// MongoDB, so switching AGMReports.jsx over to the real API doesn't lose
// the actual meeting minutes that were hardcoded there.
// Usage: npm run seed:reports
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import connectDB from "../config/db.js";
import Report from "../models/Report.js";

dotenv.config();

const DEFAULT_SOURCE = path.resolve(
  process.cwd(),
  "../taspef_client/taspef_client/src/data/reports.js"
);
const sourcePath = process.env.REPORTS_JS_PATH || DEFAULT_SOURCE;

const run = async () => {
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    console.error(
      "Set REPORTS_JS_PATH to the reports.js file if your folders are laid out differently."
    );
    process.exit(1);
  }

  const { default: REPORTS } = await import(pathToFileURL(sourcePath).href);
  await connectDB();

  let created = 0;
  let updated = 0;

  for (const r of REPORTS) {
    const result = await Report.findOneAndUpdate(
      { title: r.title, date: r.date },
      {
        title: r.title,
        date: r.date,
        time: r.time,
        venue: r.venue,
        summary: r.summary,
        officials: r.officials || [],
        members: r.members || [],
        additionalMembers: r.additionalMembers || [],
        agenda: r.agenda || [],
        fileUrl: r.fileUrl || undefined,
        originalName: r.originalName || undefined,
        published: true,
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
