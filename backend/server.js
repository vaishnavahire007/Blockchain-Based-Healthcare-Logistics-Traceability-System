require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Route files
const authRoutes = require("./routes/authRoutes");
const batchRoutes = require("./routes/batchRoutes");

// Middleware
app.use(cors());
app.use(express.json());

// Basic test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is successfully connected and running!" });
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/batch', batchRoutes);

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/blockchain_logistics";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
