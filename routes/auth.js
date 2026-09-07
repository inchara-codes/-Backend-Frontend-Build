const express = require("express");
const bcrypt = require("bcrypt");

const router = express.Router();
const pool = require("../src/db");

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check that email and password were provided
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // Find the user
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        password_hash
      FROM users
      WHERE email = $1
      `,
      [email]
    );

    // User doesn't exist
    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    // Check password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Login successful
    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Login failed"
    });
  }
});

module.exports = router;