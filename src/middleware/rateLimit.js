// server/src/middleware/rateLimit.js
// Minimal in-memory fixed-window limiter — no extra dependency needed for a
// single-process deployment. Swap for a shared-store limiter if this ever
// runs behind multiple server instances.
const buckets = new Map();

export const loginRateLimit = (
  { windowMs = 15 * 60 * 1000, max = 10 } = {}
) => (req, res, next) => {
  const key = req.ip;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  bucket.count += 1;
  if (bucket.count > max) {
    const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
    res.setHeader("Retry-After", retryAfterSec);
    return res.status(429).json({
      message: "Too many login attempts. Please try again later.",
    });
  }
  next();
};
