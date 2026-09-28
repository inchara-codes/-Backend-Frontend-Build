const express = require("express");
const router = express.Router();

const pool = require("../src/db");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");
const logAdminAction = require("../utils/audit");
const adminMiddleware = require("../middleware/adminMiddleware");

function uploadImageToCloudinary(fileBuffer) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "product-catalogue",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
}

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

// CREATE a product with one uploaded image
router.post("/", adminMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { name, description, price } = req.body;

    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedDescription =
      typeof description === "string" ? description.trim() : "";

    if (!normalizedName) {
      return res.status(400).json({
        message: "Product name is required.",
      });
    }

    if (normalizedName.length > 200) {
      return res.status(400).json({
        message: "Product name must be 200 characters or fewer.",
      });
    }

    if (
      price === undefined ||
      price === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        message: "Price must be a valid non-negative number.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "A product image is required.",
      });
    }

    const uploadedImage = await uploadImageToCloudinary(req.file.buffer);

    const result = await pool.query(
      `
      INSERT INTO products (user_id, name, description, price, image_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, name, description, price, image_url, created_at
      `,
      [
        req.user.id,
        normalizedName,
        normalizedDescription || null,
        Number(price),
        uploadedImage.secure_url,
      ]
    );

    const product = result.rows[0];

    await logAdminAction(pool, {
      actorId: req.user.id,
      action: "product_created",
      entityType: "product",
      entityId: Number(product.id),
      details: {
        productName: product.name,
        price: product.price,
      },
    });

    res.status(201).json({
      message: "Product created successfully.",
      product,
    });
  } catch (error) {
    console.error("Failed to create product:", error);

    res.status(500).json({
      message: "Failed to create product.",
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

// UPDATE a product — admin only
router.put("/:id", adminMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price } = req.body;

    if (!/^\d+$/.test(id) || Number(id) < 1) {
      return res.status(400).json({
        message: "Product ID must be a positive whole number.",
      });
    }

    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedDescription =
      typeof description === "string" ? description.trim() : "";

    if (!normalizedName) {
      return res.status(400).json({
        message: "Product name is required.",
      });
    }

    if (normalizedName.length > 200) {
      return res.status(400).json({
        message: "Product name must be 200 characters or fewer.",
      });
    }

    if (
      price === undefined ||
      price === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        message: "Price must be a valid non-negative number.",
      });
    }

    let newImageUrl = null;

    if (req.file) {
      const uploadedImage = await uploadImageToCloudinary(req.file.buffer);
      newImageUrl = uploadedImage.secure_url;
    }

    const result = await pool.query(
      `
      UPDATE products
      SET
        name = $1,
        description = $2,
        price = $3,
        image_url = COALESCE($4, image_url)
      WHERE id = $5
      RETURNING id, user_id, name, description, price, image_url, created_at
      `,
      [
        normalizedName,
        normalizedDescription || null,
        Number(price),
        newImageUrl,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

const product = result.rows[0];

await logAdminAction(pool, {
  actorId: req.user.id,
  action: "product_updated",
  entityType: "product",
  entityId: Number(product.id),
  details: {
    productName: product.name,
    price: product.price,
    imageReplaced: Boolean(req.file),
  },
});

return res.json({
  message: "Product updated successfully.",
  product,
});

  } catch (error) {
    console.error("Failed to update product:", error);

    return res.status(500).json({
      message: "Failed to update product.",
    });
  }
});

// DELETE a product — admin only
router.delete("/:id", adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id) || Number(id) < 1) {
      return res.status(400).json({
        message: "Product ID must be a positive whole number.",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM products
      WHERE id = $1
      RETURNING id, name, description, price, image_url, user_id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

const deletedProduct = result.rows[0];

await logAdminAction(pool, {
  actorId: req.user.id,
  action: "product_deleted",
  entityType: "product",
  entityId: Number(deletedProduct.id),
  details: {
    productName: deletedProduct.name,
    price: deletedProduct.price,
    createdByUserId: deletedProduct.user_id,
  },
});

return res.json({
  message: "Product deleted successfully.",
});

  } catch (error) {
    console.error("Failed to delete product:", error);

    return res.status(500).json({
      message: "Failed to delete product.",
    });
  }
});

module.exports = router;