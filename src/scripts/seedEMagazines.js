// server/src/scripts/seedEMagazines.js
// One-time import of the 14 existing Namadhu Vanam issues — the PDFs and
// covers already live as static assets in the client's public folder
// (public/assets/Issue-N.pdf, public/assets/images/i-N.png), previously
// only referenced from a hardcoded array in EMagazines.jsx.
// Usage: npm run seed:emagazines
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import EMagazine from "../models/EMagazine.js";

dotenv.config();

const ISSUE_COUNT = 14;

const run = async () => {
  await connectDB();

  let created = 0;
  let updated = 0;

  for (let n = 1; n <= ISSUE_COUNT; n += 1) {
    const result = await EMagazine.findOneAndUpdate(
      { issueNumber: n },
      {
        title: `Namathu Vanam - Issue ${n}`,
        date: `Year ${2015 + n}`,
        issueNumber: n,
        isLatest: n === ISSUE_COUNT,
        fileUrl: `assets/Issue-${n}.pdf`,
        coverUrl: `assets/images/i-${n}.png`,
        originalName: `Issue-${n}.pdf`,
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
