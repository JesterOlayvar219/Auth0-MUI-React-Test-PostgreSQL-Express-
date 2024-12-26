const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { checkDatabaseConnection } = require("./config/database");
const userRoutes = require("./routes/userRoutes");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "PUT", "POST"],
    allowedHeaders: ["Authorization", "Content-Type"],
    maxAge: 86400,
  })
);

// Routes
app.use("/api", userRoutes);

// Start server function
const startServer = async () => {
  try {
    await checkDatabaseConnection();
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
