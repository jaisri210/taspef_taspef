// server/src/scripts/seedAdmin.js
// Creates (or promotes) the first admin account from env vars.
// Usage: npm run seed:admin
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

const run = async () => {
  const name = process.env.SEED_ADMIN_NAME || "TASPEF Admin";
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in .env before running this script."
    );
    process.exit(1);
  }

  await connectDB();

  let user = await User.findOne({ email });
  if (user) {
    user.role = "admin";
    user.isActive = true;
    await user.save();
    console.log(`✅ Existing user ${email} promoted to admin.`);
  } else {
    user = await User.create({ name, email, password, role: "admin" });
    console.log(`✅ Admin account created: ${email}`);
  }

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
