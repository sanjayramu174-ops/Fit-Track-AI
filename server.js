require("dotenv").config();

const mongoose = require("mongoose");
const { validateEnv } = require("./src/config/env");
const connectDB = require("./src/config/db");
const seedAdmin = require("./src/utils/seedAdmin");
const Subscription = require("./src/models/Subscription");
const createApp = require("./src/app");

async function start() {
  validateEnv();

  await connectDB();
  await seedAdmin();

  const parsedPort = Number(process.env.PORT);
  const PORT = Number.isInteger(parsedPort) && parsedPort >= 1 && parsedPort <= 65535
    ? parsedPort
    : 5000;
  if (process.env.PORT !== undefined && PORT === 5000 && process.env.PORT !== "5000") {
    console.warn(`Invalid PORT value "${process.env.PORT}" — using ${PORT}`);
  }

  const server = createApp().listen(PORT, () => {
    console.log(`FitTrack running at http://localhost:${PORT}`);
  });

  // Mark subscriptions as expired once their end date passes.
  const expiryTimer = setInterval(() => {
    if (mongoose.readyState === 1) {
      Subscription.expireOutdated().catch((err) =>
        console.error("Subscription expiry check failed:", err.message)
      );
    }
  }, 60 * 60 * 1000);
  expiryTimer.unref();

  const shutdown = async (signal) => {
    console.log(`\n${signal} received — shutting down...`);
    clearInterval(expiryTimer);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((error) => {
  console.error("Startup failed:", error.message);
  process.exit(1);
});
