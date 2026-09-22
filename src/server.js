const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

require("dotenv").config();

const pool = require("./db");
const productsRouter = require("../routes/products");
const authRoutes = require("../routes/auth");
const authMiddleware = require("../middleware/authMiddleware");

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: clientOrigin,
  })
);
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/auth", authRoutes);
app.use("/products", authMiddleware, productsRouter);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Backend is running",
  });
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "Database connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Image must be 5 MB or smaller.",
      });
    }

    return res.status(400).json({
      message: error.message,
    });
  }

  if (error.message === "Only JPEG, PNG, and WebP image files are allowed.") {
    return res.status(400).json({
      message: error.message,
    });
  }

  console.error("Unhandled server error:", error);

  res.status(500).json({
    message: "Something went wrong on the server.",
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;