// server/src/controllers/dashboardController.js
import Report from "../models/Report.js";
import EMagazine from "../models/EMagazine.js";
import GalleryImage from "../models/GalleryImage.js";
import RegisterMember from "../models/RegisterMember.js";
import Event from "../models/Event.js";
import Post from "../models/Post.js";
import User from "../models/User.js";

export const getStats = async (req, res, next) => {
  try {
    const [reports, emagazines, gallery, members, events, posts, users] =
      await Promise.all([
        Report.countDocuments(),
        EMagazine.countDocuments(),
        GalleryImage.countDocuments(),
        RegisterMember.countDocuments(),
        Event.countDocuments(),
        Post.countDocuments(),
        User.countDocuments(),
      ]);

    const recentOf = async (Model, type, titleField = "title") => {
      const docs = await Model.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select(`${titleField} createdAt`)
        .lean();
      return docs.map((d) => ({
        type,
        id: d._id,
        title: d[titleField],
        createdAt: d.createdAt,
      }));
    };

    const recent = (
      await Promise.all([
        recentOf(Report, "AGM Report"),
        recentOf(EMagazine, "E-Magazine"),
        recentOf(Post, "Post"),
        recentOf(Event, "Event"),
      ])
    )
      .flat()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);

    res.json({
      counts: { reports, emagazines, gallery, members, events, posts, users },
      recent,
    });
  } catch (err) {
    next(err);
  }
};
