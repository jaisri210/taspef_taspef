import mongoose from "mongoose";
import dns from "dns";

// mongodb+srv:// needs a DNS SRV lookup before it can connect at all. On
// some networks the OS/DHCP-assigned resolver serves plain A/AAAA fine but
// flakes or refuses SRV queries specifically (seen as ECONNREFUSED here even
// though the connection string and credentials are correct) — pointing
// Node's resolver at public DNS sidesteps that instead of failing the whole
// process on a local network hiccup.
dns.setServers(["8.8.8.8", "1.1.1.1", ...dns.getServers()]);

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, {
      // These options are no longer needed in Mongoose 6+
      // but keeping them for compatibility with older versions
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectDB;
