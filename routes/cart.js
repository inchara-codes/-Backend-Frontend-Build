const express = require("express");

const pool = require("../src/db");

const router = express.Router();

// GET the signed-in user's cart
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        cart_items.product_id,
        cart_items.quantity,
        products.name,
        products.price,
        products.image_url,
        products.description,
        products.created_at
      FROM cart_items
      INNER JOIN products ON products.id = cart_items.product_id
      WHERE cart_items.user_id = $1
      ORDER BY cart_items.created_at DESC
      `,
      [req.user.id]
    );

    const items = result.rows.map((item) => ({
      ...item,
      line_total: Number(item.price) * item.quantity,
    }));

    const total = items.reduce(
      (currentTotal, item) => currentTotal + item.line_total,
      0
    );

    return res.json({
      items,
      total: total.toFixed(2),
      itemCount: items.reduce(
        (currentCount, item) => currentCount + item.quantity,
        0
      ),
    });
  } catch (error) {
    console.error("Failed to fetch cart:", error);

    return res.status(500).json({
      message: "Failed to fetch cart.",
    });
  }
});

// ADD one product to the cart
router.post("/items", async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (
      !Number.isInteger(Number(productId)) ||
      Number(productId) < 1
    ) {
      return res.status(400).json({
        message: "Product ID must be a positive whole number.",
      });
    }

    if (
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 1 ||
      Number(quantity) > 99
    ) {
      return res.status(400).json({
        message: "Quantity must be a whole number between 1 and 99.",
      });
    }

    const productResult = await pool.query(
      `
      SELECT id
      FROM products
      WHERE id = $1
      `,
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    await pool.query(
      `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET
        quantity = cart_items.quantity + EXCLUDED.quantity,
        updated_at = now()
      `,
      [req.user.id, productId, Number(quantity)]
    );

    return res.status(201).json({
      message: "Product added to cart.",
    });
  } catch (error) {
    console.error("Failed to add item to cart:", error);

    return res.status(500).json({
      message: "Failed to add product to cart.",
    });
  }
});

// UPDATE the quantity of one cart item
router.patch("/items/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!/^\d+$/.test(productId) || Number(productId) < 1) {
      return res.status(400).json({
        message: "Product ID must be a positive whole number.",
      });
    }

    if (
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 1 ||
      Number(quantity) > 99
    ) {
      return res.status(400).json({
        message: "Quantity must be a whole number between 1 and 99.",
      });
    }

    const result = await pool.query(
      `
      UPDATE cart_items
      SET quantity = $1, updated_at = now()
      WHERE user_id = $2 AND product_id = $3
      RETURNING product_id, quantity
      `,
      [Number(quantity), req.user.id, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Cart item not found.",
      });
    }

    return res.json({
      message: "Cart quantity updated.",
      item: result.rows[0],
    });
  } catch (error) {
    console.error("Failed to update cart item:", error);

    return res.status(500).json({
      message: "Failed to update cart quantity.",
    });
  }
});

// REMOVE one product from the cart
router.delete("/items/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    if (!/^\d+$/.test(productId) || Number(productId) < 1) {
      return res.status(400).json({
        message: "Product ID must be a positive whole number.",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM cart_items
      WHERE user_id = $1 AND product_id = $2
      RETURNING product_id
      `,
      [req.user.id, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Cart item not found.",
      });
    }

    return res.json({
      message: "Product removed from cart.",
    });
  } catch (error) {
    console.error("Failed to remove cart item:", error);

    return res.status(500).json({
      message: "Failed to remove product from cart.",
    });
  }
});

// CREATE an order from the user's current cart
router.post("/checkout", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const cartResult = await client.query(
      `
      SELECT
        cart_items.product_id,
        cart_items.quantity,
        products.name,
        products.price
      FROM cart_items
      INNER JOIN products ON products.id = cart_items.product_id
      WHERE cart_items.user_id = $1
      FOR UPDATE OF cart_items, products
      `,
      [req.user.id]
    );

    if (cartResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Your cart is empty.",
      });
    }

    const cartItems = cartResult.rows;
    const totalAmount = cartItems.reduce(
      (total, item) => total + Number(item.price) * item.quantity,
      0
    );

    const orderResult = await client.query(
      `
      INSERT INTO orders (user_id, total_amount)
      VALUES ($1, $2)
      RETURNING id, user_id, total_amount, created_at
      `,
      [req.user.id, totalAmount.toFixed(2)]
    );

    const order = orderResult.rows[0];

    for (const item of cartItems) {
      await client.query(
        `
        INSERT INTO order_items
          (order_id, product_id, product_name, product_price, quantity)
        VALUES
          ($1, $2, $3, $4, $5)
        `,
        [
          order.id,
          item.product_id,
          item.name,
          item.price,
          item.quantity,
        ]
      );
    }

    await client.query(
      `
      DELETE FROM cart_items
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Order placed successfully.",
      order,
      itemCount: cartItems.reduce(
        (total, item) => total + item.quantity,
        0
      ),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to place order:", error);

    return res.status(500).json({
      message: "Failed to place order.",
    });
  } finally {
    client.release();
  }
});

module.exports = router;