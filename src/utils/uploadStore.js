// server/src/utils/uploadStore.js
// Durable backup of uploaded files in MongoDB (GridFS).
//
// Hosts like Render wipe the local disk on every deploy/restart, so files in
// uploads/ vanish while their DB records (fileUrl: "uploads/x.pdf") live on.
// Every upload is mirrored into GridFS; when a file is missing on disk it is
// restored from there on demand. Disk stays the fast path.
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import mongoose from "mongoose";

export const uploadsDir = path.resolve(
  process.cwd(),
  process.env.UPLOAD_PATH || "uploads"
);

const getBucket = () =>
  new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "upload_store",
  });

/** Copies a file on disk into GridFS under `filename`. */
export async function mirrorFileToStore(filePath, filename, contentType) {
  const bucket = getBucket();
  await pipeline(
    fs.createReadStream(filePath),
    bucket.openUploadStream(filename, { contentType })
  );
}

/**
 * Makes sure uploads/<filename> exists on disk, restoring it from GridFS if
 * needed. Returns true if the file is available afterwards.
 */
export async function ensureOnDisk(filename) {
  const safeName = path.basename(filename);
  const dest = path.join(uploadsDir, safeName);
  if (fs.existsSync(dest)) return true;

  const bucket = getBucket();
  const [stored] = await bucket
    .find({ filename: safeName })
    .sort({ uploadDate: -1 })
    .limit(1)
    .toArray();
  if (!stored) return false;

  // Write to a temp name then rename so concurrent requests never see a
  // half-written file.
  const tmp = `${dest}.${process.pid}.${Date.now()}.tmp`;
  try {
    await pipeline(bucket.openDownloadStream(stored._id), fs.createWriteStream(tmp));
    fs.renameSync(tmp, dest);
  } catch (err) {
    fs.rmSync(tmp, { force: true });
    throw err;
  }
  return true;
}

// Route middleware: after multer has saved the upload(s) to disk, copy them
// into GridFS. A failed mirror fails the request rather than silently
// leaving a file that will disappear on the next deploy.
const mirrorUploads = async (req, res, next) => {
  try {
    const files = [
      ...(req.file ? [req.file] : []),
      ...(Array.isArray(req.files)
        ? req.files
        : Object.values(req.files || {}).flat()),
    ];
    for (const f of files) {
      await mirrorFileToStore(f.path, f.filename, f.mimetype);
    }
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Wraps a multer instance so single/array/fields also mirror to GridFS.
 * Express flattens the returned [multer, mirror] arrays, so routes keep
 * using `upload.single("file")` unchanged.
 */
export function withMirror(multerInstance) {
  return {
    single: (name) => [multerInstance.single(name), mirrorUploads],
    array: (name, max) => [multerInstance.array(name, max), mirrorUploads],
    fields: (spec) => [multerInstance.fields(spec), mirrorUploads],
  };
}
