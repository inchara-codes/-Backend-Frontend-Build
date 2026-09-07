const express = require("express");
const router = express.Router();

const pool = require("../src/db");

// GET all products
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        user_id,
        name,
        description,
        price,
        image_url,
        created_at
      FROM products
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch products"
    });
  }
});

// GET one product
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        user_id,
        name,
        description,
        price,
        image_url,
        created_at
      FROM products
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch product"
    });
  }
});

module.exports = router;