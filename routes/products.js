const express = require("express");
const router = express.Router();

const pool = require("../src/db");

// GET products with pagination, name search, and price filters
router.get("/", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page || "1", 10);
    const limit = Number.parseInt(req.query.limit || "8", 10);
    const search = req.query.search?.trim() || "";
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;

    if (
      Number.isNaN(page) ||
      Number.isNaN(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 50
    ) {
      return res.status(400).json({
        message: "Page must be at least 1 and limit must be between 1 and 50.",
      });
    }

    if (
      minPrice !== undefined &&
      minPrice !== "" &&
      (!Number.isFinite(Number(minPrice)) || Number(minPrice) < 0)
    ) {
      return res.status(400).json({
        message: "Minimum price must be a valid positive number.",
      });
    }

    if (
      maxPrice !== undefined &&
      maxPrice !== "" &&
      (!Number.isFinite(Number(maxPrice)) || Number(maxPrice) < 0)
    ) {
      return res.status(400).json({
        message: "Maximum price must be a valid positive number.",
      });
    }

    if (
      minPrice !== undefined &&
      minPrice !== "" &&
      maxPrice !== undefined &&
      maxPrice !== "" &&
      Number(minPrice) > Number(maxPrice)
    ) {
      return res.status(400).json({
        message: "Minimum price cannot be greater than maximum price.",
      });
    }

    const conditions = [];
    const values = [];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`name ILIKE $${values.length}`);
    }

    if (minPrice !== undefined && minPrice !== "") {
      values.push(Number(minPrice));
      conditions.push(`price >= $${values.length}`);
    }

    if (maxPrice !== undefined && maxPrice !== "") {
      values.push(Number(maxPrice));
      conditions.push(`price <= $${values.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const offset = (page - 1) * limit;
    const limitPosition = values.length + 1;
    const offsetPosition = values.length + 2;

    const [productsResult, totalResult] = await Promise.all([
      pool.query(
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
        ${whereClause}
        ORDER BY id DESC
        LIMIT $${limitPosition} OFFSET $${offsetPosition}
        `,
        [...values, limit, offset]
      ),
      pool.query(
        `
        SELECT COUNT(*)
        FROM products
        ${whereClause}
        `,
        values
      ),
    ]);

    const total = Number(totalResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      products: productsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
});

// GET one product by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id) || Number(id) < 1) {
      return res.status(400).json({
        message: "Product ID must be a positive whole number.",
      });
    }

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
        message: "Product not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch product",
    });
  }
});

module.exports = router;