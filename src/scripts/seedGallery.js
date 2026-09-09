// server/src/scripts/seedGallery.js
// One-time import of the existing client-side gallery.json manifest — the
// photos already live as static assets in the client's public folder
// (public/assets/Gallery/gallery-N.png), previously only referenced from
// that manifest directly.
// Usage: npm run seed:gallery
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import connectDB from "../config/db.js";
import GalleryImage from "../models/GalleryImage.js";

dotenv.config();

const DEFAULT_SOURCE = path.resolve(
  process.cwd(),
  "../taspef_client/taspef_client/src/data/gallery.json"
);
const sourcePath = process.env.GALLERY_JSON_PATH || DEFAULT_SOURCE;

const run = async () => {
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source file not found: ${sourcePath}`);
    console.error(
      "Set GALLERY_JSON_PATH to the gallery.json file if your folders are laid out differently."
    );
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));
  await connectDB();

  let created = 0;
  let updated = 0;

  for (const [index, item] of raw.entries()) {
    const category = Array.isArray(item.tags) ? item.tags[0] : item.tags;
    const imageUrl = `assets/Gallery/${item.file}`;
    const result = await GalleryImage.findOneAndUpdate(
      { imageUrl },
      {
        imageUrl,
        category: category || "uncategorized",
        caption: item.caption || undefined,
        order: index,
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
