// server/src/controllers/emagazineController.js
import EMagazine from "../models/EMagazine.js";
import { toUploadUrl } from "../middleware/upload.js";

export const listEmags = async (req, res, next) => {
  try {
    const items = await EMagazine.find({}).sort({ createdAt: -1 }).lean();
    // convert file paths to full URLs (optional)
    const host = `${req.protocol}://${req.get("host")}`;
    const out = items.map((i) => ({
      ...i,
      fileUrl: i.fileUrl
        ? i.fileUrl.startsWith("http")
          ? i.fileUrl
          : `/${i.fileUrl}`
        : null,
      coverUrl: i.coverUrl
        ? i.coverUrl.startsWith("http")
          ? i.coverUrl
          : `/${i.coverUrl}`
        : null,
    }));
    res.json(out);
  } catch (err) {
    next(err);
  }
};

export const getEmag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await EMagazine.findById(id).lean();
    if (!item) return res.status(404).json({ message: "Not found" });
    item.fileUrl = item.fileUrl
      ? item.fileUrl.startsWith("http")
        ? item.fileUrl
        : `/${item.fileUrl}`
      : null;
    item.coverUrl = item.coverUrl
      ? item.coverUrl.startsWith("http")
        ? item.coverUrl
        : `/${item.coverUrl}`
      : null;
    res.json(item);
  } catch (err) {
    next(err);
  }
};

export const createEmag = async (req, res, next) => {
  try {
    const fileFile = req.files?.file?.[0];
    const coverFile = req.files?.cover?.[0];

    const doc = await EMagazine.create({
      title: req.body.title,
      date: req.body.date,
      issueNumber: req.body.issueNumber ? Number(req.body.issueNumber) : undefined,
      summary: req.body.summary,
      fileUrl: toUploadUrl(fileFile),
      originalName: fileFile?.originalname,
      coverUrl: toUploadUrl(coverFile),
      createdBy: req.user?._id,
    });

    if (req.body.isLatest === "true" || req.body.isLatest === true) {
      await EMagazine.updateMany(
        { _id: { $ne: doc._id } },
        { $set: { isLatest: false } }
      );
      doc.isLatest = true;
      await doc.save();
    }

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

export const updateEmag = async (req, res, next) => {
  try {
    const doc = await EMagazine.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });

    const { isLatest, issueNumber, ...rest } = req.body;
    Object.assign(doc, rest);
    if (issueNumber !== undefined) doc.issueNumber = Number(issueNumber);

    const fileFile = req.files?.file?.[0];
    const coverFile = req.files?.cover?.[0];
    if (fileFile) {
      doc.fileUrl = toUploadUrl(fileFile);
      doc.originalName = fileFile.originalname;
    }
    if (coverFile) doc.coverUrl = toUploadUrl(coverFile);

    await doc.save();

    if (isLatest === "true" || isLatest === true) {
      await EMagazine.updateMany(
        { _id: { $ne: doc._id } },
        { $set: { isLatest: false } }
      );
      doc.isLatest = true;
      await doc.save();
    }

    res.json(doc);
  } catch (err) {
    next(err);
  }
};

export const deleteEmag = async (req, res, next) => {
  try {
    await EMagazine.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};

