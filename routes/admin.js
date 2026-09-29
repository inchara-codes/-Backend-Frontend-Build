const express = require("express");

const pool = require("../src/db");
const adminMiddleware = require("../middleware/adminMiddleware");
const logAdminAction = require("../utils/audit");
const INITIAL_ADMIN_EMAIL = "inchara@gmail.com";

const router = express.Router();

router.use(adminMiddleware);

// GET all users for the admin page
router.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
  `
  SELECT
    id,
    name,
    email,
    role,
    created_at,
    email = $1 AS is_initial_admin
  FROM users
  ORDER BY
    CASE WHEN role = 'admin' THEN 0 ELSE 1 END,
    name ASC
  `,
  [INITIAL_ADMIN_EMAIL]
);

    return res.json({
      users: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);

    return res.status(500).json({
      message: "Failed to fetch users.",
    });
  }
});

// Change a user's role between user and admin
router.patch("/users/:id/role", async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!/^\d+$/.test(id) || Number(id) < 1) {
      return res.status(400).json({
        message: "User ID must be a positive whole number.",
      });
    }

    if (role !== "admin" && role !== "user") {
      return res.status(400).json({
        message: "Role must be either admin or user.",
      });
    }

    if (String(req.user.id) === id) {
      return res.status(400).json({
        message: "You cannot change your own admin role.",
      });
    }

    await client.query("BEGIN");

    const userResult = await client.query(
      `
      SELECT id, name, email, role
      FROM users
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "User not found.",
      });
    }

    const targetUser = userResult.rows[0];

    if (
  targetUser.email === INITIAL_ADMIN_EMAIL &&
  role === "user"
) {
  await client.query("ROLLBACK");

  return res.status(403).json({
    message: "The initial admin account cannot be removed.",
  });
}

    if (targetUser.role === role) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: `This user is already an ${role}.`,
      });
    }

    if (targetUser.role === "admin" && role === "user") {
      const adminCountResult = await client.query(`
        SELECT COUNT(*)::int AS count
        FROM users
        WHERE role = 'admin'
      `);

      if (adminCountResult.rows[0].count <= 1) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "At least one admin account must remain.",
        });
      }
    }

    const updateResult = await client.query(
      `
      UPDATE users
      SET role = $1
      WHERE id = $2
      RETURNING id, name, email, role, created_at
      `,
      [role, id]
    );

    const action =
      role === "admin" ? "admin_granted" : "admin_removed";

    await logAdminAction(client, {
      actorId: req.user.id,
      action,
      entityType: "user",
      entityId: Number(id),
      details: {
        targetName: targetUser.name,
        targetEmail: targetUser.email,
        previousRole: targetUser.role,
        newRole: role,
      },
    });

    await client.query("COMMIT");

    return res.json({
      message:
        role === "admin"
          ? "Admin access granted successfully."
          : "Admin access removed successfully.",
      user: updateResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to change user role:", error);

    return res.status(500).json({
      message: "Failed to change user role.",
    });
  } finally {
    client.release();
  }
});

// GET audit entries for the admin page
router.get("/audit-logs", async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page || "1", 10);
    const limit = Number.parseInt(req.query.limit || "25", 10);

    if (
      Number.isNaN(page) ||
      Number.isNaN(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        message: "Page must be at least 1 and limit must be between 1 and 100.",
      });
    }

    const offset = (page - 1) * limit;

    const [logsResult, totalResult] = await Promise.all([
      pool.query(
        `
        SELECT
          logs.id,
          logs.action,
          logs.entity_type,
          logs.entity_id,
          logs.details,
          logs.created_at,
          users.name AS actor_name,
          users.email AS actor_email
        FROM admin_audit_logs AS logs
        INNER JOIN users ON users.id = logs.actor_id
        ORDER BY logs.created_at DESC
        LIMIT $1 OFFSET $2
        `,
        [limit, offset]
      ),
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM admin_audit_logs
      `),
    ]);

    const total = totalResult.rows[0].count;

    return res.json({
      logs: logsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);

    return res.status(500).json({
      message: "Failed to fetch audit logs.",
    });
  }
});

// GET all customer orders for the admin panel
router.get("/orders", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        orders.id,
        orders.total_amount,
        orders.created_at,
        users.name AS customer_name,
        users.email AS customer_email,
        COALESCE(SUM(order_items.quantity), 0)::int AS item_count,
        COALESCE(
          json_agg(
            json_build_object(
              'id', order_items.id,
              'productName', order_items.product_name,
              'productPrice', order_items.product_price,
              'quantity', order_items.quantity
            )
            ORDER BY order_items.id
          ) FILTER (WHERE order_items.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM orders
      INNER JOIN users ON users.id = orders.user_id
      LEFT JOIN order_items ON order_items.order_id = orders.id
      GROUP BY
        orders.id,
        orders.total_amount,
        orders.created_at,
        users.name,
        users.email
      ORDER BY orders.created_at DESC
    `);

    return res.json({
      orders: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch admin orders:", error);

    return res.status(500).json({
      message: "Failed to fetch orders.",
    });
  }
});

module.exports = router;