const express = require("express");

const pool = require("../src/db");

const router = express.Router();

// GET all orders belonging to the signed-in user
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        orders.id,
        orders.total_amount,
        orders.created_at,
        COALESCE(SUM(order_items.quantity), 0)::int AS item_count
      FROM orders
      INNER JOIN order_items ON order_items.order_id = orders.id
      WHERE orders.user_id = $1
      GROUP BY orders.id
      ORDER BY orders.created_at DESC
      `,
      [req.user.id]
    );

    return res.json({
      orders: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch orders:", error);

    return res.status(500).json({
      message: "Failed to fetch orders.",
    });
  }
});

// GET one order, only if it belongs to the signed-in user
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id) || Number(id) < 1) {
      return res.status(400).json({
        message: "Order ID must be a positive whole number.",
      });
    }

    const orderResult = await pool.query(
      `
      SELECT id, user_id, total_amount, created_at
      FROM orders
      WHERE id = $1 AND user_id = $2
      `,
      [id, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    const itemsResult = await pool.query(
      `
      SELECT
        id,
        product_id,
        product_name,
        product_price,
        quantity,
        product_price * quantity AS line_total
      FROM order_items
      WHERE order_id = $1
      ORDER BY id ASC
      `,
      [id]
    );

    return res.json({
      order: orderResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (error) {
    console.error("Failed to fetch order details:", error);

    return res.status(500).json({
      message: "Failed to fetch order details.",
    });
  }
});

module.exports = router;