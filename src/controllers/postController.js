// server/src/controllers/postController.js
import Post from "../models/Post.js";
import slugify from "slugify";
import { toUploadUrl } from "../middleware/upload.js";

export const listPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({}).sort({ createdAt: -1 }).limit(50);
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

export const getPost = async (req, res, next) => {
  try {
    const p = await Post.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Post not found" });
    res.json(p);
  } catch (err) {
    next(err);
  }
};

export const createPost = async (req, res, next) => {
  try {
    const { title, excerpt, content } = req.body;
    const post = await Post.create({
      title,
      excerpt,
      content,
      image: toUploadUrl(req.file),
      slug: title ? slugify(title, { lower: true }) : undefined,
      createdBy: req.user?._id,
    });
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
};

export const updatePost = async (req, res, next) => {
  try {
    const p = await Post.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Post not found" });
    Object.assign(p, req.body);
    if (req.file) p.image = toUploadUrl(req.file);
    await p.save();
    res.json(p);
  } catch (err) {
    next(err);
  }
};

export const deletePost = async (req, res, next) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
};
