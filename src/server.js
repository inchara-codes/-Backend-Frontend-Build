const express = require("express");
const cors = require("cors");

require("dotenv").config();

const pool = require("./db");
const productsRouter = require("../routes/products");
const authRoutes = require("../routes/auth");
const authMiddleware = require("../middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/products", authMiddleware, productsRouter);

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

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;